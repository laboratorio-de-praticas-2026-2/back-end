import { getConfig } from './app-config.js';
import { createHttpClient } from './http.js';
import { createRelatoriosApi } from './api/relatorios.js';
import { buildShell } from './layout.js';
import { resolveRoute } from './router.js';
import { h } from './dom.js';
import { stateBox } from './ui.js';
import { renderReports } from './views/reports.js';
import { renderReportForm } from './views/report-form.js';
import { renderSimulator } from './views/simulator.js';

const cfg = getConfig();
// Os endpoints de relatórios/simulação não exigem autenticação no backend atual.
// Se passarem a exigir, basta informar `getToken` (Bearer, igual ao AuthGuard existente).
const api = createRelatoriosApi(createHttpClient({ baseUrl: cfg.apiBaseUrl, timeoutMs: cfg.timeoutMs }));

const shell = buildShell();
document.getElementById('app').replaceChildren(shell.root);

let dispose;
let pendingFlash;

function navigate(hash, { flash } = {}) {
  pendingFlash = flash;
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  dispose?.();
  dispose = undefined;
  shell.content.replaceChildren();
  const route = resolveRoute(location.hash);
  const flash = pendingFlash;
  pendingFlash = undefined;

  if (!route) {
    shell.setActive('');
    shell.content.append(stateBox({ title: 'Página não encontrada', text: 'Esta seção não faz parte desta entrega.', action: h('a', { class: 'btn btn--primary btn--sm', href: '#/relatorios' }, 'Ir para Relatórios') }));
    return;
  }
  shell.setActive(route.name);
  const ctx = { container: shell.content, api, navigate, flash };
  if (route.path === '#/relatorios/novo') dispose = renderReportForm(ctx);
  else if (route.path === '#/relatorios') dispose = renderReports(ctx);
  else dispose = renderSimulator(ctx);
  shell.content.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();
