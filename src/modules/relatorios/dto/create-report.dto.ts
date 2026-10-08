import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { IsDateRangeValid } from '../validators/is-date-range-valid.validator.js';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsDateString()
  data_inicio: string;

  @IsDateString()
  @IsDateRangeValid('data_inicio', {
    message: 'data_termino deve ser igual ou posterior a data_inicio',
  })
  data_termino: string;
}