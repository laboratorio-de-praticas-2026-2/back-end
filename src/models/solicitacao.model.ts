import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull, Default, DeletedAt, UpdatedAt, HasMany, BelongsTo, ForeignKey
} from 'sequelize-typescript';
import { Servico } from './servico.model.js';
import { DocumentoSolicitacao } from './documento-solicitacao.model.js';
import { ObrigacaoServico } from './obrigacao-servico.model.js';
import type { NonAttribute } from 'sequelize';

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
  timestamps: true,
  paranoid: true,
  createdAt: false,
  updatedAt: 'updatedAt',
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

  @ForeignKey(() => Servico)
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
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW, field: 'data_solicitacao' })
  declare dataSolicitacao: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE, field: 'data_conclusao' })
  declare dataConclusao: Date | null;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @BelongsTo(() => Servico, 'servicoId')
  declare servico: NonAttribute<Servico>;

  @HasMany(() => DocumentoSolicitacao, 'solicitacaoId')
  declare documentos: DocumentoSolicitacao[];

  @HasMany(() => ObrigacaoServico, 'solicitacaoId')
  declare obrigacaoServico: ObrigacaoServico[];
}