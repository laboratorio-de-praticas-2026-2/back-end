import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it } from 'vitest';
import { AuthService } from '../auth.service.js';
import { NivelUsuarioEnum } from '../constantes/nivel-usuario-enum.js';
import { resolveRole } from './current-role.decorator.js';

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
