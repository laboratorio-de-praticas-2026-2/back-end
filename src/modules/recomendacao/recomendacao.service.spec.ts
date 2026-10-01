import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { RecomendacaoService } from './recomendacao.service.js';

describe('RecomendacaoService', () => {
  let service: RecomendacaoService;

  const prismaMock = {
    solicitacao: {
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecomendacaoService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<RecomendacaoService>(RecomendacaoService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

    describe('buscarServicosPopulares', () => {
    it('deve retornar os serviços ordenados pela quantidade de solicitações', async () => {
      const a = { id: 1, nome: 'Serviço A', descricao: 'Desc A' };
      const b = { id: 2, nome: 'Serviço B', descricao: 'Desc B' };
      const c = { id: 3, nome: 'Serviço C', descricao: 'Desc C' };

      prismaMock.solicitacao.findMany.mockResolvedValue([
        { servico: a },
        { servico: b },
        { servico: c },
        { servico: b },
        { servico: c },
        { servico: b },
      ]);

      const resultado = await service.buscarServicosPopulares();

      expect(resultado.map((s) => s.id)).toEqual([2, 3, 1]);
    });

    it('deve consultar somente serviços ativos', async () => {
      prismaMock.solicitacao.findMany.mockResolvedValue([]);

      await service.buscarServicosPopulares();

      expect(prismaMock.solicitacao.findMany).toHaveBeenCalledWith({
        where: { servico: { ativo: true } },
        select: {
          servico: {
            select: { id: true, nome: true, descricao: true },
          },
        },
      });
    });

    it('deve retornar somente id, nome e descricao, sem a quantidade', async () => {
      const servico = { id: 1, nome: 'Abertura de empresa', descricao: 'Abertura de CNPJ' };

      prismaMock.solicitacao.findMany.mockResolvedValue([
        { servico },
        { servico },
      ]);

      const resultado = await service.buscarServicosPopulares();

      expect(resultado).toEqual([
        { id: 1, nome: 'Abertura de empresa', descricao: 'Abertura de CNPJ' },
      ]);
      expect(Object.keys(resultado[0])).toEqual(['id', 'nome', 'descricao']);
    });

    it('deve retornar array vazio quando não existirem solicitações', async () => {
      prismaMock.solicitacao.findMany.mockResolvedValue([]);

      const resultado = await service.buscarServicosPopulares();

      expect(resultado).toEqual([]);
    });
  });

  describe('buscarAtributosPerfil', () => {
    it('deve retornar um array de objetos no formato definido, convertendo ativo em status', async () => {
      prismaMock.solicitacao.findMany.mockResolvedValue([
        {
          servico: {
            nome: 'Abertura de empresa',
            descricao: 'Abertura de CNPJ',
            valorBase: { toNumber: () => 350 },
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

      expect(prismaMock.solicitacao.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 1 },
        select: {
          servico: {
            select: {
              nome: true,
              descricao: true,
              valorBase: true,
              ativo: true,
            },
          },
        },
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
      prismaMock.solicitacao.findMany.mockResolvedValue([]);

      const resultado = await service.buscarAtributosPerfil(99);

      expect(resultado).toEqual([]);
    });
  });
});