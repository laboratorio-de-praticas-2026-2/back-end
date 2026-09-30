import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt
} from 'sequelize-typescript';
import { Obrigacao } from './obrigacao.model.js';
import { Servico } from './servico.model.js';
import { Solicitacao } from './solicitacao.model.js';
import type { NonAttribute } from 'sequelize';

@Table({
  tableName: 'obrigacao_servico',
  timestamps: true,
  updatedAt: false,
})
export class ObrigacaoServico extends Model<ObrigacaoServico> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Obrigacao)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'id_obrigacao' })
  declare idObrigacao: number;

  @ForeignKey(() => Servico)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'id_servico' })
  declare idServico: number;

  @ForeignKey(() => Solicitacao)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'id_solicitacao' })
  declare solicitacaoId: number;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @BelongsTo(() => Obrigacao, 'idObrigacao')
  declare obrigacao: NonAttribute<Obrigacao>;

  @BelongsTo(() => Servico, 'idServico')
  declare servico: NonAttribute<Servico>;

  @BelongsTo(() => Solicitacao, 'solicitacaoId')
  declare solicitacao: NonAttribute<Solicitacao>;
}