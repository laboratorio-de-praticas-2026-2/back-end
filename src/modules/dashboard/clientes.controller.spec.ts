import { Test } from '@nestjs/testing';
import { ClientesController } from './clientes.controller.js';
import { ClientesService } from './clientes.service.js';

describe('ClientesController', () => {
  it('encaminha os filtros ao service e retorna a resposta', async () => {
    const resposta = {
      topClientesServicos: [],
      topClientesRentaveis: [],
      clientesInadimplentes: [],
    };

    const service = {
      getDashboardClientes: vi.fn().mockResolvedValue(resposta),
    };

    const module = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [
        { provide: ClientesService, useValue: service },
      ],
    }).compile();

    const controller = module.get(ClientesController);

    const resultado = await controller.getDashboardClientes(
      '2026-09-01',
      '2026-09-30',
    );

    expect(service.getDashboardClientes).toHaveBeenCalledWith(
      '2026-09-01',
      '2026-09-30',
    );
    expect(resultado).toEqual(resposta);
  });
});