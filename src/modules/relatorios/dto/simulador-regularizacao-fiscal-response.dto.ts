import { ApiProperty } from '@nestjs/swagger';

export class SimuladorRegularizacaoFiscalResponseDto {
  @ApiProperty({ description: 'Valor de impostos recebido na entrada.', example: 1000 })
  impostos!: number;

  @ApiProperty({ description: 'Valor de multas recebido na entrada.', example: 200 })
  multas!: number;

  @ApiProperty({ description: 'Valor de honorários recebido na entrada.', example: 300 })
  honorarios!: number;

  @ApiProperty({ description: 'Soma de impostos, multas e honorários.', example: 1500 })
  totalRegularizacao!: number;

  @ApiProperty({ description: 'Quantidade efetiva de parcelas.', example: 3 })
  quantidadeParcelas!: number;

  @ApiProperty({ description: 'Total da regularização dividido pela quantidade de parcelas.', example: 500 })
  valorParcela!: number;
}