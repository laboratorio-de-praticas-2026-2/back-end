import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AdministracaoService } from './administracao.service.js';

type Row = Record<string, unknown>;

function makeSequelize(rows: Row[] = []) {
  const calls: Array<{ sql: string; replacements?: Record<string, unknown> }> = [];
  const sequelize = {
    calls,
    transaction: async (fn: (t: unknown) => unknown) => fn({}),
    query: async (sql: string, options?: { replacements?: Record<string, unknown>; type?: unknown }) => {
      calls.push({ sql, replacements: options?.replacements });
      if (sql.includes('FROM usuario u')) return rows;
      if (sql.includes('SELECT id FROM usuario')) return [];
      if (sql.includes('SELECT id FROM empresa')) return [];
      return [];
    },
  };
  return sequelize;
}

const pf: Row = {
  id: 1,
  nome: 'Maria',
  email: 'maria@email.com',
  nivel: 'cliente',
  cpfCnpj: '12345678901',
  celular: '11999999999',
  empresaId: null,
};

const pj: Row = {
  id: 2,
  nome: 'João',
  email: 'joao@email.com',
  nivel: 'cliente',
  cpfCnpj: '12345678901',
  celular: '11988888888',
  empresaId: 10,
  razaoSocial: 'Empresa Exemplo LTDA',
  nomeFantasia: 'Empresa Exemplo',
  cnpj: '12345678000199',
  regimeTributario: 'simples_nacional',
  inscricaoEstadual: null,
  inscricaoMunicipal: null,
  dataAbertura: null,
};

describe('AdministracaoService', () => {
  it('lista PF e PJ e nunca expõe senha', async () => {
    const fake = makeSequelize([pf, pj]);
    const service = new AdministracaoService(fake as never);
    const result = await service.listarUsuarios();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 1, tipo: 'PF' });
    expect(result[1]).toMatchObject({ id: 2, tipo: 'PJ', empresas: [{ cnpj: '12345678000199' }] });
    expect(JSON.stringify(result)).not.toContain('senha');
    expect(fake.calls[0].sql).toContain("u.nivel = 'cliente'");
  });

  it('retorna 404 para usuário inexistente', async () => {
    const service = new AdministracaoService(makeSequelize([]) as never);
    await expect(service.buscarUsuario(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejeita atualização vazia', async () => {
    const service = new AdministracaoService(makeSequelize([pf]) as never);
    await expect(service.atualizarUsuario(1, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita dados de empresa para PF', async () => {
    const service = new AdministracaoService(makeSequelize([pf]) as never);
    await expect(
      service.atualizarUsuario(1, { razaoSocial: 'Não deveria' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita e-mail duplicado', async () => {
    const fake = makeSequelize([pf]);
    fake.query = async (sql: string, options?: { replacements?: Record<string, unknown>; type?: unknown }) => {
      fake.calls.push({ sql, replacements: options?.replacements });
      if (sql.includes('FROM usuario u')) return [pf];
      if (sql.includes('SELECT id FROM usuario')) return [{ id: 2 }];
      return [];
    };
    const service = new AdministracaoService(fake as never);
    await expect(
      service.atualizarUsuario(1, { email: 'outro@email.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('atualiza campo permitido sem enviar senha ou nível', async () => {
    const fake = makeSequelize([pf]);
    const service = new AdministracaoService(fake as never);
    await service.atualizarUsuario(1, { nome: 'Maria Atualizada' });

    const update = fake.calls.find((call) => call.sql.includes('UPDATE usuario'));
    expect(update?.sql).toContain('nome');
    expect(update?.sql).not.toContain('senha');
    expect(update?.sql).not.toContain('nivel');
  });
});
