import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
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
export class Servico extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare nome: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare descricao: string | null;

  // DECIMAL vem como string do driver MySQL
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true, field: 'valor_base' })
  declare valorBase: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'prazo_estimado_dias' })
  declare prazoEstimadoDias: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativo: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'exige_empresa' })
  declare exigeEmpresa: boolean;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @HasMany(() => Solicitacao, 'servicoId')
  declare solicitacoes: Solicitacao[];

  @HasMany(() => ObrigacaoServico, 'idServico')
  declare obrigacaoServico: ObrigacaoServico[];
}