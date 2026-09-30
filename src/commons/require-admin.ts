import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import { NivelUsuarioEnum } from './constantes/nivel-usuario-enum.js';
import type { AuthenticatedUser } from './decorators/current-role.decorator.js';

/**
 * Verifica se o usuário autenticado possui permissão administrativa.
 *
 * Essa função NÃO realiza a autenticação e NÃO valida o JWT.
 * Essa responsabilidade continua pertencendo à infraestrutura de
 * autenticação existente no projeto.
 *
 * O usuário recebido aqui já é o resultado do processo realizado
 * pelo CurrentUser/AuthService.
 *
 * Fluxo esperado:
 *
 * Requisição
 *    ↓
 * AuthService / CurrentUser
 *    ↓
 * requireAdmin()
 *    ↓
 * ┌─────────────────────────────────┐
 * │ Sem usuário       → HTTP 401    │
 * │ Cliente           → HTTP 403    │
 * │ Administrador     → permitido   │
 * └─────────────────────────────────┘
 *
 * A função será utilizada nas operações administrativas do CMS,
 * como cadastrar, editar, pausar, reativar e remover registros.
 */
export function requireAdmin(
  user: AuthenticatedUser | null,
): AuthenticatedUser {

  // CurrentUser retorna null quando não existe um usuário
  // autenticado válido para a requisição.
  //
  // Nesse cenário a operação administrativa não pode continuar.
  if (!user) {
    throw new UnauthorizedException(
      'Autenticação necessária.',
    );
  }

  // Estar autenticado não significa possuir permissão administrativa.
  //
  // Um usuário com perfil "cliente", por exemplo, pode utilizar
  // funcionalidades autenticadas da aplicação, mas não deve
  // cadastrar, editar, pausar ou excluir dados do CMS.
  if (user.role !== NivelUsuarioEnum.administrador) {
    throw new ForbiddenException(
      'Acesso restrito a administradores.',
    );
  }

  // Se chegou até este ponto:
  // 1. existe um usuário autenticado;
  // 2. seu perfil é administrador.
  //
  // Retornamos o próprio usuário para permitir seu reaproveitamento
  // futuramente caso alguma operação precise de seus dados.
  return user;
}