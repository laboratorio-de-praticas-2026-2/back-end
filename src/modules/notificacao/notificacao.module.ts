import { Module } from '@nestjs/common';
import { NotificacaoService } from './notificacao.service.js';
import { NotificacaoController } from './notificacao.controller.js';

@Module({
  controllers: [NotificacaoController],
  providers: [NotificacaoService],
  exports: [NotificacaoService],
})
export class NotificacaoModule {}