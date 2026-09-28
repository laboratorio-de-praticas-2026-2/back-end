import {IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ClienteDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  telefone: string;
}

export class CriarAgendamentoDto {
  @ValidateNested()
  @Type(() => ClienteDto)
  cliente: ClienteDto;

  @IsNumber()
  tipo_atendimento_id: number;

  @IsDateString()
  data_agendamento: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'O horário deve estar no formato HH:mm',
  })
  horario: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}