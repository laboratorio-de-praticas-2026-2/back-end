import { AssuntoMensagem } from "../enums/assunto-mensagem.enun.js";

export class CreateMensagemDto {
  primeiroNome: string;
  ultimoNome: string;
  email: string;
  telefone?: string;
  assunto: AssuntoMensagem;
  mensagem: string;
}