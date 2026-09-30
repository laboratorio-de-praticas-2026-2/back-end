import { Module } from '@nestjs/common';
import { AgendamentoController } from './agendamento.controller.js';
import { AgendamentoService } from './agendamento.service.js';
import { DisparoAgendamentoModule } from './disparo/disparo.module.js';
import { SequelizeModule } from '@nestjs/sequelize';
import { AgendamentoModel } from '../../models/agendamento.model.js';
import { TipoAtendimentoModel } from '../../models/tipo-atendimento.model.js';

@Module({
  imports: [
    DisparoAgendamentoModule,
    SequelizeModule.forFeature([AgendamentoModel, TipoAtendimentoModel]),
  ],
  controllers: [AgendamentoController],
  providers: [AgendamentoService],
})
export class AgendamentoModule { }