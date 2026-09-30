import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { Obrigacao } from './obrigacao.model.js';
import { Servico } from './servico.model.js';
import { Solicitacao } from './solicitacao.model.js';
import type { NonAttribute } from 'sequelize';

@Table({
  tableName: 'obrigacao_servico',
  timestamps: true,
  paranoid: false,
  createdAt: 'createdAt',
  updatedAt: false,
})
export class ObrigacaoServico extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Obrigacao)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true, field: 'id_obrigacao' })
  declare obrigacaoId: number;

  @ForeignKey(() => Servico)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_servico' })
  declare idServico: number;

  // Atenção: a coluna é id_solicitacao (e não solicitacao_id)
  @ForeignKey(() => Solicitacao)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_solicitacao' })
  declare solicitacaoId: number;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @BelongsTo(() => Obrigacao, 'obrigacaoId')
  declare obrigacao: NonAttribute<Obrigacao>;

  @BelongsTo(() => Servico, 'idServico')
  declare servico: NonAttribute<Servico>;

  @BelongsTo(() => Solicitacao, 'solicitacaoId')
  declare solicitacao: NonAttribute<Solicitacao>;
}