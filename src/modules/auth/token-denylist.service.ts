import { Injectable } from '@nestjs/common';

/**
 * Lista de tokens invalidados pelo logout (guarda o `jti` até o token expirar).
 *
 * Fica em memória: vale para uma única instância da API e é zerada ao
 * reiniciar. Com várias instâncias, troque por Redis/banco mantendo esta interface.
 */
@Injectable()
export class TokenDenylistService {
  private readonly revogados = new Map<string, number>();

  /** `exp` em segundos desde epoch, como no claim do JWT. */
  revogar(jti: string, exp: number): void {
    this.limparExpirados();
    this.revogados.set(jti, exp);
  }

  estaRevogado(jti: string): boolean {
    const exp = this.revogados.get(jti);
    if (exp === undefined) return false;
    if (exp * 1000 <= Date.now()) {
      this.revogados.delete(jti);
      return false;
    }
    return true;
  }

  private limparExpirados(): void {
    const agora = Date.now();
    for (const [jti, exp] of this.revogados) {
      if (exp * 1000 <= agora) this.revogados.delete(jti);
    }
  }
}
