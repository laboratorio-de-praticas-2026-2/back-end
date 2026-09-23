import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service.js';
import { NivelUsuarioEnum } from '../constantes/nivel-usuario-enum.js';

export type UserRole = NivelUsuarioEnum;

const VALID_ROLES = Object.values(NivelUsuarioEnum);

function extractBearerToken(authorizationHeader: unknown): string | undefined {
  if (typeof authorizationHeader !== 'string') {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}

export function resolveRole(authService: AuthService, authorizationHeader: unknown): UserRole {
  const token = extractBearerToken(authorizationHeader);
  const payload = token ? authService.verifyToken(token) : null;

  if (payload && VALID_ROLES.includes(payload.nivel as NivelUsuarioEnum)) {
    return payload.nivel as NivelUsuarioEnum;
  }

  return NivelUsuarioEnum.cliente;
}

export const CurrentRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserRole => {
    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    return resolveRole(new AuthService(), request.headers['authorization']);
  },
);
