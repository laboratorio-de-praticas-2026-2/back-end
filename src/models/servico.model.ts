import {
  Table, Column, Model, DataType, PrimaryKey, AutoIncrement,
  AllowNull, Default, DeletedAt, CreatedAt, UpdatedAt, HasMany
} from 'sequelize-typescript';
import { Solicitacao } from './solicitacao.model.js';
import { ObrigacaoServico } from './obrigacao-servico.model.js';

@Table({
  tableName: 'servico',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})
export class Servico extends Model<Servico> {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false) @Column(DataType.STRING(100))
  declare nome: string;

  @AllowNull(true) @Column(DataType.TEXT)
  declare descricao: string | null;

  @AllowNull(true) @Column({ type: DataType.DECIMAL(10, 2), field: 'valor_base' })
  declare valorBase: number | null;

  @AllowNull(true) @Column({ type: DataType.INTEGER, field: 'prazo_estimado_dias' })
  declare prazoEstimadoDias: number | null;

  @Default(true) @AllowNull(false) @Column(DataType.BOOLEAN)
  declare ativo: boolean;

  @Default(false) @AllowNull(false) @Column({ type: DataType.BOOLEAN, field: 'exige_empresa' })
  declare exigeEmpresa: boolean;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @HasMany(() => Solicitacao, 'servicoId')
  declare solicitacoes: Solicitacao[];

  @HasMany(() => ObrigacaoServico, 'idServico')
  declare obrigacaoServico: ObrigacaoServico[];
}