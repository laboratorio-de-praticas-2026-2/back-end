import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Usuario } from '../../models/usuario.model.js';
import type { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';

/** Usuário como o login o enxerga (inclui o hash; nunca sai pela API). */
export interface UsuarioAuth {
  id: number;
  nome: string;
  email: string;
  senhaHash: string;
  nivel: NivelUsuarioEnum;
}

export interface UsuarioAuthRepository {
  buscarPorEmail(email: string): Promise<UsuarioAuth | null>;
  buscarPorId(id: number): Promise<UsuarioAuth | null>;
}

export const USUARIO_AUTH_REPOSITORY = 'USUARIO_AUTH_REPOSITORY';

function paraUsuarioAuth(usuario: Usuario): UsuarioAuth {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    senhaHash: usuario.senha,
    nivel: usuario.nivel,
  };
}

/**
 * Usa o model `Usuario` (`src/models/usuario.model.ts`) — o mesmo model do
 * Cadastro PF (#50) e da listagem/edição de usuários (Administração) — para
 * que o login enxergue exatamente os mesmos usuários e o mesmo hash de senha
 * que o cadastro grava. Não deve existir outro model/tabela de usuário.
 */
@Injectable()
export class SequelizeUsuarioAuthRepository implements UsuarioAuthRepository {
  constructor(
    @InjectModel(Usuario) private readonly usuarioModel: typeof Usuario,
  ) {}

  async buscarPorEmail(email: string): Promise<UsuarioAuth | null> {
    // deletedAt não é gerenciado como "paranoid" pelo Sequelize aqui (é só
    // uma coluna), então o filtro precisa ser explícito: usuário com soft
    // delete não deve conseguir logar.
    const usuario = await this.usuarioModel.findOne({
      where: { email, deletedAt: null },
    });
    return usuario ? paraUsuarioAuth(usuario) : null;
  }

  async buscarPorId(id: number): Promise<UsuarioAuth | null> {
    const usuario = await this.usuarioModel.findOne({
      where: { id, deletedAt: null },
    });
    return usuario ? paraUsuarioAuth(usuario) : null;
  }
}
