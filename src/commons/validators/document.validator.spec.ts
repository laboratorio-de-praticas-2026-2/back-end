import { describe, expect, it } from 'vitest';
import {
  classifyDocument,
  isValidCNPJ,
  isValidCPF,
  isValidDocument,
  maskDocument,
  onlyDigits,
} from './document.validator.js';

describe('onlyDigits', () => {
  it('remove tudo que não é dígito', () => {
    expect(onlyDigits('529.982.247-25')).toBe('52998224725');
  });
});

describe('isValidCPF', () => {
  it('aceita um CPF válido', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });

  it('rejeita um CPF com dígito verificador errado', () => {
    expect(isValidCPF('529.982.247-24')).toBe(false);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
  });

  it('rejeita CPF com tamanho errado', () => {
    expect(isValidCPF('123')).toBe(false);
  });
});

describe('isValidCNPJ', () => {
  it('aceita um CNPJ válido', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
  });

  it('rejeita um CNPJ com dígito verificador errado', () => {
    expect(isValidCNPJ('11.222.333/0001-80')).toBe(false);
  });

  it('rejeita CNPJ com todos os dígitos iguais', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
  });

  it('rejeita CNPJ com tamanho errado', () => {
    expect(isValidCNPJ('123')).toBe(false);
  });
});

describe('classifyDocument', () => {
  it('classifica 11 dígitos como cpf', () => {
    expect(classifyDocument('529.982.247-25')).toBe('cpf');
  });

  it('classifica 14 dígitos como cnpj', () => {
    expect(classifyDocument('11.222.333/0001-81')).toBe('cnpj');
  });

  it('retorna null para tamanho inválido', () => {
    expect(classifyDocument('123')).toBeNull();
  });
});

describe('isValidDocument', () => {
  it('aceita CPF e CNPJ válidos', () => {
    expect(isValidDocument('529.982.247-25')).toBe(true);
    expect(isValidDocument('11.222.333/0001-81')).toBe(true);
  });

  it('rejeita documento com dígito verificador errado', () => {
    expect(isValidDocument('529.982.247-24')).toBe(false);
  });

  it('rejeita documento com tamanho inválido', () => {
    expect(isValidDocument('123')).toBe(false);
  });
});

describe('maskDocument', () => {
  it('mantém os 3 últimos dígitos de um CPF e mascara o resto', () => {
    expect(maskDocument('529.982.247-25')).toBe('********725');
  });

  it('mantém os 3 últimos dígitos de um CNPJ e mascara o resto', () => {
    expect(maskDocument('11.222.333/0001-81')).toBe('***********181');
  });
});
