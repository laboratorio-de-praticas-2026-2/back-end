import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto.js';
import { CriarTipoAtendimentoDto } from './dto/criar-tipo-atendimento.dto.js';
import { DisparoAgendamentoService } from './disparo/disparo.service.js';
import { AgendamentoModel } from '../../models/agendamento.model.js';
import { TipoAtendimentoModel } from '../../models/tipo-atendimento.model.js';

export interface HorariosDisponiveisResponse {
  data: string;
  tipo_atendimento_id: number;
  horarios_disponiveis: string[];
}

interface HorarioFuncionamento {
  diaSemana: number;
  horarios: string[];
}

@Injectable()
export class AgendamentoService implements OnModuleInit {
  private readonly horariosFuncionamento: HorarioFuncionamento[] = [
    { diaSemana: 1, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 2, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 3, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 4, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 5, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
  ];

  constructor(
    @InjectModel(AgendamentoModel)
    private readonly agendamentoModel: typeof AgendamentoModel,
    @InjectModel(TipoAtendimentoModel)
    private readonly tipoAtendimentoModel: typeof TipoAtendimentoModel,
    private readonly disparoService: DisparoAgendamentoService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (await this.tipoAtendimentoModel.count() > 0) return;

    const tipos = await this.tipoAtendimentoModel.bulkCreate([
      {
        nome: 'Reunião com o contador',
        descricao: 'Atendimento presencial ou online para consultoria contábil',
        ativo: true,
      },
      {
        nome: 'Entrega de documentos físicos',
        descricao: 'Entrega presencial de documentação no escritório',
        ativo: true,
      },
    ]);

    await this.agendamentoModel.bulkCreate([
      {
        protocolo: 'AGD-20261001-1', status: 'confirmado', clienteNome: 'Cliente inicial',
        clienteEmail: 'cliente@example.com', clienteTelefone: '13999999999',
        tipoAtendimentoId: tipos[0].id, dataAgendamento: '2026-10-01', horario: '11:00',
      },
      {
        protocolo: 'AGD-20261001-2', status: 'confirmado', clienteNome: 'Cliente inicial',
        clienteEmail: 'cliente2@example.com', clienteTelefone: '13999999998',
        tipoAtendimentoId: tipos[0].id, dataAgendamento: '2026-10-01', horario: '14:00',
      },
    ]);
  }

  async listarAtivos(): Promise<TipoAtendimentoModel[]> {
    return this.tipoAtendimentoModel.findAll({ where: { ativo: true }, order: [['id', 'ASC']] });
  }

  async cadastrar(dto: CriarTipoAtendimentoDto): Promise<Record<string, unknown>> {
    const novoTipo = await this.tipoAtendimentoModel.create({
      nome: dto.nome,
      descricao: dto.descricao,
      ativo: true,
    });

    return {
      message: 'Tipo de atendimento cadastrado com sucesso',
      id: novoTipo.id,
    };
  }

  async listarAgendamentos(filtros: {
    data_inicio?: string;
    data_fim?: string;
    status?: string;
    tipo_atendimento_id?: number;
  }): Promise<Record<string, unknown>> {
    const dataAgendamento: Record<symbol, string> = {};
    if (filtros.data_inicio) dataAgendamento[Op.gte] = filtros.data_inicio;
    if (filtros.data_fim) dataAgendamento[Op.lte] = filtros.data_fim;

    const agendamentos = await this.agendamentoModel.findAll({
      where: {
        ...(Object.keys(dataAgendamento).length ? { dataAgendamento } : {}),
        ...(filtros.status ? { status: filtros.status } : {}),
        ...(filtros.tipo_atendimento_id ? { tipoAtendimentoId: filtros.tipo_atendimento_id } : {}),
      },
      include: [{ model: TipoAtendimentoModel, required: false }],
      order: [['dataAgendamento', 'ASC'], ['horario', 'ASC']],
    });

    return {
      total: agendamentos.length,
      agendamentos: agendamentos.map((agendamento) => this.toListItem(agendamento)),
    };
  }

  async buscarAgendamento(id: number): Promise<Record<string, unknown>> {
    const agendamento = await this.findById(id);
    const tipoAtendimento = await this.tipoAtendimentoModel.findByPk(agendamento.tipoAtendimentoId);

    return {
      ...this.toListItem(agendamento),
      tipo_atendimento: tipoAtendimento,
      observacao: agendamento.observacao,
    };
  }

  async criarAgendamento(dto: CriarAgendamentoDto): Promise<Record<string, unknown>> {
    const tipoAtendimento = await this.tipoAtendimentoModel.findOne({
      where: { id: dto.tipo_atendimento_id, ativo: true },
    });

    if (!tipoAtendimento) {
      throw new NotFoundException('Tipo de atendimento não encontrado ou está inativo.');
    }

    const horarioOcupado = await this.agendamentoModel.findOne({
      where: {
        dataAgendamento: dto.data_agendamento,
        horario: dto.horario,
        status: { [Op.ne]: 'cancelado' },
      },
    });

    if (horarioOcupado) {
      throw new ConflictException({
        error: 'HORARIO_INDISPONIVEL',
        message: 'O horário selecionado já foi preenchido por outro cliente. Escolha outro horário.',
      });
    }

    const agendamento = await this.agendamentoModel.create({
      protocolo: `AGD-${dto.data_agendamento.replace(/-/g, '')}-${Date.now()}`,
      status: 'confirmado',
      clienteNome: dto.cliente.nome,
      clienteEmail: dto.cliente.email,
      clienteTelefone: dto.cliente.telefone,
      tipoAtendimentoId: dto.tipo_atendimento_id,
      dataAgendamento: dto.data_agendamento,
      horario: dto.horario,
      observacao: dto.observacao,
    });

    this.disparoService.enviarConfirmacao(
      { nome: agendamento.clienteNome, email: agendamento.clienteEmail },
      { protocolo: agendamento.protocolo, data_agendamento: agendamento.dataAgendamento, horario: agendamento.horario },
    ).catch((error) => console.error('Erro ao enviar e-mail de confirmação:', error));

    return {
      message: 'Agendamento realizado com sucesso',
      agendamento: {
        id: agendamento.id,
        status: agendamento.status,
        protocolo: agendamento.protocolo,
        data_agendamento: `${agendamento.dataAgendamento}T${agendamento.horario}:00Z`,
      },
    };
  }

  async atualizarAgendamento(
    id: number,
    dto: { status: string; nova_data?: string; novo_horario?: string; motivo?: string },
  ) {
    const agendamento = await this.findById(id);

    if (dto.status === 'remarcado' || (dto.nova_data && dto.novo_horario)) {
      if (!dto.nova_data || !dto.novo_horario) {
        throw new BadRequestException('Nova data e novo horário são obrigatórios para remarcação.');
      }

      const horarioOcupado = await this.agendamentoModel.findOne({
        where: {
          id: { [Op.ne]: id },
          dataAgendamento: dto.nova_data,
          horario: dto.novo_horario,
          status: { [Op.ne]: 'cancelado' },
        },
      });

      if (horarioOcupado) {
        throw new ConflictException({
          error: 'HORARIO_INDISPONIVEL',
          message: 'O novo horário selecionado já está ocupado. Escolha outro horário.',
        });
      }

      agendamento.dataAgendamento = dto.nova_data;
      agendamento.horario = dto.novo_horario;
      agendamento.status = 'remarcado';
    } else {
      agendamento.status = dto.status;
    }

    await agendamento.save();
    this.disparoService.enviarNotificacao(
      { nome: agendamento.clienteNome, email: agendamento.clienteEmail },
      {
        protocolo: agendamento.protocolo,
        status: agendamento.status,
        data_agendamento: agendamento.dataAgendamento,
        horario: agendamento.horario,
      },
    ).catch((error) => console.error('Erro ao enviar e-mail de notificação:', error));

    return { message: 'Agendamento atualizado com sucesso', status: agendamento.status };
  }

  async listarHorariosDisponiveis(data: string, tipoAtendimentoId: number): Promise<HorariosDisponiveisResponse> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw new BadRequestException('A data deve estar no formato YYYY-MM-DD.');
    }

