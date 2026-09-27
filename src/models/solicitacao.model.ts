import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull, Default, DeletedAt,
} from 'sequelize-typescript';

export enum StatusSolicitacao {
  RECEBIDO = 'recebido',
  AGUARDANDO_PAGAMENTO = 'aguardando_pagamento',
  AGUARDANDO_DOCUMENTO = 'aguardando_documento',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
}

@Table({
  tableName: 'solicitacao',
  timestamps: false,
  paranoid: true,
  deletedAt: 'deletedAt',
})
export class Solicitacao extends Model<Solicitacao> {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'usuario_id' })
  declare usuarioId: number;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER, field: 'empresa_id' })
  declare empresaId: number | null;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'servico_id' })
  declare servicoId: number;

  @Default(StatusSolicitacao.RECEBIDO)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(StatusSolicitacao)))
  declare status: StatusSolicitacao;

  @AllowNull(true)
  @Column({ type: DataType.TEXT, field: 'observacao_cliente' })
  declare observacaoCliente: string | null;

  @AllowNull(true)
  @Column({ type: DataType.TEXT, field: 'observacao_admin' })
  declare observacaoAdmin: string | null;

  @AllowNull(false)
  @Column({ type: DataType.DATE(3), field: 'data_solicitacao' })
  declare dataSolicitacao: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE(3), field: 'data_conclusao' })
  declare dataConclusao: Date | null;

  @DeletedAt @Column(DataType.DATE(3))
  declare deletedAt: Date | null;
}