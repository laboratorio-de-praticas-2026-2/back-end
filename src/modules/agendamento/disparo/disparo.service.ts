import { Injectable } from '@nestjs/common';

@Injectable()
export class DisparoAgendamentoService {
  
  async enviarConfirmacao(cliente: { nome: string; email: string }, agendamento: { protocolo: string; data_agendamento: string; horario: string }) {
    const disparoMock = {
      destinatario: cliente.email,
      status: 'simulado',
      mensagem: `Olá, ${cliente.nome}! O seu agendamento foi confirmado com sucesso. Protocolo: ${agendamento.protocolo} para o dia ${agendamento.data_agendamento} às ${agendamento.horario}.`,
    };

    console.log('[DISPARO - CONFIRMAÇÃO AGENDAMENTO]', disparoMock);
    return disparoMock;
  }


  async enviarNotificacao(cliente: { nome: string; email: string }, agendamento: { protocolo: string; status: string; data_agendamento?: string; horario?: string }) {
    const disparoMock = {
      destinatario: cliente.email,
      status: 'simulado',
      mensagem: `Olá, ${cliente.nome}! Houve uma atualização no seu agendamento (${agendamento.protocolo}). Novo estado: ${agendamento.status}.`,
    };

    console.log('[DISPARO - NOTIFICAÇÃO AGENDAMENTO]', disparoMock);
    return disparoMock;
  }
}