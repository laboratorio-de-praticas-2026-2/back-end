import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull, Default, DeletedAt, CreatedAt, UpdatedAt, ForeignKey, BelongsTo, HasMany
} from 'sequelize-typescript';
import { Obrigacao } from './obrigacao.model.js';
import { Parcela } from './parcela.model.js';
import type { NonAttribute } from 'sequelize';

export enum TipoPagamento {
  AVISTA = 'avista',
  PARCELADO = 'parcelado',
}

@Table({
  tableName: 'pagamento',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})
export class Pagamento extends Model<Pagamento> {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Obrigacao)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'id_obrigacao' })
  declare idObrigacao: number;

  @AllowNull(false)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'valor_total' })
  declare valorTotal: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'qtd_parcelas' })
  declare qtdParcelas: number;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(TipoPagamento)),
    field: 'tipo_pagamento',
  })
  declare tipoPagamento: TipoPagamento;

  @AllowNull(false)
  @Column({ type: DataType.STRING(100), field: 'metodo_pagamento' })
  declare metodoPagamento: string;

  @Default(0) @AllowNull(false) @Column(DataType.DECIMAL(10, 2))
  declare taxa: number;

  @CreatedAt
  @AllowNull(false)
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @BelongsTo(() => Obrigacao, 'idObrigacao')
  declare obrigacao: NonAttribute<Obrigacao>;

  @HasMany(() => Parcela, 'idPagamento')
  declare parcelas: Parcela[];
}