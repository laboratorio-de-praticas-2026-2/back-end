import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ContatoService } from './contato.service.js';
import { Usuario } from './entities/usuario.entity.js';
import { Empresa } from './entities/empresa.entity.js';

describe('ContatoService', () => {
  let service: ContatoService;

  beforeEach(async () => {
    const usuarioModelMock = {
      findOne: async () => null,
      create: async (dados: any) => ({
        id: 1,
        ...dados,
        get: ({ plain }: { plain: boolean }) => ({
          id: 1,
          ...dados,
        }),
      }),
    };

    const empresaModelMock = {
      findOne: async () => null,
      create: async (dados: any) => ({
        id: 1,
        ...dados,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContatoService,
        {
          provide: getModelToken(Usuario),
          useValue: usuarioModelMock,
        },
        {
          provide: getModelToken(Empresa),
          useValue: empresaModelMock,
        },
      ],
    }).compile();

    service = module.get<ContatoService>(ContatoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});