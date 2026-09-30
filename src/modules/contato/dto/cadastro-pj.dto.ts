import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsISO8601, IsOptional, IsString, Length, MaxLength, ValidateBy } from 'class-validator';
import { isValidCNPJ, isValidCPF } from '../../../commons/validators/document.validator.js';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export class CadastroPjDto {
  @Transform(trim) @IsString() @Length(2, 100) nome!: string;
  @Transform(({value}) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(100) email!: string;
  @IsString() @Length(8, 72) senha!: string;
  @IsString() @ValidateBy({name:'cpf', validator: {validate: v => typeof v === 'string' && isValidCPF(v), defaultMessage: () => 'CPF do responsável inválido.'}}) cpf_cnpj!: string;
  @IsOptional() @IsString() @MaxLength(20) celular?: string;
  @Transform(trim) @IsString() @Length(2, 150) razaoSocial!: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(150) nomeFantasia?: string;
  @IsString() @ValidateBy({name:'cnpj', validator: {validate: v => typeof v === 'string' && isValidCNPJ(v), defaultMessage: () => 'CNPJ inválido.'}}) cnpj!: string;
  @IsOptional() @IsIn(['mei', 'simples_nacional', 'lucro_presumido', 'lucro_real']) regimeTributario?: 'mei' | 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  @IsOptional() @IsString() @MaxLength(30) inscricaoEstadual?: string;
  @IsOptional() @IsString() @MaxLength(30) inscricaoMunicipal?: string;
  @IsOptional() @IsISO8601({strict: true}) dataAbertura?: string;
}
