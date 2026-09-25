import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { UpdateContatoDto } from './dto/update-contato.dto.js';
import { CadastroPjDto } from './dto/cadastro-pj.dto.js';
import * as crypto from 'crypto';

@Injectable()
export class ContatoService {
  private usuarios: any[] = [];
  private empresas: any[] = [];

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

  private hashSenha(senha: string): string {
    return crypto.createHash('sha256').update(senha).digest('hex');
  }

  private validarCnpj(cnpj: string): boolean {
    return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/.test(cnpj);
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

    const emailExiste = this.usuarios.find((u) => u.email === dto.email);
    if (emailExiste) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const cnpjExiste = this.empresas.find((e) => e.cnpj === cnpjLimpo);
    if (cnpjExiste) {
      throw new ConflictException('CNPJ já cadastrado.');
    }

    const senhaHash = this.hashSenha(dto.senha);

    const novoUsuario = {
      id: this.usuarios.length + 1,
      nome: dto.nome,
      email: dto.email,
      senha: senhaHash,
      nivel: 'cliente',
      cpfCnpj: cpfCnpjRespLimpo,
      celular: dto.celular,
      createdAt: new Date(),
    };

    const novaEmpresa = {
      id: this.empresas.length + 1,
      usuarioId: novoUsuario.id,
      razaoSocial: dto.razaoSocial,
      nomeFantasia: dto.nomeFantasia,
      cnpj: cnpjLimpo,
      regimeTributario: dto.regimeTributario || 'simples_nacional',
      inscricaoEstadual: dto.inscricaoEstadual,
      inscricaoMunicipal: dto.inscricaoMunicipal,
      dataAbertura: dto.dataAbertura ? new Date(dto.dataAbertura) : null,
      createdAt: new Date(),
    };

    this.usuarios.push(novoUsuario);
    this.empresas.push(novaEmpresa);

   const { senha: _senha, ...usuarioSemSenha } = novoUsuario;

    return {
      mensagem: 'Cadastro PJ realizado com sucesso.',
      usuario: usuarioSemSenha,
      empresa: novaEmpresa,
    };
  }
}