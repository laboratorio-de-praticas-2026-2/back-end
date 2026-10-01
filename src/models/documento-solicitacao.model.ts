import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { Solicitacao } from './solicitacao.model.js';
import { StatusValidacaoDocumentoEnum } from '../commons/enums/status-validacao-documento.enum.js';
import type { NonAttribute } from 'sequelize';

// A tabela documento_solicitacao NÃO possui created_at.
@Table({
  tableName: 'documento_solicitacao',
  timestamps: true,
  paranoid: true,
  createdAt: false,
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})
export class DocumentoSolicitacao extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Solicitacao)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'solicitacao_id' })
  declare solicitacaoId: number;

  @Column({ type: DataType.STRING(191), allowNull: true, field: 'nome_hash' })
  declare nomeHash: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'tipo_documento' })
  declare tipoDocumento: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(StatusValidacaoDocumentoEnum)),
    allowNull: false,
    defaultValue: StatusValidacaoDocumentoEnum.PENDENTE,
    field: 'status_validacao',
  })
  declare statusValidacao: StatusValidacaoDocumentoEnum;

  @Column({ type: DataType.DATE, allowNull: true, field: 'data_upload' })
  declare dataUpload: Date | null;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_at' })
  declare deletedAt: Date | null;

  @BelongsTo(() => Solicitacao, 'solicitacaoId')
 declare solicitacao: NonAttribute<Solicitacao>;
}