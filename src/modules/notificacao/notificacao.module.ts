import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SequelizeModule } from '@nestjs/sequelize';
import { NotificacaoService } from './notificacao.service.js';
import { NotificacaoController } from './notificacao.controller.js';
import { NotificacaoGateway } from './notificacao.gateway.js';
import { NotificacaoSocketService } from './notificacao-socket.service.js';
import { NotificacaoObrigacoesService } from './services/notificacao-obrigacoes.service.js';
import { NotificacaoObrigacoesCron } from './jobs/notificacao-obrigacoes.cron.js';
import { Obrigacao } from '../../models/obrigacao.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';
import { ObrigacaoEmpresa } from '../../models/obrigacao-empresa.model.js';
import { Solicitacao } from '../../models/solicitacao.model.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SequelizeModule.forFeature([
      Obrigacao,
      ObrigacaoServico,
      ObrigacaoEmpresa,
      Solicitacao,
    ]),
  ],
  controllers: [NotificacaoController],
  providers: [
    NotificacaoService,
    NotificacaoGateway,
    NotificacaoSocketService,
    NotificacaoObrigacoesService,
    NotificacaoObrigacoesCron,
  ],
  exports: [
    NotificacaoService,
    NotificacaoSocketService,
    NotificacaoObrigacoesService,
  ],
})
export class NotificacaoModule {}
