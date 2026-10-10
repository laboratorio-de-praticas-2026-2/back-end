import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsDateRangeValid } from '../validators/is-date-range-valid.validator.js';

export class FindReportsDto {
  @ApiPropertyOptional({
    description: 'Filtra pelo nome do relatório',
    example: 'Relatório Financeiro Mensal',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: 'Filtra pela categoria do relatório',
    example: 'Financeiro',
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({
    description: 'Filtra pelo status do relatório',
    enum: ['PENDENTE', 'GERADO', 'FALHA'],
    example: 'GERADO',
  })
  @IsOptional()
  @IsEnum(['PENDENTE', 'GERADO', 'FALHA'])
  status?: 'PENDENTE' | 'GERADO' | 'FALHA';

  @ApiPropertyOptional({
    description: 'Filtra pela data inicial',
    example: '2026-09-01',
  })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({
    description: 'Filtra pela data final',
    example: '2026-09-30',
  })
  @IsOptional()
  @IsDateString()
  @IsDateRangeValid('data_inicio', {
    message: 'data_termino deve ser igual ou posterior a data_inicio',
  })
  data_termino?: string;

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de registros por página',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}