import { Test, TestingModule } from '@nestjs/testing';
import { GeralController } from './geral.controller.js';
import { GeralService } from './geral.service.js';

describe('GeralController', () => {
  let controller: GeralController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeralController],
      providers: [
        {
          provide: GeralService,
          useValue: {
            getIndicadores: async () => ({}),
          },
        },
      ],
    }).compile();

    controller = module.get<GeralController>(GeralController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});