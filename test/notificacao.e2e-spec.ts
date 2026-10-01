import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module.js';
import { NotificacaoSocketService } from '../src/modules/notificacao/notificacao-socket.service.js';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const TEST_JWT_SECRET = 'test-secret-e2e';

describe('Notificação em Tempo Real (e2e)', () => {
  let app: INestApplication;
  let socket: Socket;
  let socketService: NotificacaoSocketService;
  let porta: number;

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    await app.init();
    await app.listen(0);
    porta = app.getHttpServer().address().port;

    socketService = moduleFixture.get<NotificacaoSocketService>(
      NotificacaoSocketService,
    );
  });

  afterAll(async () => {
    if (socket) socket.disconnect();
    await app.close();
  });

  it('deve receber notificação após entrar na sala', async () => {
    const userIdTeste = 'usuario-teste-123';
    const payload = { titulo: 'Teste', mensagem: 'Olá, mundo!' };

    const token = jwt.sign(
      { id: 1, nivel: 'cliente' },
      TEST_JWT_SECRET,
      { jwtid: randomUUID() },
    );

    // Cria uma Promise que resolve quando a notificação chegar
    const notificacaoRecebida = new Promise<any>((resolve, reject) => {
      socket = io(`http://127.0.0.1:${porta}`, {
        transports: ['websocket'],
        auth: {
          token,
        },
      });

      const timeout = setTimeout(() => {
        reject(new Error('Timeout: notificação não recebida'));
      }, 3000);

      socket.on('connect', () => {
        socket.emit('join-user', userIdTeste);

        // Pequeno delay para garantir que o servidor processou o join
        setTimeout(() => {
          socketService.sendToUser(userIdTeste, payload);
        }, 100);
      });

      socket.on('notification:new', (dados) => {
        clearTimeout(timeout);
        resolve(dados);
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Aguarda e valida
    const dados = await notificacaoRecebida;
    expect(dados.titulo).toBe(payload.titulo);
    expect(dados.mensagem).toBe(payload.mensagem);
    expect(dados).toHaveProperty('timestamp');
  }, 10000); // Timeout do teste: 10 segundos
});