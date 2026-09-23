export type DocumentType = 'cpf' | 'cnpj';

const CPF_FIRST_DIGIT_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const CPF_SECOND_DIGIT_WEIGHTS = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_FIRST_DIGIT_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_SECOND_DIGIT_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function hasAllSameDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function calculateCheckDigit(digits: string, weights: number[]): number {
  const sum = digits
    .split('')
    .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCPF(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || hasAllSameDigits(digits)) {
    return false;
  }

  const base = digits.slice(0, 9);
  const firstCheckDigit = calculateCheckDigit(base, CPF_FIRST_DIGIT_WEIGHTS);
  const secondCheckDigit = calculateCheckDigit(
    base + firstCheckDigit,
    CPF_SECOND_DIGIT_WEIGHTS,
  );

  return digits === `${base}${firstCheckDigit}${secondCheckDigit}`;
}

export function isValidCNPJ(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || hasAllSameDigits(digits)) {
    return false;
  }

  const base = digits.slice(0, 12);
  const firstCheckDigit = calculateCheckDigit(base, CNPJ_FIRST_DIGIT_WEIGHTS);
  const secondCheckDigit = calculateCheckDigit(
    base + firstCheckDigit,
    CNPJ_SECOND_DIGIT_WEIGHTS,
  );

  return digits === `${base}${firstCheckDigit}${secondCheckDigit}`;
}

export function classifyDocument(value: string): DocumentType | null {
  const digits = onlyDigits(value);
  if (digits.length === 11) return 'cpf';
  if (digits.length === 14) return 'cnpj';
  return null;
}

export function isValidDocument(value: string): boolean {
  const type = classifyDocument(value);
  if (type === 'cpf') return isValidCPF(value);
  if (type === 'cnpj') return isValidCNPJ(value);
  return false;
}

export function maskDocument(value: string): string {
  const digits = onlyDigits(value);
  const visibleCount = Math.min(3, digits.length);
  const hiddenLength = digits.length - visibleCount;
  return '*'.repeat(hiddenLength) + digits.slice(digits.length - visibleCount);
}
