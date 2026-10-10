import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class SimulacaoDto {
  @ApiProperty({
    description: 'Valor dos impostos',
    example: 100,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  impostos!: number;

  @ApiProperty({
    description: 'Valor das multas',
    example: 50,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  multas!: number;

  @ApiProperty({
    description: 'Valor dos honorários',
    example: 150,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  honorarios!: number;

  @ApiPropertyOptional({
    description: 'Quantidade de parcelas',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  parcelas?: number;

  @ApiPropertyOptional({
    description: 'Taxa de juros mensal em porcentagem',
    example: 1.5,
    minimum: 0,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxaJurosMensal?: number;
}