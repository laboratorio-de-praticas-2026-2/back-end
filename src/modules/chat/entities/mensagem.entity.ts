import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { Conversa } from './conversa.entity.js';

@Table({ tableName: 'mensagens', updatedAt: false })
export class Mensagem extends Model<
  InferAttributes<Mensagem>,
  InferCreationAttributes<Mensagem>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @ForeignKey(() => Conversa)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare conversaId: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare conteudo: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare remetenteId: number;

  @CreatedAt
  declare criadoEm: CreationOptional<Date>;
}