import {PasswordService} from '../../commons/password.service.js';
import {getConnectionToken} from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BadRequestException, ConflictException } from '@nestjs/common';

import { ContatoController } from './contato.controller.js';
import { ContatoService } from './contato.service.js';
import { AuthService } from '../../commons/auth.service.js';

import { Usuario } from '../../models/usuario.model.js';
import { Empresa } from '../../models/empresa.model.js';

import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('ContatoController & ContatoService', () => {
  let controller: ContatoController;
  let service: ContatoService;

  beforeEach(async () => {
    const usuarios: any[] = [];
    const empresas: any[] = [];

    const usuarioModelMock = {
      findOne: async ({ where }: any) => {
        return (
          usuarios.find((usuario) => usuario.email === where.email) ?? null
        );
      },

      create: async (dados: any) => {
        const novoUsuario = {
          id: usuarios.length + 1,
          ...dados,
          get: (_options: { plain: boolean }) => ({
            id: novoUsuario.id,
            ...dados,
          }),
        };

        usuarios.push(novoUsuario);

        return novoUsuario;
      },
    };

    const empresaModelMock = {
      findOne: async ({ where }: any) => {
        return (
          empresas.find((empresa) => empresa.cnpj === where.cnpj) ?? null
        );
      },

      create: async (dados: any) => {
        const novaEmpresa = {
          id: empresas.length + 1,
          ...dados,
        };

        empresas.push(novaEmpresa);

        return novaEmpresa;
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContatoController],
      providers: [
        ContatoService,
        PasswordService,
        {provide:getConnectionToken(),useValue:{transaction:async(fn: (t: unknown)=>unknown)=>fn({})}},
        {
          provide: AuthService,
          useValue: {},
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
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<ContatoController>(ContatoController);
    service = module.get<ContatoService>(ContatoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('cadastrarPj', () => {
    const payloadValido = {
      nome: 'Kauã Rodrigues',
      email: 'kaua.teste@exemplo.com',
      senha: 'SenhaMuitoSegura123',
      cpf_cnpj: '529.982.247-25',
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
