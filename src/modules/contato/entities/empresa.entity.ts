import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'empresas', timestamps: true })
export class Empresa extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ allowNull: false })
  declare usuarioId: number;

  @Column({ allowNull: false })
  declare razaoSocial: string;

  @Column
  declare nomeFantasia: string;

  @Column({ allowNull: false, unique: true })
  declare cnpj: string;

  @Column({ defaultValue: 'simples_nacional' })
  declare regimeTributario: string;

  @Column
  declare inscricaoEstadual: string;

  @Column
  declare inscricaoMunicipal: string;

  @Column({ type: DataType.DATE })
  declare dataAbertura: Date;
}