import { SetMetadata } from '@nestjs/common';
import type { NivelUsuarioEnum } from '../../../commons/constantes/nivel-usuario-enum.js';

export const ROLES_KEY = 'roles';

/** Restringe a rota aos níveis informados. Use junto com AuthGuard e RolesGuard. */
export const Roles = (...niveis: NivelUsuarioEnum[]) =>
  SetMetadata(ROLES_KEY, niveis);
