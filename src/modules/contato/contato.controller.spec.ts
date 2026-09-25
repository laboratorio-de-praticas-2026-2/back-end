import { Test, TestingModule } from '@nestjs/testing';
import { ContatoController } from './contato.controller.js';
import { ContatoService } from './contato.service.js';
import { AuthService } from '../../commons/auth.service.js';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('ContatoController & ContatoService', () => {
  let controller: ContatoController;
  let service: ContatoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContatoController],
      providers: [
        ContatoService,
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    }).compile();

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
      cpf_cnpj: '123.456.789-00',
      celular: '11999998888',
      razaoSocial: 'Empresa de Teste LTDA',
      nomeFantasia: 'Teste Soluções',
      cnpj: '12.345.678/0001-90',
      regimeTributario: 'simples_nacional',
    };

    it('deve cadastrar um cliente PJ com sucesso', async () => {
      const resultado = await service.cadastrarPj(payloadValido as any);

      expect(resultado).toHaveProperty('mensagem', 'Cadastro PJ realizado com sucesso.');
      expect(resultado.usuario).toHaveProperty('id');
      expect(resultado.usuario).not.toHaveProperty('senha');
      expect(resultado.empresa.cnpj).toBe('12345678000190');
    });

    it('deve rejeitar e-mail com formato inválido', async () => {
      const dtoInvalido = { ...payloadValido, email: 'email_invalido' };
      await expect(service.cadastrarPj(dtoInvalido as any)).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar CNPJ com formato inválido', async () => {
      const dtoInvalido = { ...payloadValido, cnpj: '123' };
      await expect(service.cadastrarPj(dtoInvalido as any)).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar CPF/CNPJ do responsável com formato inválido', async () => {
      const dtoInvalido = { ...payloadValido, cpf_cnpj: '123' };
      await expect(service.cadastrarPj(dtoInvalido as any)).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar e-mail duplicado', async () => {
      await service.cadastrarPj(payloadValido as any);
      const dtoDuplicado = { ...payloadValido, cnpj: '98.765.432/0001-10' };

      await expect(service.cadastrarPj(dtoDuplicado as any)).rejects.toThrow(ConflictException);
    });

    it('deve rejeitar CNPJ duplicado', async () => {
      await service.cadastrarPj(payloadValido as any);
      const dtoDuplicado = { ...payloadValido, email: 'outro.email@exemplo.com' };

      await expect(service.cadastrarPj(dtoDuplicado as any)).rejects.toThrow(ConflictException);
    });
  });
});