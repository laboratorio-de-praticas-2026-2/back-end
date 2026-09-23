import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import type { UserRole } from '../../commons/decorators/current-role.decorator.js';
import {
  classifyDocument,
  isValidCNPJ,
  isValidCPF,
  onlyDigits,
} from '../../commons/validators/document.validator.js';
import { Empresa } from '../../models/empresa.model.js';
import { Usuario } from '../../models/usuario.model.js';
import type { AdvancedSearchQueryDto } from './dto/advanced-search-query.dto.js';
import { presentEmpresa, presentUsuario } from './presenters/search-result.presenter.js';

const USUARIO_ATTRIBUTES = ['id', 'nome', 'email', 'celular', 'cpfCnpj', 'dataCadastro'];
const EMPRESA_ATTRIBUTES = [
  'id',
  'razaoSocial',
  'nomeFantasia',
  'cnpj',
  'regimeTributario',
  'dataAbertura',
  'inscricaoEstadual',
  'inscricaoMunicipal',
];
const REGIMES_TRIBUTARIOS = ['mei', 'simples_nacional', 'lucro_presumido', 'lucro_real'] as const;

function escapeLikeValue(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Usuario) private readonly usuarioModel: typeof Usuario,
    @InjectModel(Empresa) private readonly empresaModel: typeof Empresa,
  ) {}

  async searchByDocument(rawDoc: string | undefined, role: UserRole) {
    if (role !== NivelUsuarioEnum.administrador) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }

    if (typeof rawDoc !== 'string' || !rawDoc.trim()) {
      throw new BadRequestException('Informe um CPF ou CNPJ para busca.');
    }

    const type = classifyDocument(rawDoc);

    if (type === 'cpf') {
      if (!isValidCPF(rawDoc)) {
        throw new BadRequestException('CPF inválido.');
      }

      const usuario = await this.usuarioModel.findOne({
        where: { cpfCnpj: onlyDigits(rawDoc) },
        attributes: USUARIO_ATTRIBUTES,
        include: [{ model: Empresa, as: 'empresas', attributes: EMPRESA_ATTRIBUTES }],
      });

      if (!usuario) {
        return {
          found: false as const,
          message: 'Nenhum resultado encontrado para o documento informado.',
        };
      }

      return {
        found: true as const,
        tipo: 'pessoa_fisica' as const,
        data: presentUsuario(usuario.toJSON(), role),
      };
    }

    if (type === 'cnpj') {
      if (!isValidCNPJ(rawDoc)) {
        throw new BadRequestException('CNPJ inválido.');
      }

      const empresa = await this.empresaModel.findOne({
        where: { cnpj: onlyDigits(rawDoc) },
        attributes: EMPRESA_ATTRIBUTES,
        include: [
          { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'], required: true },
        ],
      });

      if (!empresa) {
        return {
          found: false as const,
          message: 'Nenhum resultado encontrado para o documento informado.',
        };
      }

      return {
        found: true as const,
        tipo: 'pessoa_juridica' as const,
        data: presentEmpresa(empresa.toJSON(), role),
      };
    }

    throw new BadRequestException(
      'Documento inválido: informe um CPF (11 dígitos) ou CNPJ (14 dígitos).',
    );
  }

  async advancedSearch(query: AdvancedSearchQueryDto, role: UserRole) {
    if (role !== NivelUsuarioEnum.administrador) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }

    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(query.pageSize ?? '20', 10) || 20));
    const where = await this.buildWhere(query);

    const { count, rows } = await this.usuarioModel.findAndCountAll({
      where,
      attributes: USUARIO_ATTRIBUTES,
      include: [{ model: Empresa, as: 'empresas', attributes: EMPRESA_ATTRIBUTES }],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      distinct: true,
      order: [['id', 'ASC']],
    });

    return {
      total: count,
      page,
      pageSize,
      results: rows.map((usuario) => presentUsuario(usuario.toJSON(), role)),
    };
  }

  private async buildWhere(query: AdvancedSearchQueryDto): Promise<WhereOptions> {
    const and: WhereOptions[] = [];

    if (typeof query.nome === 'string' && query.nome.trim()) {
      const nome = escapeLikeValue(query.nome.trim());
      const empresasComNome = await this.empresaModel.findAll({
        where: {
          [Op.or]: [
            { razaoSocial: { [Op.like]: `%${nome}%` } },
            { nomeFantasia: { [Op.like]: `%${nome}%` } },
          ],
        },
        attributes: ['usuarioId'],
      });
      const usuarioIds = empresasComNome.map((empresa) => empresa.usuarioId);
      and.push({
        [Op.or]: [
          { nome: { [Op.like]: `%${nome}%` } },
          { id: { [Op.in]: usuarioIds.length > 0 ? usuarioIds : [-1] } },
        ],
      });
    }

    if (typeof query.cpfCnpj === 'string' && query.cpfCnpj.trim()) {
      const digits = onlyDigits(query.cpfCnpj);
      const empresasComCnpj = await this.empresaModel.findAll({
        where: { cnpj: { [Op.like]: `%${digits}%` } },
        attributes: ['usuarioId'],
      });
      const usuarioIds = empresasComCnpj.map((empresa) => empresa.usuarioId);
      and.push({
        [Op.or]: [
          { cpfCnpj: { [Op.like]: `%${digits}%` } },
          { id: { [Op.in]: usuarioIds.length > 0 ? usuarioIds : [-1] } },
        ],
      });
    }

    if (query.regimeTributario) {
      if (!(REGIMES_TRIBUTARIOS as readonly string[]).includes(query.regimeTributario)) {
        throw new BadRequestException(
          `regimeTributario inválido. Valores aceitos: ${REGIMES_TRIBUTARIOS.join(', ')}.`,
        );
      }

      const empresasDoRegime = await this.empresaModel.findAll({
        where: { regimeTributario: query.regimeTributario as (typeof REGIMES_TRIBUTARIOS)[number] },
        attributes: ['usuarioId'],
      });
      const usuarioIds = empresasDoRegime.map((empresa) => empresa.usuarioId);
      and.push({ id: { [Op.in]: usuarioIds.length > 0 ? usuarioIds : [-1] } });
    }

    if (query.possuiEmpresa !== undefined) {
      if (query.possuiEmpresa !== 'true' && query.possuiEmpresa !== 'false') {
        throw new BadRequestException("possuiEmpresa deve ser 'true' ou 'false'.");
      }

      const todasAsEmpresas = await this.empresaModel.findAll({ attributes: ['usuarioId'] });
      const usuarioIdsComEmpresa = [...new Set(todasAsEmpresas.map((empresa) => empresa.usuarioId))];

      if (query.possuiEmpresa === 'true') {
        and.push({ id: { [Op.in]: usuarioIdsComEmpresa.length > 0 ? usuarioIdsComEmpresa : [-1] } });
      } else {
        and.push({
          id: { [Op.notIn]: usuarioIdsComEmpresa.length > 0 ? usuarioIdsComEmpresa : [-1] },
        });
      }
    }

    if (query.dataCadastroInicio || query.dataCadastroFim) {
      const range: Record<symbol, Date> = {};

      if (query.dataCadastroInicio) {
        const inicio = new Date(query.dataCadastroInicio);
        if (Number.isNaN(inicio.getTime())) {
          throw new BadRequestException('dataCadastroInicio inválida.');
        }
        range[Op.gte] = inicio;
      }

      if (query.dataCadastroFim) {
        const fim = new Date(query.dataCadastroFim);
        if (Number.isNaN(fim.getTime())) {
          throw new BadRequestException('dataCadastroFim inválida.');
        }
        fim.setUTCHours(23, 59, 59, 999);
        range[Op.lte] = fim;
      }

      and.push({ dataCadastro: range });
    }

    return and.length > 0 ? { [Op.and]: and } : {};
  }
}
