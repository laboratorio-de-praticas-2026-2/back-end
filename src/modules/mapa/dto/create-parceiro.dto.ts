import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUrl,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export enum ParceiroTipo {
  banco = 'banco',
  cartorio = 'cartorio',
  receita_federal = 'receita_federal',
  junta_comercial = 'junta_comercial',
  sindicato = 'sindicato',
}

export class CreateParceiroDto {
  @IsString()
  @IsNotEmpty()
  nomeFantasia: string;

  @IsEnum(ParceiroTipo)
  @IsNotEmpty()
  tipo: ParceiroTipo;

  @IsString()
  @IsNotEmpty()
  cidade: string;

  @IsString()
  @IsLatitude()
  latitude: string;

  @IsString()
  @IsLongitude()
  longitude: string;

  @IsString()
  @IsNotEmpty()
  telefone: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @IsOptional()
  linkLock?: string;
}
