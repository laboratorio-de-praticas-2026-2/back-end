import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
} from 'sequelize-typescript';
import { Solicitacao } from './solicitacao.model.js';

@Table({
  tableName: 'servico',
  timestamps: false,
})
export class Servico extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare nome: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare descricao: string | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare valorBase: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare prazoEstimadoDias: number | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare ativo: boolean;

  @HasMany(() => Solicitacao, 'servicoId')
  declare solicitacoes: Solicitacao[];
}