import { describe, expect, it } from 'vitest';
import { validationPipe } from '../../../commons/pipes/validation.pipe.js';
import { UpdateContatoDto } from './update-contato.dto.js';
import { CreateMensagemDto } from '../mensagem/dto/create-mensagem.dto.js';

describe('Validacao HTTP de contato e mensagem', () => {
  const mensagem = {
    primeiroNome: 'Teste', ultimoNome: 'Postman', email: 'teste@example.com',
    assunto: 'Impostos', mensagem: 'Mensagem de teste',
  };
  it('aceita atualizacao parcial de contato com a whitelist global', async () => {
    await expect(validationPipe.transform({ email: 'teste@example.com' },
      { type: 'body', metatype: UpdateContatoDto })).resolves.toMatchObject({ email: 'teste@example.com' });
  });
  it('aceita mensagem completa com a whitelist global', async () => {
    await expect(validationPipe.transform(mensagem,
      { type: 'body', metatype: CreateMensagemDto })).resolves.toMatchObject(mensagem);
  });
  it.each([{ email: 'invalido' }, { telefone: 123 }, { campoDesconhecido: true }])(
    'rejeita contato invalido: %j', async (body) => {
      await expect(validationPipe.transform(body,
        { type: 'body', metatype: UpdateContatoDto })).rejects.toMatchObject({ status: 400 });
    });
  it.each([{}, { ...mensagem, primeiroNome: 123 }, { ...mensagem, assunto: 'invalido' }])(
    'rejeita mensagem invalida: %j', async (body) => {
      await expect(validationPipe.transform(body,
        { type: 'body', metatype: CreateMensagemDto })).rejects.toMatchObject({ status: 400 });
    });
});
