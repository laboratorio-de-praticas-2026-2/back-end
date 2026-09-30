import { AuthSecurityModule } from './auth-security.module.js';
import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PasswordService } from '../../commons/password.service.js';
import { Usuario } from '../../models/usuario.model.js';
import { AuthController } from './auth.controller.js';
import { RolesGuard } from './guards/roles.guard.js';
import { SessaoService } from './sessao.service.js';
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
  imports: [AuthSecurityModule, SequelizeModule.forFeature([Usuario])],
  controllers: [AuthController],
  providers: [
    PasswordService,
    SessaoService,
    RolesGuard,
    {
      provide: USUARIO_AUTH_REPOSITORY,
      useClass: SequelizeUsuarioAuthRepository,
    },
  ],
  exports: [AuthSecurityModule, RolesGuard],
})
export class AuthModule {}
