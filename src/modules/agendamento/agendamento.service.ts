import { Injectable, NotFoundException } from '@nestjs/common';
import { CriarTipoAtendimentoDto } from './dto/criar-tipo-atendimento.dto.js';

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

  listarAgendamentos(filtros: {data_inicio?: string; data_fim?: string; status?: string; tipo_atendimento_id?: number;}) {
    let resultado = this.agendamentos;

    if (filtros.data_inicio) {
      resultado = resultado.filter((agendamento) => agendamento.data_agendamento >= filtros.data_inicio!);}

    if (filtros.data_fim) {
      resultado = resultado.filter((agendamento) => agendamento.data_agendamento <= filtros.data_fim!);}

    if (filtros.status) {resultado = resultado.filter((agendamento) => agendamento.status === filtros.status);}

    if (filtros.tipo_atendimento_id) {resultado = resultado.filter((agendamento) => agendamento.tipo_atendimento_id === filtros.tipo_atendimento_id);}

    return {
      total: resultado.length,

      agendamentos: resultado.map((agendamento) => {const tipoAtendimento = this.tiposAtendimento.find((tipo) => tipo.id === agendamento.tipo_atendimento_id);

      return {
        id: agendamento.id,
        protocolo: agendamento.protocolo,
        cliente: agendamento.cliente,
        tipo_atendimento: tipoAtendimento?.nome,
        data_agendamento: agendamento.data_agendamento,
        horario: agendamento.horario,
        status: agendamento.status,
      };
    })
  };
}

  buscarAgendamento(id: number) {
    const agendamento = this.agendamentos.find(
      (agendamento) => agendamento.id === id,
    );

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    const tipoAtendimento = this.tiposAtendimento.find((tipo) => tipo.id === agendamento.tipo_atendimento_id);

    return {
      id: agendamento.id,
      protocolo: agendamento.protocolo,
      status: agendamento.status,
      cliente: agendamento.cliente,
      tipo_atendimento: tipoAtendimento
        ? {
            id: tipoAtendimento.id,
            nome: tipoAtendimento.nome,
            descricao: tipoAtendimento.descricao,
          }
        : null,
      data_agendamento: agendamento.data_agendamento,
      horario: agendamento.horario,
      observacao: agendamento.observacao,
    };
  }
}