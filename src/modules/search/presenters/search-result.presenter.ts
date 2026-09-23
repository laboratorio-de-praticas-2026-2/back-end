import { NivelUsuarioEnum } from '../../../commons/constantes/nivel-usuario-enum.js';
import type { UserRole } from '../../../commons/decorators/current-role.decorator.js';
import { maskDocument } from '../../../commons/validators/document.validator.js';

export interface EmpresaRecord {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  regimeTributario: string;
  dataAbertura: Date | null;
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;
}

export interface UsuarioRecord {
  id: number;
  nome: string;
  email: string;
  celular: string | null;
  cpfCnpj: string | null;
  dataCadastro: Date;
  empresas: EmpresaRecord[];
}

export interface EmpresaWithUsuarioRecord extends EmpresaRecord {
  usuario: { id: number; nome: string; email: string };
}

function presentEmpresaResumo(empresa: EmpresaRecord, role: UserRole) {
  if (role === NivelUsuarioEnum.administrador) {
    return {
      id: empresa.id,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpj: empresa.cnpj,
      regimeTributario: empresa.regimeTributario,
      dataAbertura: empresa.dataAbertura,
      inscricaoEstadual: empresa.inscricaoEstadual,
      inscricaoMunicipal: empresa.inscricaoMunicipal,
    };
  }

  return {
    razaoSocial: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia,
    cnpj: maskDocument(empresa.cnpj),
    regimeTributario: empresa.regimeTributario,
  };
}

export function presentUsuario(usuario: UsuarioRecord, role: UserRole) {
  const empresas = usuario.empresas.map((empresa) => presentEmpresaResumo(empresa, role));

  if (role === NivelUsuarioEnum.administrador) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      celular: usuario.celular,
      cpfCnpj: usuario.cpfCnpj,
      dataCadastro: usuario.dataCadastro,
      empresas,
    };
  }

  return {
    nome: usuario.nome,
    cpfCnpj: usuario.cpfCnpj ? maskDocument(usuario.cpfCnpj) : null,
    empresas,
  };
}

export function presentEmpresa(empresa: EmpresaWithUsuarioRecord, role: UserRole) {
  const empresaResumo = presentEmpresaResumo(empresa, role);

  if (role === NivelUsuarioEnum.administrador) {
    return {
      ...empresaResumo,
      titular: { id: empresa.usuario.id, nome: empresa.usuario.nome, email: empresa.usuario.email },
    };
  }

  return {
    ...empresaResumo,
    titular: { nome: empresa.usuario.nome },
  };
}
