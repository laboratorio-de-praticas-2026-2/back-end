import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'Blog',
  timestamps: false,
})
export class Blog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare titulo: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare conteudo: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare data_publicacao: string;

  @Column(DataType.STRING)
  declare url_imagem: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare ativo: boolean;

  @Column(DataType.STRING)
  declare olho_do_texto: string;

  @Column({
    type: DataType.ENUM(
      'Legislacao',
      'ImpostoDeRenda',
      'ObrigacoesAcessorias',
      'FolhaDePagamento',
      'SimplesNacional',
    ),
    allowNull: false,
  })
  declare categoria: string;
}