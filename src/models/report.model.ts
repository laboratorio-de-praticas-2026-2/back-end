import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'reports',
  timestamps: false,
})
export class Report extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare nome: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare categoria: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare descricao: string;

  @Column({
    field: 'data_inicio',
    type: DataType.DATE,
    allowNull: false,
  })
  declare dataInicio: Date;

  @Column({
    field: 'data_termino',
    type: DataType.DATE,
    allowNull: false,
  })
  declare dataTermino: Date;

  @Column({
    type: DataType.ENUM('PENDENTE', 'GERADO', 'FALHA'),
    allowNull: false,
    defaultValue: 'PENDENTE',
  })
  declare status: 'PENDENTE' | 'GERADO' | 'FALHA';

  @Column({
    field: 'arquivo_url',
    type: DataType.STRING(2048),
    allowNull: true,
  })
  declare arquivoUrl: string | null;
}