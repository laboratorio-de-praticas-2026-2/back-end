import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, col, fn } from 'sequelize';
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
 

// Agrupa as solicitações criadas no período pelo status atual e calcula
// os percentuais do gráfico + a taxa de cancelamento.
// Uma única consulta agregada (GROUP BY status) — sem loop por registro.

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
 
    const percentual = (valor: number) =>
      totalSolicitacoes === 0 ? 0 : round2((valor / totalSolicitacoes) * 100);
 
    return {
      grafico: {
        totalSolicitacoes,
        emAberto: percentual(nEmAberto),
        concluidas: percentual(nConcluidas),
        documentosPendentes: percentual(nDocumentosPendentes),
      },
      taxaCancelamento:
        totalComCanceladas === 0 ? 0 : round2((nCanceladas / totalComCanceladas) * 100),
    };
  }
 
  
// Considera solicitações criadas no período, não concluídas nem canceladas,
// e calcula a data limite (calendário local) a partir do prazo do serviço.


  private async getPrazos(periodo: PeriodoFiltro) {
    const solicitacoes = await this.solicitacaoModel.findAll({
      attributes: ['id', 'dataSolicitacao'],
      where: {
        dataSolicitacao: {
          [Op.gte]: periodo.rangeStart,
          [Op.lt]: periodo.rangeEndExclusive,
        },
        status: {
          [Op.notIn]: [StatusSolicitacaoEnum.CONCLUIDO, StatusSolicitacaoEnum.CANCELADO],
        },
      },
      include: [
        {
          model: Servico,
          as: 'servico',
          attributes: ['prazoEstimadoDias'],
          required: true,
        },
      ],
    });
 
    const hoje = hojeCalendarioSaoPaulo();
    const limiteProximas = somarDiasCalendario(hoje, 7);
 
    let proximasDeVencer = 0;
    let foraDoPrazo = 0;
 
    for (const solicitacao of solicitacoes) {
      const prazo = solicitacao.servico?.prazoEstimadoDias;
 
      // prazo nulo ou negativo é excluído; prazo zero é válido (vence no próprio dia)
      if (prazo === null || prazo === undefined || prazo < 0) continue;
 
      const dataLocalAbertura = dataCalendarioSaoPaulo(solicitacao.dataSolicitacao);
      const dataLimite = somarDiasCalendario(dataLocalAbertura, prazo);
 
      if (dataLimite < hoje) {
        foraDoPrazo++;
      } else if (dataLimite <= limiteProximas) {
        proximasDeVencer++;
      }
    }
 
    return { proximasDeVencer, foraDoPrazo };
  }
 
// Considera solicitações atualmente concluídas com dataConclusao no período.
// Soma/quantidade são acumuladas com precisão decimal; o arredondamento
// ocorre apenas no resultado final.

  private async getTempoMedio(periodo: PeriodoFiltro) {
    const solicitacoes = await this.solicitacaoModel.findAll({
      attributes: ['id', 'servicoId', 'dataSolicitacao', 'dataConclusao'],
      where: {
        status: StatusSolicitacaoEnum.CONCLUIDO,
        dataConclusao: {
          [Op.gte]: periodo.rangeStart,
          [Op.lt]: periodo.rangeEndExclusive,
        },
      },
      include: [
        {
          model: Servico,
          as: 'servico',
          attributes: ['id', 'nome'],
          required: true,
        },
      ],
    });
 
    const porServico = new Map<number, { nome: string; soma: number; quantidade: number }>();
    let somaGeral = 0;
    let quantidadeGeral = 0;
 
    for (const solicitacao of solicitacoes) {
      const { dataSolicitacao, dataConclusao, servico } = solicitacao;
      if (!dataSolicitacao || !dataConclusao || !servico) continue; // datas ausentes
 
      const duracaoDias =
        (dataConclusao.getTime() - dataSolicitacao.getTime()) / (24 * 60 * 60 * 1000);
 
      if (duracaoDias < 0) continue; // conclusão anterior à abertura
 
      somaGeral += duracaoDias;
      quantidadeGeral += 1;
 
      const atual = porServico.get(servico.id) ?? {
        nome: servico.nome,
        soma: 0,
        quantidade: 0,
      };
      atual.soma += duracaoDias;
      atual.quantidade += 1;
      porServico.set(servico.id, atual);
    }
 
    const tempoMedioPorServicoDias = Array.from(porServico.entries())
      .map(([servicoId, { nome, soma, quantidade }]) => ({
        servicoId,
        servicoNome: nome,
        tempoMedio: round2(soma / quantidade),
      }))
      .sort((a, b) => b.tempoMedio - a.tempoMedio || a.servicoId - b.servicoId);
 
    const tempoMedioGeralDias = quantidadeGeral === 0 ? null : round2(somaGeral / quantidadeGeral);
 
    return { porServico: tempoMedioPorServicoDias, geral: tempoMedioGeralDias };
  }
 
  /**
   * Saldo de parcelas de honorários (mensalidade/serviço avulso) não pagas,
   * vinculadas a solicitações do período. Resolvido em duas consultas agregadas:
   *  1) obrigações elegíveis vinculadas às solicitações do período;
   *  2) soma das parcelas (ativo/atrasado) dessas obrigações — cada parcela conta
   *     uma única vez, mesmo que a obrigação esteja ligada a mais de uma solicitação.
   */
  private async getTotalCreditosAberto(periodo: PeriodoFiltro): Promise<number> {
    const obrigacaoRows = (await this.obrigacaoServicoModel.findAll({
      attributes: ['obrigacaoId'],
      group: ['obrigacaoId'],
      include: [
        {
          model: Solicitacao,
          as: 'solicitacao',
          attributes: [],
          required: true,
          where: {
            dataSolicitacao: {
              [Op.gte]: periodo.rangeStart,
              [Op.lt]: periodo.rangeEndExclusive,
            },
            status: { [Op.ne]: StatusSolicitacaoEnum.CANCELADO },
          },
        },
        {
          model: Obrigacao,
          as: 'obrigacao',
          attributes: [],
          required: true,
          where: {
            naturezaCobranca: {
              [Op.in]: [NaturezaCobrancaEnum.MENSALIDADE, NaturezaCobrancaEnum.SERVICO_AVULSO],
            },
          },
        },
      ],
      raw: true,
    })) as unknown as { obrigacaoId: number }[];
 
    const obrigacaoIds = obrigacaoRows.map((row) => row.obrigacaoId);
    if (obrigacaoIds.length === 0) return 0;
 
    const resultado = (await this.parcelaModel.findOne({
      attributes: [[fn('SUM', col('valor')), 'total']],
      where: {
        status: { [Op.in]: [StatusParcelaEnum.ATIVO, StatusParcelaEnum.ATRASADO] },
      },
      include: [
        {
          model: Pagamento,
          as: 'pagamento',
          attributes: [],
          required: true,
          where: { obrigacaoId: { [Op.in]: obrigacaoIds } },
        },
      ],
      raw: true,
    })) as unknown as { total: string | null } | null;
 
    return round2(Number(resultado?.total ?? 0));
  }
}