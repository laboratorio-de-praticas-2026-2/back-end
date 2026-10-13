/**
 * Garante que apenas a resposta da requisição mais recente seja aplicada:
 * ao iniciar uma nova, a anterior é abortada e seu resultado descartado.
 */
export function createLatest() {
  let current = 0;
  let controller;
  return {
    start() {
      controller?.abort();
      controller = new AbortController();
      const id = ++current;
      return { signal: controller.signal, isCurrent: () => id === current };
    },
    cancel() {
      controller?.abort();
      current++;
    },
  };
}

export function debounce(fn, ms) {
  let t;
  const wrapped = (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
  wrapped.cancel = () => clearTimeout(t);
  return wrapped;
}
