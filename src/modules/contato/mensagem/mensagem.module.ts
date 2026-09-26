import { Module } from '@nestjs/common';
import { ContatoModule } from '../contato.module.js';
import { MensagemController } from './mensagem.controller.js';
import { MensagemService } from './mensagem.service.js';

@Module({
  imports: [ContatoModule],
  controllers: [MensagemController],
  providers: [MensagemService],
})
export class MensagemModule {}