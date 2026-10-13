import { h, icon, ICONS } from './dom.js';
import { statusInfo } from './format.js';

export function badge(status) {
  const { label, tone } = statusInfo(status);
  return h('span', { class: `badge badge--${tone}` }, label);
}

export function toast(message, tone = 'success') {
  let host = document.getElementById('toasts');
  if (!host) {
    host = h('div', { id: 'toasts', 'aria-live': 'polite' });
    document.body.append(host);
  }
  const el = h('div', { class: `toast toast--${tone}`, role: tone === 'error' ? 'alert' : 'status' }, message);
  host.append(el);
  setTimeout(() => el.remove(), tone === 'error' ? 7000 : 4000);
}

/** Modal acessível. Retorna { body, close }. */
export function openModal({ title, wide = false, onClose } = {}) {
  const previouslyFocused = document.activeElement;
  const body = h('div', { class: 'modal__body' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': 'Fechar', onclick: () => close() }, '×');
  const dialog = h('div', { class: `modal${wide ? ' modal--wide' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('div', { class: 'modal__header' }, h('h2', {}, title), closeBtn), body);
  const overlay = h('div', { class: 'overlay', onmousedown: (e) => e.target === overlay && close() }, dialog);
  const onKey = (e) => e.key === 'Escape' && close();
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    previouslyFocused?.focus?.();
    onClose?.();
  }

  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  closeBtn.focus();
  return { body, close, setTitle: (t) => { dialog.setAttribute('aria-label', t); dialog.querySelector('h2').textContent = t; } };
}

export function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (v) => { if (!settled) { settled = true; resolve(v); } };
    const modal = openModal({ title, onClose: () => finish(false) });
    modal.body.append(
      h('p', { class: 'modal__text' }, message),
      h('div', { class: 'modal__actions' },
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => modal.close() }, 'Cancelar'),
        h('button', { class: `btn ${danger ? 'btn--danger' : 'btn--primary'}`, type: 'button', onclick: () => { finish(true); modal.close(); } }, confirmLabel)),
    );
  });
}

export const spinner = (label = 'Carregando…') => h('div', { class: 'state state--loading', role: 'status' }, h('span', { class: 'spinner' }), label);

export function stateBox({ tone = 'empty', title, text, action }) {
  return h('div', { class: `state state--${tone}`, role: tone === 'error' ? 'alert' : undefined },
    h('div', { class: 'state__icon' }, icon(tone === 'error' ? ICONS.refresh : ICONS.file, { size: 28 })),
    h('strong', {}, title), text && h('p', {}, text), action);
}

export function field({ label, name, required, error, hint, control }) {
  return h('label', { class: `field${error ? ' field--invalid' : ''}` },
    h('span', { class: 'field__label' }, label, required && h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')),
    control,
    hint && !error && h('span', { class: 'field__hint' }, hint),
    error && h('span', { class: 'field__error', role: 'alert' }, error));
}
