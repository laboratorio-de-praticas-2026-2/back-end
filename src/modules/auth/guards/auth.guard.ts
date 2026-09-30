import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../../commons/auth.service.js';
import type { RequestAutenticada } from '../auth.types.js';
import { TokenDenylistService } from '../token-denylist.service.js';

function extrairBearer(header?: string): string | undefined {
  return header?.match(/^Bearer\s+(\S+)$/i)?.[1];
}

/** Exige `Authorization: Bearer <token>` válido e não revogado. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(TokenDenylistService)
    private readonly denylist: TokenDenylistService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestAutenticada>();
    const payload = this.auth.verifyToken(
      extrairBearer(request.headers.authorization),
    );

    if (!payload?.jti || this.denylist.estaRevogado(payload.jti)) {
      throw new UnauthorizedException('Não autenticado');
    }

    request.user = payload;
    return true;
  }
}
