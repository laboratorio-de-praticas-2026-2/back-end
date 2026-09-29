import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { Obrigacao } from './obrigacao.model.js';
import { Parcela } from './parcela.model.js';

@Table({
  tableName: 'pagamento',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})
export class Pagamento extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  // Prisma: idObrigacao. Atributo `obrigacaoId` mantido para casar com o service.
  @ForeignKey(() => Obrigacao)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true, field: 'id_obrigacao' })
  declare obrigacaoId: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'valor_total' })
  declare valorTotal: string;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'qtd_parcelas' })
  declare qtdParcelas: number;

  @Column({ type: DataType.ENUM('avista', 'parcelado'), allowNull: false, field: 'tipo_pagamento' })
  declare tipoPagamento: 'avista' | 'parcelado';

  @Column({ type: DataType.STRING(100), allowNull: false, field: 'metodo_pagamento' })
  declare metodoPagamento: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare taxa: string;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @BelongsTo(() => Obrigacao, 'obrigacaoId')
  declare obrigacao: Obrigacao;

  @HasMany(() => Parcela, 'idPagamento')
  declare parcelas: Parcela[];
}