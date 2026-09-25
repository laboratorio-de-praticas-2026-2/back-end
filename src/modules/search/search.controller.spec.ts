import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';

describe('SearchController', () => {
  let controller: SearchController;
  let service: {
    searchByDocument: ReturnType<typeof vi.fn>;
    advancedSearch: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      searchByDocument: vi.fn().mockResolvedValue({ found: false, message: 'x' }),
      advancedSearch: vi.fn().mockResolvedValue({ total: 0, page: 1, pageSize: 20, results: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: service }],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('GET /search/document delega ao service com o doc e o papel resolvidos', async () => {
    await controller.searchByDocument({ doc: '52998224725' }, NivelUsuarioEnum.administrador);

    expect(service.searchByDocument).toHaveBeenCalledWith(
      '52998224725',
      NivelUsuarioEnum.administrador,
    );
  });

  it('GET /search/advanced delega ao service com os filtros e o papel resolvidos', async () => {
    await controller.advancedSearch({ nome: 'Acme' }, NivelUsuarioEnum.cliente);

    expect(service.advancedSearch).toHaveBeenCalledWith(
      { nome: 'Acme' },
      NivelUsuarioEnum.cliente,
    );
  });
});
