import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Servico } from '../../models/servico.model.js';
import {
  Solicitacao,
  StatusSolicitacao,
} from '../../models/solicitacao.model.js';
import {
  Obrigacao,
  NaturezaCobranca,
  TipoObrigacao,
} from '../../models/obrigacao.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';
import { Pagamento } from '../../models/pagamento.model.js';
import { Parcela, StatusParcela } from '../../models/parcela.model.js';
import { resolvePeriodo, round2 } from '../../commons/utils/period.util.js';

@Injectable()
export class ServicosService {
  constructor(
    @InjectModel(Servico) private readonly servicoModel: typeof Servico,
    @InjectModel(Solicitacao)
    private readonly solicitacaoModel: typeof Solicitacao,
    @InjectModel(Parcela) private readonly parcelaModel: typeof Parcela,
    @InjectModel(Pagamento)
    private readonly pagamentoModel: typeof Pagamento,
    @InjectModel(Obrigacao)
    private readonly obrigacaoModel: typeof Obrigacao,
    @InjectModel(ObrigacaoServico)
    private readonly obrigacaoServicoModel: typeof ObrigacaoServico,
  ) {}

  async getIndicadores(startDate?: string, endDate?: string) {
    const { start, endExclusive } = resolvePeriodo(startDate, endDate);

    // 1. Status do catalogo
    const [ativos, pausados] = await Promise.all([
      this.servicoModel.count({ where: { ativo: true } }),
      this.servicoModel.count({ where: { ativo: false } }),
    ]);

    // 2. Faturamento: parcelas pagas no periodo
    const parcelasPagas = await this.parcelaModel.findAll({
      where: {
        status: StatusParcela.PAGO,
        dataPagamento: {
          [Op.ne]: null,
          [Op.gte]: start,
          [Op.lt]: endExclusive,
        },
      },
    });

    const idsPagamentos = parcelasPagas.map((p) => p.idPagamento);

    const pagamentos = idsPagamentos.length
      ? await this.pagamentoModel.findAll({
          where: { id: { [Op.in]: idsPagamentos } },
        })
      : [];

    const idsObrigacoes = pagamentos.map((p) => p.idObrigacao);

    const obrigacoes = idsObrigacoes.length
      ? await this.obrigacaoModel.findAll({
          where: {
            id: { [Op.in]: idsObrigacoes },
            tipo: TipoObrigacao.SERVICO,
            naturezaCobranca: {
              [Op.in]: [
                NaturezaCobranca.MENSALIDADE,
                NaturezaCobranca.SERVICO_AVULSO,
              ],
            },
          },
        })
      : [];

    const idsObrigacoesValidas = obrigacoes.map((o) => o.id);

    const obrigacaoServicos = idsObrigacoesValidas.length
      ? await this.obrigacaoServicoModel.findAll({
          where: { idObrigacao: { [Op.in]: idsObrigacoesValidas } },
        })
      : [];

    const idsServicos = obrigacaoServicos.map((os) => os.idServico);

    const servicos = idsServicos.length
      ? await this.servicoModel.findAll({
          where: { id: { [Op.in]: idsServicos } },
        })
      : [];

    const pagamentoPorId = new Map(pagamentos.map((p) => [p.id, p]));
    const obrigacaoPorId = new Map(obrigacoes.map((o) => [o.id, o]));
    const osPorObrigacao = new Map(
      obrigacaoServicos.map((os) => [os.idObrigacao, os]),
    );
    const servicoPorId = new Map(servicos.map((s) => [s.id, s]));

    const faturamentoMap = new Map<number, { nome: string; total: number }>();

    for (const parcela of parcelasPagas) {
      const pagamento = pagamentoPorId.get(parcela.idPagamento);
      if (!pagamento) continue;
      const obrigacao = obrigacaoPorId.get(pagamento.idObrigacao);
      if (!obrigacao) continue;
      const os = osPorObrigacao.get(obrigacao.id);
      if (!os) continue;
      const servico = servicoPorId.get(os.idServico);
      if (!servico) continue;

      const atual = faturamentoMap.get(servico.id) ?? {
        nome: servico.nome,
        total: 0,
      };
      atual.total += Number(parcela.valor) || 0;
      faturamentoMap.set(servico.id, atual);
    }

    const faturamentoPorServico = Array.from(faturamentoMap.entries())
      .map(([servicoId, v]) => ({
        servicoId,
        servicoNome: v.nome,
        totalFaturado: round2(v.total),
      }))
      .sort(
        (a, b) =>
          b.totalFaturado - a.totalFaturado || a.servicoId - b.servicoId,
      );

    // 3. Demandas
    const solicitacoes = await this.solicitacaoModel.findAll({
      where: {
        status: { [Op.ne]: StatusSolicitacao.CANCELADO },
        dataSolicitacao: { [Op.gte]: start, [Op.lt]: endExclusive },
      },
    });

    const idsServicosDemanda = solicitacoes.map((s) => s.servicoId);

    const servicosDemanda = idsServicosDemanda.length
      ? await this.servicoModel.findAll({
          where: { id: { [Op.in]: idsServicosDemanda } },
        })
      : [];

    const servicoDemandaPorId = new Map(servicosDemanda.map((s) => [s.id, s]));

    const demandaMap = new Map<number, { nome: string; qtd: number }>();
    for (const s of solicitacoes) {
      const servico = servicoDemandaPorId.get(s.servicoId);
      if (!servico) continue;
      const atual = demandaMap.get(servico.id) ?? {
        nome: servico.nome,
        qtd: 0,
      };
      atual.qtd++;
      demandaMap.set(servico.id, atual);
    }

    const demandasMaisSolicitadas = Array.from(demandaMap.entries())
      .map(([servicoId, v]) => ({
        servicoId,
        servicoNome: v.nome,
        quantidade: v.qtd,
      }))
      .sort(
        (a, b) => b.quantidade - a.quantidade || a.servicoId - b.servicoId,
      );

    return {
      statusServicos: { ativos, pausados, total: ativos + pausados },
      faturamentoPorServico,
      demandasMaisSolicitadas,
    };
  }
}