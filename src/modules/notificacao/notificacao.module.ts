import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificacaoService } from './notificacao.service.js';
import { NotificacaoController } from './notificacao.controller.js';
import { NotificacaoGateway } from './notificacao.gateway.js';
import { NotificacaoSocketService } from './notificacao-socket.service.js';
import { NotificacaoObrigacoesService } from './services/notificacao-obrigacoes.service.js';
import { NotificacaoObrigacoesCron } from './jobs/notificacao-obrigacoes.cron.js';

@Module({
  imports: [ScheduleModule.forRoot()],
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
