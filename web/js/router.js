// Roteamento por hash (#/relatorios, #/relatorios/novo, #/simulador): não exige fallback no servidor.
export const ROUTES = [
  { path: '#/relatorios/novo', name: 'relatorios' },
  { path: '#/relatorios', name: 'relatorios' },
  { path: '#/simulador', name: 'simulador' },
];

export function resolveRoute(hash) {
  const clean = (hash || '').split('?')[0].replace(/\/+$/, '') || '#/relatorios';
  return ROUTES.find((r) => r.path === clean) ?? null;
}
