import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Obrigacao, StatusObrigacao } from '../../../models/obrigacao.model.js';
import { ObrigacaoServico } from '../../../models/obrigacao-servico.model.js';
import { ObrigacaoEmpresa } from '../../../models/obrigacao-empresa.model.js';
import { Solicitacao } from '../../../models/solicitacao.model.js';
import { Empresa } from '../../../models/empresa.model.js';
import { NotificacaoSocketService } from '../notificacao-socket.service.js';
import { pertenceAoEscopo } from '../constants/termos-obrigacoes.js';
import type {
  NotificacaoObrigacoesPayload,
  ObrigacaoNotificacao,
} from '../dto/notificacao-obrigacoes.dto.js';

type ObrigacaoComRelacoes = Obrigacao & {
  obrigacaoServico?: ObrigacaoServico | null;
  obrigacaoEmpresa?: ObrigacaoEmpresa | null;
};

@Injectable()
export class NotificacaoObrigacoesService {
  private readonly logger = new Logger(NotificacaoObrigacoesService.name);

  constructor(
    @InjectModel(Obrigacao)
    private readonly obrigacaoModel: typeof Obrigacao,
    private readonly notificacaoSocket: NotificacaoSocketService,
  ) {}

  async executarRotinaSemanal(): Promise<void> {
    this.logger.log('Iniciando rotina semanal de notificações de obrigações.');

    const obrigacoes = await this.buscarObrigacoesPendentes();
    if (obrigacoes.length === 0) {
      this.logger.log('Nenhuma obrigação pendente encontrada.');
      return;
    }

    const noEscopo = obrigacoes.filter((o) => pertenceAoEscopo(o.descricao ?? ''));
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

  private async buscarObrigacoesPendentes(): Promise<ObrigacaoComRelacoes[]> {
    const resultado = await this.obrigacaoModel.findAll({
      where: {
        status: StatusObrigacao.PENDENTE,
        deletedAt: null,
      },
      include: [
        {
          model: ObrigacaoServico,
          include: [
            {
              model: Solicitacao,
              attributes: ['usuarioId'],
            },
          ],
        },
        {
          model: ObrigacaoEmpresa,
          include: [
            {
              model: Empresa,
              attributes: ['usuarioId'],
            },
          ],
        },
      ],
    });

    return resultado as ObrigacaoComRelacoes[];
  }

  private agruparPorUsuario(
    obrigacoes: ObrigacaoComRelacoes[],
  ): Map<number, ObrigacaoNotificacao[]> {
    const mapa = new Map<number, ObrigacaoNotificacao[]>();

    for (const o of obrigacoes) {
      const solicitacao = o.obrigacaoServico?.solicitacao as
        | Solicitacao
        | undefined;
      const empresa = o.obrigacaoEmpresa?.empresa as Empresa | undefined;

      const usuarioId = solicitacao?.usuarioId ?? empresa?.usuarioId ?? null;

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

  private formatarVencimento(vencimento: Date | string | null): string {
    if (!vencimento) return '';
    const d =
      vencimento instanceof Date ? vencimento : new Date(String(vencimento));
    return Number.isNaN(d.getTime())
      ? String(vencimento)
      : d.toISOString().slice(0, 10);
  }
}