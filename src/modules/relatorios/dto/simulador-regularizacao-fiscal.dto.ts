import { Transform, Type } from 'class-transformer';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsDefined,
  IsInt,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';

export class SimuladorRegularizacaoFiscalDto {
  @ApiProperty({
    description:
      'Valor de impostos já informado para a simulação, com até duas casas decimais. O projeto não define cálculo fiscal para este valor.',
    type: Number,
    minimum: 0,
    example: 1000,
  })
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  impostos!: number;

  @ApiProperty({
    description:
      'Valor de multas já informado para a simulação, com até duas casas decimais. O projeto não define cálculo fiscal para este valor.',
    type: Number,
    minimum: 0,
    example: 200,
  })
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  multas!: number;

  @ApiProperty({
    description:
      'Valor de honorários já informado para a simulação, com até duas casas decimais. O projeto não define cálculo fiscal para este valor.',
    type: Number,
    minimum: 0,
    example: 300,
  })
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  honorarios!: number;

  @ApiPropertyOptional({
    description:
      'Quantidade de parcelas. Campo opcional; quando omitido, o valor efetivo utilizado é 1.',
    type: Number,
    minimum: 1,
    example: 3,
  })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }) => {
    if (value === null || typeof value === 'boolean') {
      return value;
    }

    return Number(value);
  })
  @IsInt()
  @Min(1)
  quantidadeParcelas?: number;
}