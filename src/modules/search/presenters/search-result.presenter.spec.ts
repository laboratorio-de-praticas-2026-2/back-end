import { describe, expect, it } from 'vitest';
import { presentEmpresa, presentUsuario } from './search-result.presenter.js';
import type { EmpresaWithUsuarioRecord, UsuarioRecord } from './search-result.presenter.js';
import { NivelUsuarioEnum } from '../../../commons/constantes/nivel-usuario-enum.js';

const empresaFixture = {
  id: 1,
  razaoSocial: 'Acme Contabilidade Ltda',
  nomeFantasia: 'Acme',
  cnpj: '11222333000181',
  regimeTributario: 'simples_nacional',
  dataAbertura: new Date('2020-01-10'),
  inscricaoEstadual: '123456789',
  inscricaoMunicipal: '987654321',
};

const usuarioFixture: UsuarioRecord = {
  id: 10,
  nome: 'Cliente Teste',
  email: 'cliente@example.com',
  celular: '11999998888',
  cpfCnpj: '52998224725',
  dataCadastro: new Date('2024-05-01'),
  empresas: [empresaFixture],
};

describe('presentUsuario', () => {
  it('papel administrador vê o registro completo', () => {
    const result = presentUsuario(usuarioFixture, NivelUsuarioEnum.administrador);

    expect(result).toEqual({
      id: 10,
      nome: 'Cliente Teste',
      email: 'cliente@example.com',
      celular: '11999998888',
      cpfCnpj: '52998224725',
      dataCadastro: usuarioFixture.dataCadastro,
      empresas: [
        {
          id: 1,
          razaoSocial: 'Acme Contabilidade Ltda',
          nomeFantasia: 'Acme',
          cnpj: '11222333000181',
          regimeTributario: 'simples_nacional',
          dataAbertura: empresaFixture.dataAbertura,
          inscricaoEstadual: '123456789',
          inscricaoMunicipal: '987654321',
        },
      ],
    });
  });

  it('papel cliente vê apenas nome, cpf/cnpj mascarado e empresas resumidas', () => {
    const result = presentUsuario(usuarioFixture, NivelUsuarioEnum.cliente);

    expect(result).toEqual({
      nome: 'Cliente Teste',
      cpfCnpj: '********725',
      empresas: [
        {
          razaoSocial: 'Acme Contabilidade Ltda',
          nomeFantasia: 'Acme',
          cnpj: '***********181',
          regimeTributario: 'simples_nacional',
        },
      ],
    });
  });

  it('papel cliente não recebe e-mail, celular ou dataCadastro', () => {
    const result = presentUsuario(usuarioFixture, NivelUsuarioEnum.cliente) as Record<string, unknown>;

    expect(result.email).toBeUndefined();
    expect(result.celular).toBeUndefined();
    expect(result.dataCadastro).toBeUndefined();
    expect(result.id).toBeUndefined();
  });

  it('lida com cpfCnpj nulo sem quebrar', () => {
    const result = presentUsuario({ ...usuarioFixture, cpfCnpj: null }, NivelUsuarioEnum.cliente);
    expect(result.cpfCnpj).toBeNull();
  });
});

describe('presentEmpresa', () => {
  const empresaComTitular: EmpresaWithUsuarioRecord = {
    ...empresaFixture,
    usuario: { id: 10, nome: 'Cliente Teste', email: 'cliente@example.com' },
  };

  it('papel administrador vê a empresa completa e o titular completo', () => {
    const result = presentEmpresa(empresaComTitular, NivelUsuarioEnum.administrador);

    expect(result).toEqual({
      id: 1,
      razaoSocial: 'Acme Contabilidade Ltda',
      nomeFantasia: 'Acme',
      cnpj: '11222333000181',
      regimeTributario: 'simples_nacional',
      dataAbertura: empresaFixture.dataAbertura,
      inscricaoEstadual: '123456789',
      inscricaoMunicipal: '987654321',
      titular: { id: 10, nome: 'Cliente Teste', email: 'cliente@example.com' },
    });
  });

  it('papel cliente vê a empresa resumida e só o nome do titular', () => {
    const result = presentEmpresa(empresaComTitular, NivelUsuarioEnum.cliente);

    expect(result).toEqual({
      razaoSocial: 'Acme Contabilidade Ltda',
      nomeFantasia: 'Acme',
      cnpj: '***********181',
      regimeTributario: 'simples_nacional',
      titular: { nome: 'Cliente Teste' },
    });
  });
});
