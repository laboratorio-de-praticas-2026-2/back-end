import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { RecomendacaoRespostaDto } from './dto/recomendacao-resposta.dto.js';

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

    /**
   * Retorna os serviços ativos mais solicitados, do mais para o menos
   * solicitado. Usado como base de popularidade e fallback de recomendação.
   */
  async buscarServicosPopulares(): Promise<RecomendacaoRespostaDto[]> {
    const solicitacoes = await this.prisma.solicitacao.findMany({
      where: { servico: { ativo: true } },
      select: {
        servico: {
          select: { id: true, nome: true, descricao: true },
        },
      },
    });

    if (solicitacoes.length === 0) {
      return [];
    }

    const contagem = new Map<
      number,
      { servico: RecomendacaoRespostaDto; total: number }
    >();

    for (const { servico } of solicitacoes as {
      servico: { id: number; nome: string; descricao: string | null };
    }[]) {
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
}

