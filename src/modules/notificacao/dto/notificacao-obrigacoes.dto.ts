export interface ObrigacaoNotificacao {
  descricao: string;
  valor: number;
  vencimento: string; // YYYY-MM-DD
}

export interface NotificacaoObrigacoesPayload {
  titulo: string;
  mensagem: string;
  obrigacoes: ObrigacaoNotificacao[];
  [key: string]: unknown;
}