import {
  IsString,
  IsOptional,
  IsUrl,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class UpdatePublicidadeDto {

  // FRONT: enviar somente caso queira alterar o título.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo?: string;

  // FRONT: enviar somente caso queira alterar o conteúdo.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  conteudo?: string;

  // FRONT: enviar somente caso queira alterar a imagem.
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(191)
  urlImagem?: string;
}