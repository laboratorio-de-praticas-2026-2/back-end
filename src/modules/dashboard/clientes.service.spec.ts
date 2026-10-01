import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';

import { ClientesService } from './clientes.service.js';
import { Obrigacao } from '../../models/obrigacao.model.js';
import { Pagamento } from '../../models/pagamento.model.js';
import { Parcela } from '../../models/parcela.model.js';
import { ObrigacaoEmpresa } from '../../models/obrigacao-empresa.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';
import { Empresa } from '../../models/empresa.model.js';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { Usuario } from '../../models/usuario.model.js';

describe('ClientesService', () => {
  let service: ClientesService;

  beforeEach(async () => {
    const models = [
      Obrigacao,
      Pagamento,
      Parcela,
      ObrigacaoEmpresa,
      ObrigacaoServico,
      Empresa,
      Solicitacao,
      Usuario,
    ];

    const module = await Test.createTestingModule({
      providers: [
        ClientesService,
        ...models.map((model) => ({
          provide: getModelToken(model),
          useValue: {
            findAll: vi.fn().mockResolvedValue([]),
          },
        })),
      ],
    }).compile();

    service = module.get(ClientesService);
  });

  it('retorna listas vazias quando não há dados', async () => {
    const resultado = await service.getDashboardClientes(
      '2026-09-01',
      '2026-09-30',
    );

    expect(resultado).toEqual({
      topClientesServicos: [],
      topClientesRentaveis: [],
      clientesInadimplentes: [],
    });
  });
});