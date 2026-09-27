import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service.js';
import { NivelUsuarioEnum } from '../constantes/nivel-usuario-enum.js';

export type UserRole = NivelUsuarioEnum;

export interface AuthenticatedUser {
  id: number;
  role: UserRole;
}

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

export function resolveUser(
  authService: AuthService,
  authorizationHeader: unknown,
): AuthenticatedUser | null {
  const token = extractBearerToken(authorizationHeader);
  const payload = token ? authService.verifyToken(token) : null;

  if (
    !payload ||
    typeof payload.id !== 'number' ||
    !VALID_ROLES.includes(payload.nivel as NivelUsuarioEnum)
  ) {
    return null;
  }

  return { id: payload.id, role: payload.nivel as NivelUsuarioEnum };
}

export const CurrentRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserRole => {
    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    return resolveRole(new AuthService(), request.headers['authorization']);
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | null => {
    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    return resolveUser(new AuthService(), request.headers['authorization']);
  },
);
