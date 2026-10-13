// URL base da API vem de window.__PORTAL_CONFIG__ (servido em /portal/config.js a partir de
// PORTAL_API_BASE_URL). Vazio = mesma origem do portal.
export function getConfig(globalObject = globalThis) {
  const cfg = globalObject.__PORTAL_CONFIG__ ?? {};
  return {
    apiBaseUrl: String(cfg.apiBaseUrl ?? '').replace(/\/+$/, ''),
    timeoutMs: Number(cfg.timeoutMs) > 0 ? Number(cfg.timeoutMs) : 30000,
  };
}
