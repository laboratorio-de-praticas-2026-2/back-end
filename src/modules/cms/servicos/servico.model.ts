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

@Table({
  tableName: 'servico', // Nome EXATO da tabela existente no MySQL
  timestamps: false,    // A tabela não possui createdAt e updatedAt
})
export class Servico extends Model<Servico> {

  // Identificador do serviço.
  // FRONT: útil para buscar, editar, pausar ou remover um serviço específico.
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  // Nome apresentado na Vitrine de Serviços.
  // Ex.: "Declaração de IRPF"
  @AllowNull(false)
  @Column(DataType.STRING(100))
  declare nome: string;

  // Texto descritivo que poderá ser apresentado ao usuário na Vitrine.
  @AllowNull(true)
  @Column(DataType.TEXT)
  declare descricao: string | null;

  // Honorário/valor base do serviço.
  // O atributo da API será "valorBase", enquanto no banco é "valor_base".
  // FRONT: consumir como valorBase.
  @AllowNull(true)
  @Column({
    type: DataType.DECIMAL(10, 2),
    field: 'valor_base',
  })
  declare valorBase: string | null;

  // Prazo estimado, em dias.
  // Banco: prazo_estimado_dias
  // API/FRONT: prazoEstimadoDias
  @AllowNull(true)
  @Column({
    type: DataType.INTEGER,
    field: 'prazo_estimado_dias',
  })
  declare prazoEstimadoDias: number | null;

  // Controla se o serviço pode aparecer na Vitrine.
  //
  // true  = ativo / disponível para exibição
  // false = pausado / não deve aparecer na Vitrine
  //
  // Esse campo será importante no CMS para ativar/pausar serviços.
  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare ativo: boolean;
}


// Comentários dispostos temporariamente até a integração do front-end
// To-do: Elaborar documentação descritiva e apagar comentários desnecessários para compreensão do fluxo do back -> front