import { Module } from '@nestjs/common';
import { NotificacaoService } from './notificacao.service.js';
import { NotificacaoController } from './notificacao.controller.js';
import { NotificacaoGateway } from './notificacao.gateway.js';
import { NotificacaoSocketService } from './notificacao-socket.service.js';

@Module({
  controllers: [NotificacaoController],
  providers: [
    NotificacaoService,
    NotificacaoGateway,
    NotificacaoSocketService,
  ],
  exports: [NotificacaoService, NotificacaoSocketService],
})
export class NotificacaoModule {}