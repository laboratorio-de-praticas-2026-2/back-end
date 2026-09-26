import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Empresa } from './empresa.model.js';

@Table({ tableName: 'usuario', timestamps: false })
export class Usuario extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  declare id: number;

  @Column({ type: DataType.STRING(100) })
  declare nome: string;

  @Column({ type: DataType.STRING(100) })
  declare email: string;

  @Column({ type: DataType.STRING(255) })
  declare senha: string;

  @Column({ type: DataType.ENUM('cliente', 'administrador'), defaultValue: 'cliente' })
  declare nivel: 'cliente' | 'administrador';

  @Column({ field: 'cpf_cnpj', type: DataType.STRING(20), allowNull: true })
  declare cpfCnpj: string | null;

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare celular: string | null;

  @Column({ field: 'data_cadastro', type: DataType.DATE })
  declare dataCadastro: Date;

  @HasMany(() => Empresa, { foreignKey: 'usuarioId', as: 'empresas' })
  declare empresas: Empresa[];
}
