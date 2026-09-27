import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException } from '@nestjs/common';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { PasswordService } from '../../commons/password.service.js';
import { Usuario } from '../../models/usuario.model.js';
import { ClienteService } from './cliente.service.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';

const validDto: CreateClienteDto = {
  nome: ' Maria da Silva ',
  email: ' MARIA@EXAMPLE.COM ',
  senha: 'SenhaSegura123',
  cpfCnpj: '529.982.247-25',
  celular: ' 11999999999 ',
};

describe('ClienteService', () => {
  let service: ClienteService;
  const usuarioModel = {
    findOne: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClienteService,
        PasswordService,
        {
          provide: getModelToken(Usuario),
          useValue: usuarioModel,
        },
      ],
    }).compile();

    service = module.get<ClienteService>(ClienteService);
  });

  it('normaliza dados, define cliente, gera hash e remove senha da resposta', async () => {
    usuarioModel.findOne.mockResolvedValue(null);
    usuarioModel.create.mockImplementation(async (data) => ({
      ...data,
      id: 1,
      dataCadastro: new Date(),
      toJSON: () => ({ ...data, id: 1, senha: data.senha }),
    }));

    const response = await service.create(validDto);
    const createdData = usuarioModel.create.mock.calls[0][0];

    expect(createdData).toMatchObject({
      nome: 'Maria da Silva',
      email: 'maria@example.com',
      nivel: NivelUsuarioEnum.cliente,
      cpfCnpj: validDto.cpfCnpj,
      celular: '11999999999',
    });
    expect(createdData.senha).not.toBe(validDto.senha);
    expect(response).not.toHaveProperty('senha');
    expect(response).toMatchObject({ id: 1, email: 'maria@example.com' });
  });

  it('rejeita e-mail duplicado', async () => {
    usuarioModel.findOne.mockResolvedValue({ id: 1 });

    await expect(service.create(validDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(usuarioModel.create).not.toHaveBeenCalled();
  });

  it('rejeita CPF duplicado depois de verificar o e-mail', async () => {
    usuarioModel.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1 });

    await expect(service.create(validDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(usuarioModel.create).not.toHaveBeenCalled();
  });
});
