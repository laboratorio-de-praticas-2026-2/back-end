import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

export interface AtributoPerfil {
  nome: string;
  descricao: string | null;
  valorBase: number | null;
  status: 'ativo' | 'inativo';
}

@Injectable()
export class RecomendacaoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna os atributos dos serviços já solicitados por um usuário,
   * usados para montar o perfil de interesse da recomendação.
   */
  async buscarAtributosPerfil(usuarioId: number): Promise<AtributoPerfil[]> {
    const solicitacoes = await this.prisma.solicitacao.findMany({
      where: { usuarioId },
      select: {
        servico: {
          select: {
            nome: true,
            descricao: true,
            valorBase: true,
            ativo: true,
          },
        },
      },
    });

    return solicitacoes.map(({ servico }: { servico: any }) => ({
      nome: servico.nome,
      descricao: servico.descricao,
      // Decimal do Prisma -> number
      valorBase: servico.valorBase != null ? servico.valorBase.toNumber() : null,
      // booleano do banco -> status textual do domínio
      status: servico.ativo ? 'ativo' : 'inativo',
    }));
  }
}