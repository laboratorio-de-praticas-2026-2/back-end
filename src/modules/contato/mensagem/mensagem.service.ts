import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ContatoService } from '../contato.service.js';
import { CreateMensagemDto } from './dto/create-mensagem.dto.js';
import { AssuntoMensagem } from './enums/assunto-mensagem.enun.js';
import { Mensagem, DisparoMensagem } from './interfaces/mensagem.inteface.js';

@Injectable()
export class MensagemService {
  private historico: Mensagem[] = [];

  constructor(private readonly contatoService: ContatoService) {}

  async criarMensagem(dto: CreateMensagemDto): Promise<Mensagem> {
    this.validarMensagem(dto);

    const criadoEm = new Date(); 

    const contato = await this.contatoService.getContact();

    const disparo = this.dispararEmail(dto, contato.email, criadoEm);

    const novaMensagem: Mensagem = {
      id: randomUUID(),
      primeiroNome: dto.primeiroNome,
      ultimoNome: dto.ultimoNome,
      email: dto.email,
      telefone: dto.telefone,
      assunto: dto.assunto,
      mensagem: dto.mensagem,
      criadoEm,
      disparo,
    };

    this.historico.push(novaMensagem);

    return novaMensagem;
  }

  async listarHistorico(): Promise<Mensagem[]> {
    return this.historico;
  }

  private validarMensagem(dto: CreateMensagemDto): void {
    if (!dto.primeiroNome?.trim()) {
      throw new BadRequestException('Primeiro nome é obrigatório.');
    }
    if (!dto.ultimoNome?.trim()) {
      throw new BadRequestException('Último nome é obrigatório.');
    }
    if (!dto.email?.trim() || !dto.email.includes('@')) {
      throw new BadRequestException('E-mail válido é obrigatório.');
    }
    if (!dto.assunto || !Object.values(AssuntoMensagem).includes(dto.assunto)) {
      throw new BadRequestException(
        `Assunto inválido. Valores aceitos: ${Object.values(AssuntoMensagem).join(', ')}.`,
      );
    }
    if (!dto.mensagem?.trim()) {
      throw new BadRequestException('Mensagem é obrigatória.');
    }
  }

  private dispararEmail(
    dto: CreateMensagemDto,
    destinatario: string,
    criadoEm: Date,
  ): DisparoMensagem {
    const corpo =
      `Nova mensagem de contato recebida em ${criadoEm.toISOString()}\n\n` +
      `Nome: ${dto.primeiroNome} ${dto.ultimoNome}\n` +
      `E-mail: ${dto.email}\n` +
      `Telefone: ${dto.telefone ?? 'não informado'}\n` +
      `Assunto: ${dto.assunto}\n\n` +
      `Mensagem:\n${dto.mensagem}`;

    return {
      destinatario,
      assunto: `Novo contato - ${dto.assunto}`,
      corpo,
      status: 'simulado',
    };
  }
}