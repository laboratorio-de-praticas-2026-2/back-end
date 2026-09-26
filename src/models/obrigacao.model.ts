import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull, Default, DeletedAt,
} from 'sequelize-typescript';

export enum TipoObrigacao {
  SERVICO = 'servico',
  EMPRESA = 'empresa',
}

export enum StatusObrigacao {
  PAGO = 'pago',
  PENDENTE = 'pendente',
}

export enum NaturezaCobranca {
  TRIBUTO = 'tributo',
  MENSALIDADE = 'mensalidade',
  SERVICO_AVULSO = 'servico_avulso',
}

@Table({
  tableName: 'obrigacao',
  timestamps: false,
  paranoid: true,
  deletedAt: 'deletedAt',
})
export class Obrigacao extends Model<Obrigacao> {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TipoObrigacao)))
  declare tipo: TipoObrigacao;

  @AllowNull(true)
  @Column(DataType.ENUM(...Object.values(NaturezaCobranca)))
  declare naturezaCobranca: NaturezaCobranca | null;

  @AllowNull(true) @Column(DataType.TEXT)
  declare descricao: string | null;

  @AllowNull(false) @Column(DataType.DECIMAL(10, 2))
  declare valor: number;

  @Default(StatusObrigacao.PENDENTE)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(StatusObrigacao)))
  declare status: StatusObrigacao;

  @AllowNull(true) @Column(DataType.DATEONLY)
  declare competencia: string | null;

  @AllowNull(true) @Column(DataType.DATEONLY)
  declare vencimento: string | null;

  @AllowNull(false)
  @Column({ type: DataType.DATE(3), field: 'created_at' })
  declare createdAt: Date;

  @DeletedAt @Column(DataType.DATE(3))
  declare deletedAt: Date | null;
}