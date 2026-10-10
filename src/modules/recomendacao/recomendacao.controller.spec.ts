
import { Test, TestingModule } from '@nestjs/testing';
import { RecomendacaoController } from './recomendacao.controller.js';
import { RecomendacaoService } from './recomendacao.service.js';

describe('RecomendacaoController', () => {
  let controller: RecomendacaoController;

  const recomendacaoServiceMock = {
    obterRecomendacao: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecomendacaoController],
      providers: [
        {
          provide: RecomendacaoService,
          useValue: recomendacaoServiceMock,
        },
      ],
    }).compile();

    controller = module.get<RecomendacaoController>(RecomendacaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('deve chamar o service com o ID do usuário informado', async () => {
    recomendacaoServiceMock.obterRecomendacao.mockResolvedValue([]);

    await controller.obterRecomendacao(1);

    expect(recomendacaoServiceMock.obterRecomendacao).toHaveBeenCalledWith(1);
  });

  it('deve retornar as recomendações recebidas do service', async () => {
    const recomendacoes = [
      {
        id: 9,
        nome: 'Consultoria Contábil',
        descricao: 'Atendimento para análise de questões contábeis',
      },
      {
        id: 7,
        nome: 'Planejamento Tributário',
        descricao: 'Análise para otimização da carga tributária',
      },
    ];

    recomendacaoServiceMock.obterRecomendacao.mockResolvedValue(recomendacoes);

    const resultado = await controller.obterRecomendacao(1);

    expect(resultado).toEqual(recomendacoes);
  });

  it('deve retornar um array vazio quando o service não encontrar recomendações', async () => {
    recomendacaoServiceMock.obterRecomendacao.mockResolvedValue([]);

    const resultado = await controller.obterRecomendacao(1);

    expect(resultado).toEqual([]);
  });
});
