import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';
import { UpdateUsuarioAdminDto } from './dto/update-usuario-admin.dto.js';

interface UsuarioRow {
  id: number;
  nome: string;
  email: string;
  nivel: string;
  cpfCnpj: string | null;
  celular: string | null;
  empresaId: number | null;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  cnpj: string | null;
  regimeTributario: string | null;
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;
  dataAbertura: Date | null;
}

@Injectable()
export class AdministracaoService {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async listarUsuarios() {
    const rows = await this.buscarUsuarios();
    return rows.map((row) => this.toResponse(row));
  }

  async buscarUsuario(id: number) {
    const rows = await this.buscarUsuarios('u.id = :id', { id });
    const row = rows[0];
    if (!row) throw new NotFoundException('Usuário não encontrado.');
    return this.toResponse(row);
  }

  async atualizarUsuario(id: number, dto: UpdateUsuarioAdminDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Informe ao menos um campo para atualização.');
    }

    const atual = await this.buscarUsuario(id);
    const email = dto.email?.trim().toLowerCase();
    const cpfCnpj = dto.cpfCnpj ? dto.cpfCnpj.replace(/\D/g, '') : dto.cpfCnpj;
    const cnpj = dto.cnpj ? dto.cnpj.replace(/\D/g, '') : dto.cnpj;

    if (email && email !== atual.email) {
      const duplicado = await this.sequelize.query<{ id: number }>(
        'SELECT id FROM usuario WHERE email = :email AND id <> :id LIMIT 1',
        { replacements: { email, id }, type: QueryTypes.SELECT },
      );
      if (duplicado.length) throw new ConflictException('E-mail já cadastrado.');
    }

    if (cpfCnpj && cpfCnpj !== atual.cpfCnpj) {
      const duplicado = await this.sequelize.query<{ id: number }>(
        'SELECT id FROM usuario WHERE cpf_cnpj = :cpfCnpj AND id <> :id LIMIT 1',
        { replacements: { cpfCnpj, id }, type: QueryTypes.SELECT },
      );
      if (duplicado.length) throw new ConflictException('CPF/CNPJ já cadastrado.');
    }

    const isPj = atual.tipo === 'PJ';
    const hasEmpresaFields = [
      dto.razaoSocial,
      dto.nomeFantasia,
      dto.cnpj,
      dto.regimeTributario,
      dto.inscricaoEstadual,
      dto.inscricaoMunicipal,
    ].some((value) => value !== undefined);

    if (hasEmpresaFields && !isPj) {
      throw new BadRequestException('Dados de empresa só podem ser alterados para usuários PJ.');
    }

    if (cnpj && isPj && cnpj !== (atual as any).empresa?.cnpj) {
      const duplicado = await this.sequelize.query<{ id: number }>(
        'SELECT id FROM empresas WHERE cnpj = :cnpj AND usuarioId <> :id LIMIT 1',
        { replacements: { cnpj, id }, type: QueryTypes.SELECT },
      );
      if (duplicado.length) throw new ConflictException('CNPJ já cadastrado.');
    }

    const usuarioUpdates: Record<string, unknown> = {};
    if (dto.nome !== undefined) usuarioUpdates.nome = dto.nome.trim();
    if (email !== undefined) usuarioUpdates.email = email;
    if (dto.celular !== undefined) usuarioUpdates.celular = dto.celular?.trim() || null;
    if (dto.cpfCnpj !== undefined) usuarioUpdates.cpf_cnpj = cpfCnpj || null;

    if (Object.keys(usuarioUpdates).length) {
      const sets = Object.keys(usuarioUpdates).map((key) => `\`${key}\` = :${key}`);
      await this.sequelize.query(
        `UPDATE usuario SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
        { replacements: { ...usuarioUpdates, id }, type: QueryTypes.UPDATE },
      );
    }

    if (isPj && hasEmpresaFields) {
      const empresaUpdates: Record<string, unknown> = {};
      if (dto.razaoSocial !== undefined) empresaUpdates.razaoSocial = dto.razaoSocial.trim();
      if (dto.nomeFantasia !== undefined) empresaUpdates.nomeFantasia = dto.nomeFantasia?.trim() || null;
      if (cnpj !== undefined) empresaUpdates.cnpj = cnpj;
      if (dto.regimeTributario !== undefined) empresaUpdates.regimeTributario = dto.regimeTributario.trim();
      if (dto.inscricaoEstadual !== undefined) empresaUpdates.inscricaoEstadual = dto.inscricaoEstadual?.trim() || null;
      if (dto.inscricaoMunicipal !== undefined) empresaUpdates.inscricaoMunicipal = dto.inscricaoMunicipal?.trim() || null;

      const sets = Object.keys(empresaUpdates).map((key) => `\`${key}\` = :${key}`);
      if (sets.length) {
        await this.sequelize.query(
          `UPDATE empresas SET ${sets.join(', ')} WHERE usuarioId = :id`,
          { replacements: { ...empresaUpdates, id }, type: QueryTypes.UPDATE },
        );
      }
    }

    return this.buscarUsuario(id);
  }

  private async buscarUsuarios(where?: string, replacements?: Record<string, unknown>) {
    const sql = `
      SELECT
        u.id,
        u.nome,
        u.email,
        u.nivel,
        u.cpf_cnpj AS cpfCnpj,
        u.celular,
        e.id AS empresaId,
        e.razaoSocial AS razaoSocial,
        e.nomeFantasia AS nomeFantasia,
        e.cnpj,
        e.regimeTributario AS regimeTributario,
        e.inscricaoEstadual AS inscricaoEstadual,
        e.inscricaoMunicipal AS inscricaoMunicipal,
        e.dataAbertura AS dataAbertura
      FROM usuario u
      LEFT JOIN empresas e ON e.usuarioId = u.id
      ${where ? `WHERE ${where}` : ''}
      ORDER BY u.id
    `;
    return this.sequelize.query<UsuarioRow>(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });
  }

  private toResponse(row: UsuarioRow) {
    const tipo = row.empresaId ? 'PJ' : 'PF';
    const response: Record<string, unknown> = {
      id: row.id,
      tipo,
      nome: row.nome,
      email: row.email,
      nivel: row.nivel,
      cpfCnpj: row.cpfCnpj,
      celular: row.celular,
    };

    if (row.empresaId) {
      response.empresa = {
        id: row.empresaId,
        razaoSocial: row.razaoSocial,
        nomeFantasia: row.nomeFantasia,
        cnpj: row.cnpj,
        regimeTributario: row.regimeTributario,
        inscricaoEstadual: row.inscricaoEstadual,
        inscricaoMunicipal: row.inscricaoMunicipal,
        dataAbertura: row.dataAbertura,
      };
    }

    return response;
  }
}
