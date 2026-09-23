import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Servico } from './servico.model';

@Injectable()
export class ServicosService {

  constructor(
    // Injeta o Model Sequelize que representa a tabela "servico".
    // A partir daqui o Service consegue consultar o banco.
    @InjectModel(Servico)
    private readonly servicoModel: typeof Servico,
  ) {}

  // Retorna os serviços disponíveis para consumo pela Vitrine.
  //
  // REGRA DA ISSUE:
  // - ativo = true  -> disponível na Vitrine
  // - ativo = false -> pausado e não deve aparecer
  async listarAtivos(): Promise<Servico[]> {
    return this.servicoModel.findAll({
      where: {
        ativo: true,
      },
    });
  }
}



// Comentários dispostos temporariamente até a integração do front-end
// To-do: Elaborar documentação descritiva e apagar comentários desnecessários para compreensão do fluxo do back -> front