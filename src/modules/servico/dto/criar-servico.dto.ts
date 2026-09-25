import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateServicoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsString()
  @IsNotEmpty()
  icone: string;

  @IsString()
  @IsOptional()
  honorarios?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}