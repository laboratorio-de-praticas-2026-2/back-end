import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { StatusConversa } from '../enums/status-conversa.enum.js';

@Table({ tableName: 'conversas' })
export class Conversa extends Model<
  InferAttributes<Conversa>,
  InferCreationAttributes<Conversa>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare clienteId: CreationOptional<number | null>;

  @AllowNull(true)
  @Column(DataType.STRING(120))
  declare visitanteId: CreationOptional<string | null>;

  @AllowNull(true)
  @Column(DataType.STRING(120))
  declare visitanteNome: CreationOptional<string | null>;

  @AllowNull(true)
  @Column(DataType.STRING(254))
  declare visitanteEmail: CreationOptional<string | null>;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare atendenteId: number;

  @AllowNull(false)
  @Default(StatusConversa.ABERTA)
  @Column(DataType.ENUM(...Object.values(StatusConversa)))
  declare status: CreationOptional<StatusConversa>;

  @CreatedAt
  declare criadoEm: CreationOptional<Date>;

  @UpdatedAt
  declare atualizadoEm: CreationOptional<Date>;
}
