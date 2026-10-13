import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES, mergeCategories } from './categories.js';

test('mescla categorias existentes sem duplicar (case-insensitive) e ignora vazias', () => {
  const r = mergeCategories(['Obrigações Fiscais', 'base de clientes', '  ', 'Obrigações Fiscais']);
  assert.equal(r.length, DEFAULT_CATEGORIES.length + 1);
  assert.ok(r.includes('Obrigações Fiscais'));
});
