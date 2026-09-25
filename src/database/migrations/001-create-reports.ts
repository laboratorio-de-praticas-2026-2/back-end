import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('reports', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    categoria: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    descricao: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    data_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    data_termino: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM('PENDENTE', 'GERADO', 'FALHA'),
      allowNull: false,
      defaultValue: 'PENDENTE',
    },

    arquivo_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('reports');
}