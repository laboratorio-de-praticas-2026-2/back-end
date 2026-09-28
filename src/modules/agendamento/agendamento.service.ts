import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { CriarTipoAtendimentoDto } from './dto/criar-tipo-atendimento.dto.js';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto.js';

export class TipoAtendimento {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
}

export class Cliente {
  nome: string;
  email: string;
  telefone: string;
}

export class Agendamento {
  id: number;
  status: string;
  protocolo: string;
  cliente: Cliente;
  tipo_atendimento_id: number;
  data_agendamento: string;
  horario: string;
  observacao?: string;
}

interface HorarioFuncionamento {
  diaSemana: number; // 0 = domingo ... 6 = sábado
  horarios: string[]; // horários de atendimento naquele dia, ex: '09:00'
}

export interface HorariosDisponiveisResponse {
  data: string;
  tipo_atendimento_id: number;
  horarios_disponiveis: string[];
}

@Injectable()
export class AgendamentoService {
  private tiposAtendimento: TipoAtendimento[] = [
    {
      id: 1,
      nome: 'Reunião com o contador',
      descricao: 'Atendimento presencial ou online para consultoria contábil',
      ativo: true,
    },
    {
      id: 2,
      nome: 'Entrega de documentos físicos',
      descricao: 'Entrega presencial de documentação no escritório',
      ativo: true,
    },
  ];

  private proximoId = 3;

  private agendamentos: Agendamento[] = [
    {
      id: 1,
      status: 'confirmado',
      protocolo: 'AGD-20261001-1',
      cliente: {
        nome: 'Cliente inicial',
        email: 'cliente@example.com',
        telefone: '13999999999',
      },
      tipo_atendimento_id: 1,
      data_agendamento: '2026-10-01',
      horario: '11:00',
    },
    {
      id: 2,
      status: 'confirmado',
      protocolo: 'AGD-20261001-2',
      cliente: {
        nome: 'Cliente inicial',
        email: 'cliente2@example.com',
        telefone: '13999999998',
      },
      tipo_atendimento_id: 1,
      data_agendamento: '2026-10-01',
      horario: '14:00',
    },
  ];

  private proximoAgendamentoId = 101;

  // TODO: substituir por consulta ao banco de dados quando a tabela
  // de horários de funcionamento estiver disponível.
  private horariosFuncionamento: HorarioFuncionamento[] = [
    { diaSemana: 1, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 2, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 3, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 4, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 5, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
  ];

  listarAtivos(): TipoAtendimento[] {
    return this.tiposAtendimento.filter((tipo) => tipo.ativo);
  }

  cadastrar(dto: CriarTipoAtendimentoDto) {
    const novoTipo: TipoAtendimento = {
      id: this.proximoId++,
      nome: dto.nome,
      descricao: dto.descricao,
      ativo: true,
    };

    this.tiposAtendimento.push(novoTipo);

    return {
      message: 'Tipo de atendimento cadastrado com sucesso',
      id: novoTipo.id,
    };
  }

  criarAgendamento(dto: CriarAgendamentoDto) {

    const tipoAtendimento = this.tiposAtendimento.find(
      (tipo) =>
        tipo.id === dto.tipo_atendimento_id &&
        tipo.ativo,
    );

    if (!tipoAtendimento) {
      throw new NotFoundException(
        'Tipo de atendimento não encontrado ou está inativo.',
      );
    }

    const horarioOcupado = this.agendamentos.find(
      (agendamento) =>
        agendamento.data_agendamento === dto.data_agendamento &&
        agendamento.horario === dto.horario &&
        agendamento.status !== 'cancelado',
    );

    if (horarioOcupado) {
      throw new ConflictException({
        error: 'HORARIO_INDISPONIVEL',
        message:
          'O horário selecionado já foi preenchido por outro cliente. Escolha outro horário.',
      });
    }

    const id = this.proximoAgendamentoId++;

    const protocolo =
      `AGD-${dto.data_agendamento.replace(/-/g, '')}-${id}`;

    const novoAgendamento: Agendamento = {
      id,
      status: 'confirmado',
      protocolo,

      cliente: {
        nome: dto.cliente.nome,
        email: dto.cliente.email,
        telefone: dto.cliente.telefone,
      },

      tipo_atendimento_id: dto.tipo_atendimento_id,
      data_agendamento: dto.data_agendamento,
      horario: dto.horario,
      observacao: dto.observacao,
    };

    this.agendamentos.push(novoAgendamento);

    return {
      message: 'Agendamento realizado com sucesso',

      agendamento: {
        id: novoAgendamento.id,
        status: novoAgendamento.status,
        protocolo: novoAgendamento.protocolo,
        data_agendamento:
          `${novoAgendamento.data_agendamento}T${novoAgendamento.horario}:00Z`,
      },
    };
  }

  listarHorariosDisponiveis(data: string, tipoAtendimentoId: number): HorariosDisponiveisResponse {
    const tipoAtendimento = this.tiposAtendimento.find(
      (tipo) => tipo.id === tipoAtendimentoId && tipo.ativo,
    );

    if (!tipoAtendimento) {
      throw new NotFoundException('Tipo de atendimento não encontrado ou inativo');
    }

    const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(data) && !Number.isNaN(Date.parse(data));

    if (!dataValida) {
      throw new BadRequestException('Parâmetro "data" inválido. Utilize o formato YYYY-MM-DD');
    }

    const diaSemana = new Date(`${data}T00:00:00`).getDay();

    const funcionamentoDoDia = this.horariosFuncionamento.find(
      (h) => h.diaSemana === diaSemana,
    );

    const horariosBase = funcionamentoDoDia ? funcionamentoDoDia.horarios : [];

    const horariosOcupados = new Set(
      this.agendamentos
        .filter(
          (agendamento) =>
            agendamento.data_agendamento === data &&
            agendamento.tipo_atendimento_id === tipoAtendimentoId &&
            agendamento.status === 'confirmado',
        )
        .map((agendamento) => agendamento.horario),
    );

    const horariosDisponiveis = horariosBase.filter(
      (horario) => !horariosOcupados.has(horario),
    );

    return {
      data,
      tipo_atendimento_id: tipoAtendimentoId,
      horarios_disponiveis: horariosDisponiveis,
    };
  }
}