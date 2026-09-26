import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { FinanceiroController } from './financeiro.controller.js';
import { FinanceiroService } from './financeiro.service.js';
import { ClientesController } from './clientes.controller.js';
import { ClientesService } from './clientes.service.js';
import { SolicitacoesController } from './solicitacoes.controller.js';
import { SolicitacoesService } from './solicitacoes.service.js';
import { DocumentosController } from './documentos.controller.js';
import { DocumentosService } from './documentos.service.js';
import { FiscalController } from './fiscal.controller.js';
import { FiscalService } from './fiscal.service.js';
import { ServicosController } from './servicos.controller.js';
import { ServicosService } from './servicos.service.js';
import { GeralController } from './geral.controller.js';
import { GeralService } from './geral.service.js';

// Models Sequelize
import { Obrigacao } from '../../models/obrigacao.model.js';
import { Pagamento } from '../../models/pagamento.model.js';
import { Parcela } from '../../models/parcela.model.js';
import { Servico } from '../../models/servico.model.js';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Obrigacao,
      Pagamento,
      Parcela,
      Servico,
      Solicitacao,
      ObrigacaoServico,
    ]),
  ],
  controllers: [
    FinanceiroController,
    ClientesController,
    SolicitacoesController,
    DocumentosController,
    FiscalController,
    ServicosController,
    GeralController,
  ],
  providers: [
    FinanceiroService,
    ClientesService,
    SolicitacoesService,
    DocumentosService,
    FiscalService,
    ServicosService,
    GeralService,
  ],
})
export class DashboardModule {}