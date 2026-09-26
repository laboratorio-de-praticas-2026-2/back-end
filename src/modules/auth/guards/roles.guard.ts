import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { NivelUsuarioEnum } from '../../../commons/constantes/nivel-usuario-enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { RequestAutenticada } from '../auth.types.js';

/** Aplicar depois do AuthGuard: `@UseGuards(AuthGuard, RolesGuard)`. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<NivelUsuarioEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permitidos || permitidos.length === 0) return true;

    const usuario = context.switchToHttp().getRequest<RequestAutenticada>().user;
    if (!usuario) throw new UnauthorizedException('Não autenticado');

    if (!permitidos.includes(usuario.nivel)) {
      throw new ForbiddenException('Acesso negado');
    }
    return true;
  }
}
