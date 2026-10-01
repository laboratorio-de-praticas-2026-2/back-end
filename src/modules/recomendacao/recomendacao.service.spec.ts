import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';

import { Solicitacao } from '../../models/solicitacao.model.js';

import { RecomendacaoService } from './recomendacao.service.js';

describe('RecomendacaoService', () => {
  let service: RecomendacaoService;

  const solicitacaoModelMock = {
    findAll: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecomendacaoService,
        {
          provide: getModelToken(Solicitacao),
          useValue: solicitacaoModelMock,
        },
      ],
    }).compile();

    service = module.get<RecomendacaoService>(RecomendacaoService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buscarAtributosPerfil', () => {
    it('deve retornar um array de objetos no formato definido, convertendo ativo em status', async () => {
      solicitacaoModelMock.findAll.mockResolvedValue([
        {
          servico: {
            nome: 'Abertura de empresa',
            descricao: 'Abertura de CNPJ',
            valorBase: 350,
            ativo: true,
          },
        },
        {
          servico: {
            nome: 'Declaração de IR',
            descricao: null,
            valorBase: null,
            ativo: false,
          },
        },
      ]);

      const resultado = await service.buscarAtributosPerfil(1);

      expect(solicitacaoModelMock.findAll).toHaveBeenCalledWith({
        where: { usuarioId: 1 },
        include: [
          {
            association: 'servico',
            attributes: ['nome', 'descricao', 'valorBase', 'ativo'],
          },
        ],
      });

      expect(resultado).toEqual([
        {
          nome: 'Abertura de empresa',
          descricao: 'Abertura de CNPJ',
          valorBase: 350,
          status: 'ativo',
        },
        {
          nome: 'Declaração de IR',
          descricao: null,
          valorBase: null,
          status: 'inativo',
        },
      ]);
    });

    it('deve retornar array vazio quando o usuário não tem solicitações', async () => {
      solicitacaoModelMock.findAll.mockResolvedValue([]);

      const resultado = await service.buscarAtributosPerfil(99);

      expect(resultado).toEqual([]);
    });
  });
});