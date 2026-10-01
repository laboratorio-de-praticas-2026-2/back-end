import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Solicitacao } from '../../models/solicitacao.model.js';

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
}