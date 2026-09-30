import { IsOptional, IsString, IsIn } from 'class-validator';

export class AtualizarAgendamentoDto {
  @IsString()
  @IsIn(['confirmado', 'cancelado', 'remarcado'])
  status: string;

  @IsOptional()
  @IsString()
  nova_data?: string;

  @IsOptional()
  @IsString()
  novo_horario?: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}