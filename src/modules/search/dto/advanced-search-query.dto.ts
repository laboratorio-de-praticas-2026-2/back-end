import {IsOptional,IsString} from 'class-validator';
export class AdvancedSearchQueryDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() cpfCnpj?: string;
  @IsOptional() @IsString() regimeTributario?: string;
  @IsOptional() @IsString() possuiEmpresa?: string;
  @IsOptional() @IsString() dataCadastroInicio?: string;
  @IsOptional() @IsString() dataCadastroFim?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() pageSize?: string;
}
