import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module.js';
import { NotificacaoObrigacoesService } from '../src/modules/notificacao/services/notificacao-obrigacoes.service.js';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import {
  Obrigacao,
  StatusObrigacao,
  TipoObrigacao,
} from '../src/models/obrigacao.model.js';
import { ObrigacaoEmpresa } from '../src/models/obrigacao-empresa.model.js';
import { ObrigacaoServico } from '../src/models/obrigacao-servico.model.js';
import { Empresa } from '../src/models/empresa.model.js';
import { Usuario } from '../src/models/usuario.model.js';
import { Solicitacao } from '../src/models/solicitacao.model.js';
import { Servico } from '../src/models/servico.model.js';
import { NotificacaoGateway } from '../src/modules/notificacao/notificacao.gateway.js';
import { pertenceAoEscopo } from '../src/modules/notificacao/constants/termos-obrigacoes.js';

const TEST_JWT_SECRET = 'test-secret-e2e';
const USER_ID_TESTE = 3;

describe('Notificação de obrigações pendentes (e2e)', () => {
  let app: INestApplication;
  let notificacaoObrigacoesService: NotificacaoObrigacoesService;
  let socket: Socket;

  let empresaTeste: Empresa | null = null;
  let obrigacaoEmpresaTeste: Obrigacao | null = null;
  let vinculoEmpresaTeste: ObrigacaoEmpresa | null = null;

  let obrigacaoServicoTeste: Obrigacao | null = null;
  let solicitacaoTeste: Solicitacao | null = null;
  let vinculoServicoTeste: ObrigacaoServico | null = null;

  let obrigacaoForaEscopo: Obrigacao | null = null;
  let vinculoForaEscopo: ObrigacaoEmpresa | null = null;

  let obrigacaoPagaTeste: Obrigacao | null = null;
  let vinculoObrigacaoPagaTeste: ObrigacaoEmpresa | null = null;

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

    const usuario = await Usuario.findByPk(USER_ID_TESTE);

    if (!usuario) {
      throw new Error(
        `Usuário ${USER_ID_TESTE} não encontrado no banco.`,
      );
    }

    const servico = await Servico.findOne({
      where: { ativo: true },
    });

    if (!servico) {
      throw new Error(
        'Nenhum serviço ativo encontrado para o teste.',
      );
    }

    empresaTeste = await Empresa.create({
      usuarioId: usuario.id,
      razaoSocial: 'Empresa Teste E2E',
      nomeFantasia: 'Empresa Teste E2E',
      cnpj: '12345678000195',
      regimeTributario: 'simples_nacional',
    } as any);

    obrigacaoEmpresaTeste = await Obrigacao.create({
      tipo: TipoObrigacao.EMPRESA,
      descricao: 'DAS / Teste E2E Empresa',
      valor: 150,
      status: StatusObrigacao.PENDENTE,
      vencimento: '2026-12-20',
      createdAt: new Date(),
    } as any);

    vinculoEmpresaTeste = await ObrigacaoEmpresa.create({
      idObrigacao: obrigacaoEmpresaTeste.id,
      idEmpresa: empresaTeste.id,
      createdAt: new Date(),
    } as any);

    solicitacaoTeste = await Solicitacao.create({
      usuarioId: usuario.id,
      servicoId: servico.id,
    } as any);

    obrigacaoServicoTeste = await Obrigacao.create({
      tipo: TipoObrigacao.SERVICO,
      descricao: 'DARF / Teste E2E Solicitação',
      valor: 200,
      status: StatusObrigacao.PENDENTE,
      vencimento: '2026-12-21',
      createdAt: new Date(),
    } as any);

    vinculoServicoTeste = await ObrigacaoServico.create({
      idObrigacao: obrigacaoServicoTeste.id,
      idServico: servico.id,
      solicitacaoId: solicitacaoTeste.id,
      createdAt: new Date(),
    } as any);

    obrigacaoForaEscopo = await Obrigacao.create({
      tipo: TipoObrigacao.EMPRESA,
      descricao: 'Obrigação de teste fora do escopo',
      valor: 300,
      status: StatusObrigacao.PENDENTE,
      vencimento: '2026-12-22',
      createdAt: new Date(),
    } as any);

    vinculoForaEscopo = await ObrigacaoEmpresa.create({
      idObrigacao: obrigacaoForaEscopo.id,
      idEmpresa: empresaTeste.id,
      createdAt: new Date(),
    } as any);

    obrigacaoPagaTeste = await Obrigacao.create({
      tipo: TipoObrigacao.EMPRESA,
      descricao: 'DAS / Teste E2E Pago',
      valor: 100,
      status: StatusObrigacao.PAGO,
      vencimento: '2026-12-23',
      createdAt: new Date(),
    } as any);

    vinculoObrigacaoPagaTeste = await ObrigacaoEmpresa.create({
      idObrigacao: obrigacaoPagaTeste.id,
      idEmpresa: empresaTeste.id,
      createdAt: new Date(),
    } as any);
  }, 30000);

  afterAll(async () => {
    if (socket) {
      socket.disconnect();
    }

    if (vinculoObrigacaoPagaTeste) {
      await ObrigacaoEmpresa.destroy({
        where: { id: vinculoObrigacaoPagaTeste.id },
      });
    }

    if (vinculoForaEscopo) {
      await ObrigacaoEmpresa.destroy({
        where: { id: vinculoForaEscopo.id },
      });
    }

    if (vinculoServicoTeste) {
      await ObrigacaoServico.destroy({
        where: { id: vinculoServicoTeste.id },
      });
    }

    if (vinculoEmpresaTeste) {
      await ObrigacaoEmpresa.destroy({
        where: { id: vinculoEmpresaTeste.id },
      });
    }

    if (obrigacaoPagaTeste) {
      await Obrigacao.destroy({
        where: { id: obrigacaoPagaTeste.id },
        force: true,
      });
    }

    if (obrigacaoForaEscopo) {
      await Obrigacao.destroy({
        where: { id: obrigacaoForaEscopo.id },
        force: true,
      });
    }

    if (obrigacaoServicoTeste) {
      await Obrigacao.destroy({
        where: { id: obrigacaoServicoTeste.id },
        force: true,
      });
    }

    if (obrigacaoEmpresaTeste) {
      await Obrigacao.destroy({
        where: { id: obrigacaoEmpresaTeste.id },
        force: true,
      });
    }

    if (solicitacaoTeste) {
      await Solicitacao.destroy({
        where: { id: solicitacaoTeste.id },
        force: true,
      });
    }

    if (empresaTeste) {
      await Empresa.destroy({
        where: { id: empresaTeste.id },
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('deve enviar notificações pelas associações de empresa e solicitação', async () => {
    const token = jwt.sign(
      {
        id: USER_ID_TESTE,
        nivel: 'cliente',
      },
      TEST_JWT_SECRET,
      { jwtid: randomUUID() },
    );

    const address = app.getHttpServer().address();

    if (!address || typeof address === 'string') {
      throw new Error(
        'Não foi possível obter a porta da aplicação.',
      );
    }

    socket = io(`http://localhost:${address.port}`, {
      transports: ['websocket'],
      auth: { token },
    });

    await new Promise<void>((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });

    const notificacaoRecebida = new Promise<any>(
      (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error(
              'Tempo limite excedido aguardando a notificação.',
            ),
          );
        }, 5000);

        socket.once('notification:new', (payload) => {
          clearTimeout(timeout);
          resolve(payload);
        });
      },
    );

    await notificacaoObrigacoesService.executarRotinaSemanal();

    const payload = await notificacaoRecebida;

    console.log(
      '\nNotificação recebida:',
      JSON.stringify(payload, null, 2),
    );

    const descricoes = payload.obrigacoes.map(
      (obrigacao: { descricao: string }) => obrigacao.descricao,
    );

    expect(payload.titulo).toBe('Obrigações pendentes');
    expect(payload.mensagem).toContain('obrigações pendentes');
    expect(payload.timestamp).toBeDefined();

    expect(descricoes).toContain('DAS / Teste E2E Empresa');
    expect(descricoes).toContain('DARF / Teste E2E Solicitação');
    expect(descricoes).not.toContain(
      'Obrigação de teste fora do escopo',
    );
    expect(descricoes).not.toContain('DAS / Teste E2E Pago');

    const obrigacaoEmpresa = payload.obrigacoes.find(
      (obrigacao: { descricao: string }) =>
        obrigacao.descricao === 'DAS / Teste E2E Empresa',
    );

    expect(obrigacaoEmpresa).toMatchObject({
      descricao: 'DAS / Teste E2E Empresa',
      valor: 150,
      vencimento: '2026-12-20',
    });

    const obrigacaoServico = payload.obrigacoes.find(
      (obrigacao: { descricao: string }) =>
        obrigacao.descricao === 'DARF / Teste E2E Solicitação',
    );

    expect(obrigacaoServico).toMatchObject({
      descricao: 'DARF / Teste E2E Solicitação',
      valor: 200,
      vencimento: '2026-12-21',
    });
  }, 30000);

  it('não deve incluir obrigações pagas na consulta de pendentes do banco', async () => {
    const obrigacoesPagas = await Obrigacao.findAll({
      where: {
        status: StatusObrigacao.PAGO,
      },
    });

    const idsDasObrigacoesPagas = obrigacoesPagas.map(
      (obrigacao) => obrigacao.id,
    );

    const obrigacoesPendentes = await Obrigacao.findAll({
      where: {
        status: StatusObrigacao.PENDENTE,
      },
    });

    const idsDasObrigacoesPendentes = obrigacoesPendentes.map(
      (obrigacao) => obrigacao.id,
    );

    for (const id of idsDasObrigacoesPagas) {
      expect(idsDasObrigacoesPendentes).not.toContain(id);
    }

    expect(idsDasObrigacoesPagas).toContain(obrigacaoPagaTeste!.id);
    expect(idsDasObrigacoesPendentes).not.toContain(
      obrigacaoPagaTeste!.id,
    );
  });

  it('não deve permitir que um usuário entre na sala de outro usuário', async () => {
    expect(socket?.connected).toBe(true);

    const gateway = app.get(NotificacaoGateway);
    const socketServidor = gateway.server.sockets.sockets.get(
      socket.id!,
    );

    expect(socketServidor).toBeDefined();

    socket.emit('join-user', '999999');

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(
      socketServidor!.rooms.has(`user:${USER_ID_TESTE}`),
    ).toBe(true);

    expect(
      socketServidor!.rooms.has('user:999999'),
    ).toBe(false);
  });

  it('deve aceitar descrições dentro do escopo definido', () => {
    const descricoesValidas = [
      'DAS / Simples Nacional',
      'Pagamento de DARF',
      'INSS mensal',
      'Entrega do SPED',
      'DCTF mensal',
      'eSocial',
      'IR anual',
      'Imposto de Renda',
    ];

    for (const descricao of descricoesValidas) {
      expect(pertenceAoEscopo(descricao)).toBe(true);
    }
  });

  it('deve rejeitar descrições fora do escopo definido', () => {
    const descricoesInvalidas = [
      'Obrigação administrativa',
      'Pagamento de serviço',
      '',
      null,
      undefined,
    ];

    for (const descricao of descricoesInvalidas) {
      expect(pertenceAoEscopo(descricao)).toBe(false);
    }
  });
});