import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../commons/auth.service.js';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { hashSenha } from './password.util.js';
import {
  MENSAGEM_CREDENCIAIS_INVALIDAS,
  SessaoService,
} from './sessao.service.js';
import { TokenDenylistService } from './token-denylist.service.js';
import type {
  UsuarioAuth,
  UsuarioAuthRepository,
} from './usuario-auth.repository.js';

class RepositorioFake implements UsuarioAuthRepository {
  constructor(private readonly usuarios: UsuarioAuth[]) {}
  async buscarPorEmail(email: string) {
    return this.usuarios.find((u) => u.email === email) ?? null;
  }
  async buscarPorId(id: number) {
    return this.usuarios.find((u) => u.id === id) ?? null;
  }
}

describe('SessaoService', () => {
  const envOriginal = { ...process.env };
  let sessao: SessaoService;
  let auth: AuthService;
  let denylist: TokenDenylistService;
  let hash: string;

  beforeAll(async () => {
    hash = await hashSenha('Senha@123');
  });

  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres';
    auth = new AuthService();
    denylist = new TokenDenylistService();
    const repo = new RepositorioFake([
      { id: 1, nome: 'Ana', email: 'ana@teste.com', senhaHash: hash, nivel: NivelUsuarioEnum.cliente },
      { id: 2, nome: 'Admin', email: 'admin@teste.com', senhaHash: hash, nivel: NivelUsuarioEnum.administrador },
    ]);
    sessao = new SessaoService(repo, auth, denylist);
  });

  afterEach(() => {
    process.env = { ...envOriginal };
  });

  describe('login', () => {
    it('autentica com credenciais válidas e devolve token + perfil', async () => {
      const res = await sessao.login({ email: 'ana@teste.com', senha: 'Senha@123' });

      expect(res.tokenType).toBe('Bearer');
      expect(res.expiresIn).toBe(3600);
      expect(res.usuario).toEqual({ id: 1, nome: 'Ana', email: 'ana@teste.com', nivel: 'cliente' });
      expect(auth.verifyToken(res.accessToken)).toMatchObject({ id: 1, nivel: 'cliente' });
    });

    it('devolve o nível de administrador para o fluxo de permissões', async () => {
      const res = await sessao.login({ email: 'admin@teste.com', senha: 'Senha@123' });
      expect(res.usuario.nivel).toBe(NivelUsuarioEnum.administrador);
    });

    it('ignora maiúsculas e espaços no e-mail', async () => {
      const res = await sessao.login({ email: '  ANA@Teste.com ', senha: 'Senha@123' });
      expect(res.usuario.id).toBe(1);
    });

    it('nunca expõe senha ou hash', async () => {
      const res = await sessao.login({ email: 'ana@teste.com', senha: 'Senha@123' });
      const json = JSON.stringify(res);
      expect(json).not.toContain(hash);
      expect(json).not.toContain('senha');
    });

    it('rejeita senha incorreta', async () => {
      await expect(
        sessao.login({ email: 'ana@teste.com', senha: 'errada' }),
      ).rejects.toThrow(new UnauthorizedException(MENSAGEM_CREDENCIAIS_INVALIDAS));
    });

    it('rejeita e-mail inexistente com a mesma mensagem da senha incorreta', async () => {
      await expect(
        sessao.login({ email: 'ninguem@teste.com', senha: 'Senha@123' }),
      ).rejects.toThrow(new UnauthorizedException(MENSAGEM_CREDENCIAIS_INVALIDAS));
    });
  });

  describe('me', () => {
    it('devolve o usuário sem senha/hash', async () => {
      expect(await sessao.me(1)).toEqual({ id: 1, nome: 'Ana', email: 'ana@teste.com', nivel: 'cliente' });
    });

    it('rejeita usuário que não existe mais', async () => {
      await expect(sessao.me(999)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revoga o token emitido no login', async () => {
      const { accessToken } = await sessao.login({ email: 'ana@teste.com', senha: 'Senha@123' });
      const payload = auth.verifyToken(accessToken)!;

      expect(denylist.estaRevogado(payload.jti!)).toBe(false);
      sessao.logout(payload);
      expect(denylist.estaRevogado(payload.jti!)).toBe(true);
    });
  });
});
