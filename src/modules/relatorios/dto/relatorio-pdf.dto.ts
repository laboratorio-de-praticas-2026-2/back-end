import { IsArray, IsDateString, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ItemRelatorioDto {
  @IsString()
  descricao!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor!: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class RelatorioPdfDto {
  @IsString()
  titulo!: string;

  @IsString()
  nomeCliente!: string;

  @IsDateString()
  @IsOptional()
  periodoInicio?: string;

  @IsDateString()
  @IsOptional()
  periodoFim?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemRelatorioDto)
  itens!: ItemRelatorioDto[];
}