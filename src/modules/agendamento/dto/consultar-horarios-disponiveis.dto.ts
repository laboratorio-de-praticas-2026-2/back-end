import { Type } from 'class-transformer';
import { IsDateString, IsInt, Min } from 'class-validator';

export class ConsultarHorariosDisponiveisDto {
  @IsDateString({}, { message: 'data deve estar no formato YYYY-MM-DD' })
  data: string;

  @Type(() => Number)
  @IsInt({ message: 'tipo_atendimento_id deve ser um número inteiro' })
  @Min(1, { message: 'tipo_atendimento_id deve ser maior que zero' })
  tipo_atendimento_id: number;
}