import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RecomendacaoRespostaDto } from './dto/recomendacao-resposta.dto.js';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { Usuario } from '../../models/usuario.model.js';
import { ObrigacaoEmpresa } from '../../models/obrigacao-empresa.model.js';
import { Obrigacao, StatusObrigacao } from '../../models/obrigacao.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';
import { Servico } from '../cms/servicos/servico.model.js';
import { Pagamento, TipoPagamento } from '../../models/pagamento.model.js';


const NOME_SERVICO_REGULARIZACAO_DEBITOS = 'Regularização de Débitos Fiscais';

const NOME_SERVICO_PARCELAMENTO_DEBITOS = 'Parcelamento de Débitos Fiscais';

export interface AtributoPerfil {
  nome: string;
  descricao: string | null;
  valorBase: number | null;
  status: 'ativo' | 'inativo';
}

@Injectable()
export class RecomendacaoService {
  constructor(
    @InjectModel(Solicitacao)
    private readonly solicitacaoModel: typeof Solicitacao,
  ) {}

  /**
   * Retorna os atributos dos serviços já solicitados por um usuário,
   * usados para montar o perfil de interesse da recomendação.
   */
  async buscarAtributosPerfil(
    usuarioId: number,
  ): Promise<AtributoPerfil[]> {
    const solicitacoes = await this.solicitacaoModel.findAll({
      where: { usuarioId },
      include: [
        {
          association: 'servico',
          attributes: ['nome', 'descricao', 'valorBase', 'ativo'],
        },
      ],
    });

    return solicitacoes.map(({ servico }) => ({
      nome: servico.nome,
      descricao: servico.descricao,
      valorBase:
        servico.valorBase != null ? Number(servico.valorBase) : null,
      status: servico.ativo ? 'ativo' : 'inativo',
    }));
  }

  /**
   * Retorna os serviços ativos mais solicitados, do mais para o menos
   * solicitado. Usado como base de popularidade e fallback de recomendação.
   */
  async buscarServicosPopulares(): Promise<RecomendacaoRespostaDto[]> {
    const solicitacoes = await this.solicitacaoModel.findAll({
      include: [
        {
          association: 'servico',
          attributes: ['id', 'nome', 'descricao'],
          where: { ativo: true },
          required: true,
        },
      ],
    });

    if (solicitacoes.length === 0) {
      return [];
    }

    const contagem = new Map<
      number,
      { servico: RecomendacaoRespostaDto; total: number }
    >();

    for (const { servico } of solicitacoes) {
      const atual = contagem.get(servico.id);

      if (atual) {
        atual.total += 1;
      } else {
        contagem.set(servico.id, {
          servico: {
            id: servico.id,
            nome: servico.nome,
            descricao: servico.descricao ?? '',
          },
          total: 1,
        });
      }
    }

    return [...contagem.values()]
      .sort((a, b) => b.total - a.total)
      .map(({ servico }) => servico);
  }

  async verificarRecomendacaoRegularizacaoObrigacoesFiscais(
    usuarioId: number,
  ): Promise<RecomendacaoRespostaDto | null> {
    
    const usuario = await Usuario.findByPk(usuarioId, {
      include: ['empresas'],
    });

    const empresa  = (usuario as any)?.empresas?.[0];

    if (!empresa?.id) {
      return null;
    }

    const empresaId = empresa.id;

    const obrigacaoEmpresa = await ObrigacaoEmpresa.findAll({
      where: {
        idEmpresa: empresaId,
      },
    });

    if (!obrigacaoEmpresa.length) {
      return null;
    }

    const idsObrigacoes = obrigacaoEmpresa.map((oe) => oe.idObrigacao);

    const obrigacaoValida = await Obrigacao.findOne({
      where: {
        id: idsObrigacoes,
        status: StatusObrigacao.PENDENTE,
      },
      include: [
        {
          model: ObrigacaoServico,
          as: 'obrigacaoServico',
          required: true,
          include: [
            {
              model: Servico,
              as: 'servico',
              where: {
                id: 5,
              },
              required: true,
            },
          ],
        },
      ],
    });

    if (!obrigacaoValida) {
      return null;
    }

    const servico = (obrigacaoValida as any).obrigacaoServico?.servico;

    if (!servico) {
      return null;
    }

    return {
      id: servico.id,
      nome: servico.nome,
      descricao: servico.descricao,
    };
  }

