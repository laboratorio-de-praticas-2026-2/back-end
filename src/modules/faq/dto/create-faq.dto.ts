import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  pergunta: string;

  @IsString()
  @IsNotEmpty()
  resposta: string;

  @IsString()
  @IsIn([
    'documentacao',
    'tributos',
    'obrigacoes_acessorias',
    'folha_pagamento',
    'frequentes',
  ])
  categoria: string;
}
