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

function presentEmpresaResumo(empresa: EmpresaRecord) {
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

export function presentUsuario(usuario: UsuarioRecord) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    celular: usuario.celular,
    cpfCnpj: usuario.cpfCnpj,
    dataCadastro: usuario.dataCadastro,
    empresas: usuario.empresas.map((empresa) => presentEmpresaResumo(empresa)),
  };
}

export function presentEmpresa(empresa: EmpresaWithUsuarioRecord) {
  return {
    ...presentEmpresaResumo(empresa),
    titular: { id: empresa.usuario.id, nome: empresa.usuario.nome, email: empresa.usuario.email },
  };
}
