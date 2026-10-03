import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotificacaoSocketService } from '../notificacao-socket.service.js';
import { pertenceAoEscopo } from '../constants/termos-obrigacoes.js';
import type {
  NotificacaoObrigacoesPayload,
  ObrigacaoNotificacao,
} from '../dto/notificacao-obrigacoes.dto.js';

type ObrigacaoComRelacoes = Awaited<
  ReturnType<NotificacaoObrigacoesService['buscarObrigacoesPendentes']>
>[number];

@Injectable()
export class NotificacaoObrigacoesService {
  private readonly logger = new Logger(NotificacaoObrigacoesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacaoSocket: NotificacaoSocketService,
  ) {}

  /**
   * Rotina semanal (issue #115):
   * 1. Busca obrigações com status = pendente
   * 2. Filtra pelo escopo (descricao contém termos da Short Release)
   * 3. Resolve o usuário responsável (via serviço OU empresa)
   * 4. Agrupa por usuário
   * 5. Envia UMA notificação por usuário via NotificacaoSocketService
   */
  async executarRotinaSemanal(): Promise<void> {
    this.logger.log('Iniciando rotina semanal de notificações de obrigações.');

    const obrigacoes = await this.buscarObrigacoesPendentes();
    if (obrigacoes.length === 0) {
      this.logger.log('Nenhuma obrigação pendente encontrada.');
      return;
    }

    const noEscopo = obrigacoes.filter((o) => pertenceAoEscopo(o.descricao));
    if (noEscopo.length === 0) {
      this.logger.log('Nenhuma obrigação no escopo da Short Release.');
      return;
    }

    const porUsuario = this.agruparPorUsuario(noEscopo);

    for (const [usuarioId, lista] of porUsuario.entries()) {
      const payload = this.montarPayload(lista);
      try {
        this.notificacaoSocket.sendToUser(
          String(usuarioId),
          payload as unknown as Record<string, unknown>,
        );
        this.logger.log(
          `Notificação enviada ao usuário ${usuarioId} (${lista.length} obrigação(ões)).`,
        );
      } catch (err) {
        this.logger.error(
          `Falha ao enviar notificação ao usuário ${usuarioId}: ${String(err)}`,
        );
      }
    }

    this.logger.log('Rotina semanal finalizada.');
  }

  /**
   * Busca todas as obrigações com status = pendente e não deletadas,
   * incluindo os relacionamentos para resolver o usuário responsável.
   */
  private async buscarObrigacoesPendentes() {
    return this.prisma.obrigacao.findMany({
      where: {
        status: 'pendente',
        deletedAt: null,
      },
      include: {
        obrigacaoServico: {
          include: {
            solicitacao: {
              select: { usuarioId: true },
            },
          },
        },
        obrigacaoEmpresa: {
          include: {
            empresa: {
              select: { usuarioId: true },
            },
          },
        },
      },
    });
  }

  /**
   * Resolve o usuário responsável e agrupa as obrigações por usuário.
   * Precedência: serviço → empresa (conforme a issue).
   */
  private agruparPorUsuario(
    obrigacoes: ObrigacaoComRelacoes[],
  ): Map<number, ObrigacaoNotificacao[]> {
    const mapa = new Map<number, ObrigacaoNotificacao[]>();

    for (const o of obrigacoes) {
      const usuarioId =
        o.obrigacaoServico?.solicitacao?.usuarioId ??
        o.obrigacaoEmpresa?.empresa?.usuarioId ??
        null;

      if (usuarioId == null) {
        this.logger.warn(
          `Obrigação ${o.id} sem usuário responsável identificado. Ignorando.`,
        );
        continue;
      }

      const item: ObrigacaoNotificacao = {
        descricao: o.descricao ?? '',
        valor: Number(o.valor),
        vencimento: this.formatarVencimento(o.vencimento),
      };

      if (!mapa.has(usuarioId)) mapa.set(usuarioId, []);
      mapa.get(usuarioId)!.push(item);
    }

    return mapa;
  }

  /**
   * Monta o payload único por usuário (formato do exemplo da issue).
   */
  private montarPayload(
    obrigacoes: ObrigacaoNotificacao[],
  ): NotificacaoObrigacoesPayload {
    const qtd = obrigacoes.length;
    const mensagem =
      qtd === 1
        ? 'Você possui 1 obrigação pendente. Confira o respectivo vencimento.'
        : `Você possui ${qtd} obrigações pendentes. Confira os respectivos vencimentos.`;

    return {
      titulo: 'Obrigações pendentes',
      mensagem,
      obrigacoes,
    };
  }

  /**
   * Formata o vencimento para YYYY-MM-DD.
   */
  private formatarVencimento(vencimento: Date | string | null): string {
    if (!vencimento) return '';
    const d =
      vencimento instanceof Date ? vencimento : new Date(String(vencimento));
    return Number.isNaN(d.getTime())
      ? String(vencimento)
      : d.toISOString().slice(0, 10);
  }
}