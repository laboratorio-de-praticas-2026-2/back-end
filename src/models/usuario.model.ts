import {
  AutoIncrement,
  Column,
  DataType,
  Default,
  IsEmail,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { NivelUsuarioEnum } from '../commons/constantes/nivel-usuario-enum.js';

export interface UsuarioAttributes {
  id: number;
  nome: string;
  email: string;
  senha: string;
  nivel: NivelUsuarioEnum;
  cpfCnpj: string | null;
  celular: string | null;
  dataCadastro: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type UsuarioCreationAttributes = Optional<
  UsuarioAttributes,
  'id' | 'nivel' | 'cpfCnpj' | 'celular' | 'dataCadastro' | 'deletedAt'
>;

@Table({ tableName: 'usuario', timestamps: false })
export class Usuario
  extends Model<UsuarioAttributes, UsuarioCreationAttributes>
  implements UsuarioAttributes
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare nome: string;

  @IsEmail
  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare senha: string;

  @Default(NivelUsuarioEnum.cliente)
  @Column({
    type: DataType.ENUM(...Object.values(NivelUsuarioEnum)),
    allowNull: false,
  })
  declare nivel: NivelUsuarioEnum;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    unique: true,
    field: 'cpf_cnpj',
  })
  declare cpfCnpj: string | null;

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare celular: string | null;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, allowNull: false, field: 'data_cadastro' })
  declare dataCadastro: Date;

  @Column({ type: DataType.DATE, allowNull: false, field: 'updated_at' })
  declare updatedAt: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_at' })
  declare deletedAt: Date | null;
}
