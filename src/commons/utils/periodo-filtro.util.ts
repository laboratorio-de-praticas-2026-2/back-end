import { BadRequestException } from '@nestjs/common';

export interface PeriodoFiltro {
  rangeStart: Date;
  rangeEndExclusive: Date;
  startDate: string;
  endDate: string;
}

const TIME_ZONE = 'America/Sao_Paulo';

function validarData(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split('-').map(Number);
  const dataUtc = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    dataUtc.getUTCFullYear() === ano &&
    dataUtc.getUTCMonth() === mes - 1 &&
    dataUtc.getUTCDate() === dia
  );
}

function hojeCalendarioSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dataCalendarioSaoPaulo(data: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);
}

function criarInicioDoDia(data: string): Date {
  return new Date(`${data}T00:00:00-03:00`);
}

function somarDiasCalendario(data: string, dias: number): string {
  const [ano, mes, dia] = data.split('-').map(Number);

  const resultado = new Date(Date.UTC(ano, mes - 1, dia));
  resultado.setUTCDate(resultado.getUTCDate() + dias);

  return [
    resultado.getUTCFullYear(),
    String(resultado.getUTCMonth() + 1).padStart(2, '0'),
    String(resultado.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

export function resolvePeriodo(
  startDate?: string,
  endDate?: string,
): PeriodoFiltro {
  if ((startDate === undefined) !== (endDate === undefined)) {
    throw new BadRequestException(
      'startDate e endDate devem ser informados juntos',
    );
  }

  if (startDate === undefined && endDate === undefined) {
    const hoje = hojeCalendarioSaoPaulo();

    const [ano, mes] = hoje.split('-').map(Number);

    const primeiroDia = `${ano}-${String(mes).padStart(2, '0')}-01`;

    return {
      startDate: primeiroDia,
      endDate: hoje,
      rangeStart: criarInicioDoDia(primeiroDia),
      rangeEndExclusive: criarInicioDoDia(somarDiasCalendario(hoje, 1)),
    };
  }

  if (!validarData(startDate!) || !validarData(endDate!)) {
    throw new BadRequestException(
      'As datas devem estar no formato YYYY-MM-DD',
    );
  }

  if (startDate! > endDate!) {
    throw new BadRequestException(
      'startDate não pode ser maior que endDate',
    );
  }

  return {
    startDate: startDate!,
    endDate: endDate!,
    rangeStart: criarInicioDoDia(startDate!),
    rangeEndExclusive: criarInicioDoDia(somarDiasCalendario(endDate!, 1)),
  };
}

export function round2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export {
  hojeCalendarioSaoPaulo,
  dataCalendarioSaoPaulo,
  somarDiasCalendario,
};