import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Op } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { Empresa } from '../../models/empresa.model.js';
import { Usuario } from '../../models/usuario.model.js';
import { SearchService } from './search.service.js';

const admin = { id: 1, role: NivelUsuarioEnum.administrador };
const cliente = { id: 5, role: NivelUsuarioEnum.cliente };

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

  it('lança ForbiddenException sem usuário autenticado (searchByDocument)', async () => {
    await expect(service.searchByDocument('529.982.247-25', null)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(usuarioModel.findOne).not.toHaveBeenCalled();
  });

  it('lança ForbiddenException sem usuário autenticado (advancedSearch)', async () => {
    await expect(service.advancedSearch({}, null)).rejects.toBeInstanceOf(ForbiddenException);
    expect(usuarioModel.findAndCountAll).not.toHaveBeenCalled();
  });

  it('cliente busca o próprio CPF: restringe a query ao próprio id e devolve os dados completos', async () => {
    usuarioModel.findOne.mockResolvedValue({
      toJSON: () => ({
        id: 5,
        nome: 'Cliente Teste',
        email: 'cliente@example.com',
        celular: null,
        cpfCnpj: '52998224725',
        dataCadastro: new Date('2024-01-01'),
        empresas: [],
      }),
    });

    const result = await service.searchByDocument('529.982.247-25', cliente);

    expect(usuarioModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { cpfCnpj: '52998224725', id: 5 } }),
    );
    expect(result).toMatchObject({
      found: true,
      tipo: 'pessoa_fisica',
      data: { id: 5, cpfCnpj: '52998224725', email: 'cliente@example.com' },
    });
  });

  it('cliente busca CPF de terceiro: 403 sem revelar se o documento existe', async () => {
    usuarioModel.findOne.mockResolvedValue(null);

    await expect(service.searchByDocument('529.982.247-25', cliente)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('cliente busca CNPJ de empresa vinculada: restringe a query ao próprio usuarioId', async () => {
    empresaModel.findOne.mockResolvedValue({
      toJSON: () => ({
        id: 9,
        razaoSocial: 'Acme Ltda',
        nomeFantasia: 'Acme',
        cnpj: '11222333000181',
        regimeTributario: 'simples_nacional',
        dataAbertura: null,
        inscricaoEstadual: null,
        inscricaoMunicipal: null,
        usuario: { id: 5, nome: 'Cliente Teste', email: 'cliente@example.com' },
      }),
    });

    const result = await service.searchByDocument('11.222.333/0001-81', cliente);

    expect(empresaModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { cnpj: '11222333000181', usuarioId: 5 } }),
    );
    expect(result).toMatchObject({ found: true, tipo: 'pessoa_juridica' });
  });

  it('cliente busca CNPJ de empresa não vinculada: 403 sem revelar se o documento existe', async () => {
    empresaModel.findOne.mockResolvedValue(null);

    await expect(service.searchByDocument('11.222.333/0001-81', cliente)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('cliente com documento inválido continua recebendo 400', async () => {
    await expect(service.searchByDocument('123', cliente)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usuarioModel.findOne).not.toHaveBeenCalled();
  });

  it('admin busca qualquer CPF sem restrição de id', async () => {
    usuarioModel.findOne.mockResolvedValue(null);

    await service.searchByDocument('529.982.247-25', admin);

    const chamada = usuarioModel.findOne.mock.calls[0][0];
    expect(chamada.where).toEqual({ cpfCnpj: '52998224725' });
  });

  it('advancedSearch de cliente sempre restringe ao próprio id', async () => {
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.advancedSearch({}, cliente);

    const chamada = usuarioModel.findAndCountAll.mock.calls[0][0];
    expect(chamada.where).toEqual({ [Op.and]: [{ id: 5 }] });
  });

  it('advancedSearch de cliente combina o escopo do id com os filtros informados', async () => {
    empresaModel.findAll.mockResolvedValue([{ usuarioId: 7 }]);
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.advancedSearch({ nome: 'Acme' }, cliente);

    const chamada = usuarioModel.findAndCountAll.mock.calls[0][0];
    expect(chamada.where).toEqual({
      [Op.and]: [
        { id: 5 },
        { [Op.or]: [{ nome: { [Op.like]: '%Acme%' } }, { id: { [Op.in]: [7] } }] },
      ],
    });
  });

  it('lança BadRequestException para documento inválido', async () => {
    await expect(
      service.searchByDocument('123', admin),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuarioModel.findOne).not.toHaveBeenCalled();
  });

  it('lança BadRequestException para CPF com dígito verificador errado', async () => {
    await expect(
      service.searchByDocument('529.982.247-24', admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('retorna found:false quando o CPF é válido mas não existe', async () => {
    usuarioModel.findOne.mockResolvedValue(null);

    const result = await service.searchByDocument('529.982.247-25', admin);

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

    const result = await service.searchByDocument('529.982.247-25', admin);

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

    const result = await service.searchByDocument('11.222.333/0001-81', admin);

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

    const result = await service.advancedSearch({}, admin);

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
      admin,
    );

    expect(result).toEqual({ total: 0, page: 1, pageSize: 20, results: [] });
  });

  it('advancedSearch filtra por nome no próprio usuario ou em empresas vinculadas', async () => {
    empresaModel.findAll.mockResolvedValue([{ usuarioId: 7 }]);
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.advancedSearch({ nome: 'Acme' }, admin);

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

    await service.advancedSearch({ nome: '100%_off' }, admin);

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
      admin,
    );

    const chamada = usuarioModel.findAndCountAll.mock.calls[0][0];
    expect(chamada.where).toEqual({
      [Op.and]: [{ id: { [Op.in]: [1, 2] } }, { id: { [Op.in]: [1] } }],
    });
  });

  it('advancedSearch respeita page e pageSize informados, limitando pageSize a 100', async () => {
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.advancedSearch({ page: '2', pageSize: '500' }, admin);

    expect(usuarioModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 100, limit: 100 }),
    );
  });

  it('lança BadRequestException quando searchByDocument recebe um valor não-string', async () => {
    await expect(
      service.searchByDocument(['123'] as unknown as string, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuarioModel.findOne).not.toHaveBeenCalled();
  });

  it('lança BadRequestException para dataCadastroInicio inválida sem consultar o banco', async () => {
    await expect(
      service.advancedSearch({ dataCadastroInicio: 'data-invalida' }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuarioModel.findAndCountAll).not.toHaveBeenCalled();
  });

  it('lança BadRequestException para dataCadastroFim inválida sem consultar o banco', async () => {
    await expect(
      service.advancedSearch({ dataCadastroFim: 'data-invalida' }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuarioModel.findAndCountAll).not.toHaveBeenCalled();
  });

  it('advancedSearch normaliza dataCadastroFim para o fim do dia (23:59:59.999)', async () => {
    usuarioModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.advancedSearch({ dataCadastroFim: '2024-01-31' }, admin);

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
      service.advancedSearch({ regimeTributario: 'invalido' }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(empresaModel.findAll).not.toHaveBeenCalled();
    expect(usuarioModel.findAndCountAll).not.toHaveBeenCalled();
  });

  it('lança BadRequestException para possuiEmpresa inválido sem consultar o banco', async () => {
    await expect(
      service.advancedSearch({ possuiEmpresa: 'sim' }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(empresaModel.findAll).not.toHaveBeenCalled();
    expect(usuarioModel.findAndCountAll).not.toHaveBeenCalled();
  });
});
