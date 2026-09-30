import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
} from 'sequelize-typescript';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

@Table({
  tableName: 'publicidade', // Nome esperado da tabela no banco
  timestamps: true, createdAt: false, updatedAt: 'updated_at',       // O ER atual não define createdAt/updatedAt
})
export class Publicidade extends Model<
  InferAttributes<Publicidade>,
  InferCreationAttributes<Publicidade>
> {

  // Identificador único do anúncio.
  // FRONT: utilizado para buscar, editar, pausar ou remover um anúncio.
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: CreationOptional<number>;

  // Título principal apresentado na área de Publicidade.
  @AllowNull(true)
  @Column(DataType.STRING(150))
  declare titulo: string | null;

  // Conteúdo/texto associado ao anúncio.
  @AllowNull(true)
  @Column(DataType.TEXT)
  declare conteudo: string | null;

  // URL da imagem utilizada pelo anúncio.
  //
  // Banco: url_imagem
  // API/FRONT: urlImagem
  @AllowNull(true)
  @Column({
    type: DataType.STRING(191),
    field: 'url_imagem',
  })
  declare urlImagem: string | null;

  // Controla a disponibilidade do anúncio.
  //
  // true  = anúncio ativo / disponível para Publicidade
  // false = anúncio pausado / não deve ser exibido
  //
  // FRONT: o CMS utilizará esse campo para representar
  // visualmente se o anúncio está ativo ou pausado.
  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare ativo: CreationOptional<boolean>;
}


// Comentários dispostos temporariamente até a integração do front-end
// To-do: Elaborar documentação descritiva e apagar comentários desnecessários para compreensão do fluxo do back -> front