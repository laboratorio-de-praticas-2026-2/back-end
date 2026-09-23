import { AssuntoMensagem } from "../enums/assunto-mensagem.enun.js";

export interface DisparoMensagem {
  destinatario: string;
  assunto: string;
  corpo: string;
  status: 'simulado';
}

export interface Mensagem {
  id: string;
  primeiroNome: string;
  ultimoNome: string;
  email: string;
  telefone?: string;
  assunto: AssuntoMensagem;
  mensagem: string;
  criadoEm: Date;
  disparo: DisparoMensagem;
}