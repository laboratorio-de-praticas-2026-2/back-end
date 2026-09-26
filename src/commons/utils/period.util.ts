import { BadRequestException } from '@nestjs/common';

export interface Periodo {
  start: Date;
  end: Date;
  endExclusive: Date;
}

/**
 * Resolve o período a ser usado nos dashboards.
 * - Sem parâmetros: do primeiro dia do mês atual até hoje (fuso America/Sao_Paulo)
 * - Com parâmetros: valida formato YYYY-MM-DD, valida ordem, retorna range [start, endExclusive)
 */
export function resolvePeriodo(startDate?: string, endDate?: string): Periodo {
  const incompleto = (startDate && !endDate) || (!startDate && endDate);
  if (incompleto) {
    throw new BadRequestException(
      'startDate e endDate devem ser enviados juntos.',
    );
  }

  const hoje = getHojeSP();

  if (!startDate && !endDate) {
    const primeiroDia = new Date(
      Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1),
    );
    const endExclusive = new Date(hoje);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    return { start: primeiroDia, end: hoje, endExclusive };
  }

  const start = parseDateSP(startDate!);
  const end = parseDateSP(endDate!);

  if (!start || !end) {
    throw new BadRequestException('Data inválida. Use o formato YYYY-MM-DD.');
  }
  if (start > end) {
    throw new BadRequestException('startDate é posterior a endDate.');
  }

  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return { start, end, endExclusive };
}

/**
 * Converte 'YYYY-MM-DD' em Date UTC (calendário puro, sem shift de fuso).
 * Retorna null se o formato ou a data forem inválidos.
 */
export function parseDateSP(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

/**
 * Retorna a data de "hoje" no fuso America/Sao_Paulo, representada em UTC
 * com horário zerado (calendário puro).
 */
export function getHojeSP(): Date {
  const now = new Date();
  const spStr = now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
  });
  const sp = new Date(spStr);
  return new Date(Date.UTC(sp.getFullYear(), sp.getMonth(), sp.getDate()));
}

/**
 * Arredonda para 2 casas decimais (evita erro de floating point).
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}