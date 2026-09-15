import { Injectable } from '@nestjs/common';
import { ContatoService } from '../contato/contato.service.js';

@Injectable()
export class DisparoService {
  constructor(private readonly contatoService: ContatoService) {}

  dispararEmail() {
    const contato = this.contatoService.getContact();

    const disparoMock = {
      destinatario: contato.email,
      status: 'simulado',
      mensagem: 'Disparo de e-mail simulado com sucesso.',
    };

    return disparoMock;
  }
}