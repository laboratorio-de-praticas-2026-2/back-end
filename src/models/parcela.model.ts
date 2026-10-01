import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull, Default, DeletedAt, CreatedAt, UpdatedAt, ForeignKey, BelongsTo
} from 'sequelize-typescript';
import { Pagamento } from './pagamento.model.js';
import type { NonAttribute } from 'sequelize';

export enum StatusParcela {
  PAGO = 'pago',
  ATRASADO = 'atrasado',
  ATIVO = 'ativo',
}

@Table({
  tableName: 'parcela',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})
export class Parcela extends Model<Parcela> {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Pagamento)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'id_pagamento' })
  declare idPagamento: number;

  @AllowNull(false) @Column(DataType.DECIMAL(10, 2))
  declare valor: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'numero_parcela' })
  declare numeroParcela: number;

  @Default(StatusParcela.ATIVO)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(StatusParcela)))
  declare status: StatusParcela;

  @AllowNull(false) @Column(DataType.DATEONLY)
  declare vencimento: string;

  @AllowNull(true) @Column({ type: DataType.DATEONLY, field: 'data_pagamento' })
  declare dataPagamento: string | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @BelongsTo(() => Pagamento, 'idPagamento')
  declare pagamento: NonAttribute<Pagamento>;
}