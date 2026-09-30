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

// Representa a data de calendário de São Paulo com horário UTC zerado.
// Não representa o instante da meia-noite de São Paulo.
export function getHojeSP(): Date {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const obter = (tipo: string) =>
    Number(partes.find((parte) => parte.type === tipo)!.value);

  return new Date(
    Date.UTC(obter('year'), obter('month') - 1, obter('day')),
  );
}

export function resolvePeriodo(
  startDate?: string,
  endDate?: string,
): Periodo {
  let start: Date;
  let end: Date;

  if (startDate === undefined && endDate === undefined) {
    end = getHojeSP();

    start = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1),
    );
  } else {
    const inicio = parseDateSP(startDate ?? '');
    const fim = parseDateSP(endDate ?? '');

    if (!inicio || !fim) {
      throw new BadRequestException(
        'Informe startDate e endDate com datas válidas no formato YYYY-MM-DD.',
      );
    }

    start = inicio;
    end = fim;
  }

  if (start > end) {
    throw new BadRequestException(
      'startDate não pode ser posterior a endDate.',
    );
  }

  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return { start, end, endExclusive };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}