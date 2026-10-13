import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute } from './router.js';

test('rotas conhecidas, padrão e desconhecida', () => {
  assert.equal(resolveRoute('').path, '#/relatorios');
  assert.equal(resolveRoute('#/relatorios/').path, '#/relatorios');
  assert.equal(resolveRoute('#/relatorios/novo').path, '#/relatorios/novo');
  assert.equal(resolveRoute('#/simulador?x=1').path, '#/simulador');
  assert.equal(resolveRoute('#/dashboard'), null);
});
