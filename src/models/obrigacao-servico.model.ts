import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull,
} from 'sequelize-typescript';

@Table({
  tableName: 'obrigacao_servico',
  timestamps: false,
})
export class ObrigacaoServico extends Model<ObrigacaoServico> {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'id_obrigacao' })
  declare idObrigacao: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'id_servico' })
  declare idServico: number;
}