import {PasswordService} from '../../commons/password.service.js';
import {getConnectionToken} from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ContatoService } from './contato.service.js';
import { Usuario } from '../../models/usuario.model.js';
import { Empresa } from '../../models/empresa.model.js';

describe('ContatoService', () => {
  let service: ContatoService;

  beforeEach(async () => {
    const usuarioModelMock = {
      findOne: async () => null,
      create: async (dados: any) => ({
        id: 1,
        ...dados,
        get: (_options: { plain: boolean }) => ({
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
        PasswordService,
        {provide:getConnectionToken(),useValue:{transaction:async(fn: (t: unknown)=>unknown)=>fn({})}},
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
