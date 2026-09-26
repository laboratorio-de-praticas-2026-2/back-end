import { Table, Column, Model } from 'sequelize-typescript';

@Table({ tableName: 'usuarios', timestamps: true })
export class Usuario extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ allowNull: false })
  declare nome: string;

  @Column({ allowNull: false, unique: true })
  declare email: string;

  @Column({ allowNull: false })
  declare senha: string;

  @Column({ defaultValue: 'cliente' })
  declare nivel: string;

  @Column
  declare cpfCnpj: string;

  @Column
  declare celular: string;
}