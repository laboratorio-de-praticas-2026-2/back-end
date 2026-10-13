import { h, clear, icon, ICONS } from '../dom.js';
import { badge, confirmDialog, openModal, spinner, stateBox, toast } from '../ui.js';
import { formatDate, formatPeriod, hasPdf } from '../format.js';
import { toUserMessage } from '../http.js';
import { createLatest, debounce } from '../latest.js';
import { downloadReportPdf, openReportPdf } from '../pdf.js';

const PAGE_SIZE = 10;
const POLL_MS = 5000;

export function renderReports({ container, api, flash }) {
  const state = { page: 1, nome: '', categoria: '', data_inicio: '', data_termino: '', total: 0, rows: [], status: 'loading', error: null };
  const latest = createLatest();
  let pollTimer;
  let disposed = false;

  const searchInput = h('input', { type: 'search', placeholder: 'Buscar por nome', 'aria-label': 'Buscar por nome', maxLength: 150 });
  const categorySelect = h('select', { 'aria-label': 'Filtrar por categoria' }, h('option', { value: '' }, 'Todas as categorias'));
  const fromInput = h('input', { type: 'date', 'aria-label': 'Período — início' });
  const toInput = h('input', { type: 'date', 'aria-label': 'Período — término' });
  const clearBtn = h('button', { class: 'btn btn--ghost btn--sm', type: 'button', hidden: true, onclick: resetFilters }, 'Limpar filtros');
  const tableHost = h('div', { class: 'card__body' });
  const pager = h('div', { class: 'pager' });

  const applySearch = debounce(() => setFilter({ nome: searchInput.value.trim() }), 400);
  searchInput.addEventListener('input', applySearch);
  categorySelect.addEventListener('change', () => setFilter({ categoria: categorySelect.value }));
  fromInput.addEventListener('change', () => setFilter({ data_inicio: fromInput.value }));
  toInput.addEventListener('change', () => setFilter({ data_termino: toInput.value }));

  container.append(
    h('div', { class: 'page-head' },
      h('div', {}, h('h1', {}, 'Relatórios'), h('p', { class: 'muted' }, 'Consulte, visualize e baixe os relatórios gerados.')),
      h('a', { class: 'btn btn--primary', href: '#/relatorios/novo' }, icon(ICONS.plus, { size: 16 }), 'Gerar novo relatório')),
    h('section', { class: 'card' },
      h('div', { class: 'card__head' }, h('h2', {}, 'Relatórios criados'), h('span', { class: 'muted', id: 'count' })),
      h('div', { class: 'filters' },
        h('div', { class: 'filters__search' }, icon(ICONS.search, { size: 16 }), searchInput),
        categorySelect,
        h('label', { class: 'filters__date' }, h('span', {}, 'De'), fromInput),
        h('label', { class: 'filters__date' }, h('span', {}, 'Até'), toInput),
        clearBtn),
      tableHost, pager));

  if (flash) toast(flash.message, flash.tone);
  loadCategories();
  load();

  function setFilter(patch) {
    Object.assign(state, patch, { page: 1 });
    clearBtn.hidden = !(state.nome || state.categoria || state.data_inicio || state.data_termino);
    load();
  }

  function resetFilters() {
    searchInput.value = categorySelect.value = fromInput.value = toInput.value = '';
    setFilter({ nome: '', categoria: '', data_inicio: '', data_termino: '' });
  }

  async function loadCategories() {
    try {
      const cats = await api.categories();
      for (const c of cats) categorySelect.append(h('option', { value: c }, c));
    } catch (error) {
      console.error('[relatorios] categorias indisponíveis', error);
    }
  }

  async function load({ silent = false } = {}) {
    clearTimeout(pollTimer);
    const req = latest.start();
    if (!silent) {
      state.status = 'loading';
      draw();
    }
    const query = { page: state.page, limit: PAGE_SIZE, nome: state.nome, categoria: state.categoria, data_inicio: state.data_inicio, data_termino: state.data_termino };
    try {
      const data = await api.list(query, { signal: req.signal });
      if (!req.isCurrent() || disposed) return;
      const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
      if (state.page > lastPage) {
        state.page = lastPage;
        return load();
      }
      Object.assign(state, { rows: data.dados, total: data.total, status: data.dados.length ? 'ready' : 'empty', error: null });
    } catch (error) {
      if (!req.isCurrent() || disposed || error.kind === 'aborted') return;
      if (silent) return;
      Object.assign(state, { status: 'error', error: toUserMessage(error, 'Não foi possível carregar os relatórios.') });
    }
    draw();
    schedulePoll();
  }

  // Atualiza sozinho apenas enquanto houver relatórios PENDENTE na página visível.
  function schedulePoll() {
    if (state.rows.some((r) => r.status === 'PENDENTE')) {
      pollTimer = setTimeout(() => !document.hidden && !disposed ? load({ silent: true }) : schedulePoll(), POLL_MS);
    }
  }

  function draw() {
    clear(tableHost);
    clear(pager);
    container.querySelector('#count').textContent = state.status === 'ready' ? `${state.total} no total` : '';
    if (state.status === 'loading') return void tableHost.append(spinner('Carregando relatórios…'));
    if (state.status === 'error') return void tableHost.append(stateBox({ tone: 'error', title: 'Erro ao carregar', text: state.error, action: h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => load() }, 'Tentar novamente') }));
    if (state.status === 'empty') {
      const filtered = state.nome || state.categoria || state.data_inicio || state.data_termino;
      return void tableHost.append(stateBox({ title: filtered ? 'Nenhum relatório encontrado' : 'Nenhum relatório criado', text: filtered ? 'Ajuste a busca ou os filtros.' : 'Gere o primeiro relatório para vê-lo aqui.' }));
    }

    tableHost.append(h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', {}, h('tr', {}, ['Nome', 'Categoria', 'Período', 'Status', 'Ações'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, state.rows.map(row)))));

    const lastPage = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
    const from = (state.page - 1) * PAGE_SIZE + 1;
    pager.append(
      h('span', { class: 'muted' }, `Mostrando ${from}–${from + state.rows.length - 1} de ${state.total}`),
      h('div', { class: 'pager__nav' },
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', disabled: state.page <= 1, 'aria-label': 'Página anterior', onclick: () => go(state.page - 1) }, icon(ICONS.chevronLeft, { size: 14 })),
        h('span', { class: 'pager__info' }, `Página ${state.page} de ${lastPage}`),
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', disabled: state.page >= lastPage, 'aria-label': 'Próxima página', onclick: () => go(state.page + 1) }, icon(ICONS.chevronRight, { size: 14 }))));
  }

  function go(page) {
    state.page = page;
    load();
  }

  function row(r) {
    const iconBtn = (ic, label, onclick, extra = {}) => h('button', { class: 'icon-btn', type: 'button', title: label, 'aria-label': `${label}: ${r.nome}`, onclick, ...extra }, icon(ic));
    return h('tr', {},
      h('td', { class: 'cell-name' }, r.nome),
      h('td', {}, r.categoria),
      h('td', {}, formatPeriod(r.dataInicio, r.dataTermino)),
      h('td', {}, badge(r.status)),
      h('td', { class: 'cell-actions' },
        iconBtn(ICONS.eye, 'Visualizar', () => openDetails(r)),
        hasPdf(r) && iconBtn(ICONS.download, 'Baixar PDF', (e) => handleDownload(r, e.currentTarget)),
        r.status === 'FALHA' && iconBtn(ICONS.refresh, 'Gerar novamente', () => regenerate(r)),
        iconBtn(ICONS.trash, 'Excluir', () => remove(r), { class: 'icon-btn icon-btn--danger' })));
  }

  async function handleDownload(r, btn) {
    btn.disabled = true;
    try {
      await downloadReportPdf(r, { api });
    } catch (error) {
      toast(toUserMessage(error, 'Não foi possível baixar o PDF.'), 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async function regenerate(r) {
    try {
      await api.generate(r.id);
      toast('Geração reenviada. O status será atualizado automaticamente.');
      load({ silent: false });
    } catch (error) {
      toast(toUserMessage(error, 'Não foi possível reenviar a geração.'), 'error');
    }
  }

  async function remove(r) {
    const ok = await confirmDialog({ title: 'Excluir relatório', message: `Tem certeza que deseja excluir “${r.nome}”? Essa ação não pode ser desfeita.`, confirmLabel: 'Excluir', danger: true });
    if (!ok) return;
    try {
      await api.remove(r.id);
      toast('Relatório excluído com sucesso.');
      if (state.rows.length === 1 && state.page > 1) state.page -= 1;
      load();
    } catch (error) {
      toast(toUserMessage(error, 'Não foi possível excluir o relatório.'), 'error');
    }
  }

  function openDetails(initial) {
    const modal = openModal({ title: initial.nome, wide: true });
    const req = createLatest();
    const show = (r, notice) => {
      clear(modal.body);
      modal.setTitle(`${r.nome} — ${formatPeriod(r.dataInicio, r.dataTermino).replace(' — ', ' a ')}`);
      const info = h('dl', { class: 'info' },
        h('div', {}, h('dt', {}, 'Status'), h('dd', {}, badge(r.status))),
        h('div', {}, h('dt', {}, 'Tipo de relatório'), h('dd', {}, r.categoria)),
        h('div', {}, h('dt', {}, 'Descrição'), h('dd', {}, r.descricao)),
        h('div', {}, h('dt', {}, 'Período'), h('dd', {}, `${formatDate(r.dataInicio)} — ${formatDate(r.dataTermino)}`)));
      const available = hasPdf(r);
      const preview = h('div', { class: 'preview' });
      if (available) {
        preview.append(h('p', { class: 'muted' }, 'Carregando pré-visualização…'));
        api.pdf(r.id).then((blob) => {
          const url = URL.createObjectURL(blob);
          clear(preview);
          preview.classList.add('preview--has-doc');
          preview.append(h('iframe', { src: url, title: `Pré-visualização do PDF de ${r.nome}`, loading: 'lazy' }));
        }).catch((error) => {
          clear(preview);
          preview.append(stateBox({ tone: 'error', title: 'Pré-visualização indisponível', text: toUserMessage(error, 'Não foi possível carregar o PDF.') }));
        });
      } else {
        const msg = r.status === 'PENDENTE' ? ['PDF em geração', 'O documento ainda está sendo gerado. Atualize em instantes.'] : r.status === 'FALHA' ? ['Falha na geração', 'O PDF não pôde ser gerado para este relatório.'] : ['PDF indisponível', 'Este relatório não possui documento gerado.'];
        preview.append(stateBox({ title: msg[0], text: msg[1] }));
      }
      const refresh = h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => refreshOne(r.id) }, icon(ICONS.refresh, { size: 14 }), 'Atualizar');
      const actions = h('div', { class: 'modal__actions' },
        r.status !== 'GERADO' && refresh,
        h('button', { class: 'btn btn--ghost', type: 'button', disabled: !available, onclick: () => openReportPdf(r, { api }).catch((e) => toast(toUserMessage(e), 'error')) }, 'Abrir PDF'),
        h('button', { class: 'btn btn--primary', type: 'button', disabled: !available, onclick: (e) => handleDownload(r, e.currentTarget) }, 'Baixar PDF'));
      modal.body.append(...[notice && h('div', { class: 'alert alert--error', role: 'alert' }, notice), h('section', { class: 'panel' }, info), preview, actions].filter(Boolean));
    };
    async function refreshOne(id) {
      const rq = req.start();
      try {
        const fresh = await api.get(id, { signal: rq.signal });
        if (rq.isCurrent()) show(fresh);
      } catch (error) {
        if (rq.isCurrent() && error.kind !== 'aborted') show(initial, toUserMessage(error, 'Não foi possível atualizar o relatório.'));
      }
    }
    // Consulta por ID: exibe o dado da lista imediatamente e confirma o estado atual na API.
    show(initial);
    refreshOne(initial.id).then(() => load({ silent: true }));
  }

  return () => {
    disposed = true;
    clearTimeout(pollTimer);
    applySearch.cancel();
    latest.cancel();
  };
}
