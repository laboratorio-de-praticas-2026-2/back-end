import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CriarTipoAtendimentoDto } from './dto/criar-tipo-atendimento.dto.js';

export class TipoAtendimento {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
}

interface HorarioFuncionamento {
  diaSemana: number; // 0 = domingo ... 6 = sábado
  horarios: string[]; // horários de atendimento naquele dia, ex: '09:00'
}

interface Agendamento {
  id: number;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  tipoAtendimentoId: number;
  status: 'confirmado' | 'cancelado';
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

  // TODO: substituir por consulta ao banco de dados quando a tabela
  // de horários de funcionamento estiver disponível.
  private horariosFuncionamento: HorarioFuncionamento[] = [
    { diaSemana: 1, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 2, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 3, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 4, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:30'] },
    { diaSemana: 5, horarios: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
  ];

  // TODO: substituir por consulta ao banco de dados quando a tabela
  // de agendamentos estiver disponível.
  private agendamentos: Agendamento[] = [
    { id: 1, data: '2026-10-01', horario: '11:00', tipoAtendimentoId: 1, status: 'confirmado' },
    { id: 2, data: '2026-10-01', horario: '14:00', tipoAtendimentoId: 1, status: 'confirmado' },
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
            agendamento.data === data &&
            agendamento.tipoAtendimentoId === tipoAtendimentoId &&
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