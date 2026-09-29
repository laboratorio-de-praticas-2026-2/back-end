import { describe, it, expect, vi, afterEach } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';

const contexto = (user?: unknown) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as any;

describe('AdminGuard (provisório)', () => {
  const guard = new AdminGuard();

  afterEach(() => vi.unstubAllEnvs());

  // Cada teste fixa as variáveis para não depender do .env de quem roda
  it('sem usuário autenticado: 401', () => {
    vi.stubEnv('DASHBOARD_AUTH_BYPASS', 'false');
    expect(() => guard.canActivate(contexto())).toThrow(UnauthorizedException);
  });

  it('usuário cliente: 403', () => {
    vi.stubEnv('DASHBOARD_AUTH_BYPASS', 'false');
    expect(() => guard.canActivate(contexto({ nivel: 'cliente' }))).toThrow(ForbiddenException);
  });

  it('usuário administrador: libera', () => {
    vi.stubEnv('DASHBOARD_AUTH_BYPASS', 'false');
    expect(guard.canActivate(contexto({ nivel: 'administrador' }))).toBe(true);
  });

  it('bypass local ligado fora de produção: libera', () => {
    vi.stubEnv('DASHBOARD_AUTH_BYPASS', 'true');
    vi.stubEnv('NODE_ENV', 'development');
    expect(guard.canActivate(contexto())).toBe(true);
  });

  it('bypass ligado em produção é ignorado: 401', () => {
    vi.stubEnv('DASHBOARD_AUTH_BYPASS', 'true');
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => guard.canActivate(contexto())).toThrow(UnauthorizedException);
  });
});