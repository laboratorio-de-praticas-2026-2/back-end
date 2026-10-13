import test from 'node:test';
import assert from 'node:assert/strict';
import { createRelatoriosApi } from './relatorios.js';

const api = (impl, raw = async () => ({ blob: async () => new Blob(['%PDF']) })) =>
  createRelatoriosApi({ json: impl, raw });

test('list repassa filtros/paginação e valida o formato', async () => {
  let args;
  const r = await api(async (p, o) => ((args = [p, o]), { dados: [], total: 0, pagina: 1, limite: 10 })).list({ page: 2 });
  assert.equal(args[0], '/relatorios');
  assert.deepEqual(args[1].query, { page: 2 });
  assert.equal(r.total, 0);
  await assert.rejects(api(async () => ({ foo: 1 })).list(), /formato inesperado/);
});

test('rotas de id, geração e exclusão', async () => {
  const calls = [];
  const a = api(
    async (p, o) => (calls.push([p, o?.method, o?.body]), {}),
    async (p) => {
      calls.push([p, undefined]);
      return { blob: async () => new Blob(['%PDF']) };
    },
  );
  await a.get('abc'); await a.generate('abc'); await a.remove('abc'); await a.pdf('abc');
  assert.deepEqual(calls.map((c) => c.slice(0, 2)), [
    ['/relatorios/abc', undefined], ['/relatorios/generate', 'POST'], ['/relatorios/abc', 'DELETE'], ['/relatorios/abc/pdf', undefined],
  ]);
  assert.deepEqual(calls[1][2], { relatorioId: 'abc' });
});

test('simulate rejeita resultado incompleto ou não numérico (ex.: null do Infinity)', async () => {
  const good = { impostos: 1, multas: 1, honorarios: 1, subtotal: 3, parcelas: 1, total: 3, valorParcela: 3 };
  assert.deepEqual(await api(async () => good).simulate({}), good);
  await assert.rejects(api(async () => ({ ...good, total: null })).simulate({}), /formato inesperado/);
  await assert.rejects(api(async () => ({ impostos: 1 })).simulate({}), /formato inesperado/);
});
