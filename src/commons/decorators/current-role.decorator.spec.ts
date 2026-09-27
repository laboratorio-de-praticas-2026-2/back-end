import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it } from 'vitest';
import { AuthService } from '../auth.service.js';
import { NivelUsuarioEnum } from '../constantes/nivel-usuario-enum.js';
import { resolveRole, resolveUser } from './current-role.decorator.js';

const JWT_SECRET = 'test-secret';

function tokenFor(nivel: string): string {
  return jwt.sign({ id: 1, nivel }, JWT_SECRET);
}

describe('resolveRole', () => {
  let authService: AuthService;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    authService = new AuthService();
  });

  it('retorna administrador quando o token é válido e o nivel é administrador', () => {
    expect(resolveRole(authService, `Bearer ${tokenFor('administrador')}`)).toBe(
      NivelUsuarioEnum.administrador,
    );
  });

  it('retorna cliente quando o token é válido e o nivel é cliente', () => {
    expect(resolveRole(authService, `Bearer ${tokenFor('cliente')}`)).toBe(
      NivelUsuarioEnum.cliente,
    );
  });

  it('retorna cliente (padrão) quando o header está ausente', () => {
    expect(resolveRole(authService, undefined)).toBe(NivelUsuarioEnum.cliente);
  });

  it('retorna cliente (padrão) quando o header não usa o esquema Bearer', () => {
    expect(resolveRole(authService, 'Token abc123')).toBe(NivelUsuarioEnum.cliente);
  });

  it('retorna cliente (padrão) quando o token é inválido', () => {
    expect(resolveRole(authService, 'Bearer token-invalido')).toBe(NivelUsuarioEnum.cliente);
  });

  it('retorna cliente (padrão) quando o token é válido mas o nivel não é reconhecido', () => {
    expect(resolveRole(authService, `Bearer ${tokenFor('root')}`)).toBe(NivelUsuarioEnum.cliente);
  });
});

describe('resolveUser', () => {
  let authService: AuthService;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    authService = new AuthService();
  });

  it('retorna id e papel quando o token é válido', () => {
    const header = `Bearer ${jwt.sign({ id: 7, nivel: 'cliente' }, JWT_SECRET)}`;
    expect(resolveUser(authService, header)).toEqual({ id: 7, role: NivelUsuarioEnum.cliente });
  });

  it('retorna administrador quando o nivel do token é administrador', () => {
    const header = `Bearer ${jwt.sign({ id: 1, nivel: 'administrador' }, JWT_SECRET)}`;
    expect(resolveUser(authService, header)).toEqual({
      id: 1,
      role: NivelUsuarioEnum.administrador,
    });
  });

  it('retorna null quando o header está ausente', () => {
    expect(resolveUser(authService, undefined)).toBeNull();
  });

  it('retorna null quando o token é inválido', () => {
    expect(resolveUser(authService, 'Bearer token-invalido')).toBeNull();
  });

  it('retorna null quando o nivel não é reconhecido', () => {
    const header = `Bearer ${jwt.sign({ id: 1, nivel: 'root' }, JWT_SECRET)}`;
    expect(resolveUser(authService, header)).toBeNull();
  });

  it('retorna null quando o id do token não é numérico', () => {
    const header = `Bearer ${jwt.sign({ id: '1', nivel: 'cliente' }, JWT_SECRET)}`;
    expect(resolveUser(authService, header)).toBeNull();
  });
});
