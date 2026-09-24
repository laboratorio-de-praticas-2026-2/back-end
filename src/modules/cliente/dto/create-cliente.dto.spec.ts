import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateClienteDto } from './create-cliente.dto.js';

describe('CreateClienteDto', () => {
  it('aceita um cadastro PF válido', async () => {
    const dto = plainToInstance(CreateClienteDto, {
      nome: 'Maria da Silva',
      email: 'maria@example.com',
      senha: 'SenhaSegura123',
      cpfCnpj: '529.982.247-25',
      celular: '11999999999',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejeita campos obrigatórios ausentes', async () => {
    const dto = plainToInstance(CreateClienteDto, {});

    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['nome', 'email', 'senha', 'cpfCnpj']),
    );
  });

  it('rejeita e-mail e CPF inválidos', async () => {
    const dto = plainToInstance(CreateClienteDto, {
      nome: 'Maria da Silva',
      email: 'email-invalido',
      senha: 'SenhaSegura123',
      cpfCnpj: '111.111.111-11',
    });

    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['email', 'cpfCnpj']),
    );
  });
});
