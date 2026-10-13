import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatPeriod, hasPdf, pdfFileName, slugify, statusInfo } from './format.js';

test('datas ISO não deslocam o dia (UTC)', () => {
  assert.equal(formatDate('2026-04-07T00:00:00.000Z'), '07/04/2026');
  assert.equal(formatPeriod('2026-04-07', '2026-05-07'), '07/04/2026 — 07/05/2026');
  assert.equal(formatDate(null), '-');
  assert.equal(formatDate('lixo'), '-');
});

test('status reais do backend', () => {
  assert.equal(statusInfo('GERADO').tone, 'success');
  assert.equal(statusInfo('PENDENTE').tone, 'warning');
  assert.equal(statusInfo('FALHA').tone, 'danger');
  assert.equal(statusInfo('X').tone, 'neutral');
});

test('PDF só existe para GERADO com URL', () => {
  assert.equal(hasPdf({ status: 'GERADO', arquivoUrl: 'https://x/a.pdf' }), true);
  assert.equal(hasPdf({ status: 'GERADO', arquivoUrl: null }), false);
  assert.equal(hasPdf({ status: 'PENDENTE', arquivoUrl: 'https://x' }), false);
  assert.equal(hasPdf({ status: 'FALHA' }), false);
});

test('nome de arquivo adequado', () => {
  assert.equal(slugify('Relatório de DAS — 2026'), 'relatorio-de-das-2026');
  assert.equal(pdfFileName({ nome: 'Gestão Fiscal' }), 'gestao-fiscal.pdf');
  assert.equal(pdfFileName({}), 'relatorio.pdf');
});
