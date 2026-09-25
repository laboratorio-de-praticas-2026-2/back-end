export class CadastroPjDto {
  nome: string;
  email: string;
  senha: string;
  cpf_cnpj?: string;
  celular?: string;

  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  regimeTributario?: any;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  dataAbertura?: string;
}