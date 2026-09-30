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
    return this.agrupar(rows);
  }

  async buscarUsuario(id: number) {
    const rows = await this.buscarUsuarios('u.id = :id', { id });
    const row = rows[0];
    if (!row) throw new NotFoundException('Usuário não encontrado.');
    return this.agrupar(rows)[0];
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
    const empresa = atual.empresas.find(e => e.id === dto.empresaId);
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

    if (hasEmpresaFields && !empresa) throw new BadRequestException('Selecione uma empresa vinculada ao usuário.');

    if (cnpj && isPj && cnpj !== empresa?.cnpj) {
      const duplicado = await this.sequelize.query<{ id: number }>(
        'SELECT id FROM empresa WHERE cnpj = :cnpj AND id <> :empresaId LIMIT 1',
        { replacements: { cnpj, empresaId: dto.empresaId }, type: QueryTypes.SELECT },
      );
      if (duplicado.length) throw new ConflictException('CNPJ já cadastrado.');
    }

    const usuarioUpdates: Record<string, unknown> = {};
    if (dto.nome !== undefined) usuarioUpdates.nome = dto.nome.trim();
    if (email !== undefined) usuarioUpdates.email = email;
    if (dto.celular !== undefined) usuarioUpdates.celular = dto.celular?.trim() || null;
    if (dto.cpfCnpj !== undefined) usuarioUpdates.cpf_cnpj = cpfCnpj || null;

    await this.sequelize.transaction(async transaction => {
    if (Object.keys(usuarioUpdates).length) {
      const sets = Object.keys(usuarioUpdates).map((key) => `\`${key}\` = :${key}`);
      await this.sequelize.query(
        `UPDATE usuario SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
        { replacements: { ...usuarioUpdates, id }, type: QueryTypes.UPDATE, transaction },
      );
    }

    if (isPj && hasEmpresaFields) {
      const empresaUpdates: Record<string, unknown> = {};
      if (dto.razaoSocial !== undefined) empresaUpdates.razao_social = dto.razaoSocial.trim();
      if (dto.nomeFantasia !== undefined) empresaUpdates.nome_fantasia = dto.nomeFantasia?.trim() || null;
      if (cnpj !== undefined) empresaUpdates.cnpj = cnpj;
      if (dto.regimeTributario !== undefined) empresaUpdates.regime_tributario = dto.regimeTributario.trim();
      if (dto.inscricaoEstadual !== undefined) empresaUpdates.inscricao_estadual = dto.inscricaoEstadual?.trim() || null;
      if (dto.inscricaoMunicipal !== undefined) empresaUpdates.inscricao_municipal = dto.inscricaoMunicipal?.trim() || null;

      const sets = Object.keys(empresaUpdates).map((key) => `\`${key}\` = :${key}`);
      if (sets.length) {
        await this.sequelize.query(
          `UPDATE empresa SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE usuario_id = :id AND id = :empresaId`,
          { replacements: { ...empresaUpdates, id, empresaId: dto.empresaId }, type: QueryTypes.UPDATE, transaction },
        );
      }
    }

    });
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
        e.razao_social AS razaoSocial,
        e.nome_fantasia AS nomeFantasia,
        e.cnpj,
        e.regime_tributario AS regimeTributario,
        e.inscricao_estadual AS inscricaoEstadual,
        e.inscricao_municipal AS inscricaoMunicipal,
        e.data_abertura AS dataAbertura
      FROM usuario u
      LEFT JOIN empresa e ON e.usuario_id = u.id AND e.deleted_at IS NULL
      WHERE u.deleted_at IS NULL AND u.nivel = 'cliente' ${where ? `AND ${where}` : ''}
      ORDER BY u.id
    `;
    return this.sequelize.query<UsuarioRow>(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });
  }

  private agrupar(rows: UsuarioRow[]) {
    const users = new Map<number, {id:number; nome:string; email:string; nivel:string; cpfCnpj:string|null; celular:string|null; tipo:string; empresas: Array<{id:number; razaoSocial:string|null; nomeFantasia:string|null; cnpj:string|null; regimeTributario:string|null; inscricaoEstadual:string|null; inscricaoMunicipal:string|null}>}>();
    for (const row of rows) {
      let u = users.get(row.id);
      if (!u) { u = {id:row.id, nome:row.nome, email:row.email, nivel:row.nivel, cpfCnpj:row.cpfCnpj, celular:row.celular, tipo:'PF', empresas:[]}; users.set(row.id,u); }
      if(row.empresaId) { u.tipo='PJ'; u.empresas.push({id:row.empresaId,razaoSocial:row.razaoSocial,nomeFantasia:row.nomeFantasia,cnpj:row.cnpj,regimeTributario:row.regimeTributario,inscricaoEstadual:row.inscricaoEstadual,inscricaoMunicipal:row.inscricaoMunicipal}); }
    }
    return [...users.values()];
  }
}
