import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReportForm, validateSimulatorForm } from './validators.js';

test('relatório: campos obrigatórios e intervalo de datas', () => {
  const e = validateReportForm({ categoria: '', nome: ' ', descricao: '', data_inicio: '', data_termino: '' });
  assert.deepEqual(Object.keys(e).sort(), ['categoria', 'data_inicio', 'data_termino', 'descricao', 'nome']);
  const bad = validateReportForm({ categoria: 'a', nome: 'n', descricao: 'd', data_inicio: '2026-05-10', data_termino: '2026-05-01' });
  assert.match(bad.data_termino, /posterior/);
  assert.deepEqual(validateReportForm({ categoria: 'a', nome: 'n', descricao: 'd', data_inicio: '2026-05-01', data_termino: '2026-05-01' }), {});
});

test('simulador: payload válido converte vírgula e omite opcionais vazios', () => {
  const r = validateSimulatorForm({ impostos: '1000,50', multas: '0', honorarios: '300', parcelas: '', taxaJurosMensal: '' });
  assert.deepEqual(r.payload, { impostos: 1000.5, multas: 0, honorarios: 300 });
});

test('simulador: obrigatórios, negativos, decimais e limites do DTO', () => {
  const r = validateSimulatorForm({ impostos: '', multas: '-1', honorarios: '1.234', parcelas: '0', taxaJurosMensal: '101' });
  assert.equal(r.payload, undefined);
  assert.ok(r.errors.impostos && r.errors.multas && r.errors.honorarios && r.errors.parcelas && r.errors.taxaJurosMensal);
  assert.match(validateSimulatorForm({ impostos: '1', multas: '1', honorarios: '1', parcelas: '361' }).errors.parcelas, /360/);
  assert.match(validateSimulatorForm({ impostos: '1', multas: '1', honorarios: '1', parcelas: '2.5' }).errors.parcelas, /inteiro/);
  assert.match(validateSimulatorForm({ impostos: 'abc', multas: '1', honorarios: '1' }).errors.impostos, /número válido/);
});
