import { describe, it, expect, vi, afterEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  resolvePeriodo,
  somarDiasCalendario,
  dataCalendarioSaoPaulo,
  round2,
} from './periodo-filtro.util.js';

describe('resolvePeriodo', () => {
  afterEach(() => vi.useRealTimers());

  // ── Endpoints com e sem filtros ──────────────────────────────────────
  it('sem datas: usa o mês atual até hoje (fuso São Paulo)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T15:00:00Z')); // 12h em São Paulo

    const p = resolvePeriodo();

    expect(p.startDate).toBe('2026-09-01');
    expect(p.endDate).toBe('2026-09-29');
    expect(p.rangeStart.toISOString()).toBe('2026-09-01T03:00:00.000Z');
    expect(p.rangeEndExclusive.toISOString()).toBe('2026-09-30T03:00:00.000Z');
  });

  it('com datas válidas: início do startDate até o início do dia seguinte ao endDate', () => {
    const p = resolvePeriodo('2026-09-01', '2026-09-30');

    expect(p.rangeStart.toISOString()).toBe('2026-09-01T03:00:00.000Z');
    expect(p.rangeEndExclusive.toISOString()).toBe('2026-10-01T03:00:00.000Z');
  });

  it('aceita startDate igual a endDate (período de um dia)', () => {
    expect(() => resolvePeriodo('2026-09-29', '2026-09-29')).not.toThrow();
  });

  // ── Limites do dia final ─────────────────────────────────────────────
  it('o último milissegundo do dia final entra; 00:00 do dia seguinte não', () => {
    const { rangeEndExclusive } = resolvePeriodo('2026-09-29', '2026-09-29');

    expect(new Date('2026-09-30T02:59:59.999Z') < rangeEndExclusive).toBe(true); // 23:59:59.999 SP
    expect(new Date('2026-09-30T03:00:00.000Z') < rangeEndExclusive).toBe(false); // 00:00 SP do dia 30
  });

  it('virada de ano no dia final', () => {
    const { rangeEndExclusive } = resolvePeriodo('2026-12-01', '2026-12-31');
    expect(rangeEndExclusive.toISOString()).toBe('2027-01-01T03:00:00.000Z');
  });

  // ── Datas inválidas (400) ────────────────────────────────────────────
  const invalidos: [string, string | undefined, string | undefined][] = [
    ['apenas startDate', '2026-09-01', undefined],
    ['apenas endDate', undefined, '2026-09-01'],
    ['data inexistente (30/02)', '2026-02-30', '2026-03-01'],
    ['29/02 em ano não bissexto', '2026-02-29', '2026-03-01'],
    ['formato DD/MM/YYYY', '29/09/2026', '30/09/2026'],
    ['texto qualquer', 'abc', 'def'],
    ['início posterior ao fim', '2026-09-30', '2026-09-01'],
  ];

  for (const [nome, inicio, fim] of invalidos) {
    it(`retorna 400: ${nome}`, () => {
      expect(() => resolvePeriodo(inicio, fim)).toThrow(BadRequestException);
    });
  }

  it('29/02 em ano bissexto é válido', () => {
    expect(() => resolvePeriodo('2028-02-29', '2028-02-29')).not.toThrow();
  });
});

describe('utilitários de data e arredondamento', () => {
  it('somarDiasCalendario: hoje+7, hoje+8 e virada de ano', () => {
    expect(somarDiasCalendario('2026-09-29', 7)).toBe('2026-10-06');
    expect(somarDiasCalendario('2026-09-29', 8)).toBe('2026-10-07');
    expect(somarDiasCalendario('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('dataCalendarioSaoPaulo: 02:00Z ainda é o dia anterior em São Paulo', () => {
    expect(dataCalendarioSaoPaulo(new Date('2026-09-30T02:00:00Z'))).toBe('2026-09-29');
  });

  it('round2 arredonda para 2 casas', () => {
    expect(round2(2.6666666)).toBe(2.67);
    expect(round2(16.666666)).toBe(16.67);
    expect(round2(1500.5)).toBe(1500.5);
  });
});