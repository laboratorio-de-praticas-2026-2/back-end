import { Global, Module } from '@nestjs/common';
import { AuthService } from '../../commons/auth.service.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './guards/auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { SessaoService } from './sessao.service.js';
import { TokenDenylistService } from './token-denylist.service.js';
import {
  SequelizeUsuarioAuthRepository,
  USUARIO_AUTH_REPOSITORY,
} from './usuario-auth.repository.js';

/**
 * Global para que qualquer módulo use `@UseGuards(AuthGuard, RolesGuard)`
 * sem precisar importar o AuthModule.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenDenylistService,
    SessaoService,
    AuthGuard,
    RolesGuard,
    {
      provide: USUARIO_AUTH_REPOSITORY,
      useClass: SequelizeUsuarioAuthRepository,
    },
  ],
  exports: [AuthService, TokenDenylistService, AuthGuard, RolesGuard],
})
export class AuthModule {}
