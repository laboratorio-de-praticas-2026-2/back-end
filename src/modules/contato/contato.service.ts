
import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { UpdateContatoDto } from './dto/update-contato.dto.js';
import { CadastroPjDto } from './dto/cadastro-pj.dto.js';

import { Usuario } from './entities/usuario.entity.js';
import { Empresa } from './entities/empresa.entity.js';

import { hashPassword } from '../../commons/utils/crypto.js';

@Injectable()
export class ContatoService {
  constructor(
    @InjectModel(Usuario)
    private readonly usuarioModel: typeof Usuario,

    @InjectModel(Empresa)
    private readonly empresaModel: typeof Empresa,

    private readonly sequelize: Sequelize,
  ) {}

  private infoContact = {
    whatsapp: '00 00000-0000',
    telefone: '11 1111-1111',
    email: 'portalcontabil@gmail.com.br',
    endereco:
      'R. Tamekishi Takano, 713 - Centro, Registro - SP, 11900-000',
    horarioAtendimento:
      'Segunda a Sexta, das 08:00 às 11:30, 13:00 às 18:00',
  };

  async putContact(updateContatoDto: UpdateContatoDto) {
    this.infoContact = {
      ...this.infoContact,
      ...updateContatoDto,
    };

    return this.infoContact;
  }

  async getContact() {
    return this.infoContact;
  }

  // Validação do formato do CNPJ
  private validarCnpj(cnpj: string): boolean {
    if (!cnpj) {
      return false;
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '');

    return cnpjLimpo.length === 14;
  }

  // Validação da quantidade de números do CPF/CNPJ
  private validarCpfCnpj(doc: string): boolean {
    if (!doc) {
      return true;
    }

    const numeros = doc.replace(/\D/g, '');

    return numeros.length === 11 || numeros.length === 14;
  }

  // Validação básica do e-mail
  private validarEmail(email: string): boolean {
    if (!email) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Cadastro de cliente Pessoa Jurídica
  async cadastrarPj(dto: CadastroPjDto) {
    // 1. Validar campos obrigatórios
    if (
      !dto.nome ||
      !dto.email ||
      !dto.senha ||
      !dto.razaoSocial ||
      !dto.cnpj
    ) {
      throw new BadRequestException(
        'Preencha os campos obrigatórios (nome, e-mail, senha, razão social e CNPJ).',
      );
    }

    // 2. Normalizar os dados
    const emailNormalizado = dto.email.trim().toLowerCase();

    const cnpjLimpo = dto.cnpj.replace(/\D/g, '');

    const cpfCnpjRespLimpo = dto.cpf_cnpj
      ? dto.cpf_cnpj.replace(/\D/g, '')
      : null;

    // 3. Validar e-mail
    if (!this.validarEmail(emailNormalizado)) {
      throw new BadRequestException(
        'Formato de e-mail inválido.',
      );
    }

    // 4. Validar CNPJ da empresa
    if (!this.validarCnpj(cnpjLimpo)) {
      throw new BadRequestException(
        'Formato de CNPJ inválido.',
      );
    }

    // 5. Validar documento do responsável
    // A validação recebe o valor original do DTO,
    // evitando o conflito entre string e null.
    if (
      dto.cpf_cnpj &&
      !this.validarCpfCnpj(dto.cpf_cnpj)
    ) {
      throw new BadRequestException(
        'Formato de CPF/CNPJ do responsável inválido.',
      );
    }

    // 6. Verificar se o e-mail já está cadastrado
    const emailExiste = await this.usuarioModel.findOne({
      where: {
        email: emailNormalizado,
      },
    });

    if (emailExiste) {
      throw new ConflictException(
        'E-mail já cadastrado.',
      );
    }

    // 7. Verificar se o CNPJ já está cadastrado
    const cnpjExiste = await this.empresaModel.findOne({
      where: {
        cnpj: cnpjLimpo,
      },
    });

    if (cnpjExiste) {
      throw new ConflictException(
        'CNPJ já cadastrado.',
      );
    }

    // 8. Gerar hash da senha
    const senhaHash = await hashPassword(dto.senha);

    // 9. Criar usuário e empresa na mesma transação
    const resultado = await this.sequelize.transaction(
      async (transaction) => {
        // Criar usuário responsável
        const novoUsuario = await this.usuarioModel.create(
          {
            nome: dto.nome,
            email: emailNormalizado,
            senha: senhaHash,
            nivel: 'cliente',
            cpfCnpj: cpfCnpjRespLimpo,
            celular: dto.celular,
          },
          {
            transaction,
          },
        );

        // Criar empresa vinculada ao usuário
        const novaEmpresa = await this.empresaModel.create(
          {
            usuarioId: novoUsuario.id,
            razaoSocial: dto.razaoSocial,
            nomeFantasia: dto.nomeFantasia,
            cnpj: cnpjLimpo,
            regimeTributario:
              dto.regimeTributario || 'simples_nacional',
            inscricaoEstadual: dto.inscricaoEstadual,
            inscricaoMunicipal: dto.inscricaoMunicipal,
            dataAbertura: dto.dataAbertura
              ? new Date(dto.dataAbertura)
              : null,
          },
          {
            transaction,
          },
        );

        return {
          novoUsuario,
          novaEmpresa,
        };
      },
    );

    const usuarioPlain = resultado.novoUsuario.get({
      plain: true,
    });


    delete usuarioPlain.senha;

    return {
      mensagem: 'Cadastro PJ realizado com sucesso.',
      usuario: usuarioPlain,
      empresa: resultado.novaEmpresa,
    };
  }
}