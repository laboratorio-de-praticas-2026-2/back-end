import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/sequelize';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

import { ContatoService } from './contato.service.js';
import { AuthService } from '../../commons/auth.service.js';

import { Usuario } from './entities/usuario.entity.js';
import { Empresa } from './entities/empresa.entity.js';

describe('ContatoService', () => {
  let service: ContatoService;

  beforeEach(async () => {
    const usuarios: any[] = [];
    const empresas: any[] = [];

    const usuarioModelMock = {
      findOne: async ({ where }: any) =>
        usuarios.find((u) => u.email === where.email) ?? null,

      create: async (dados: any) => {
        const novoUsuario = {
          id: usuarios.length + 1,
          ...dados,

          get: ({ plain }: { plain: boolean }) => ({
            id: novoUsuario.id,
            ...dados,
          }),
        };

        usuarios.push(novoUsuario);

        return novoUsuario;
      },
    };

    const empresaModelMock = {
      findOne: async ({ where }: any) =>
        empresas.find((e) => e.cnpj === where.cnpj) ?? null,

      create: async (dados: any) => {
        const novaEmpresa = {
          id: empresas.length + 1,
          ...dados,
        };

        empresas.push(novaEmpresa);

        return novaEmpresa;
      },
    };

    const sequelizeMock = {
      transaction: async (callback: any) => callback(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContatoService,

        {
          provide: AuthService,
          useValue: {},
        },

        // Sequelize usando @InjectConnection()
        {
          provide: getConnectionToken(),
          useValue: sequelizeMock,
        },

        // Sequelize usando injeção pela classe Sequelize
        {
          provide: Sequelize,
          useValue: sequelizeMock,
        },

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

  describe('cadastrarPj', () => {
    const payloadValido = {
      nome: 'Kauã Rodrigues',
      email: 'kaua.teste@exemplo.com',
      senha: 'SenhaMuitoSegura123',
      cpf_cnpj: '123.456.789-00',
      celular: '11999998888',
      razaoSocial: 'Empresa de Teste LTDA',
      nomeFantasia: 'Teste Soluções',
      cnpj: '11.222.333/0001-81',
      regimeTributario: 'simples_nacional',
    };

    it('deve cadastrar um cliente PJ com sucesso', async () => {
      const resultado = await service.cadastrarPj(payloadValido as any);

      expect(resultado).toHaveProperty(
        'mensagem',
        'Cadastro PJ realizado com sucesso.',
      );

      expect(resultado.usuario).toHaveProperty('id');

      expect(resultado.usuario).not.toHaveProperty('senha');

      expect(resultado.empresa.cnpj).toBe('11222333000181');
    });

    it('deve rejeitar e-mail com formato inválido', async () => {
      const dtoInvalido = {
        ...payloadValido,
        email: 'email_invalido',
      };

      await expect(
        service.cadastrarPj(dtoInvalido as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar CNPJ com formato inválido', async () => {
      const dtoInvalido = {
        ...payloadValido,
        cnpj: '123',
      };

      await expect(
        service.cadastrarPj(dtoInvalido as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar CPF/CNPJ do responsável com formato inválido', async () => {
      const dtoInvalido = {
        ...payloadValido,
        cpf_cnpj: '123',
      };

      await expect(
        service.cadastrarPj(dtoInvalido as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar e-mail duplicado', async () => {
      await service.cadastrarPj(payloadValido as any);

      const dtoDuplicado = {
        ...payloadValido,
        cnpj: '45.678.901/0001-75',
      };

      await expect(
        service.cadastrarPj(dtoDuplicado as any),
      ).rejects.toThrow(ConflictException);
    });

    it('deve rejeitar CNPJ duplicado', async () => {
      await service.cadastrarPj(payloadValido as any);

      const dtoDuplicado = {
        ...payloadValido,
        email: 'outro.email@exemplo.com',
      };

      await expect(
        service.cadastrarPj(dtoDuplicado as any),
      ).rejects.toThrow(ConflictException);
    });
  });
});