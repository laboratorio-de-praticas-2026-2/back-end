import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PasswordService } from '../../commons/password.service.js';
import { Usuario } from '../../models/usuario.model.js';
import { ClienteController } from './cliente.controller.js';
import { ClienteService } from './cliente.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Usuario])],
  controllers: [ClienteController],
  providers: [ClienteService, PasswordService],
})
export class ClienteModule {}
