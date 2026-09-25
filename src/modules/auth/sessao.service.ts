import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../commons/auth.service.js';
import type { JwtUserPayload } from '../../commons/auth.service.js';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import type { LoginDto } from './dto/login.dto.js';
import type { LoginResponse, UsuarioPublico } from './auth.types.js';
import { obterHashFalso, verificarSenha } from './password.util.js';
import { TokenDenylistService } from './token-denylist.service.js';
import { USUARIO_AUTH_REPOSITORY } from './usuario-auth.repository.js';
import type {
  UsuarioAuth,
  UsuarioAuthRepository,
} from './usuario-auth.repository.js';

export const MENSAGEM_CREDENCIAIS_INVALIDAS = 'Credenciais inválidas';
export const MENSAGEM_NAO_AUTENTICADO = 'Não autenticado';

function paraUsuarioPublico(usuario: UsuarioAuth): UsuarioPublico {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    nivel: usuario.nivel,
  };
}

@Injectable()
export class SessaoService {
  private readonly logger = new Logger(SessaoService.name);

  constructor(
    @Inject(USUARIO_AUTH_REPOSITORY)
    private readonly usuarios: UsuarioAuthRepository,
    @Inject(AuthService) private readonly tokens: AuthService,
    @Inject(TokenDenylistService)
    private readonly denylist: TokenDenylistService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const email = dto.email.trim().toLowerCase();
    const usuario = await this.usuarios.buscarPorEmail(email);

    // Sempre compara uma senha, mesmo sem usuário, para não vazar por tempo de resposta.
    const hash = usuario?.senhaHash ?? (await obterHashFalso());
    const senhaConfere = await verificarSenha(dto.senha, hash);

    if (!usuario || !senhaConfere) {
      throw new UnauthorizedException(MENSAGEM_CREDENCIAIS_INVALIDAS);
    }

    if (!Object.values(NivelUsuarioEnum).includes(usuario.nivel)) {
      this.logger.warn(`Usuário ${usuario.id} com nível desconhecido.`);
      throw new UnauthorizedException(MENSAGEM_CREDENCIAIS_INVALIDAS);
    }

    const publico = paraUsuarioPublico(usuario);
    const { accessToken, expiresIn } = this.tokens.signToken(publico);

    return { accessToken, tokenType: 'Bearer', expiresIn, usuario: publico };
  }

  async me(idUsuario: number): Promise<UsuarioPublico> {
    const usuario = await this.usuarios.buscarPorId(idUsuario);
    if (!usuario) throw new UnauthorizedException(MENSAGEM_NAO_AUTENTICADO);
    return paraUsuarioPublico(usuario);
  }

  logout(payload: JwtUserPayload): void {
    if (payload.jti && payload.exp) {
      this.denylist.revogar(payload.jti, payload.exp);
    }
  }
}
