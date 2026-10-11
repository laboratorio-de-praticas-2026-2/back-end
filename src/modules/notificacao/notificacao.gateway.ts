import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../../commons/auth.service.js';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificacaoGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.auth?.token;
      const usuario = this.authService.verifyToken(token);

      if (!usuario?.id) {
        client.disconnect(true);
        return;
      }

      client.data.usuario = usuario;

      // Cada usuário entra somente na própria sala.
      void client.join(`user:${usuario.id}`);

      console.log(
        `[Socket] Usuário ${usuario.id} conectado às notificações.`,
      );
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const usuario = client.data.usuario;

    if (usuario?.id) {
      console.log(
        `[Socket] Usuário ${usuario.id} desconectado das notificações.`,
      );
    }
  }

  @SubscribeMessage('join-user')
  handleJoinUser(@ConnectedSocket() client: Socket): void {
    const usuario = client.data.usuario;

    if (!usuario?.id) {
      client.disconnect(true);
      return;
    }

    // Ignora qualquer ID enviado pelo cliente.
    void client.join(`user:${usuario.id}`);
  }
}