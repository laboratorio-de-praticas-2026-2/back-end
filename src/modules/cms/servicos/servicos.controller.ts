import { Controller, Get } from '@nestjs/common';

import { ServicosService } from './servicos.service';

@Controller('servicos')
export class ServicosController {

  constructor(
    // O Controller não acessa o banco diretamente.
    // Ele delega essa responsabilidade para o Service.
    private readonly servicosService: ServicosService,
  ) {}

  // Endpoint destinado ao consumo dos serviços disponíveis.
  //
  // FRONT:
  // GET /servicos
  //
  // Retorna somente serviços ativos, pois serviços pausados
  // não devem ser disponibilizados para a Vitrine.
  @Get()
  async listarAtivos() {
    return this.servicosService.listarAtivos();
  }
}


// Comentários dispostos temporariamente até a integração do front-end
// To-do: Elaborar documentação descritiva e apagar comentários desnecessários para compreensão do fluxo do back -> front