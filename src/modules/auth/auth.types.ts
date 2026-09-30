import type { Request } from 'express';
import type { JwtUserPayload } from '../../commons/auth.service.js';
import type { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';

/** Dados do usuário que podem sair pela API. Nunca inclui senha ou hash. */
export interface UsuarioPublico {
  id: number;
  nome: string;
  email: string;
  nivel: NivelUsuarioEnum;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  /** Validade do token, em segundos. */
  expiresIn: number;
  usuario: UsuarioPublico;
}

export type RequestAutenticada = Request & { user?: JwtUserPayload };
