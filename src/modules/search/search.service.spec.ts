import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Op } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { Empresa } from '../../models/empresa.model.js';
import { Usuario } from '../../models/usuario.model.js';
import { SearchService } from './search.service.js';

function createModelMock() {
  return {
    findOne: vi.fn(),
    findAndCountAll: vi.fn(),
    findAll: vi.fn(),
  };
}

describe('SearchService', () => {
  let service: SearchService;
  let usuarioModel: ReturnType<typeof createModelMock>;
  let empresaModel: ReturnType<typeof createModelMock>;

  beforeEach(async () => {
    usuarioModel = createModelMock();
    empresaModel = createModelMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getModelToken(Usuario), useValue: usuarioModel },
        { provide: getModelToken(Empresa), useValue: empresaModel },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('lança ForbiddenException quando o papel não é administrador (searchByDocument)', async () => {
    await expect(
      service.searchByDocument('529.982.247-25', NivelUsuarioEnum.cliente),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usuarioModel.findOne).not.toHaveBeenCalled();
  });

  it('lança ForbiddenException quando o papel não é administrador (advancedSearch)', async () => {
    await expect(
      service.advancedSearch({}, NivelUsuarioEnum.cliente),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usuarioModel.findAndCountAll).not.toHaveBeenCalled();
  });

  it('lança BadRequestException para documento inválido', async () => {
    await expect(
      service.searchByDocument('123', NivelUsuarioEnum.administrador),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuarioModel.findOne).not.toHaveBeenCalled();
  });

  it('lança BadRequestException para CPF com dígito verificador errado', async () => {
    await expect(
      service.searchByDocument('529.982.247-24', NivelUsuarioEnum.administrador),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('retorna found:false quando o CPF é válido mas não existe', async () => {
    usuarioModel.findOne.mockResolvedValue(null);

    const result = await service.searchByDocument('529.982.247-25', NivelUsuarioEnum.administrador);

    expect(result).toEqual({
      found: false,
      message: 'Nenhum resultado encontrado para o documento informado.',
    });
    expect(usuarioModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { cpfCnpj: '52998224725' } }),
    );
  });

  it('retorna os dados completos quando o CPF é encontrado (papel administrador)', async () => {
    usuarioModel.findOne.mockResolvedValue({
      toJSON: () => ({
        id: 1,
        nome: 'Cliente Teste',
        email: 'cliente@example.com',
        celular: '11999998888',
        cpfCnpj: '52998224725',
        dataCadastro: new Date('2024-01-01'),
        empresas: [],
      }),
    });

    const result = await service.searchByDocument('529.982.247-25', NivelUsuarioEnum.administrador);

    expect(result).toEqual({
      found: true,
      tipo: 'pessoa_fisica',
      data: {
        id: 1,
        nome: 'Cliente Teste',
        email: 'cliente@example.com',
        celular: '11999998888',
        cpfCnpj: '52998224725',
        dataCadastro: new Date('2024-01-01'),
        empresas: [],
      },
    });
  });

  it('busca por CNPJ na tabela empresa e retorna tipo pessoa_juridica', async () => {
    empresaModel.findOne.mockResolvedValue({
      toJSON: () => ({
        id: 5,
        razaoSocial: 'Acme Ltda',
        nomeFantasia: 'Acme',
        cnpj: '11222333000181',
        regimeTributario: 'simples_nacional',
        dataAbertura: null,
        inscricaoEstadual: null,
        inscricaoMunicipal: null,
        usuario: { id: 1, nome: 'Cliente Teste', email: 'cliente@example.com' },
      }),
    });

    const result = await service.searchByDocument('11.222.333/0001-81', NivelUsuarioEnum.administrador);

    expect(result.found).toBe(true);
    expect((result as { tipo: string }).tipo).toBe('pessoa_juridica');
    expect(empresaModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { cnpj: '11222333000181' } }),
    );
  });

  it('advancedSearch sem filtros retorna paginação padrão', async () => {
    usuarioModel.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
        {
          toJSON: () => ({
            id: 1,
            nome: 'Cliente Teste',
            email: 'cliente@example.com',
            celular: null,
            cpfCnpj: '52998224725',
            dataCadastro: new Date('2024-01-01'),
            empresas: [],
          }),
        },
      ],
    });

    const result = await service.advancedSearch({}, NivelUsuarioEnum.administrador);

    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.results).toHaveLength(1);
    expect(usuarioModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        limit: 20,
        offset: 0,
        distinct: true,
        order: [['id', 'ASC']],
      }),
    );
    expect(empresaModel.findAll).not.toHaveBeenCalled();
  });

  it('advancedSearch retorna lista vazia quando nenhum filtro casa', async () => {
    empresaModel.findAll.mockResolvedValue([]);
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await service.advancedSearch(
      { nome: 'Inexistente' },
      NivelUsuarioEnum.administrador,
    );

    expect(result).toEqual({ total: 0, page: 1, pageSize: 20, results: [] });
  });

  it('advancedSearch filtra por nome no próprio usuario ou em empresas vinculadas', async () => {
    empresaModel.findAll.mockResolvedValue([{ usuarioId: 7 }]);
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.advancedSearch({ nome: 'Acme' }, NivelUsuarioEnum.administrador);

    expect(empresaModel.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { razaoSocial: { [Op.like]: '%Acme%' } },
          { nomeFantasia: { [Op.like]: '%Acme%' } },
        ],
      },
      attributes: ['usuarioId'],
    });

    const chamada = usuarioModel.findAndCountAll.mock.calls[0][0];
    expect(chamada.where).toEqual({
      [Op.and]: [
        {
          [Op.or]: [{ nome: { [Op.like]: '%Acme%' } }, { id: { [Op.in]: [7] } }],
        },
      ],
    });
  });

  it('advancedSearch escapa curingas de LIKE no filtro nome', async () => {
    empresaModel.findAll.mockResolvedValue([]);
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.advancedSearch({ nome: '100%_off' }, NivelUsuarioEnum.administrador);

    expect(empresaModel.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { razaoSocial: { [Op.like]: '%100\\%\\_off%' } },
          { nomeFantasia: { [Op.like]: '%100\\%\\_off%' } },
        ],
      },
      attributes: ['usuarioId'],
    });
  });

  it('advancedSearch combina regimeTributario e possuiEmpresa com AND', async () => {
    empresaModel.findAll.mockImplementation(({ where }: { where?: Record<string, unknown> }) => {
      if (where?.regimeTributario) {
        return Promise.resolve([{ usuarioId: 1 }, { usuarioId: 2 }]);
      }
      return Promise.resolve([{ usuarioId: 1 }]);
    });
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.advancedSearch(
      { regimeTributario: 'simples_nacional', possuiEmpresa: 'true' },
      NivelUsuarioEnum.administrador,
    );

    const chamada = usuarioModel.findAndCountAll.mock.calls[0][0];
    expect(chamada.where).toEqual({
      [Op.and]: [{ id: { [Op.in]: [1, 2] } }, { id: { [Op.in]: [1] } }],
    });
  });

  it('advancedSearch respeita page e pageSize informados, limitando pageSize a 100', async () => {
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.advancedSearch({ page: '2', pageSize: '500' }, NivelUsuarioEnum.administrador);

    expect(usuarioModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 100, limit: 100 }),
    );
  });

  it('lança BadRequestException quando searchByDocument recebe um valor não-string', async () => {
    await expect(
      service.searchByDocument(['123'] as unknown as string, NivelUsuarioEnum.administrador),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuarioModel.findOne).not.toHaveBeenCalled();
  });

  it('lança BadRequestException para dataCadastroInicio inválida sem consultar o banco', async () => {
    await expect(
      service.advancedSearch({ dataCadastroInicio: 'data-invalida' }, NivelUsuarioEnum.administrador),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuarioModel.findAndCountAll).not.toHaveBeenCalled();
  });

  it('lança BadRequestException para dataCadastroFim inválida sem consultar o banco', async () => {
    await expect(
      service.advancedSearch({ dataCadastroFim: 'data-invalida' }, NivelUsuarioEnum.administrador),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuarioModel.findAndCountAll).not.toHaveBeenCalled();
  });

  it('advancedSearch normaliza dataCadastroFim para o fim do dia (23:59:59.999)', async () => {
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.advancedSearch({ dataCadastroFim: '2024-01-31' }, NivelUsuarioEnum.administrador);

    const chamada = usuarioModel.findAndCountAll.mock.calls[0][0];
    const fim = (chamada.where as Record<symbol, { dataCadastro: Record<symbol, Date> }>)[Op.and][0]
      .dataCadastro[Op.lte];
    expect(fim.getUTCHours()).toBe(23);
    expect(fim.getUTCMinutes()).toBe(59);
    expect(fim.getUTCSeconds()).toBe(59);
    expect(fim.getUTCMilliseconds()).toBe(999);
  });

  it('lança BadRequestException para regimeTributario inválido sem consultar o banco', async () => {
    await expect(
      service.advancedSearch({ regimeTributario: 'invalido' }, NivelUsuarioEnum.administrador),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(empresaModel.findAll).not.toHaveBeenCalled();
    expect(usuarioModel.findAndCountAll).not.toHaveBeenCalled();
  });

  it('lança BadRequestException para possuiEmpresa inválido sem consultar o banco', async () => {
    await expect(
      service.advancedSearch({ possuiEmpresa: 'sim' }, NivelUsuarioEnum.administrador),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(empresaModel.findAll).not.toHaveBeenCalled();
    expect(usuarioModel.findAndCountAll).not.toHaveBeenCalled();
  });
});
