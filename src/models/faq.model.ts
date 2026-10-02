import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'Faq',
  timestamps: false,
})
export class Faq extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare pergunta: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare resposta: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare status: boolean;

  @Column({
    type: DataType.ENUM(
      'documentacao',
      'tributos',
      'obrigacoes_acessorias',
      'folha_pagamento',
      'frequentes',
    ),
    allowNull: false,
  })
  declare categoria: string;
}