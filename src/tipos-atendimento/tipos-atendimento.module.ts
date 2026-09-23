import { Module } from '@nestjs/common';
import { TiposAtendimentoController } from './tipos-atendimento.controller.js';
import { TiposAtendimentoService } from './tipos-atendimento.service.js';

@Module({
  controllers: [TiposAtendimentoController],
  providers: [TiposAtendimentoService],
})
export class TiposAtendimentoModule {}