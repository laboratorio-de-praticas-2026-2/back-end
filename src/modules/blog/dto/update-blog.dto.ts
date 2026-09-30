import { IsString, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { CategoriaBlog } from './create-blog.dto.js';

export class UpdateBlogDto {
  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  conteudo?: string;

  @IsDateString()
  @IsOptional()
  data_publicacao?: string;

  @IsString()
  @IsOptional()
  url_imagem?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsString()
  @IsOptional()
  olho_do_texto?: string;

  @IsEnum(CategoriaBlog)
  @IsOptional()
  categoria?: CategoriaBlog;
}