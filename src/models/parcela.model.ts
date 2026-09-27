import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull, Default, DeletedAt,
} from 'sequelize-typescript';

export enum StatusParcela {
  PAGO = 'pago',
  ATRASADO = 'atrasado',
  ATIVO = 'ativo',
}

@Table({
  tableName: 'parcela',
  timestamps: false,
  paranoid: true,
  deletedAt: 'deletedAt',
})
export class Parcela extends Model<Parcela> {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  declare id: number;

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

  @AllowNull(true) @Column(DataType.DATEONLY)
  declare dataPagamento: string | null;

  @DeletedAt @Column(DataType.DATE(3))
  declare deletedAt: Date | null;
}