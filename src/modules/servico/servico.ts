import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'servicos',
  timestamps: true,
})
export class Servico extends Model<Servico> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  titulo: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  descricao: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  icone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  honorarios: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  ativo: boolean;
}