import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardClientes(startDate?: string, endDate?: string) {
    const period = this.parseAndValidatePeriod(startDate, endDate);

    const topServicos = await this.prisma.$queryRawUnsafe(
      `
        SELECT
          u.id AS clienteId,
          u.nome AS clienteNome,
          COUNT(s.id) AS quantidadeServicos
        FROM solicitacoes s
        INNER JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.deleted_at IS NULL
          AND s.status != 'cancelado'
          AND s.data_solicitacao >= ?
          AND s.data_solicitacao < ?
        GROUP BY u.id, u.nome
        ORDER BY quantidadeServicos DESC, clienteId ASC
      `,
      period.startDateTime,
      period.endDateTime,
    ) as Array<{ clienteId: number; clienteNome: string; quantidadeServicos: number }>;

    const topRentaveis = await this.prisma.$queryRawUnsafe(
      `
        SELECT
          u.id AS clienteId,
          u.nome AS clienteNome,
          COALESCE(SUM(p.valor), 0) AS totalFaturado
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
        GROUP BY u.id, u.nome
        ORDER BY totalFaturado DESC, clienteId ASC
      `,
      period.startDateTime,
      period.endDateTime,
    ) as Array<{ clienteId: number; clienteNome: string; totalFaturado: number }>;

    const clientesInadimplentes = await this.prisma.$queryRawUnsafe(
      `
        SELECT
          u.id AS clienteId,
          u.nome AS clienteNome,
          COALESCE(SUM(p.valor), 0) AS valorEmAtraso
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
          AND p.status IN ('ativo', 'atrasado')
          AND DATE(p.vencimento) < ?
          AND o.natureza_cobranca IN ('mensalidade', 'servico_avulso')
          AND u.id IS NOT NULL
        GROUP BY u.id, u.nome
        ORDER BY valorEmAtraso DESC, clienteId ASC
      `,
      period.todayStr,
    ) as Array<{ clienteId: number; clienteNome: string; valorEmAtraso: number }>;

    return {
      topClientesServicos: topServicos.map((item) => ({
        clienteId: Number(item.clienteId),
        clienteNome: item.clienteNome,
        quantidadeServicos: Number(item.quantidadeServicos ?? 0),
      })),
      topClientesRentaveis: topRentaveis.map((item) => ({
        clienteId: Number(item.clienteId),
        clienteNome: item.clienteNome,
        totalFaturado: Number(Number(item.totalFaturado ?? 0).toFixed(2)),
      })),
      clientesInadimplentes: clientesInadimplentes.map((item) => ({
        clienteId: Number(item.clienteId),
        clienteNome: item.clienteNome,
        valorEmAtraso: Number(Number(item.valorEmAtraso ?? 0).toFixed(2)),
      })),
    };
  }

  private parseAndValidatePeriod(startDate?: string, endDate?: string) {
    if ((startDate && !endDate) || (!startDate && endDate)) {
      throw new BadRequestException('startDate e endDate devem ser fornecidos juntos.');
    }

    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    const isValidCalendarDate = (value: string) => {
      if (!dateRegex.test(value)) return false;
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    };

    const addDays = (value: string, days: number) => {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      date.setDate(date.getDate() + days);
      const formattedYear = date.getFullYear();
      const formattedMonth = String(date.getMonth() + 1).padStart(2, '0');
      const formattedDay = String(date.getDate()).padStart(2, '0');
      return `${formattedYear}-${formattedMonth}-${formattedDay}`;
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

    return {
      startDate: start,
      endDate: end,
      todayStr,
      startDateTime: `${start} 00:00:00`,
      endDateTime: `${addDays(end, 1)} 00:00:00`,
    };
  }
}