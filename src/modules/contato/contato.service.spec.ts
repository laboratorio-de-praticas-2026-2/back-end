import { Test, TestingModule } from '@nestjs/testing';
import {
  getModelToken,
  getConnectionToken,
} from '@nestjs/sequelize';

import { ContatoService } from './contato.service.js';

import { Usuario } from './entities/usuario.entity.js';
import { Empresa } from './entities/empresa.entity.js';

describe('ContatoService', () => {
  let service: ContatoService;

  beforeEach(async () => {
    // Mock do Usuario
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

    // Mock da Empresa
    const empresaModelMock = {
      findOne: async () => null,

      create: async (dados: any) => ({
        id: 1,
        ...dados,
      }),
    };

    // Mock do Sequelize
    const sequelizeMock = {
      transaction: async (callback: any) => {
        return callback({});
      },
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ContatoService,

          // Mock do Usuario
          {
            provide: getModelToken(Usuario),
            useValue: usuarioModelMock,
          },

          // Mock da Empresa
          {
            provide: getModelToken(Empresa),
            useValue: empresaModelMock,
          },

          // Mock do Sequelize
          {
            provide: getConnectionToken(),
            useValue: sequelizeMock,
          },
        ],
      }).compile();

    service =
      module.get<ContatoService>(ContatoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});