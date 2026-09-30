import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreatePublicidadeDto {

  // FRONT: título principal do anúncio.
  // Obrigatório no cadastro.
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo: string;

  // FRONT: conteúdo/texto que será apresentado no anúncio.
  // Obrigatório no cadastro.
  @IsString()
  @IsNotEmpty()
  conteudo: string;

  // FRONT: URL da imagem utilizada no anúncio.
  // Pode ser omitida caso o anúncio não possua imagem.
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(191)
  urlImagem?: string;
}