import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateUsuarioAdminDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nome?: string;

  @IsOptional()
  @IsEmail()
  @Length(5, 100)
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9()+\-\s]{8,20}$/, {
    message: 'celular deve conter apenas números e caracteres de telefone válidos',
  })
  celular?: string | null;

  @IsOptional()
  @IsString()
  @Length(11, 14)
  @Matches(/^(?:\d{11}|\d{14})$/, {
    message: 'cpfCnpj deve conter 11 ou 14 dígitos',
  })
  cpfCnpj?: string | null;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  razaoSocial?: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  nomeFantasia?: string | null;

  @IsOptional()
  @IsString()
  @Length(14, 18)
  @Matches(/^\d{14}$/, { message: 'cnpj deve conter 14 dígitos' })
  cnpj?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  regimeTributario?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  inscricaoEstadual?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  inscricaoMunicipal?: string | null;
}
