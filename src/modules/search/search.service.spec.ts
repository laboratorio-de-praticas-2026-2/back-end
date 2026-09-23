import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
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

  it('lança BadRequestException para documento inválido', async () => {
    await expect(
      service.searchByDocument('123', NivelUsuarioEnum.cliente),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuarioModel.findOne).not.toHaveBeenCalled();
  });

  it('lança BadRequestException para CPF com dígito verificador errado', async () => {
    await expect(
      service.searchByDocument('529.982.247-24', NivelUsuarioEnum.cliente),
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

  it('retorna os dados presentes quando o CPF é encontrado (papel cliente mascara)', async () => {
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

    const result = await service.searchByDocument('529.982.247-25', NivelUsuarioEnum.cliente);

    expect(result).toEqual({
      found: true,
      tipo: 'pessoa_fisica',
      data: { nome: 'Cliente Teste', cpfCnpj: '********725', empresas: [] },
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
});
