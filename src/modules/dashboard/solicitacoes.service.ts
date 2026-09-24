import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, col, fn } from 'sequelize';
import { StatusSolicitacaoEnum } from '../../commons/enums/status-solicitacao.enum.js';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { Servico } from '../../models/servico.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';
import { Obrigacao } from '../../models/obrigacao.model.js';
import { Pagamento } from '../../models/pagamento.model.js';
import { Parcela } from '../../models/parcela.model.js';
import { StatusSolicitacaoEnum } from '../../commons/enums/status-solicitacao.enum.js';
import { StatusParcelaEnum } from '../../commons/enums/status-parcela.enum.js';
import { NaturezaCobrancaEnum } from '../../commons/enums/natureza-cobranca.enum.js';
import {
  PeriodoFiltro,
  dataCalendarioSaoPaulo,
  hojeCalendarioSaoPaulo,
  resolvePeriodo,
  round2,
  somarDiasCalendario,
} from '../../commons/utils/periodo-filtro.util.js';

const STATUS_EM_ABERTO = [
    StatusSolicitacaoEnum.RECEBIDO,
    StatusSolicitacaoEnum.AGUARDANDO_PAGAMENTO,
    StatusSolicitacaoEnum.EM_ANDAMENTO,
];

@Injectable()
export class SolicitacoesService {
    constructor(
        @InjectModel(Solicitacao)
        private readonly solicitacaoModel: typeof Solicitacao,
        @InjectModel(ObrigacaoServico)
        private readonly obrigacaoServicoModel: typeof ObrigacaoServico,
        @InjectModel(Parcela)
        private readonly parcelaModel: typeof Parcela,
    ) {}

    async getIndicadores(startDate?: string, endDate?: string) {
    const periodo = resolvePeriodo(startDate, endDate);
 
    const [graficoStatus, prazos, tempoMedio, totalCreditosAberto] = await Promise.all([
      this.getGraficoStatus(periodo),
      this.getPrazos(periodo),
      this.getTempoMedio(periodo),
      this.getTotalCreditosAberto(periodo),
    ]);

    return {
        graficoStatus: graficoStatus.grafico,
        taxaCancelamento: graficoStatus.taxaCancelamento,
        totalCreditosAberto,
        prazos,
        tempoMedioPorServicoDias: tempoMedio.porServico,
        tempoMedioGeralDias: tempoMedio.geral,
    };

    
}

private async getGraficoStatus(periodo: PeriodoFiltro) {
    const rows = (await this.solicitacaoModel.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'quantidade']],
        where: {
            dataSolicitacao: {
                [Op.gte]: periodo.rangeStart,
                [Op.lt]: periodo.rangeEndExclusive,
            },
        },
        group: ['status'],
        raw: true,
    })) as unknown as { status: StatusSolicitacaoEnum; quantidade: string }[];

    const contagemPorStatus = new Map<StatusSolicitacaoEnum, number>();
    for (const row of rows) {
        contagemPorStatus.set(row.status, Number(row.quantidade));
    }

    const nEmAberto = STATUS_EM_ABERTO.reduce(
        (acc, status) => acc + (contagemPorStatus.get(status) ?? 0),
        0,
    );
    const nConcluidas = contagemPorStatus.get(StatusSolicitacaoEnum.CONCLUIDO) ?? 0;
    const nDocumentosPendentes =
        contagemPorStatus.get(StatusSolicitacaoEnum.AGUARDANDO_DOCUMENTO) ?? 0;
    const nCanceladas = contagemPorStatus.get(StatusSolicitacaoEnum.CANCELADO) ?? 0;

    const totalSolicitacoes = nEmAberto + nConcluidas + nDocumentosPendentes;
    const totalComCanceladas = totalSolicitacoes + nCanceladas;

    const percentual = (valor : number) =>
        totalSolicitacoes === 0 ? 0 : round2((valor / totalSolicitacoes) * 100);

    
    return{
        grafico: {
            totalSolicitacoes,
            emAberto: percentual(nEmAberto),
            concluidas: percentual(nConcluidas),
            DocumentosPendentes: percentual(nDocumentosPendentes),
        },
        taxaCancelamento:
            totalComCanceladas === 0 ? 0 : round2((nCanceladas / totalComCanceladas) * 100),
    };
}

// terminar getPrazos
private async getPrazos(periodo : PeriodoFiltro) {
    const solicitacoes = await this.solicitacaoModel.findAll({
        attributes: ['id', 'dataSolicitacao'],
        where: {

        }
    })
}

}