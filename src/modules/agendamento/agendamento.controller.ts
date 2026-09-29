import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AgendamentoService } from './agendamento.service.js';
import { CriarTipoAtendimentoDto } from './dto/criar-tipo-atendimento.dto.js';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto.js';
import { ConsultarHorariosDisponiveisDto } from './dto/consultar-horarios-disponiveis.dto.js';
import { AtualizarAgendamentoDto } from './dto/atualizar-agendamento.dto.js';

@Controller()
export class AgendamentoController {
  constructor(private readonly agendamentoService: AgendamentoService) { }

  @Get('tipos-atendimento')
  @HttpCode(HttpStatus.OK)
  listarTiposAtendimento() {
    return this.agendamentoService.listarAtivos();
  }

  @Post('tipos-atendimento')
  @HttpCode(HttpStatus.CREATED)
  cadastrarTipoAtendimento(@Body() body: CriarTipoAtendimentoDto) {
    return this.agendamentoService.cadastrar(body);
  }

  @Get('agendamentos')
  listarAgendamentos(
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
    @Query('status') status?: string,
    @Query('tipo_atendimento_id') tipo_atendimento_id?: string,
  ) {
    return this.agendamentoService.listarAgendamentos({
      data_inicio,
      data_fim,
      status,
      tipo_atendimento_id: tipo_atendimento_id
        ? Number(tipo_atendimento_id)
        : undefined,
    });
  }

  @Get('agendamentos/:id')
  buscarAgendamento(@Param('id', ParseIntPipe) id: number) {
    return this.agendamentoService.buscarAgendamento(id);
  }

  @Post('agendamentos')
  @HttpCode(HttpStatus.CREATED)
  criarAgendamento(@Body() body: CriarAgendamentoDto) {
    return this.agendamentoService.criarAgendamento(body);
  }

  @Get('agendamentos/horarios-disponiveis')
  @HttpCode(HttpStatus.OK)
  horariosDisponiveis(@Query() query: ConsultarHorariosDisponiveisDto) {
    return this.agendamentoService.listarHorariosDisponiveis(
      query.data,
      Number(query.tipo_atendimento_id)
    );
  }

  @Patch('agendamentos/:id')
  @HttpCode(HttpStatus.OK)
  atualizarAgendamento(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AtualizarAgendamentoDto,
  ) {
    return this.agendamentoService.atualizarAgendamento(id, body); 
  }
}