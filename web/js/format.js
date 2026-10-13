const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatCurrency = (n) => BRL.format(Number(n) || 0);

/** Datas da API (ISO) são tratadas em UTC para não deslocar o dia. */
export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatPeriod(inicio, termino) {
  return `${formatDate(inicio)} — ${formatDate(termino)}`;
}

export const STATUS = {
  PENDENTE: { label: 'Pendente', tone: 'warning' },
  GERADO: { label: 'Gerado', tone: 'success' },
  FALHA: { label: 'Falha', tone: 'danger' },
};

export function statusInfo(status) {
  return STATUS[status] ?? { label: String(status ?? '-'), tone: 'neutral' };
}

/** Apenas relatórios GERADO possuem PDF disponível. */
export const hasPdf = (r) => r?.status === 'GERADO' && Boolean(r?.arquivoUrl);

export function slugify(text) {
  return String(text ?? 'relatorio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'relatorio';
}

export const pdfFileName = (r) => `${slugify(r?.nome)}.pdf`;
