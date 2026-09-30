import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { Servico } from './servico.model.js';
import { DocumentoSolicitacao } from './documento-solicitacao.model.js';
import { ObrigacaoServico } from './obrigacao-servico.model.js';
import { StatusSolicitacaoEnum } from '../commons/enums/status-solicitacao.enum.js';
import type { NonAttribute } from 'sequelize';

// A tabela solicitacao NÃO possui created_at (a data de criação é data_solicitacao).
@Table({
  tableName: 'solicitacao',
  timestamps: true,
  paranoid: true,
  createdAt: false,
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})
export class Solicitacao extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  // FKs para usuario/empresa: models ainda não criados, por isso sem @ForeignKey.
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'usuario_id' })
  declare usuarioId: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'empresa_id' })
  declare empresaId: number | null;

  @ForeignKey(() => Servico)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'servico_id' })
  declare servicoId: number;

  @Column({
    type: DataType.ENUM(...Object.values(StatusSolicitacaoEnum)),
    allowNull: false,
    defaultValue: StatusSolicitacaoEnum.RECEBIDO,
  })
  declare status: StatusSolicitacaoEnum;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'observacao_cliente' })
  declare observacaoCliente: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'observacao_admin' })
  declare observacaoAdmin: string | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW, field: 'data_solicitacao' })
  declare dataSolicitacao: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'data_conclusao' })
  declare dataConclusao: Date | null;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @BelongsTo(() => Servico, 'servicoId')
  declare servico: NonAttribute<Servico>;

  @HasMany(() => DocumentoSolicitacao, 'solicitacaoId')
  declare documentos: DocumentoSolicitacao[];

  @HasMany(() => ObrigacaoServico, 'solicitacaoId')
  declare obrigacaoServico: ObrigacaoServico[];
}