    const tipoAtendimento = await this.tipoAtendimentoModel.findOne({
      where: { id: tipoAtendimentoId, ativo: true },
    });
    if (!tipoAtendimento) throw new NotFoundException('Tipo de atendimento não encontrado ou está inativo.');

    const dataObj = new Date(`${data}T12:00:00`);
    const diaSemana = dataObj.getDay() === 0 ? 7 : dataObj.getDay();
    const funcionamento = this.horariosFuncionamento.find((item) => item.diaSemana === diaSemana);
    const agendamentos = await this.agendamentoModel.findAll({
      where: {
        dataAgendamento: data,
        tipoAtendimentoId,
        status: { [Op.ne]: 'cancelado' },
      },
    });
    const ocupados = new Set(agendamentos.map((agendamento) => agendamento.horario));

    return {
      data,
      tipo_atendimento_id: tipoAtendimentoId,
      horarios_disponiveis: (funcionamento?.horarios ?? []).filter((horario) => !ocupados.has(horario)),
    };
  }

  private async findById(id: number) {
    const agendamento = await this.agendamentoModel.findByPk(id);
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado.');
    return agendamento;
  }

  private toListItem(agendamento: AgendamentoModel) {
    return {
      id: agendamento.id,
      protocolo: agendamento.protocolo,
      cliente: {
        nome: agendamento.clienteNome,
        email: agendamento.clienteEmail,
        telefone: agendamento.clienteTelefone,
      },
      tipo_atendimento: agendamento.tipoAtendimento?.nome,
      tipo_atendimento_id: agendamento.tipoAtendimentoId,
      data_agendamento: agendamento.dataAgendamento,
      horario: agendamento.horario,
      status: agendamento.status,
    };
  }
}
