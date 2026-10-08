import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AssuntoMensagem } from '../enums/assunto-mensagem.enun.js';

export class CreateMensagemDto {
  @IsString()
  @IsNotEmpty()
  primeiroNome: string;
  @IsString()
  @IsNotEmpty()
  ultimoNome: string;
  @IsEmail()
  email: string;
  @IsOptional()
  @IsString()
  telefone?: string;
  @IsEnum(AssuntoMensagem)
  assunto: AssuntoMensagem;
  @IsString()
  @IsNotEmpty()
  mensagem: string;
}
