import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../../commons/auth.service.js';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { ContatoController } from '../contato/contato.controller.js';
import { ContatoService } from '../contato/contato.service.js';
import { MensagemController } from '../contato/mensagem/mensagem.controller.js';
import { MensagemService } from '../contato/mensagem/mensagem.service.js';
import { AuthController } from './auth.controller.js';
import { Roles } from './decorators/roles.decorator.js';
import { AuthGuard } from './guards/auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { hashSenha } from './password.util.js';
import { SessaoService } from './sessao.service.js';
import { TokenDenylistService } from './token-denylist.service.js';
import { USUARIO_AUTH_REPOSITORY } from './usuario-auth.repository.js';
import type { UsuarioAuth } from './usuario-auth.repository.js';

@Controller('teste')
class RotasDeTesteController {
  @Get('autenticada')
  @UseGuards(AuthGuard)
  autenticada() {
    return { ok: true };
  }

  @Get('admin')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(NivelUsuarioEnum.administrador)
  soAdmin() {
    return { ok: true };
  }
}

describe('Autenticação (HTTP)', () => {
  const envOriginal = { ...process.env };
  let app: INestApplication;
  let hash: string;

  const login = (email: string, senha: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, senha });

  const tokenDe = async (email: string) =>
    (await login(email, 'Senha@123')).body.accessToken as string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres';
    hash = await hashSenha('Senha@123');

    const usuarios: UsuarioAuth[] = [
      { id: 1, nome: 'Ana', email: 'ana@teste.com', senhaHash: hash, nivel: NivelUsuarioEnum.cliente },
      { id: 2, nome: 'Admin', email: 'admin@teste.com', senhaHash: hash, nivel: NivelUsuarioEnum.administrador },
    ];

    const modulo = await Test.createTestingModule({
      controllers: [
        AuthController,
        ContatoController,
        MensagemController,
        RotasDeTesteController,
      ],
      providers: [
        AuthService,
        TokenDenylistService,
        SessaoService,
        AuthGuard,
        RolesGuard,
        { provide: ContatoService, useValue: { putContact: vi.fn() } },
        { provide: MensagemService, useValue: { listarHistorico: vi.fn() } },
        {
          provide: USUARIO_AUTH_REPOSITORY,
          useValue: {
            buscarPorEmail: async (email: string) => usuarios.find((u) => u.email === email) ?? null,
            buscarPorId: async (id: number) => usuarios.find((u) => u.id === id) ?? null,
          },
        },
      ],
    }).compile();

    app = modulo.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env = { ...envOriginal };
  });

  describe('POST /auth/login', () => {
    it('200 com token, tipo, validade e perfil do usuário', async () => {
      const res = await login('ana@teste.com', 'Senha@123').expect(200);

      expect(res.body).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: 3600,
        usuario: { id: 1, nome: 'Ana', email: 'ana@teste.com', nivel: 'cliente' },
      });
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('não expõe senha nem hash na resposta', async () => {
      const res = await login('ana@teste.com', 'Senha@123').expect(200);
      const texto = JSON.stringify(res.body);

      expect(texto).not.toContain(hash);
      expect(texto).not.toContain('senhaHash');
      expect(texto).not.toContain('Senha@123');
    });

    it('401 para senha incorreta', async () => {
      const res = await login('ana@teste.com', 'errada').expect(401);
      expect(res.body).toMatchObject({ statusCode: 401, message: 'Credenciais inválidas' });
    });

    it('401 para e-mail inexistente, com a mesma resposta da senha incorreta', async () => {
      const inexistente = await login('ninguem@teste.com', 'Senha@123').expect(401);
      const senhaErrada = await login('ana@teste.com', 'errada').expect(401);
      expect(inexistente.body).toEqual(senhaErrada.body);
    });

    it('400 com lista de erros para corpo inválido', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'nao-e-email' }).expect(400);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toEqual([
        'email deve ser um endereço de e-mail válido',
        'senha não pode estar vazia',
      ]);
    });

    it('400 quando não há corpo', async () => {
      await request(app.getHttpServer()).post('/auth/login').expect(400);
    });
  });

  describe('recursos protegidos', () => {
    it('401 sem token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
      await request(app.getHttpServer()).get('/teste/autenticada').expect(401);
    });

    it('401 com token inválido ou header malformado', async () => {
      await request(app.getHttpServer()).get('/auth/me').set('Authorization', 'Bearer token-invalido').expect(401);
      await request(app.getHttpServer()).get('/auth/me').set('Authorization', 'token-sem-prefixo').expect(401);
    });

    it('GET /auth/me identifica o usuário autenticado', async () => {
      const token = await tokenDe('ana@teste.com');
      const res = await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200);

      expect(res.body).toEqual({ id: 1, nome: 'Ana', email: 'ana@teste.com', nivel: 'cliente' });
    });

    it('acesso liberado com token válido', async () => {
      const token = await tokenDe('ana@teste.com');
      await request(app.getHttpServer()).get('/teste/autenticada').set('Authorization', `Bearer ${token}`).expect(200);
    });
  });

  describe('autorização por perfil', () => {
    it('403 para cliente em rota de administrador', async () => {
      const token = await tokenDe('ana@teste.com');
      await request(app.getHttpServer()).get('/teste/admin').set('Authorization', `Bearer ${token}`).expect(403);
    });

    it('200 para administrador', async () => {
      const token = await tokenDe('admin@teste.com');
      await request(app.getHttpServer()).get('/teste/admin').set('Authorization', `Bearer ${token}`).expect(200);
    });

    it('403 para cliente em PUT /contato', async () => {
      const token = await tokenDe('ana@teste.com');
      await request(app.getHttpServer())
        .put('/contato')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(403);
    });

    it('403 para cliente em GET /mensagem', async () => {
      const token = await tokenDe('ana@teste.com');
      await request(app.getHttpServer())
        .get('/mensagem')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('401 sem token', async () => {
      await request(app.getHttpServer()).get('/teste/admin').expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('204 e o token deixa de funcionar', async () => {
      const token = await tokenDe('ana@teste.com');
      const auth = { Authorization: `Bearer ${token}` };

      await request(app.getHttpServer()).get('/auth/me').set(auth).expect(200);
      await request(app.getHttpServer()).post('/auth/logout').set(auth).expect(204);
      await request(app.getHttpServer()).get('/auth/me').set(auth).expect(401);
      await request(app.getHttpServer()).get('/teste/autenticada').set(auth).expect(401);
    });

    it('logout de um token não invalida outros tokens do mesmo usuário', async () => {
      const token1 = await tokenDe('ana@teste.com');
      const token2 = await tokenDe('ana@teste.com');

      await request(app.getHttpServer()).post('/auth/logout').set('Authorization', `Bearer ${token1}`).expect(204);
      await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${token2}`).expect(200);
    });

    it('401 sem token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });
});
