import { Module } from '@nestjs/common';
import { ContatoService } from './contato.service.js';
import { ContatoController } from './contato.controller.js';
import { AuthService } from '../../commons/auth.service.js';

@Module({
  controllers: [ContatoController],
  providers: [ContatoService, AuthService],
  exports: [ContatoService],
})
export class ContatoModule {}