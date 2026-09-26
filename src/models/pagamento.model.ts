import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull, Default, DeletedAt,
} from 'sequelize-typescript';

export enum TipoPagamento {
  AVISTA = 'avista',
  PARCELADO = 'parcelado',
}

@Table({
  tableName: 'pagamento',
  timestamps: false,
  paranoid: true,
  deletedAt: 'deletedAt',
})
export class Pagamento extends Model<Pagamento> {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  declare id: number;

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
  @Column(DataType.ENUM(...Object.values(TipoPagamento)))
  declare tipoPagamento: TipoPagamento;

  @AllowNull(false)
  @Column({ type: DataType.STRING(100), field: 'metodo_pagamento' })
  declare metodoPagamento: string;

  @Default(0) @AllowNull(false) @Column(DataType.DECIMAL(10, 2))
  declare taxa: number;

  @AllowNull(false)
  @Column({ type: DataType.DATE(3), field: 'created_at' })
  declare createdAt: Date;

  @DeletedAt @Column(DataType.DATE(3))
  declare deletedAt: Date | null;
}