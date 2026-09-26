import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, JwtUserPayload } from '../../../commons/auth.service.js';

type AuthenticatedRequest = Request & { user?: JwtUserPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
    const user = this.authService.verifyToken(token);

    if (!user?.id || !user.nivel) {
      throw new UnauthorizedException('Token inválido ou ausente.');
    }

    request.user = user;
    return true;
  }
}