  /**
   * Recomenda "Regularização de Débitos Fiscais" quando a empresa do usuário
   * possui uma obrigação pendente vinculada ao serviço via OBRIGACAO_SERVICO.
   */
  async verificarRecomendacaoRegularizacaoDebitosFiscais(
    usuarioId: number,
  ): Promise<RecomendacaoRespostaDto | null> {
    // 1-2. Identifica a empresa vinculada ao usuário
    const usuario = await Usuario.findByPk(usuarioId, {
      include: ['empresas'],
    });

    const empresa = (usuario as any)?.empresas?.[0];

    if (!empresa?.id) {
      return null;
    }

    // 3-4. OBRIGACAO_EMPRESA -> obrigações da empresa
    const obrigacoesEmpresa = await ObrigacaoEmpresa.findAll({
      where: { idEmpresa: empresa.id },
    });

    if (!obrigacoesEmpresa.length) {
      return null;
    }

    const idsObrigacoes = obrigacoesEmpresa.map((oe) => oe.idObrigacao);

    // 5-8. OBRIGACAO_SERVICO -> SERVICO, filtrando por nome e status pendente
    const obrigacaoValida = await Obrigacao.findOne({
      where: {
        id: idsObrigacoes,
        status: StatusObrigacao.PENDENTE,
      },
      include: [
        {
          model: ObrigacaoServico,
          as: 'obrigacaoServico',
          required: true,
          include: [
            {
              model: Servico,
              as: 'servico',
              where: { nome: NOME_SERVICO_REGULARIZACAO_DEBITOS },
              required: true,
            },
          ],
        },
      ],
    });

    if (!obrigacaoValida) {
      return null;
    }

    const servico = (obrigacaoValida as any).obrigacaoServico?.servico;

    if (!servico) {
      return null;
    }

    // 9. Retorna somente id, nome e descricao
    return {
      id: servico.id,
      nome: servico.nome,
      descricao: servico.descricao ?? '',
    };
  }

  /**
   * Recomenda "Parcelamento de Débitos Fiscais" quando a empresa do usuário
   * possui uma obrigação pendente vinculada ao serviço e essa obrigação
   * ainda não possui pagamento com tipo_pagamento = 'parcelado'.
   */
  async verificarRecomendacaoParcelamentoDebitosFiscais(
    usuarioId: number,
  ): Promise<RecomendacaoRespostaDto | null> {
    // 1-2. Identifica a empresa vinculada ao usuário
    const usuario = await Usuario.findByPk(usuarioId, {
      include: ['empresas'],
    });

    const empresa = (usuario as any)?.empresas?.[0];

    if (!empresa?.id) {
      return null;
    }

    // 3-4. OBRIGACAO_EMPRESA -> obrigações da empresa
    const obrigacoesEmpresa = await ObrigacaoEmpresa.findAll({
      where: { idEmpresa: empresa.id },
    });

    if (!obrigacoesEmpresa.length) {
      return null;
    }

    const idsObrigacoes = obrigacoesEmpresa.map((oe) => oe.idObrigacao);

    // 5-10. OBRIGACAO_SERVICO -> SERVICO (nome), status pendente
    // e PAGAMENTO parcelado (LEFT JOIN: required: false)
    const obrigacoes = await Obrigacao.findAll({
      where: {
        id: idsObrigacoes,
        status: StatusObrigacao.PENDENTE,
      },
      include: [
        {
          model: ObrigacaoServico,
          as: 'obrigacaoServico',
          required: true,
          include: [
            {
              model: Servico,
              as: 'servico',
              where: { nome: NOME_SERVICO_PARCELAMENTO_DEBITOS },
              required: true,
            },
          ],
        },
        {
          model: Pagamento,
          as: 'pagamento',
          where: { tipoPagamento: TipoPagamento.PARCELADO },
          required: false,
        },
      ],
    });

    // 11. Primeira obrigação SEM pagamento parcelado
    const obrigacaoValida = obrigacoes.find(
      (obrigacao) => !(obrigacao as any).pagamento,
    );

    if (!obrigacaoValida) {
      return null;
    }

    const servico = (obrigacaoValida as any).obrigacaoServico?.servico;

    if (!servico) {
      return null;
    }

    return {
      id: servico.id,
      nome: servico.nome,
      descricao: servico.descricao ?? '',
    };
  }
}
