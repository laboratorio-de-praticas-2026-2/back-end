import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull, Default, DeletedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'servico',
  timestamps: false,
  paranoid: true,
  deletedAt: 'deletedAt',
})
export class Servico extends Model<Servico> {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false) @Column(DataType.STRING(100))
  declare nome: string;

  @AllowNull(true) @Column(DataType.TEXT)
  declare descricao: string | null;

  @AllowNull(true) @Column(DataType.DECIMAL(10, 2))
  declare valorBase: number | null;

  @AllowNull(true) @Column(DataType.INTEGER)
  declare prazoEstimadoDias: number | null;

  @Default(true) @AllowNull(false) @Column(DataType.BOOLEAN)
  declare ativo: boolean;

  @DeletedAt @Column(DataType.DATE(3))
  declare deletedAt: Date | null;
}