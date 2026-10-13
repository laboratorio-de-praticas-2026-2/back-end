import { h, clear } from '../dom.js';
import { field, spinner } from '../ui.js';
import { toUserMessage } from '../http.js';
import { formatCurrency } from '../format.js';
import { validateSimulatorForm, SIMULATOR_LIMITS } from '../validators.js';
import { createLatest } from '../latest.js';

export function renderSimulator({ container, api }) {
  const latest = createLatest();
  const resultHost = h('div', { class: 'sim__result', 'aria-live': 'polite' });
  const banner = h('div', { class: 'alert alert--error', role: 'alert', hidden: true });
  const submitBtn = h('button', { class: 'btn btn--primary', type: 'submit' }, 'Simular');
  const money = (name) => h('input', { name, type: 'text', inputMode: 'decimal', placeholder: '0,00', autocomplete: 'off' });
  const controls = {
    impostos: money('impostos'),
    multas: money('multas'),
    honorarios: money('honorarios'),
    parcelas: h('input', { name: 'parcelas', type: 'text', inputMode: 'numeric', placeholder: '1', autocomplete: 'off' }),
    taxaJurosMensal: h('input', { name: 'taxaJurosMensal', type: 'text', inputMode: 'decimal', placeholder: '0,00', autocomplete: 'off' }),
  };
  const defs = [
    ['impostos', 'Impostos (R$)', true, null],
    ['multas', 'Multas (R$)', true, null],
    ['honorarios', 'Honorários (R$)', true, null],
    ['parcelas', 'Quantidade de parcelas', false, `Opcional. De 1 a ${SIMULATOR_LIMITS.parcelasMax}; sem valor, considera pagamento à vista.`],
    ['taxaJurosMensal', 'Taxa de juros mensal (%)', false, `Opcional. De 0 a ${SIMULATOR_LIMITS.taxaMax}.`],
  ];
  const hosts = Object.fromEntries(defs.map(([k]) => [k, h('div', {})]));

  function paint(errors = {}) {
    const keep = Object.fromEntries(Object.entries(controls).map(([k, c]) => [k, c.value]));
    for (const [key, label, required, hint] of defs) hosts[key].replaceChildren(field({ label, name: key, required, error: errors[key], hint, control: controls[key] }));
    for (const [k, v] of Object.entries(keep)) controls[k].value = v;
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Simulando…' : 'Simular';
  }

  const row = (label, value, strong) => h('div', { class: `result__row${strong ? ' result__row--total' : ''}` }, h('dt', {}, label), h('dd', {}, value));

  function showResult(r) {
    clear(resultHost);
    resultHost.append(h('section', { class: 'card' },
      h('div', { class: 'card__head' }, h('h2', {}, 'Resultado da simulação')),
      h('dl', { class: 'card__body result' },
        row('Impostos', formatCurrency(r.impostos)),
        row('Multas', formatCurrency(r.multas)),
        row('Honorários', formatCurrency(r.honorarios)),
        row('Subtotal', formatCurrency(r.subtotal)),
        row('Taxa de juros mensal', `${String(r.taxaJurosMensal ?? 0).replace('.', ',')}%`),
        row('Quantidade de parcelas', `${r.parcelas}x`),
        row('Total', formatCurrency(r.total), true),
        row('Valor por parcela', formatCurrency(r.valorParcela), true))));
  }

  const form = h('form', { class: 'form', noValidate: true, onsubmit: async (event) => {
    event.preventDefault();
    // Nova tentativa sempre invalida o resultado anterior (inclusive se falhar).
    clear(resultHost);
    banner.hidden = true;
    const { errors, payload } = validateSimulatorForm(Object.fromEntries(Object.entries(controls).map(([k, c]) => [k, c.value])));
    paint(errors);
    if (!payload) return void container.querySelector('.field--invalid input')?.focus();

    const req = latest.start();
    setBusy(true);
    resultHost.append(spinner('Calculando…'));
    try {
      const data = await api.simulate(payload, { signal: req.signal });
      if (!req.isCurrent()) return;
      showResult(data);
    } catch (error) {
      if (!req.isCurrent() || error.kind === 'aborted') return;
      clear(resultHost);
      banner.textContent = toUserMessage(error, 'Não foi possível realizar a simulação.');
      banner.hidden = false;
    } finally {
      if (req.isCurrent()) setBusy(false);
    }
  } });

  paint();
  form.append(
    h('div', { class: 'card' },
      h('div', { class: 'card__head' }, h('h2', {}, 'Dados da simulação')),
      h('div', { class: 'card__body form__grid' }, banner, hosts.impostos, hosts.multas, hosts.honorarios, hosts.parcelas, hosts.taxaJurosMensal)),
    h('div', { class: 'form__actions' }, submitBtn));

  container.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Simulador'), h('p', { class: 'muted' }, 'Simule o parcelamento de débitos com base nas regras do portal.'))), form, resultHost);

  return () => latest.cancel();
}
