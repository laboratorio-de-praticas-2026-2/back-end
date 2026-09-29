import { Module } from '@nestjs/common';
import { AgendamentoController } from './agendamento.controller.js';
import { AgendamentoService } from './agendamento.service.js';
import { DisparoAgendamentoModule } from './disparo/disparo.module.js';

@Module({
  imports: [DisparoAgendamentoModule],
  controllers: [AgendamentoController],
  providers: [AgendamentoService],
})
export class AgendamentoModule { }