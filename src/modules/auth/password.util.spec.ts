import { hashSenha, obterHashFalso, verificarSenha } from './password.util.js';

describe('password.util', () => {
  it('gera hash que não contém a senha em texto puro', async () => {
    const hash = await hashSenha('Senha@123');
    expect(hash).not.toContain('Senha@123');
    expect(hash.startsWith('scrypt$')).toBe(true);
  });

  it('gera hashes diferentes para a mesma senha (salt aleatório)', async () => {
    const [a, b] = await Promise.all([hashSenha('Senha@123'), hashSenha('Senha@123')]);
    expect(a).not.toBe(b);
  });

  it('aceita a senha correta e rejeita a incorreta', async () => {
    const hash = await hashSenha('Senha@123');
    expect(await verificarSenha('Senha@123', hash)).toBe(true);
    expect(await verificarSenha('senha@123', hash)).toBe(false);
    expect(await verificarSenha('', hash)).toBe(false);
  });

  it('rejeita hash armazenado em formato inválido', async () => {
    expect(await verificarSenha('qualquer', '')).toBe(false);
    expect(await verificarSenha('qualquer', 'texto-puro')).toBe(false);
    expect(await verificarSenha('qualquer', 'scrypt$x$y$z$a$b')).toBe(false);
    expect(await verificarSenha('qualquer', 'bcrypt$16384$8$1$YQ==$Yg==')).toBe(false);
  });

  it('fornece um hash falso válido para o caso de e-mail inexistente', async () => {
    const hash = await obterHashFalso();
    expect(await verificarSenha('qualquer', hash)).toBe(false);
  });
});
