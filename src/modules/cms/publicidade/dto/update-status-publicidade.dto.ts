import { IsBoolean } from 'class-validator';

export class UpdateStatusPublicidadeDto {

  // FRONT:
  // true  = anúncio ativo
  // false = anúncio pausado
  @IsBoolean()
  ativo: boolean;
}