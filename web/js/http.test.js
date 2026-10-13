import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, createHttpClient, toUserMessage } from './http.js';

const silent = { error() {} };
const ok = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

test('monta URL com base, ignora query vazia e envia JSON', async () => {
  let call;
  const http = createHttpClient({
    baseUrl: 'http://api.test',
    logger: silent,
    fetchImpl: async (url, init) => ((call = { url, init }), ok({ a: 1 })),
  });
  const data = await http.json('/relatorios', { query: { page: 2, nome: '', x: undefined }, method: 'POST', body: { z: 1 } });
  assert.deepEqual(data, { a: 1 });
  assert.equal(call.url, 'http://api.test/relatorios?page=2');
  assert.equal(call.init.body, '{"z":1}');
  assert.equal(call.init.headers['Content-Type'], 'application/json');
});

test('envia Authorization quando há token', async () => {
  let headers;
  const http = createHttpClient({ baseUrl: 'http://x', logger: silent, getToken: () => 'abc', fetchImpl: async (_u, i) => ((headers = i.headers), ok({})) });
  await http.json('/a');
  assert.equal(headers.Authorization, 'Bearer abc');
});

test('4xx vira ApiError http com mensagem do backend (array unido)', async () => {
  const http = createHttpClient({ baseUrl: 'http://x', logger: silent, fetchImpl: async () => ok({ message: ['a inválido', 'b inválido'] }, 400) });
  await assert.rejects(http.json('/a'), (e) => e instanceof ApiError && e.kind === 'http' && e.status === 400 && e.message === 'a inválido b inválido');
});

test('5xx não expõe detalhes técnicos ao usuário', async () => {
  const http = createHttpClient({ baseUrl: 'http://x', logger: silent, fetchImpl: async () => ok({ message: 'stack secreta' }, 500) });
  const err = await http.json('/a').catch((e) => e);
  assert.match(toUserMessage(err), /Erro interno/);
  assert.doesNotMatch(toUserMessage(err), /secreta/);
});

test('falha de rede vira ApiError network', async () => {
  const http = createHttpClient({ baseUrl: 'http://x', logger: silent, fetchImpl: async () => { throw new TypeError('fetch failed'); } });
  const err = await http.json('/a').catch((e) => e);
  assert.equal(err.kind, 'network');
  assert.match(toUserMessage(err), /conectar/);
});

test('timeout vira ApiError timeout', async () => {
  const http = createHttpClient({
    baseUrl: 'http://x', logger: silent, timeoutMs: 20,
    fetchImpl: (_u, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(Object.assign(new Error('abort'), { name: 'AbortError' })))),
  });
  const err = await http.json('/a').catch((e) => e);
  assert.equal(err.kind, 'timeout');
});

test('cancelamento pelo chamador vira kind aborted', async () => {
  const ctl = new AbortController();
  const http = createHttpClient({
    baseUrl: 'http://x', logger: silent,
    fetchImpl: (_u, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(Object.assign(new Error('abort'), { name: 'AbortError' })))),
  });
  const p = http.json('/a', { signal: ctl.signal });
  ctl.abort();
  assert.equal((await p.catch((e) => e)).kind, 'aborted');
});

test('resposta 200 com corpo inválido vira parse', async () => {
  const http = createHttpClient({ baseUrl: 'http://x', logger: silent, fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('x'); } }) });
  assert.equal((await http.json('/a').catch((e) => e)).kind, 'parse');
});
