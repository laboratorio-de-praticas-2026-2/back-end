import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { ScryptOptions } from 'node:crypto';

/**
 * Hash de senha com scrypt (nativo do Node, sem dependências extras).
 *
 * Formato armazenado: scrypt$N$r$p$saltBase64$hashBase64
 * Os parâmetros ficam no próprio hash, então dá para aumentar o custo no
 * futuro sem invalidar senhas já cadastradas.
 *
 * O cadastro (PF/PJ) DEVE usar `hashSenha` ao salvar a senha do usuário.
 */
const PREFIXO = 'scrypt';
const PARAMS = { N: 16384, r: 8, p: 1 } as const;
const TAMANHO_CHAVE = 64;
const TAMANHO_SALT = 16;

function derivarChave(
  senha: string,
  salt: Buffer,
  tamanho: number,
  opcoes: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, salt, tamanho, opcoes, (erro, chave) =>
      erro ? reject(erro) : resolve(chave),
    );
  });
}

export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(TAMANHO_SALT);
  const chave = await derivarChave(senha, salt, TAMANHO_CHAVE, PARAMS);
  return [
    PREFIXO,
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64'),
    chave.toString('base64'),
  ].join('$');
}

export async function verificarSenha(
  senha: string,
  armazenado: string,
): Promise<boolean> {
  const partes = armazenado.split('$');
  if (partes.length !== 6 || partes[0] !== PREFIXO) return false;

  const [, n, r, p, saltBase64, chaveBase64] = partes;
  const opcoes = { N: Number(n), r: Number(r), p: Number(p) };
  if (![opcoes.N, opcoes.r, opcoes.p].every((v) => Number.isInteger(v))) {
    return false;
  }

  const salt = Buffer.from(saltBase64, 'base64');
  const esperado = Buffer.from(chaveBase64, 'base64');
  if (salt.length === 0 || esperado.length === 0) return false;

  try {
    const calculado = await derivarChave(senha, salt, esperado.length, opcoes);
    return (
      calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
    );
  } catch {
    return false;
  }
}

let hashFalsoEmCache: Promise<string> | undefined;

/**
 * Hash descartável usado quando o e-mail não existe, para que o login gaste
 * o mesmo tempo com e sem usuário e não revele quais e-mails estão cadastrados.
 */
export function obterHashFalso(): Promise<string> {
  hashFalsoEmCache ??= hashSenha(randomBytes(16).toString('hex'));
  return hashFalsoEmCache;
}
