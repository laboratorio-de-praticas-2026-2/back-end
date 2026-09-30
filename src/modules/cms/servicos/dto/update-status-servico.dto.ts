import { IsBoolean } from 'class-validator';

export class UpdateStatusServicoDto {

  // FRONT ADMINISTRATIVO:
  // Define a disponibilidade do serviço.
  //
  // true  -> serviço ativo e disponível para a Vitrine
  // false -> serviço pausado e oculto da Vitrine
  @IsBoolean()
  ativo: boolean;
}