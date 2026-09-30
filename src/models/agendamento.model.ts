import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { TipoAtendimentoModel } from './tipo-atendimento.model.js';

@Table({ tableName: 'agendamentos', timestamps: true })
export class AgendamentoModel extends Model<InferAttributes<AgendamentoModel>, InferCreationAttributes<AgendamentoModel>> {
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    declare id: CreationOptional<number>;

    @Column({ type: DataType.STRING(40), allowNull: false, unique: true })
    declare protocolo: string;

    @Column({ type: DataType.ENUM('confirmado', 'cancelado', 'remarcado'), allowNull: false, defaultValue: 'confirmado' })
    declare status: string;

    @Column({ type: DataType.STRING(150), allowNull: false })
    declare clienteNome: string;

    @Column({ type: DataType.STRING(180), allowNull: false })
    declare clienteEmail: string;

    @Column({ type: DataType.STRING(30), allowNull: false })
    declare clienteTelefone: string;

    @ForeignKey(() => TipoAtendimentoModel)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare tipoAtendimentoId: number;

    @BelongsTo(() => TipoAtendimentoModel)
    declare tipoAtendimento?: TipoAtendimentoModel;

    @Column({ type: DataType.DATEONLY, allowNull: false })
    declare dataAgendamento: string;

    @Column({ type: DataType.STRING(5), allowNull: false })
    declare horario: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare observacao?: string;
}
