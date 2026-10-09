import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateReportDto {
  @ApiProperty({
    description: 'ID do relatório que será gerado',
    example: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
  })
  @IsUUID()
  @IsNotEmpty()
  relatorioId!: string;
}