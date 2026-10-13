import { h, icon, ICONS } from '../dom.js';
import { field } from '../ui.js';
import { toUserMessage } from '../http.js';
import { mergeCategories } from '../categories.js';
import { validateReportForm } from '../validators.js';

export function renderReportForm({ container, api, navigate }) {
  let submitting = false;
  let disposed = false;
  const values = { categoria: '', nome: '', descricao: '', data_inicio: '', data_termino: '' };
  const banner = h('div', { class: 'alert alert--error', role: 'alert', hidden: true });
  const form = h('form', { class: 'form', noValidate: true });
  const submitBtn = h('button', { class: 'btn btn--primary', type: 'submit' }, 'Gerar novo relatório');
  const categorySelect = h('select', { name: 'categoria', required: true }, h('option', { value: '' }, 'Selecione…'));
  let categories = mergeCategories();
  fillCategories();

  const controls = {
    categoria: categorySelect,
    nome: h('input', { name: 'nome', type: 'text', maxLength: 255, autocomplete: 'off' }),
    descricao: h('textarea', { name: 'descricao', rows: 3 }),
    data_inicio: h('input', { name: 'data_inicio', type: 'date' }),
    data_termino: h('input', { name: 'data_termino', type: 'date' }),
  };
  const fields = [
    ['categoria', 'Categoria'], ['nome', 'Nome'], ['descricao', 'Descrição'], ['data_inicio', 'Data de início'], ['data_termino', 'Data de término'],
  ];
  const fieldHosts = Object.fromEntries(fields.map(([k]) => [k, h('div', {})]));

  function fillCategories() {
    const current = categorySelect.value;
    categorySelect.replaceChildren(h('option', { value: '' }, 'Selecione…'), ...categories.map((c) => h('option', { value: c }, c)));
    categorySelect.value = current;
  }

  function paint(errors = {}) {
    for (const [key, label] of fields) {
      fieldHosts[key].replaceChildren(field({ label, name: key, required: true, error: errors[key], control: controls[key] }));
    }
  }

  function readValues() {
    for (const k of Object.keys(values)) values[k] = controls[k].value;
  }

  function setBusy(busy) {
    submitting = busy;
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Enviando…' : 'Gerar novo relatório';
    for (const c of Object.values(controls)) c.disabled = busy;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    readValues();
    const errors = validateReportForm(values);
    banner.hidden = true;
    const keep = { ...values };
    paint(errors);
    for (const k of Object.keys(keep)) controls[k].value = keep[k];
    if (Object.keys(errors).length) return void container.querySelector('.field--invalid input, .field--invalid select, .field--invalid textarea')?.focus();

    setBusy(true);
    let created;
    try {
      created = await api.create({ nome: values.nome.trim(), categoria: values.categoria.trim(), descricao: values.descricao.trim(), data_inicio: values.data_inicio, data_termino: values.data_termino });
      await api.generate(created.id);
      if (!disposed) navigate('#/relatorios', { flash: { message: 'Relatório criado e enviado para geração. O status será atualizado automaticamente.', tone: 'success' } });
    } catch (error) {
      if (disposed) return;
      setBusy(false);
      // Se o relatório foi criado mas a geração não foi enfileirada, ele permanece PENDENTE na lista.
      banner.textContent = created
        ? `O relatório foi criado, mas não foi possível iniciar a geração do PDF: ${toUserMessage(error)} Você pode tentar novamente pela listagem.`
        : toUserMessage(error, 'Não foi possível criar o relatório.');
      banner.hidden = false;
      banner.scrollIntoView?.({ block: 'nearest' });
    }
  });

  paint();
  form.append(
    h('div', { class: 'card' },
      h('div', { class: 'card__head' }, h('h2', {}, icon(ICONS.file, { size: 18 }), 'Gerar novo relatório')),
      h('div', { class: 'card__body form__grid' },
        banner,
        h('div', { class: 'form__full' }, fieldHosts.categoria),
        h('div', { class: 'form__full' }, fieldHosts.nome),
        h('div', { class: 'form__full' }, fieldHosts.descricao),
        fieldHosts.data_inicio, fieldHosts.data_termino)),
    h('div', { class: 'form__actions' },
      h('a', { class: 'btn btn--ghost', href: '#/relatorios' }, 'Cancelar'), submitBtn));

  container.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Gerar relatório'), h('p', { class: 'muted' }, 'Gere novos relatórios sempre que precisar.'))), form);

  api.categories().then((existing) => {
    if (disposed) return;
    categories = mergeCategories(existing);
    fillCategories();
  }).catch((e) => console.error('[relatorios] categorias indisponíveis', e));

  return () => { disposed = true; };
}
