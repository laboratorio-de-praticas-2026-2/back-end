import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { Pagamento } from './pagamento.model.js';
import { StatusParcelaEnum } from '../commons/enums/status-parcela.enum.js';
import type { NonAttribute } from 'sequelize';

@Table({
  tableName: 'parcela',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})
export class Parcela extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Pagamento)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_pagamento' })
  declare idPagamento: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare valor: string;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'numero_parcela' })
  declare numeroParcela: number;

  @Column({
    type: DataType.ENUM(...Object.values(StatusParcelaEnum)),
    allowNull: false,
    defaultValue: StatusParcelaEnum.ATIVO,
  })
  declare status: StatusParcelaEnum;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare vencimento: string;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'data_pagamento' })
  declare dataPagamento: string | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @BelongsTo(() => Pagamento, 'idPagamento')
  declare pagamento: NonAttribute<Pagamento>;
}