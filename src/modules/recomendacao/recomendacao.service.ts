import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RecomendacaoRespostaDto } from './dto/recomendacao-resposta.dto.js';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { Usuario } from '../../models/usuario.model.js';
import { ObrigacaoEmpresa } from '../../models/obrigacao-empresa.model.js';
import { Obrigacao, StatusObrigacao } from '../../models/obrigacao.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';
import { Servico } from '../cms/servicos/servico.model.js';

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

    const obrigacaoValide = await Obrigacao.findOne({
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
                nome: 'Regularização de Obrigações Fiscais',
              },
              required: true,
            },
          ],
        },
      ],
    });

    if (!obrigacaoValide) {
      return null;
    }

    const servico = (obrigacaoValide as any).obrigacaoServico?.servico;

    if (!servico) {
      return null;
    }

    return {
      id: servico.id,
      nome: servico.nome,
      descricao: servico.descricao,
    };
  }
}
