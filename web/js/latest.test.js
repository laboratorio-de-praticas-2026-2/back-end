import test from 'node:test';
import assert from 'node:assert/strict';
import { createLatest, debounce } from './latest.js';

test('somente a requisição mais recente é considerada atual e a anterior é abortada', () => {
  const l = createLatest();
  const a = l.start();
  const b = l.start();
  assert.equal(a.signal.aborted, true);
  assert.equal(a.isCurrent(), false);
  assert.equal(b.isCurrent(), true);
  l.cancel();
  assert.equal(b.isCurrent(), false);
});

test('debounce agrupa chamadas', async () => {
  let n = 0;
  const d = debounce(() => n++, 10);
  d(); d(); d();
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(n, 1);
});
