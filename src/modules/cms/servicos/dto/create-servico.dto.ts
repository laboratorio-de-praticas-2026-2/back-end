import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServicoDto {

  // FRONT: obrigatório.
  // Nome que será utilizado para identificar/exibir o serviço.
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  // FRONT: opcional.
  // Descrição detalhada apresentada ao usuário.
  @IsOptional()
  @IsString()
  descricao?: string;

  // FRONT: opcional.
  // Honorário/valor base do serviço.
  // Deve ser um número igual ou superior a zero.
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorBase?: number;

  // FRONT: opcional.
  // Prazo estimado para realização do serviço, em dias.
  @IsOptional()
  @IsNumber()
  @Min(0)
  prazoEstimadoDias?: number;
}