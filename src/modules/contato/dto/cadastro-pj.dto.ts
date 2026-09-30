import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CadastroPjDto {
  @IsString({ message: 'O nome deve ser uma string.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @IsString({ message: 'A senha deve ser uma string.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  senha: string;

  @IsString({ message: 'O CPF/CNPJ deve ser uma string.' })
  @IsOptional()
  cpf_cnpj?: string;

  @IsString({ message: 'O celular deve ser uma string.' })
  @IsOptional()
  celular?: string;

  @IsString({ message: 'A razão social deve ser uma string.' })
  @IsNotEmpty({ message: 'A razão social é obrigatória.' })
  razaoSocial: string;

  @IsString({ message: 'O nome fantasia deve ser uma string.' })
  @IsOptional()
  nomeFantasia?: string;

  @IsString({ message: 'O CNPJ deve ser uma string.' })
  @IsNotEmpty({ message: 'O CNPJ é obrigatório.' })
  cnpj: string;

  @IsOptional()
  regimeTributario?: any;

  @IsString({ message: 'A inscrição estadual deve ser uma string.' })
  @IsOptional()
  inscricaoEstadual?: string;

  @IsString({ message: 'A inscrição municipal deve ser uma string.' })
  @IsOptional()
  inscricaoMunicipal?: string;

  @IsString({ message: 'A data de abertura deve ser uma string.' })
  @IsOptional()
  dataAbertura?: string;
}