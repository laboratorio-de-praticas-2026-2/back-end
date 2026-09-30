import {
  Table,
  Column,
  Model,
  DataType,
  HasOne,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { ObrigacaoServico } from './obrigacao-servico.model.js';
import { Pagamento } from './pagamento.model.js';
import type { NonAttribute } from 'sequelize';

@Table({
  tableName: 'obrigacao',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})
export class Obrigacao extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.ENUM('servico', 'empresa'), allowNull: false })
  declare tipo: 'servico' | 'empresa';

  @Column({ type: DataType.TEXT, allowNull: true })
  declare descricao: string | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare valor: string;

  @Column({ type: DataType.ENUM('pago', 'pendente'), allowNull: false, defaultValue: 'pendente' })
  declare status: 'pago' | 'pendente';

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare competencia: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare vencimento: string | null;

  // VARCHAR(100) livre no banco; valores esperados em NaturezaCobrancaEnum
  @Column({ type: DataType.STRING(100), allowNull: true, field: 'natureza_cobranca' })
  declare naturezaCobranca: string | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @HasOne(() => ObrigacaoServico, 'obrigacaoId')
  declare obrigacaoServico: NonAttribute<ObrigacaoServico>;

  @HasOne(() => Pagamento, 'obrigacaoId')
  declare pagamento: NonAttribute<Pagamento>;
}