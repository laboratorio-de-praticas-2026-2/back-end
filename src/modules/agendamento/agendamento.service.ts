import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CriarTipoAtendimentoDto } from './dto/criar-tipo-atendimento.dto.js';
import {CriarAgendamentoDto} from './dto/criar-agendamento.dto.js';

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
      id: 100,
      status: 'confirmado',
      protocolo: 'AGD-20261001-100',

      cliente: {
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '13988888888',
      },

      tipo_atendimento_id: 1,
      data_agendamento: '2026-10-01',
      horario: '09:00',
      observacao: 'Atendimento fiscal',
    },
  ];

  private proximoAgendamentoId = 101;


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
    }
  }
}