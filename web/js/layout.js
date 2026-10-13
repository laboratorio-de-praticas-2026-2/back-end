import { h, icon, ICONS } from './dom.js';

// Estrutura de navegação conforme o Figma. Apenas Relatórios (e seu submenu Simulador)
// possuem rotas nesta entrega; os demais itens são apenas a referência visual do portal.
const NAV = [
  ['Dashboard', ICONS.dashboard, false],
  ['Solicitações', ICONS.requests, true],
  ['Serviços', ICONS.services, true],
  ['Blog', ICONS.blog, true],
  ['FAQ', ICONS.faq, true],
  ['Carrossel', ICONS.carousel, true],
  ['Relatórios', ICONS.reports, true, 'reports'],
  ['Publicidade', ICONS.ads, true],
  ['Usuários', ICONS.users, true],
  ['Empresas', ICONS.companies, true],
  ['Configurações', ICONS.settings, true],
];

const SUBMENU = [
  ['Relatórios', '#/relatorios', 'relatorios'],
  ['Simulador', '#/simulador', 'simulador'],
];

export function buildShell() {
  const nav = h('nav', { class: 'sidebar__nav', 'aria-label': 'Menu principal' });
  for (const [label, ic, chevron, key] of NAV) {
    if (key === 'reports') {
      nav.append(
        h('a', { class: 'nav-item nav-item--active', href: '#/relatorios', 'aria-expanded': 'true' }, icon(ic), h('span', {}, label), icon(ICONS.chevronUp, { size: 14 })),
        h('div', { class: 'nav-sub' }, SUBMENU.map(([text, href, route]) => h('a', { class: 'nav-sub__item', href, dataset: { route } }, text))),
      );
    } else {
      nav.append(h('span', { class: 'nav-item nav-item--static', 'aria-disabled': 'true' }, icon(ic), h('span', {}, label), chevron && icon(ICONS.chevronRight, { size: 14 })));
    }
  }

  const sidebar = h('aside', { class: 'sidebar' },
    h('div', { class: 'brand', 'aria-label': 'Portal Contábil — Grupo Bortone' }, h('strong', {}, 'PORTAL'), h('strong', {}, 'CONTÁBIL'), h('small', {}, 'GRUPO BORTONE')),
    nav,
    h('div', { class: 'sidebar__footer' },
      h('span', { class: 'btn-exit', 'aria-disabled': 'true' }, icon(ICONS.logout), 'Sair'),
      h('div', { class: 'user' }, h('span', { class: 'user__avatar', 'aria-hidden': 'true' }, icon(ICONS.users, { size: 16 })), h('span', { class: 'user__name' }, 'Usuário'))));

  const today = new Date().toLocaleDateString('pt-BR');
  const header = h('header', { class: 'topbar' },
    h('div', { class: 'topbar__greeting' }, h('strong', {}, 'Olá'), h('span', { class: 'topbar__date' }, '»» ', today)),
    h('div', { class: 'topbar__tools' },
      h('span', { class: 'topbar__bell', 'aria-hidden': 'true' }, icon(ICONS.bell, { size: 20 })),
      h('div', { class: 'topbar__search' }, h('input', { type: 'search', placeholder: 'Busque aqui', disabled: true, 'aria-label': 'Busca global (indisponível nesta entrega)' }), icon(ICONS.search, { size: 16 }))));

  const content = h('main', { class: 'content', id: 'content', tabIndex: -1 });
  const root = h('div', { class: 'shell' }, sidebar, h('div', { class: 'main' }, header, content));

  return {
    root,
    content,
    setActive(route) {
      for (const a of root.querySelectorAll('.nav-sub__item')) a.classList.toggle('is-active', a.dataset.route === route);
    },
  };
}
