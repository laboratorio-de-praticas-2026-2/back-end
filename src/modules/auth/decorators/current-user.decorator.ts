import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtUserPayload } from '../../../commons/auth.service.js';
import type { RequestAutenticada } from '../auth.types.js';

/** Usuário autenticado da requisição (preenchido pelo AuthGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtUserPayload | undefined =>
    context.switchToHttp().getRequest<RequestAutenticada>().user,
);
