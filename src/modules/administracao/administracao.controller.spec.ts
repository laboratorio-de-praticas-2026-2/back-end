import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { AdministracaoController } from './administracao.controller.js';

const service = {
  listarUsuarios: vi.fn().mockResolvedValue([]),
  buscarUsuario: vi.fn().mockResolvedValue({ id: 1 }),
  atualizarUsuario: vi.fn().mockResolvedValue({ id: 1 }),
};

describe('AdministracaoController', () => {
  it('restringe a controller ao administrador', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdministracaoController)).toEqual([
      NivelUsuarioEnum.administrador,
    ]);
  });

  it('delega listagem, consulta e atualização ao service', async () => {
    const controller = new AdministracaoController(service as never);

    await controller.listarUsuarios();
    await controller.buscarUsuario(1);
    await controller.atualizarUsuario(1, { nome: 'Maria' });

    expect(service.listarUsuarios).toHaveBeenCalled();
    expect(service.buscarUsuario).toHaveBeenCalledWith(1);
    expect(service.atualizarUsuario).toHaveBeenCalledWith(1, { nome: 'Maria' });
  });
});
