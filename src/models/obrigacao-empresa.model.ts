import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
} from 'sequelize-typescript';

@Table({
  tableName: 'obrigacao_empresa',
  timestamps: false,
})
export class ObrigacaoEmpresa extends Model<ObrigacaoEmpresa> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'id_obrigacao' })
  declare idObrigacao: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'id_empresa' })
  declare idEmpresa: number;

  @AllowNull(false)
  @Column({ type: DataType.DATE(3), field: 'created_at' })
  declare createdAt: Date;
}