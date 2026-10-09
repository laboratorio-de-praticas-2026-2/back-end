import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { IsDateRangeValid } from '../validators/is-date-range-valid.validator.js';

export class CreateReportDto {
  @ApiProperty({
    description: 'Nome do relatório',
    example: 'Relatório Financeiro Mensal',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'Categoria do relatório',
    example: 'Financeiro',
  })
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiProperty({
    description: 'Descrição do relatório',
    example: 'Relatório financeiro referente ao mês de setembro.',
  })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({
    description: 'Data inicial do período do relatório',
    example: '2026-09-01',
  })
  @IsDateString()
  data_inicio: string;

  @ApiProperty({
    description: 'Data final do período do relatório',
    example: '2026-09-30',
  })
  @IsDateString()
  @IsDateRangeValid('data_inicio', {
    message: 'data_termino deve ser igual ou posterior a data_inicio',
  })
  data_termino: string;
}