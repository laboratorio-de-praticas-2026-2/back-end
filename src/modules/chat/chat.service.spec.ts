import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ChatService } from './chat.service.js';
import { Conversa } from './entities/conversa.entity.js';

const conversaModel = {
  findOne: vi.fn(),
  findAll: vi.fn(),
  findByPk: vi.fn(),
  create: vi.fn(),
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getModelToken(Conversa), useValue: conversaModel },
      ],
    })
      .overrideProvider(getModelToken(Conversa))
      .useValue(conversaModel)
      .compile();

    service = module.get<ChatService>(ChatService);
  });

  it('deve criar uma conversa identificando cliente e atendente', async () => {
    const conversa = { id: 'id', status: 'aberta' } as Conversa;
    conversaModel.findOne.mockResolvedValue(null);
    conversaModel.create.mockResolvedValue(conversa);

    const result = await service.criarConversa(
      { clienteId: 10, atendenteId: 20 },
      { id: 20, nivel: 'atendente' },
    );

    expect(result).toBe(conversa);
    expect(conversaModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ clienteId: 10, atendenteId: 20, status: 'aberta' }),
    );
  });
});
