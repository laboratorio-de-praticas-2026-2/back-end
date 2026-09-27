import {  IsNumber, IsOptional, IsString, MaxLength, Min, } from 'class-validator';

export class UpdateServicoDto {

  // FRONT: opcional na edição.
  // Enviar somente quando o nome precisar ser alterado.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nome?: string;

  // FRONT: opcional.
  @IsOptional()
  @IsString()
  descricao?: string;

  // FRONT: opcional.
  // Representa o novo honorário/valor base do serviço.
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorBase?: number;

  // FRONT: opcional.
  // Novo prazo estimado em dias.
  @IsOptional()
  @IsNumber()
  @Min(0)
  prazoEstimadoDias?: number;
}