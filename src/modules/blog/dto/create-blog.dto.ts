import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator';

export enum CategoriaBlog {
  Legislacao = 'Legislacao',
  ImpostoDeRenda = 'ImpostoDeRenda',
  ObrigacoesAcessorias = 'ObrigacoesAcessorias',
  FolhaDePagamento = 'FolhaDePagamento',
  SimplesNacional = 'SimplesNacional',
}

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  conteudo: string;

  @IsDateString()
  @IsNotEmpty()
  data_publicacao: string;

  @IsString()
  @IsOptional()
  url_imagem?: string;

  @IsString()
  @IsNotEmpty()
  olho_do_texto: string;

  @IsEnum(CategoriaBlog)
  @IsNotEmpty()
  categoria: CategoriaBlog;
}