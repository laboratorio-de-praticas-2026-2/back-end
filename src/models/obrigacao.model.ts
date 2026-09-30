import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull, Default, DeletedAt, CreatedAt, UpdatedAt, HasOne
} from 'sequelize-typescript';
import { ObrigacaoServico } from './obrigacao-servico.model.js';
import { Pagamento } from './pagamento.model.js';
import type { NonAttribute } from 'sequelize';

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
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})
export class Obrigacao extends Model<Obrigacao> {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TipoObrigacao)))
  declare tipo: TipoObrigacao;

  @AllowNull(true)
  @Column({
    type: DataType.ENUM(...Object.values(NaturezaCobranca)),
    field: 'natureza_cobranca',
  })
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

  @CreatedAt
  @AllowNull(false)
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @HasOne(() => ObrigacaoServico, 'idObrigacao')
  declare obrigacaoServico: NonAttribute<ObrigacaoServico>;

  @HasOne(() => Pagamento, 'idObrigacao')
  declare pagamento: NonAttribute<Pagamento>;
}