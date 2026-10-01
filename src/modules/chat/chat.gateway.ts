import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';

import { Socket } from 'socket.io';

import { ChatService } from './chat.service.js';
import { AuthService } from '../../commons/auth.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  // Quando um usuário conecta
  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    const usuario = this.authService.verifyToken(token);

    if (!usuario) {
      console.log('WebSocket: usuário não autenticado.');
      client.disconnect();
      return;
    }

    client.data.usuario = usuario;

    console.log(`Usuário ${usuario.id} conectado ao WebSocket.`);
  }

  // Quando um usuário desconecta
  handleDisconnect(client: Socket) {
    const usuario = client.data.usuario;

    if (usuario) {
      console.log(
        `Usuário ${usuario.id} desconectado do WebSocket.`,
      );
    } else {
      console.log('Usuário desconectado do WebSocket.');
    }
  }

  // Entrar em uma conversa
  @SubscribeMessage('entrarConversa')
  async entrarConversa(
    @MessageBody() conversaId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const usuario = client.data.usuario;

      // Verifica se o usuário está autenticado
      if (!usuario) {
        throw new WsException('Usuário não autenticado.');
      }

      // Verifica se o ID da conversa foi informado
      if (!conversaId) {
        throw new WsException('conversaId é obrigatório.');
      }

      // Verifica se o usuário tem acesso à conversa
      await this.chatService.buscarConversa(
        conversaId,
        usuario,
      );

      const room = `conversa-${conversaId}`;

      client.join(room);

      console.log(`Cliente entrou na sala: ${room}`);

      client.emit('entrouConversa', {
        conversaId,
        mensagem: 'Você entrou na conversa.',
      });
    } catch (erro) {
      const mensagemErro =
        erro instanceof WsException
          ? erro.message
          : 'Erro ao entrar na conversa.';

      console.error(
        'Erro ao entrar na conversa:',
        mensagemErro,
      );

      client.emit('erro', {
        mensagem: mensagemErro,
      });
    }
  }

  // Receber e enviar mensagem
  @SubscribeMessage('mensagem')
  async receberMensagem(
    @MessageBody()
    dados: {
      conversaId: string;
      conteudo: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const usuario = client.data.usuario;

      // Verifica se o usuário está autenticado
      if (!usuario) {
        throw new WsException('Usuário não autenticado.');
      }

      // Verifica se os dados obrigatórios foram enviados
      if (!dados.conversaId || !dados.conteudo?.trim()) {
        throw new WsException(
          'conversaId e conteudo são obrigatórios.',
        );
      }

      console.log('Mensagem recebida:', dados);

      // Salva a mensagem no banco de dados
      const mensagem = await this.chatService.enviarMensagem(
        dados.conversaId,
        {
          conteudo: dados.conteudo,
        },
        usuario,
      );

      const room = `conversa-${dados.conversaId}`;

      // Envia para os outros usuários da conversa
      client.to(room).emit('mensagem', mensagem);

      // Envia também para quem enviou
      client.emit('mensagem', mensagem);
    } catch (erro) {
      const mensagemErro =
        erro instanceof WsException
          ? erro.message
          : 'Erro ao processar a mensagem.';

      console.error(
        'Erro no WebSocket:',
        mensagemErro,
      );

      client.emit('erro', {
        mensagem: mensagemErro,
      });
    }
  }
}