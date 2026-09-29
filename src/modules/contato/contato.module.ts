import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ContatoService } from './contato.service.js';
import { ContatoController } from './contato.controller.js';
import { AuthService } from '../../commons/auth.service.js';
import { Usuario } from './entities/usuario.entity.js';
import { Empresa } from './entities/empresa.entity.js';

@Module({
  imports: [
    SequelizeModule.forFeature([Usuario, Empresa]),
  ],
  controllers: [ContatoController],
  providers: [ContatoService, AuthService],
  exports: [ContatoService],
})
export class ContatoModule {}