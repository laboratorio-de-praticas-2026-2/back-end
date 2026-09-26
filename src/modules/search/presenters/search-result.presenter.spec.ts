import { describe, expect, it } from 'vitest';
import { presentEmpresa, presentUsuario } from './search-result.presenter.js';
import type { EmpresaWithUsuarioRecord, UsuarioRecord } from './search-result.presenter.js';

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
  it('retorna o registro completo do usuário com as empresas', () => {
    expect(presentUsuario(usuarioFixture)).toEqual({
      id: 10,
      nome: 'Cliente Teste',
      email: 'cliente@example.com',
      celular: '11999998888',
      cpfCnpj: '52998224725',
      dataCadastro: usuarioFixture.dataCadastro,
      empresas: [empresaFixture],
    });
  });

  it('nunca inclui senha, mesmo que o registro de entrada a carregue', () => {
    const comSenha = { ...usuarioFixture, senha: 'hash' } as UsuarioRecord;
    expect(presentUsuario(comSenha)).not.toHaveProperty('senha');
  });

  it('lida com cpfCnpj nulo sem quebrar', () => {
    expect(presentUsuario({ ...usuarioFixture, cpfCnpj: null }).cpfCnpj).toBeNull();
  });
});

describe('presentEmpresa', () => {
  const empresaComTitular: EmpresaWithUsuarioRecord = {
    ...empresaFixture,
    usuario: { id: 10, nome: 'Cliente Teste', email: 'cliente@example.com' },
  };

  it('retorna a empresa completa e o titular', () => {
    expect(presentEmpresa(empresaComTitular)).toEqual({
      ...empresaFixture,
      titular: { id: 10, nome: 'Cliente Teste', email: 'cliente@example.com' },
    });
  });
});
