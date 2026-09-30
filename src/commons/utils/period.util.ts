import { BadRequestException } from '@nestjs/common';

export interface Periodo {
  start: Date;
  end: Date;
  endExclusive: Date;
}

export function parseDateSP(value: string): Date | null {
  if (typeof value !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [ano, mes, dia] = value.split('-').map(Number);
  const date = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    date.getUTCFullYear() !== ano ||
    date.getUTCMonth() !== mes - 1 ||
    date.getUTCDate() !== dia
  ) {
    return null;
  }
  return date;
}

export function getHojeSP(): Date {
  const now = new Date();
  const spStr = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  const sp = new Date(spStr);
  return new Date(Date.UTC(sp.getFullYear(), sp.getMonth(), sp.getDate()));
}

export function resolvePeriodo(startDate?: string, endDate?: string): Periodo {
  const incompleto = (startDate === undefined) !== (endDate === undefined);
  if (incompleto) {
    throw new BadRequestException('startDate e endDate devem ser enviados juntos.');
  }

  let start: Date;
  let end: Date;

  if (startDate === undefined && endDate === undefined) {
    end = getHojeSP();
    start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  } else {
    const inicio = parseDateSP(startDate!);
    const fim = parseDateSP(endDate!);

    if (!inicio || !fim) {
      throw new BadRequestException('Data inválida. Use o formato YYYY-MM-DD.');
    }
    start = inicio;
    end = fim;
  }

  if (start > end) {
    throw new BadRequestException('startDate não pode ser posterior a endDate.');
  }

  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return { start, end, endExclusive };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}