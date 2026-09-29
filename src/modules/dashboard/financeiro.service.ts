import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardFinanceiro(startDate?: string, endDate?: string) {
    const period = this.parseAndValidatePeriod(startDate, endDate);

    const faturamentoRecebidoRow = await this.prisma.$queryRawUnsafe(
      `
        SELECT COALESCE(SUM(p.valor), 0) AS total
        FROM parcelas p
        INNER JOIN pagamentos pag ON pag.id = p.pagamento_id AND pag.deleted_at IS NULL
        INNER JOIN obrigacoes o ON o.id = pag.obrigacao_id AND o.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND p.status = 'pago'
          AND p.data_pagamento IS NOT NULL
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') >= ?
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') < ?
          AND o.natureza_cobranca IN ('mensalidade', 'servico_avulso')
      `,
      period.startDateTime,
      period.endDateTime,
    ) as Array<{ total: string | number }>;

    const faturamentoRecebido = Number(Number(faturamentoRecebidoRow[0]?.total ?? 0).toFixed(2));

    const ticketRow = await this.prisma.$queryRawUnsafe(
      `
        SELECT
          COALESCE(SUM(p.valor), 0) AS receita_clientes,
          COUNT(DISTINCT u.id) AS qtd_clientes
        FROM parcelas p
        INNER JOIN pagamentos pag ON pag.id = p.pagamento_id AND pag.deleted_at IS NULL
        INNER JOIN obrigacoes o ON o.id = pag.obrigacao_id AND o.deleted_at IS NULL
        LEFT JOIN obrigacao_empresas oe ON oe.obrigacao_id = o.id
        LEFT JOIN empresas emp ON emp.id = oe.empresa_id
        LEFT JOIN obrigacao_servicos os ON os.obrigacao_id = o.id
        LEFT JOIN solicitacoes sol ON sol.id = os.solicitacao_id
        LEFT JOIN usuarios u ON (
          (o.tipo = 'empresa' AND emp.usuario_id = u.id) OR
          (o.tipo = 'servico' AND sol.usuario_id = u.id)
        )
        WHERE p.deleted_at IS NULL
          AND p.status = 'pago'
          AND p.data_pagamento IS NOT NULL
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') >= ?
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') < ?
          AND o.natureza_cobranca IN ('mensalidade', 'servico_avulso')
          AND u.id IS NOT NULL
      `,
      period.startDateTime,
      period.endDateTime,
    ) as Array<{ receita_clientes: string | number; qtd_clientes: string | number }>;

    const receitaClientes = Number(ticketRow[0]?.receita_clientes ?? 0);
    const qtdClientesDistintos = Number(ticketRow[0]?.qtd_clientes ?? 0);
    const ticketMedio = qtdClientesDistintos > 0 ? Number((receitaClientes / qtdClientesDistintos).toFixed(2)) : 0;

    const aReceberRow = await this.prisma.$queryRawUnsafe(
      `
        SELECT COALESCE(SUM(p.valor), 0) AS total
        FROM parcelas p
        INNER JOIN pagamentos pag ON pag.id = p.pagamento_id AND pag.deleted_at IS NULL
        INNER JOIN obrigacoes o ON o.id = pag.obrigacao_id AND o.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND p.status IN ('ativo', 'atrasado')
          AND DATE(p.vencimento) >= ?
          AND DATE(p.vencimento) <= ?
          AND o.natureza_cobranca IN ('mensalidade', 'servico_avulso')
      `,
      period.startDate,
      period.endDate,
    ) as Array<{ total: string | number }>;
    const aReceber = Number(Number(aReceberRow[0]?.total ?? 0).toFixed(2));

    const receitaExtrasRow = await this.prisma.$queryRawUnsafe(
      `
        SELECT COALESCE(SUM(p.valor), 0) AS total
        FROM parcelas p
        INNER JOIN pagamentos pag ON pag.id = p.pagamento_id AND pag.deleted_at IS NULL
        INNER JOIN obrigacoes o ON o.id = pag.obrigacao_id AND o.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND p.status = 'pago'
          AND p.data_pagamento IS NOT NULL
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') >= ?
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') < ?
          AND o.natureza_cobranca = 'servico_avulso'
      `,
      period.startDateTime,
      period.endDateTime,
    ) as Array<{ total: string | number }>;
    const receitaServicosExtras = Number(Number(receitaExtrasRow[0]?.total ?? 0).toFixed(2));

    const historicoRows = await this.prisma.$queryRawUnsafe(
      `
        SELECT
          DATE_FORMAT(CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00'), '%Y-%m') AS mes,
          COALESCE(SUM(p.valor), 0) AS valor
        FROM parcelas p
        INNER JOIN pagamentos pag ON pag.id = p.pagamento_id AND pag.deleted_at IS NULL
        INNER JOIN obrigacoes o ON o.id = pag.obrigacao_id AND o.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND p.status = 'pago'
          AND p.data_pagamento IS NOT NULL
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') >= ?
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') < ?
          AND o.natureza_cobranca IN ('mensalidade', 'servico_avulso')
        GROUP BY DATE_FORMAT(CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00'), '%Y-%m')
      `,
      period.startDateTime,
      period.endDateTime,
    ) as Array<{ mes: string; valor: string | number }>;

    const historicoMap = new Map<string, number>();
    for (const row of historicoRows) {
      historicoMap.set(String(row.mes), Number(Number(row.valor ?? 0).toFixed(2)));
    }

    const historicoMensal = period.monthsInPeriod.map((mes) => ({
      mes,
      valor: Number((historicoMap.get(mes) ?? 0).toFixed(2)),
    }));

    const metodoRows = await this.prisma.$queryRawUnsafe(
      `
        SELECT
          LOWER(TRIM(COALESCE(pag.metodo_pagamento, ''))) AS metodo,
          COALESCE(SUM(p.valor), 0) AS valor
        FROM parcelas p
        INNER JOIN pagamentos pag ON pag.id = p.pagamento_id AND pag.deleted_at IS NULL
        INNER JOIN obrigacoes o ON o.id = pag.obrigacao_id AND o.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND p.status = 'pago'
          AND p.data_pagamento IS NOT NULL
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') >= ?
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') < ?
          AND o.natureza_cobranca IN ('mensalidade', 'servico_avulso')
        GROUP BY LOWER(TRIM(COALESCE(pag.metodo_pagamento, '')))
      `,
      period.startDateTime,
      period.endDateTime,
    ) as Array<{ metodo: string; valor: string | number }>;

    let pix = 0;
    let boleto = 0;
    let cartao = 0;
    let outros = 0;

    for (const row of metodoRows) {
      const valor = Number(row.valor ?? 0);
      const metodo = String(row.metodo ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      if (metodo === 'pix') pix += valor;
      else if (metodo === 'boleto') boleto += valor;
      else if (['cartao', 'cartao de credito', 'cartao de debito', 'credito', 'debito', 'cartao_credito', 'cartao_debito'].includes(metodo)) {
        cartao += valor;
      } else {
        outros += valor;
      }
    }

    const distribuicaoMetodoPagamento = {
      pix: faturamentoRecebido > 0 ? Number(((pix / faturamentoRecebido) * 100).toFixed(2)) : 0,
      boleto: faturamentoRecebido > 0 ? Number(((boleto / faturamentoRecebido) * 100).toFixed(2)) : 0,
      cartao: faturamentoRecebido > 0 ? Number(((cartao / faturamentoRecebido) * 100).toFixed(2)) : 0,
      outros: faturamentoRecebido > 0 ? Number(((outros / faturamentoRecebido) * 100).toFixed(2)) : 0,
    };

    const tipoRows = await this.prisma.$queryRawUnsafe(
      `
        SELECT
          o.natureza_cobranca AS natureza,
          COALESCE(SUM(p.valor), 0) AS valor
        FROM parcelas p
        INNER JOIN pagamentos pag ON pag.id = p.pagamento_id AND pag.deleted_at IS NULL
        INNER JOIN obrigacoes o ON o.id = pag.obrigacao_id AND o.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND p.status = 'pago'
          AND p.data_pagamento IS NOT NULL
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') >= ?
          AND CONVERT_TZ(p.data_pagamento, '+00:00', '-03:00') < ?
          AND o.natureza_cobranca IN ('mensalidade', 'servico_avulso')
        GROUP BY o.natureza_cobranca
      `,
      period.startDateTime,
      period.endDateTime,
    ) as Array<{ natureza: string; valor: string | number }>;

    let mensalidadeFixa = 0;
    let servicosAvulsos = 0;

    for (const row of tipoRows) {
      const valor = Number(row.valor ?? 0);
      if (row.natureza === 'mensalidade') mensalidadeFixa += valor;
      if (row.natureza === 'servico_avulso') servicosAvulsos += valor;
    }

    const distribuicaoTipoPagamento = {
      mensalidadeFixa: faturamentoRecebido > 0 ? Number(((mensalidadeFixa / faturamentoRecebido) * 100).toFixed(2)) : 0,
      servicosAvulsos: faturamentoRecebido > 0 ? Number(((servicosAvulsos / faturamentoRecebido) * 100).toFixed(2)) : 0,
    };

    const previsaoRow = await this.prisma.$queryRawUnsafe(
      `
        SELECT
          COALESCE(SUM(p.valor), 0) AS valor,
          COUNT(p.id) AS parcelas
        FROM parcelas p
        INNER JOIN pagamentos pag ON pag.id = p.pagamento_id AND pag.deleted_at IS NULL
        INNER JOIN obrigacoes o ON o.id = pag.obrigacao_id AND o.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND p.status IN ('ativo', 'atrasado')
          AND DATE(p.vencimento) >= ?
          AND DATE(p.vencimento) <= ?
          AND o.natureza_cobranca IN ('mensalidade', 'servico_avulso')
      `,
      period.todayStr,
      period.todayPlus30Str,
    ) as Array<{ valor: string | number; parcelas: string | number }>;

    const inadimplenciaRow = await this.prisma.$queryRawUnsafe(
      `
        SELECT
          COALESCE(SUM(p.valor), 0) AS valor,
          COUNT(p.id) AS parcelas
        FROM parcelas p
        INNER JOIN pagamentos pag ON pag.id = p.pagamento_id AND pag.deleted_at IS NULL
        INNER JOIN obrigacoes o ON o.id = pag.obrigacao_id AND o.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND p.status IN ('ativo', 'atrasado')
          AND DATE(p.vencimento) < ?
          AND o.natureza_cobranca IN ('mensalidade', 'servico_avulso')
      `,
      period.todayStr,
    ) as Array<{ valor: string | number; parcelas: string | number }>;

    return {
      faturamentoRecebido,
      aReceber,
      receitaServicosExtras,
      ticketMedio,
      graficos: {
        historicoMensal,
        distribuicaoMetodoPagamento,
        distribuicaoTipoPagamento,
      },
      previsaoReceita30Dias: {
        valor: Number(Number(previsaoRow[0]?.valor ?? 0).toFixed(2)),
        parcelasProximas: Number(previsaoRow[0]?.parcelas ?? 0),
      },
      inadimplencia: {
        valorTotalVencido: Number(Number(inadimplenciaRow[0]?.valor ?? 0).toFixed(2)),
        parcelasEmAtraso: Number(inadimplenciaRow[0]?.parcelas ?? 0),
      },
    };
  }

  private parseAndValidatePeriod(startDate?: string, endDate?: string) {
    if ((startDate && !endDate) || (!startDate && endDate)) {
      throw new BadRequestException('startDate e endDate devem ser fornecidos juntos.');
    }

    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    const addDays = (value: string, days: number) => {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      date.setDate(date.getDate() + days);
      const formattedYear = date.getFullYear();
      const formattedMonth = String(date.getMonth() + 1).padStart(2, '0');
      const formattedDay = String(date.getDate()).padStart(2, '0');
      return `${formattedYear}-${formattedMonth}-${formattedDay}`;
    };

    const isValidCalendarDate = (value: string) => {
      if (!dateRegex.test(value)) return false;
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    };

    const getTodaySP = () => {
      const now = new Date();
      const value = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let start = startDate ?? '';
    let end = endDate ?? '';
    const todayStr = getTodaySP();

    if (!start || !end) {
      const [year, month] = todayStr.split('-');
      start = `${year}-${month}-01`;
      end = todayStr;
    } else if (!isValidCalendarDate(start) || !isValidCalendarDate(end)) {
      throw new BadRequestException('Formato de data inválido ou data inexistente. Utilize YYYY-MM-DD.');
    }

    if (start > end) {
      throw new BadRequestException('A data de início não pode ser posterior à data de fim.');
    }

    const todayPlus30Str = addDays(todayStr, 30);
    const startDateTime = `${start} 00:00:00`;
    const endDateTime = `${addDays(end, 1)} 00:00:00`;

    const monthsInPeriod: string[] = [];
    const startMonth = new Date(`${start.substring(0, 7)}-01T00:00:00`);
    const endMonth = new Date(`${end.substring(0, 7)}-01T00:00:00`);
    const cursor = new Date(startMonth);

    while (cursor <= endMonth) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      monthsInPeriod.push(`${year}-${month}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return {
      startDate: start,
      endDate: end,
      startDateTime,
      endDateTime,
      todayStr,
      todayPlus30Str,
      monthsInPeriod,
    };
  }
}