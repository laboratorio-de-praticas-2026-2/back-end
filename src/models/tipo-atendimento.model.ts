import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'tipos_atendimento', timestamps: false })
export class TipoAtendimentoModel extends Model<InferAttributes<TipoAtendimentoModel>, InferCreationAttributes<TipoAtendimentoModel>> {
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    declare id: CreationOptional<number>;

    @Column({ type: DataType.STRING(150), allowNull: false })
    declare nome: string;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare descricao: string;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    declare ativo: boolean;
}
