import { PasswordService } from '../../commons/password.service.js';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ContatoService } from './contato.service.js';
import { ContatoController } from './contato.controller.js';
import { AuthService } from '../../commons/auth.service.js';
import { Usuario } from '../../models/usuario.model.js';
import { Empresa } from '../../models/empresa.model.js';

@Module({
  imports: [
    SequelizeModule.forFeature([Usuario, Empresa]),
  ],
  controllers: [ContatoController],
  providers: [ContatoService, AuthService, PasswordService],
  exports: [ContatoService],
})
export class ContatoModule {}