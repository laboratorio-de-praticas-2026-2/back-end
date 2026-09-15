import { Module } from '@nestjs/common';
import { ContatoModule } from '../contato/contato.module.js';
import { DisparoService } from './disparo.service.js';
import { DisparoController } from './disparo.controller.js';

@Module({
  imports: [ContatoModule],
  controllers: [DisparoController],
  providers: [DisparoService],
})
export class DisparoModule {}