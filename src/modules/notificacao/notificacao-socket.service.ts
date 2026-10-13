import { Injectable } from '@nestjs/common';
import { NotificacaoGateway } from './notificacao.gateway.js';

@Injectable()
export class NotificacaoSocketService {
  constructor(private readonly gateway: NotificacaoGateway) {}

  sendToUser(userId: string, payload: Record<string, unknown>) {
    this.gateway.server.to(`user:${userId}`).emit('notification:new', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    console.log(`[Notification] Enviada para o usuário ${userId}`);
  }
}