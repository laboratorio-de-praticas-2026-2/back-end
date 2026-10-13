// Regras espelham os DTOs reais do backend (CreateReportDto, SimulacaoDto).

const toNumber = (v) => (typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v));
const decimals = (n) => (String(n).split('.')[1] ?? '').length;

export function validateReportForm(v) {
  const errors = {};
  if (!v.categoria?.trim()) errors.categoria = 'Selecione uma categoria.';
  if (!v.nome?.trim()) errors.nome = 'Informe o nome do relatório.';
  if (!v.descricao?.trim()) errors.descricao = 'Informe a descrição.';
  if (!v.data_inicio) errors.data_inicio = 'Informe a data de início.';
  if (!v.data_termino) errors.data_termino = 'Informe a data de término.';
  if (v.data_inicio && v.data_termino && v.data_termino < v.data_inicio) {
    errors.data_termino = 'A data de término deve ser igual ou posterior à data de início.';
  }
  return errors;
}

export const SIMULATOR_LIMITS = { parcelasMax: 360, taxaMax: 100 };

const MONEY_FIELDS = [
  ['impostos', 'Impostos'],
  ['multas', 'Multas'],
  ['honorarios', 'Honorários'],
];

/** Retorna { errors, payload }. payload só existe quando não há erros. */
export function validateSimulatorForm(values) {
  const errors = {};
  const payload = {};

  for (const [key, label] of MONEY_FIELDS) {
    const raw = values[key];
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      errors[key] = `${label}: campo obrigatório.`;
      continue;
    }
    const n = toNumber(raw);
    if (!Number.isFinite(n)) errors[key] = `${label}: informe um número válido.`;
    else if (n < 0) errors[key] = `${label}: o valor não pode ser negativo.`;
    else if (decimals(n) > 2) errors[key] = `${label}: use no máximo 2 casas decimais.`;
    else payload[key] = n;
  }

  const p = values.parcelas;
  if (p !== undefined && p !== null && String(p).trim() !== '') {
    const n = toNumber(p);
    if (!Number.isInteger(n)) errors.parcelas = 'Parcelas: informe um número inteiro.';
    else if (n < 1) errors.parcelas = 'Parcelas: o mínimo é 1.';
    else if (n > SIMULATOR_LIMITS.parcelasMax) errors.parcelas = `Parcelas: o máximo é ${SIMULATOR_LIMITS.parcelasMax}.`;
    else payload.parcelas = n;
  }

  const t = values.taxaJurosMensal;
  if (t !== undefined && t !== null && String(t).trim() !== '') {
    const n = toNumber(t);
    if (!Number.isFinite(n)) errors.taxaJurosMensal = 'Taxa de juros: informe um número válido.';
    else if (n < 0) errors.taxaJurosMensal = 'Taxa de juros: o valor não pode ser negativo.';
    else if (n > SIMULATOR_LIMITS.taxaMax) errors.taxaJurosMensal = `Taxa de juros: o máximo é ${SIMULATOR_LIMITS.taxaMax}%.`;
    else if (decimals(n) > 2) errors.taxaJurosMensal = 'Taxa de juros: use no máximo 2 casas decimais.';
    else payload.taxaJurosMensal = n;
  }

  return Object.keys(errors).length ? { errors } : { errors: {}, payload };
}
