import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';
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

/**
 * ATENÇÃO: nomes de tabela/colunas abaixo são uma SUPOSIÇÃO enquanto a
 * estrutura definitiva de `Usuario` (issues de Cadastro PF/PJ) não existe.
 * Ajuste só este objeto quando o schema for definido.
 */
const USUARIOS = {
  tabela: 'usuarios',
  id: 'id',
  nome: 'nome',
  email: 'email',
  senhaHash: 'senha',
  nivel: 'nivel',
} as const;

const COLUNAS_SELECT = `${USUARIOS.id} AS id, ${USUARIOS.nome} AS nome, ${USUARIOS.email} AS email, ${USUARIOS.senhaHash} AS senhaHash, ${USUARIOS.nivel} AS nivel`;

@Injectable()
export class SequelizeUsuarioAuthRepository implements UsuarioAuthRepository {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async buscarPorEmail(email: string): Promise<UsuarioAuth | null> {
    return this.buscarUm(`${USUARIOS.email} = :valor`, email);
  }

  async buscarPorId(id: number): Promise<UsuarioAuth | null> {
    return this.buscarUm(`${USUARIOS.id} = :valor`, id);
  }

  private async buscarUm(
    condicao: string,
    valor: string | number,
  ): Promise<UsuarioAuth | null> {
    const linhas = await this.sequelize.query<UsuarioAuth>(
      `SELECT ${COLUNAS_SELECT} FROM ${USUARIOS.tabela} WHERE ${condicao} LIMIT 1`,
      { replacements: { valor }, type: QueryTypes.SELECT },
    );
    return linhas[0] ?? null;
  }
}
