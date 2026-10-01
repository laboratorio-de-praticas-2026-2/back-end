import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { afterEach, expect, it, vi } from 'vitest';
import { AuthService } from '../../commons/auth.service.js';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { Usuario } from '../../models/usuario.model.js';
import { AuthModule } from './auth.module.js';
import { AuthSecurityModule } from './auth-security.module.js';
import { AuthGuard } from './guards/auth.guard.js';
import { SessaoService } from './sessao.service.js';

afterEach(() => vi.unstubAllEnvs());

it('compartilha a revogação do logout com módulos que importam AuthSecurityModule', async () => {
  vi.stubEnv('JWT_SECRET', 'segredo-exclusivo-dos-testes');
  const module = await Test.createTestingModule({ imports: [AuthModule, AuthSecurityModule] })
    .overrideProvider(getModelToken(Usuario)).useValue({ findOne: vi.fn() }).compile();
  try {
    const auth = module.get(AuthService);
    const sessao = module.get(SessaoService);
    const guard = module.get(AuthGuard);
    const { accessToken } = auth.signToken({ id: 1, nivel: NivelUsuarioEnum.administrador });
    const request = { headers: { authorization: `Bearer ${accessToken}` } };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as ExecutionContext;
    expect(guard.canActivate(context)).toBe(true);
    sessao.logout(auth.verifyToken(accessToken)!);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  } finally {
    await module.close();
  }
});
