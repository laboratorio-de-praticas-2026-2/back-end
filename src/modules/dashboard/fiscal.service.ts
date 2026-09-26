import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import {
  Obrigacao,
  NaturezaCobranca,
  StatusObrigacao,
} from '../../models/obrigacao.model.js';
import { Pagamento } from '../../models/pagamento.model.js';
import { Parcela, StatusParcela } from '../../models/parcela.model.js';
import {
  resolvePeriodo,
  getHojeSP,
  round2,
} from '../../commons/utils/period.util.js';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(
    @InjectModel(Obrigacao)
    private readonly obrigacaoModel: typeof Obrigacao,
    @InjectModel(Pagamento)
    private readonly pagamentoModel: typeof Pagamento,
    @InjectModel(Parcela)
    private readonly parcelaModel: typeof Parcela,
  ) {}

  async getIndicadores(startDate?: string, endDate?: string) {
    const { start, endExclusive } = resolvePeriodo(startDate, endDate);
    const hoje = getHojeSP();

    // 1. Busca obrigacoes de tributo com vencimento no periodo
    const obrigacoes = await this.obrigacaoModel.findAll({
      where: {
        naturezaCobranca: NaturezaCobranca.TRIBUTO,
        vencimento: { [Op.ne]: null, [Op.gte]: start, [Op.lt]: endExclusive },
      },
    });

    const idsObrigacoes = obrigacoes.map((o) => o.id);

    // 2. Busca pagamentos das obrigacoes
    const pagamentos = idsObrigacoes.length
      ? await this.pagamentoModel.findAll({
          where: { idObrigacao: { [Op.in]: idsObrigacoes } },
        })
      : [];

    const idsPagamentos = pagamentos.map((p) => p.id);

    // 3. Busca parcelas dos pagamentos
    const parcelas = idsPagamentos.length
      ? await this.parcelaModel.findAll({
          where: { idPagamento: { [Op.in]: idsPagamentos } },
        })
      : [];

    // 4. Indexa para lookup O(1)
    const parcelasPorPagamento = new Map<number, Parcela[]>();
    for (const p of parcelas) {
      const arr = parcelasPorPagamento.get(p.idPagamento) ?? [];
      arr.push(p);
      parcelasPorPagamento.set(p.idPagamento, arr);
    }

    const pagamentoPorObrigacao = new Map<number, Pagamento>();
    for (const p of pagamentos) {
      pagamentoPorObrigacao.set(p.idObrigacao, p);
    }

    // 5. Calcula indicadores
    let totalPendentes = 0;
    let impostosEmAtraso = 0;
    const distribuicaoMap = new Map<string, number>();

    for (const ob of obrigacoes) {
      const pendente = ob.status === StatusObrigacao.PENDENTE;
      if (pendente) totalPendentes++;

      const pagamento = pagamentoPorObrigacao.get(ob.id);
      const parcelasDaObrigacao = pagamento
        ? parcelasPorPagamento.get(pagamento.id) ?? []
        : [];

      const saldo = this.calcularSaldoVencido(
        ob,
        pagamento,
        parcelasDaObrigacao,
        hoje,
      );

      if (saldo <= 0 || !pendente) continue;

      impostosEmAtraso++;
      const descricao = (ob.descricao ?? '').trim() || 'Sem descricao';
      distribuicaoMap.set(
        descricao,
        (distribuicaoMap.get(descricao) ?? 0) + saldo,
      );
    }

    const distribuicao = Array.from(distribuicaoMap.entries())
      .map(([imposto, valor]) => ({ imposto, valor: round2(valor) }))
      .sort((a, b) => b.valor - a.valor || a.imposto.localeCompare(b.imposto));

    const valorTotal = round2(
      distribuicao.reduce((acc, d) => acc + d.valor, 0),
    );

    return {
      guias: {
        totalGeradas: obrigacoes.length,
        totalPendentes,
        impostosEmAtraso,
      },
      volumeImpostosAtraso: { valorTotal, distribuicao },
    };
  }

  private calcularSaldoVencido(
    ob: Obrigacao,
    pagamento: Pagamento | undefined,
    parcelas: Parcela[],
    hoje: Date,
  ): number {
    const venc = ob.vencimento ? new Date(ob.vencimento) : null;

    if (!pagamento) {
      if (!venc || venc >= hoje) return 0;
      return Number(ob.valor) || 0;
    }

    if (parcelas.length === 0) {
      this.logger.warn(
        `Pagamento ${pagamento.id} sem parcelas (Obrigacao ${ob.id}). Revisar.`,
      );
      return 0;
    }

    let saldo = 0;
    for (const p of parcelas) {
      if (p.status === StatusParcela.PAGO) continue;
      const vencP = p.vencimento ? new Date(p.vencimento) : null;
      if (!vencP || vencP >= hoje) continue;
      saldo += Number(p.valor) || 0;
    }
    return saldo;
  }
}