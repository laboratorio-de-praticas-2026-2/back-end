import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module.js';
import { NotificacaoObrigacoesService } from '../src/modules/notificacao/services/notificacao-obrigacoes.service.js';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { Obrigacao } from '../src/models/obrigacao.model.js';
import { ObrigacaoEmpresa } from '../src/models/obrigacao-empresa.model.js';
import { Empresa } from '../src/models/empresa.model.js';
import { Usuario } from '../src/models/usuario.model.js';

const TEST_JWT_SECRET = 'test-secret-e2e';
const USER_ID_TESTE = '3';

describe('Notificação de obrigações pendentes (e2e)', () => {
  let app: INestApplication;
  let notificacaoObrigacoesService: NotificacaoObrigacoesService;
  let socket: Socket;
  let empresaTeste: Empresa | null = null;
  let obrigacaoTeste: Obrigacao | null = null;
  let obrigacaoEmpresaTeste: ObrigacaoEmpresa | null = null;
  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
    app = moduleFixture.createNestApplication();
    await app.listen(0);
    notificacaoObrigacoesService =
      app.get(NotificacaoObrigacoesService);
    const usuario = await Usuario.findByPk(
      Number(USER_ID_TESTE),
    );
    if (!usuario) {
      throw new Error(
        `Usuário ${USER_ID_TESTE} não encontrado no banco.`,
      );
    }
    empresaTeste = await Empresa.create({
      usuarioId: usuario.id,
      razaoSocial: 'Empresa Teste E2E',
      nomeFantasia: 'Empresa Teste E2E',
      cnpj: '12345678000195',
      regimeTributario: 'simples_nacional',
    } as any);
    obrigacaoTeste = await Obrigacao.findByPk(5);
    if (!obrigacaoTeste) {
      throw new Error(
        'Obrigação 5 não encontrada no banco.',
      );
    }
    obrigacaoEmpresaTeste =
      await ObrigacaoEmpresa.create({
        idObrigacao: obrigacaoTeste.id,
        idEmpresa: empresaTeste.id,
        createdAt: new Date(),
      } as any);
  }, 30000);
  afterAll(async () => {
    if (socket) {
      socket.disconnect();
    }
    if (obrigacaoEmpresaTeste) {
      await ObrigacaoEmpresa.destroy({
        where: {
          id: obrigacaoEmpresaTeste.id,
        },
      });
    }
    if (empresaTeste) {
      await Empresa.destroy({
        where: {
          id: empresaTeste.id,
        },
      });
    }
    if (app) {
      await app.close();
    }
  });
  it(
    'deve enviar uma notificação para o usuário com obrigações pendentes',
    async () => {
      const token = jwt.sign(
        {
          id: Number(USER_ID_TESTE),
          nivel: 'cliente',
        },
        TEST_JWT_SECRET,
        {
          jwtid: randomUUID(),
        },
      );
      const address = app
        .getHttpServer()
        .address();
      if (!address || typeof address === 'string') {
        throw new Error(
          'Não foi possível obter a porta da aplicação.',
        );
      }
      const port = address.port;
      socket = io(`http://localhost:${port}`, {
        transports: ['websocket'],
        auth: {
          token,
        },
      });
      await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => {
          resolve();
        });
        socket.on('connect_error', (error) => {
          reject(error);
        });
      });
      socket.emit(
        'join-user',
        USER_ID_TESTE,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, 200),
      );
      const notificacaoRecebida =
        new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(
              new Error(
                'Tempo limite excedido aguardando a notificação.',
              ),
            );
          }, 5000);
          socket.once(
            'notification:new',
            (payload) => {
              clearTimeout(timeout);
              resolve(payload);
            },
          );
        });
      await notificacaoObrigacoesService.executarRotinaSemanal();
      const payload = await notificacaoRecebida;
      console.log(
        '\nNotificação recebida:',
        JSON.stringify(payload, null, 2),
      );
      expect(payload).toBeDefined();
      expect(payload.titulo).toBe(
        'Obrigações pendentes',
      );
      expect(payload.mensagem).toContain(
        'obrigação',
      );
      expect(
        Array.isArray(payload.obrigacoes),
      ).toBe(true);
      expect(
        payload.obrigacoes.length,
      ).toBeGreaterThan(0);
      expect(payload.timestamp).toBeDefined();
      const obrigacaoRecebida =
        payload.obrigacoes.find(
          (obrigacao: any) =>
            obrigacao.descricao ===
            'DAS / Simples Nacional',
        );
      expect(
        obrigacaoRecebida,
      ).toBeDefined();
      expect(
        obrigacaoRecebida,
      ).toHaveProperty('descricao');
      expect(
        obrigacaoRecebida,
      ).toHaveProperty('valor');
      expect(
        obrigacaoRecebida,
      ).toHaveProperty('vencimento');
    },
    30000,
  );
});  