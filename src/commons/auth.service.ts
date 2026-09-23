import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface JwtUserPayload {
  id: number;
  nivel: string;
  nome?: string;
  email?: string;
}

@Injectable()
export class AuthService {
  private JWT_SECRET: string | undefined = process.env.JWT_SECRET;

  private readonly logger = new Logger(AuthService.name);

  verifyToken(token?: string): JwtUserPayload | null {
    this.logger.log('Verificando token');

    if (!token) return null;

    if (!this.JWT_SECRET) return null;

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtUserPayload;
      return decoded;
    } catch {
      return null;
    }
  }
}