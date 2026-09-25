import { Test, TestingModule } from '@nestjs/testing';
import { ClienteController } from './cliente.controller.js';
import { ClienteService } from './cliente.service.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';

describe('ClienteController', () => {
  let controller: ClienteController;
  const clienteService = {
    create: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClienteController],
      providers: [
        {
          provide: ClienteService,
          useValue: clienteService,
        },
      ],
    }).compile();

    controller = module.get<ClienteController>(ClienteController);
  });

  it('encaminha o cadastro para o service', async () => {
    const dto = {
      nome: 'Maria da Silva',
      email: 'maria@example.com',
      senha: 'SenhaSegura123',
      cpfCnpj: '529.982.247-25',
    } as CreateClienteDto;
    const response = { id: 1, nome: dto.nome };
    clienteService.create.mockResolvedValue(response);

    await expect(controller.create(dto)).resolves.toEqual(response);
    expect(clienteService.create).toHaveBeenCalledWith(dto);
  });
});
