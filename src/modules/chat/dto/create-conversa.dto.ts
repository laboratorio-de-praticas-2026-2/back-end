import { IsEmail, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateConversaDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  clienteId?: number;

  @IsOptional()
  @IsString()
  @IsUUID()
  visitanteId?: string;

  @IsOptional()
  @IsString()
  visitanteNome?: string;

  @IsOptional()
  @IsEmail()
  visitanteEmail?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  atendenteId?: number;
}
