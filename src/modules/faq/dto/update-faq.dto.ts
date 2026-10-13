import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pergunta?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  resposta?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'documentacao',
    'tributos',
    'obrigacoes_acessorias',
    'folha_pagamento',
    'frequentes',
  ])
  categoria?: string;

  @IsOptional()
  status?: boolean;
}
