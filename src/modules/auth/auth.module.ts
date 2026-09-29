import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from '../../commons/auth.service.js';
import { PasswordService } from '../../commons/password.service.js';
import { Usuario } from '../../models/usuario.model.js';
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
  imports: [SequelizeModule.forFeature([Usuario])],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
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
