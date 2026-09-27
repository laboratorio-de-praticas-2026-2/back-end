import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Solicitacao } from './solicitacao.model.js';
import { StatusValidacaoDocumentoEnum } from '../commons/enums/status-validacao-documento.enum.js';

@Table({
  tableName: 'documento_solicitacao',
  timestamps: false,
})
export class DocumentoSolicitacao extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Solicitacao)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare solicitacaoId: number;

  @Column({
    type: DataType.STRING(191),
    allowNull: true,
  })
  declare nomeHash: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare tipoDocumento: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(StatusValidacaoDocumentoEnum)),
    allowNull: false,
    defaultValue: StatusValidacaoDocumentoEnum.PENDENTE,
  })
  declare statusValidacao: StatusValidacaoDocumentoEnum;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare dataUpload: Date | null;

  @BelongsTo(() => Solicitacao, 'solicitacaoId')
  declare solicitacao: Solicitacao;
}