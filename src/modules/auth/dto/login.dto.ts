import { BadRequestException } from '@nestjs/common';

export class LoginDto {
  email!: string;
  senha!: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_TAMANHO_MAXIMO = 254;
const SENHA_TAMANHO_MAXIMO = 128;

/**
 * Valida o corpo do POST /auth/login. Em caso de erro responde 400 com
 * `message` como lista de strings, o mesmo formato do ValidationPipe do Nest.
 */
export function validarLoginDto(body: unknown): LoginDto {
  const dados = (
    typeof body === 'object' && body !== null ? body : {}
  ) as Record<string, unknown>;
  const erros: string[] = [];

  const { email, senha } = dados;

  if (typeof email !== 'string' || email.trim() === '') {
    erros.push('email não pode estar vazio');
  } else if (
    email.trim().length > EMAIL_TAMANHO_MAXIMO ||
    !EMAIL_REGEX.test(email.trim())
  ) {
    erros.push('email deve ser um endereço de e-mail válido');
  }

  if (typeof senha !== 'string' || senha.length === 0) {
    erros.push('senha não pode estar vazia');
  } else if (senha.length > SENHA_TAMANHO_MAXIMO) {
    erros.push(`senha deve ter no máximo ${SENHA_TAMANHO_MAXIMO} caracteres`);
  }

  if (erros.length > 0) throw new BadRequestException(erros);

  return { email: (email as string).trim(), senha: senha as string };
}
