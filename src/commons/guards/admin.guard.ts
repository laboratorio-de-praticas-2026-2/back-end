import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * ⚠️ GUARD PROVISÓRIO — substituir pelo guard oficial de autenticação/autorização.
 *
 * Existe apenas para os controllers do dashboard compilarem e para permitir testes locais.
 * Foi escrito para FALHAR FECHADO: se ninguém o substituir, os endpoints continuam
 * protegidos em vez de ficarem abertos.
 *
 * Comportamento:
 *  1. Se `DASHBOARD_AUTH_BYPASS=true` e `NODE_ENV !== 'production'`, libera o acesso
 *     (uso exclusivo em desenvolvimento/testes locais).
 *  2. Caso contrário, exige `request.user` preenchido por uma autenticação anterior
 *     (ex.: JWT) e com `nivel === 'administrador'` (enum UsuarioNivel do schema).
 *     Sem usuário → 401; usuário que não é administrador → 403.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const bypassLocal =
      process.env.DASHBOARD_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production';

    if (bypassLocal) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario) {
      throw new UnauthorizedException('Autenticação necessária');
    }

    if (usuario.nivel !== 'administrador') {
      throw new ForbiddenException('Acesso restrito a administradores');
    }

    return true;
  }
}