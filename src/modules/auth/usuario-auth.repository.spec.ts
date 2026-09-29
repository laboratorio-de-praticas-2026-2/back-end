import { getModelToken } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { PasswordService } from '../../commons/password.service.js';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { Usuario } from '../../models/usuario.model.js';
import {
  SequelizeUsuarioAuthRepository,
  USUARIO_AUTH_REPOSITORY,
} from './usuario-auth.repository.js';
import type { UsuarioAuthRepository } from './usuario-auth.repository.js';

/**
 * Simula exatamente o que o Cadastro PF (`ClienteService`) grava: mesmo
 * model `Usuario`, senha com `PasswordService` (bcrypt). Isso é o que
 * comprova que o login enxerga um usuário cadastrado pelo PF sem precisar
 * de banco de verdade.
 */
describe('SequelizeUsuarioAuthRepository (integração com o model Usuario)', () => {
  let repo: UsuarioAuthRepository;
  const senhas = new PasswordService();

  const linhasUsuario: Record<string, unknown>[] = [
    {
      id: 1,
      nome: 'Ana (PF)',
      email: 'ana.pf@teste.com',
      senha: '__preencher_no_beforeAll__',
      nivel: NivelUsuarioEnum.cliente,
      cpfCnpj: '12345678901',
      celular: null,
      deletedAt: null,
    },
    {
      id: 2,
      nome: 'Usuária removida',
      email: 'removida@teste.com',
      senha: '__preencher_no_beforeAll__',
      nivel: NivelUsuarioEnum.cliente,
      cpfCnpj: null,
      celular: null,
      deletedAt: new Date(),
    },
  ];

  beforeAll(async () => {
    linhasUsuario[0].senha = await senhas.hash('Senha@123');
    linhasUsuario[1].senha = await senhas.hash('Senha@123');
  });

  beforeEach(async () => {
    const usuarioModelMock = {
      findOne: async ({ where }: any) => {
        const linha = linhasUsuario.find((u) =>
          Object.entries(where).every(([campo, valor]) => u[campo] === valor),
        );
        return linha ? { ...linha } : null;
      },
    };

    const modulo = await Test.createTestingModule({
      providers: [
        {
          provide: USUARIO_AUTH_REPOSITORY,
          useClass: SequelizeUsuarioAuthRepository,
        },
        { provide: getModelToken(Usuario), useValue: usuarioModelMock },
      ],
    }).compile();

    repo = modulo.get(USUARIO_AUTH_REPOSITORY);
  });

  it('encontra por e-mail um usuário cadastrado como PF, com o hash gerado pelo PasswordService', async () => {
    const usuario = await repo.buscarPorEmail('ana.pf@teste.com');

    expect(usuario?.id).toBe(1);
    expect(usuario?.nivel).toBe(NivelUsuarioEnum.cliente);
    expect(await senhas.compare('Senha@123', usuario!.senhaHash)).toBe(true);
  });

  it('não retorna usuário com soft delete (deletedAt preenchido)', async () => {
    const usuario = await repo.buscarPorEmail('removida@teste.com');
    expect(usuario).toBeNull();
  });

  it('busca por id segue a mesma regra de soft delete', async () => {
    expect(await repo.buscarPorId(1)).not.toBeNull();
    expect(await repo.buscarPorId(2)).toBeNull();
  });
});
