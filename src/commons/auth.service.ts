import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { NivelUsuarioEnum } from './constantes/nivel-usuario-enum.js';

export interface JwtUserPayload {
  id: number;
  nivel: NivelUsuarioEnum;
  nome?: string;
  email?: string;
  /** Identificador único do token (usado para invalidá-lo no logout). */
  jti?: string;
  /** Expiração do token, em segundos desde epoch. */
  exp?: number;
}

export interface TokenEmitido {
  accessToken: string;
  /** Validade do token, em segundos. */
  expiresIn: number;
}

const EXPIRACAO_PADRAO_SEGUNDOS = 60 * 60;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  /** Falha na inicialização da aplicação se o segredo não estiver configurado. */
  onModuleInit(): void {
    void this.secret;
  }

  private get secret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET não configurado. Defina a variável no .env.');
    }
    return secret;
  }

  private get expiresIn(): number {
    const valor = Number(process.env.JWT_EXPIRES_IN);
    return Number.isFinite(valor) && valor > 0
      ? valor
      : EXPIRACAO_PADRAO_SEGUNDOS;
  }

  signToken(
    usuario: Pick<JwtUserPayload, 'id' | 'nivel' | 'nome' | 'email'>,
  ): TokenEmitido {
    const expiresIn = this.expiresIn;
    const accessToken = jwt.sign(
      {
        id: usuario.id,
        nivel: usuario.nivel,
        nome: usuario.nome,
        email: usuario.email,
      },
      this.secret,
      { algorithm: 'HS256', expiresIn, jwtid: randomUUID() },
    );
    return { accessToken, expiresIn };
  }

  verifyToken(token?: string): JwtUserPayload | null {
    if (!token) return null;

    const secret = this.secret;

    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
      if (typeof decoded === 'string') return null;

      const { id, nivel, jti } = decoded as Partial<JwtUserPayload>;
      if (
        typeof id !== 'number' ||
        typeof jti !== 'string' ||
        typeof nivel !== 'string' ||
        !Object.values(NivelUsuarioEnum).includes(nivel)
      ) {
        return null;
      }

      return decoded as JwtUserPayload;
    } catch {
      this.logger.debug('Token inválido ou expirado.');
      return null;
    }
  }
}
