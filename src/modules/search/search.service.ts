import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { UserRole } from '../../commons/decorators/current-role.decorator.js';
import {
  classifyDocument,
  isValidCNPJ,
  isValidCPF,
  onlyDigits,
} from '../../commons/validators/document.validator.js';
import { Empresa } from '../../models/empresa.model.js';
import { Usuario } from '../../models/usuario.model.js';
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

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Usuario) private readonly usuarioModel: typeof Usuario,
    @InjectModel(Empresa) private readonly empresaModel: typeof Empresa,
  ) {}

  async searchByDocument(rawDoc: string | undefined, role: UserRole) {
    if (!rawDoc?.trim()) {
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
        include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }],
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
}
