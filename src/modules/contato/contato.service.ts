import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UpdateContatoDto } from './dto/update-contato.dto.js';
import { CadastroPjDto } from './dto/cadastro-pj.dto.js';
import * as crypto from 'crypto';

// Modelos do Sequelize
import { Usuario } from './entities/usuario.entity.js';
import { Empresa } from './entities/empresa.entity.js';

@Injectable()
export class ContatoService {
  constructor(
    @InjectModel(Usuario)
    private readonly usuarioModel: typeof Usuario,
    @InjectModel(Empresa)
    private readonly empresaModel: typeof Empresa,
  ) {}

  private infoContact = {
    whatsapp: '00 00000-0000',
    telefone: '11 1111-1111',
    email: 'portalcontabil@gmail.com.br',
    endereco: 'R. Tamekishi Takano, 713 - Centro, Registro - SP, 11900-000',
    horarioAtendimento: 'Segunda a Sexta, das 08:00 ás 11:30, 13:00 ás 18:00',
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

  private validarCnpj(cnpj: string): boolean {
    return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$\vert{}^\d{14}$/.test(cnpj);
  }

  private validarCpfCnpj(doc: string): boolean {
    if (!doc) return true;
    const numeros = doc.replace(/\D/g, '');
    return numeros.length === 11 || numeros.length === 14;
  }

  private validarEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async cadastrarPj(dto: CadastroPjDto) {
    if (!dto.nome || !dto.email || !dto.senha || !dto.razaoSocial || !dto.cnpj) {
      throw new BadRequestException('Preencha os campos obrigatórios (nome, e-mail, senha, razão social e CNPJ).');
    }

    if (!this.validarEmail(dto.email)) {
      throw new BadRequestException('Formato de e-mail inválido.');
    }

    if (!this.validarCnpj(dto.cnpj)) {
      throw new BadRequestException('Formato de CNPJ inválido.');
    }

    if (dto.cpf_cnpj && !this.validarCpfCnpj(dto.cpf_cnpj)) {
      throw new BadRequestException('Formato de CPF/CNPJ do responsável inválido.');
    }

    const cnpjLimpo = dto.cnpj.replace(/\D/g, '');
    const cpfCnpjRespLimpo = dto.cpf_cnpj ? dto.cpf_cnpj.replace(/\D/g, '') : null;

    // 1. Busca no Banco de Dados via Sequelize
    const emailExiste = await this.usuarioModel.findOne({ where: { email: dto.email } });
    if (emailExiste) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const cnpjExiste = await this.empresaModel.findOne({ where: { cnpj: cnpjLimpo } });
    if (cnpjExiste) {
      throw new ConflictException('CNPJ já cadastrado.');
    }

    // 2. Hash seguro de senha usando o módulo nativo crypto (pbkdf2)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(dto.senha, salt, 1000, 64, 'sha512').toString('hex');
    const senhaHash = `${salt}:${hash}`;

    // 3. Persistência real no Banco de Dados via Sequelize
    const novoUsuario = await this.usuarioModel.create({
      nome: dto.nome,
      email: dto.email,
      senha: senhaHash,
      nivel: 'cliente',
      cpfCnpj: cpfCnpjRespLimpo,
      celular: dto.celular,
    });

    const novaEmpresa = await this.empresaModel.create({
      usuarioId: novoUsuario.id,
      razaoSocial: dto.razaoSocial,
      nomeFantasia: dto.nomeFantasia,
      cnpj: cnpjLimpo,
      regimeTributario: dto.regimeTributario || 'simples_nacional',
      inscricaoEstadual: dto.inscricaoEstadual,
      inscricaoMunicipal: dto.inscricaoMunicipal,
      dataAbertura: dto.dataAbertura ? new Date(dto.dataAbertura) : null,
    });

    const usuarioPlain = novoUsuario.get({ plain: true });
    delete usuarioPlain.senha;

    return {
      mensagem: 'Cadastro PJ realizado com sucesso.',
      usuario: usuarioPlain,
      empresa: novaEmpresa,
    };
  }
}