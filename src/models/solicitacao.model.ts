import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

import { Servico } from './servico.model.js';
import { DocumentoSolicitacao } from './documento-solicitacao.model.js';
import { StatusSolicitacaoEnum } from '../commons/enums/status-solicitacao.enum.js';

@Table({
  tableName: 'solicitacao',
  timestamps: false,
})
export class Solicitacao extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare usuarioId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare empresaId: number | null;

  @ForeignKey(() => Servico)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare servicoId: number;

  @Column({
    type: DataType.ENUM(...Object.values(StatusSolicitacaoEnum)),
    allowNull: false,
    defaultValue: StatusSolicitacaoEnum.RECEBIDO,
  })
  declare status: StatusSolicitacaoEnum;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare observacaoCliente: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare observacaoAdmin: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare dataSolicitacao: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare dataConclusao: Date | null;

  @BelongsTo(() => Servico, 'servicoId')
  declare servico: Servico;

  @HasMany(() => DocumentoSolicitacao, 'solicitacaoId')
  declare documentos: DocumentoSolicitacao[];
}