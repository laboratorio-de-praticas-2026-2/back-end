import { Module } from '@nestjs/common';
import { AgendamentoController } from './agendamento.controller.js';
import { AgendamentoService } from './agendamento.service.js';

@Module({
  controllers: [AgendamentoController],
  providers: [AgendamentoService],
})
export class AgendamentoModule { }