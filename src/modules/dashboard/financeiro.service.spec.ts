import { Test, TestingModule } from '@nestjs/testing';
import { FinanceiroService } from './financeiro.service.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

describe('FinanceiroService', () => {
  let service: FinanceiroService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceiroService,
        {
          provide: PrismaService,
          useValue: {
            $queryRawUnsafe: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FinanceiroService>(FinanceiroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});