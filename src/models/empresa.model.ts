import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Usuario } from './usuario.model.js';

@Table({ tableName: 'empresa', timestamps: false })
export class Empresa extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  declare id: number;

  @ForeignKey(() => Usuario)
  @Column({ field: 'usuario_id', type: DataType.INTEGER })
  declare usuarioId: number;

  @Column({ field: 'razao_social', type: DataType.STRING(150) })
  declare razaoSocial: string;

  @Column({ field: 'nome_fantasia', type: DataType.STRING(150), allowNull: true })
  declare nomeFantasia: string | null;

  @Column({ type: DataType.STRING(20) })
  declare cnpj: string;

  @Column({
    field: 'regime_tributario',
    type: DataType.ENUM('mei', 'simples_nacional', 'lucro_presumido', 'lucro_real'),
    defaultValue: 'simples_nacional',
  })
  declare regimeTributario: 'mei' | 'simples_nacional' | 'lucro_presumido' | 'lucro_real';

  @Column({ field: 'inscricao_estadual', type: DataType.STRING(30), allowNull: true })
  declare inscricaoEstadual: string | null;

  @Column({ field: 'inscricao_municipal', type: DataType.STRING(30), allowNull: true })
  declare inscricaoMunicipal: string | null;

  @Column({ field: 'data_abertura', type: DataType.DATEONLY, allowNull: true })
  declare dataAbertura: Date | null;

  @BelongsTo(() => Usuario, { foreignKey: 'usuarioId', as: 'usuario' })
  declare usuario: Usuario;
}
