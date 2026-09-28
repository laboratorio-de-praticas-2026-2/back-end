import { QueryTypes, Sequelize } from 'sequelize';
import { SequelizeUsuarioAuthRepository } from './usuario-auth.repository.js';

describe('SequelizeUsuarioAuthRepository', () => {
  const query = vi.fn();
  const repository = new SequelizeUsuarioAuthRepository({
    query,
  } as unknown as Sequelize);

  beforeEach(() => query.mockReset());

  it('consulta o e-mail na tabela oficial do cadastro PF e mapeia o hash', async () => {
    const usuario = {
      id: 1,
      nome: 'Cliente',
      email: 'pf@example.test',
      senhaHash: 'hash',
      nivel: 'cliente',
    };
    query.mockResolvedValue([usuario]);
    expect(await repository.buscarPorEmail(usuario.email)).toEqual(usuario);
    expect(query).toHaveBeenCalledWith(
      'SELECT id AS id, nome AS nome, email AS email, senha AS senhaHash, nivel AS nivel FROM usuario WHERE email = :valor LIMIT 1',
      { replacements: { valor: usuario.email }, type: QueryTypes.SELECT },
    );
  });

  it('consulta o perfil pelo id na mesma tabela e retorna null se ausente', async () => {
    query.mockResolvedValue([]);
    expect(await repository.buscarPorId(42)).toBeNull();
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FROM usuario WHERE id = :valor LIMIT 1'),
      { replacements: { valor: 42 }, type: QueryTypes.SELECT },
    );
  });
});
