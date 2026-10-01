import bcrypt from 'bcryptjs';

/**
 * Hash de senha com bcrypt (bcryptjs, sem dependência nativa).
 *
 * O cadastro (PF/PJ) DEVE usar `hashSenha` ao salvar a senha do usuário,
 * pra ficar no mesmo formato que o login espera em `verificarSenha`.
 */
const SALT_ROUNDS = 10;

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

export async function verificarSenha(
  senha: string,
  armazenado: string,
): Promise<boolean> {
  if (!armazenado) return false;
  try {
    return await bcrypt.compare(senha, armazenado);
  } catch {
    // Hash em formato inesperado (ex.: vazio, truncado, de outro algoritmo).
    return false;
  }
}

let hashFalsoEmCache: Promise<string> | undefined;

/**
 * Hash descartável usado quando o e-mail não existe, para que o login gaste
 * o mesmo tempo com e sem usuário e não revele quais e-mails estão cadastrados.
 */
export function obterHashFalso(): Promise<string> {
  hashFalsoEmCache ??= hashSenha('hash-falso-sem-usuario-correspondente');
  return hashFalsoEmCache;
}
