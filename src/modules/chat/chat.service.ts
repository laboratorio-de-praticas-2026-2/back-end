import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { JwtUserPayload } from '../../commons/auth.service.js';
import { CreateConversaDto } from './dto/create-conversa.dto.js';
import { UpdateStatusConversaDto } from './dto/update-status-conversa.dto.js';
import { Conversa } from './entities/conversa.entity.js';
import { StatusConversa } from './enums/status-conversa.enum.js';

const ATENDENTE_NIVEIS = new Set(['atendente', 'administrador']);

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversa)
    private readonly conversaModel: typeof Conversa,
  ) {}

  async criarConversa(
    dto: CreateConversaDto,
    usuario: JwtUserPayload,
  ): Promise<Conversa> {
    const ehAtendente = this.ehAtendente(usuario);
    const clienteId = ehAtendente ? dto.clienteId : usuario.id;
    const atendenteId = ehAtendente ? (dto.atendenteId ?? usuario.id) : dto.atendenteId;
    const possuiCliente = clienteId !== undefined;
    const possuiVisitante = Boolean(dto.visitanteId);

    if (possuiCliente === possuiVisitante) {
      throw new BadRequestException(
        'Informe clienteId ou visitanteId, mas não ambos.',
      );
    }
    if (!atendenteId) {
      throw new BadRequestException('atendenteId é obrigatório.');
    }
    if (!ehAtendente && atendenteId === usuario.id) {
      throw new ForbiddenException('Cliente não pode ser o atendente da conversa.');
    }
    if (!ehAtendente && dto.clienteId !== undefined) {
      throw new ForbiddenException('Cliente não pode informar outro cliente.');
    }

    const conversaAtiva = await this.conversaModel.findOne({
      where: {
        atendenteId,
        status: { [Op.in]: [StatusConversa.ABERTA, StatusConversa.EM_ATENDIMENTO] },
        ...(clienteId !== undefined ? { clienteId } : { visitanteId: dto.visitanteId }),
      },
    });

    if (conversaAtiva) {
      throw new ConflictException('Já existe uma conversa ativa para esses participantes.');
    }

    return this.conversaModel.create({
      clienteId: clienteId ?? null,
      visitanteId: dto.visitanteId ?? null,
      visitanteNome: dto.visitanteNome?.trim() ?? null,
      visitanteEmail: dto.visitanteEmail?.trim().toLowerCase() ?? null,
      atendenteId,
      status: StatusConversa.ABERTA,
    });
  }

  async listarConversas(usuario: JwtUserPayload): Promise<Conversa[]> {
    const where = this.ehAdministrador(usuario)
      ? undefined
      : this.ehAtendente(usuario)
        ? { atendenteId: usuario.id }
        : { clienteId: usuario.id };

    return this.conversaModel.findAll({
      where,
      order: [['atualizadoEm', 'DESC']],
    });
  }

  async buscarConversa(id: string, usuario: JwtUserPayload): Promise<Conversa> {
    const conversa = await this.conversaModel.findByPk(id);
    if (!conversa) {
      throw new NotFoundException('Conversa não encontrada.');
    }
    this.validarAcesso(conversa, usuario);
    return conversa;
  }

  async atualizarStatus(
    id: string,
    dto: UpdateStatusConversaDto,
    usuario: JwtUserPayload,
  ): Promise<Conversa> {
    const conversa = await this.buscarConversa(id, usuario);
    if (!this.ehAtendente(usuario)) {
      throw new ForbiddenException('Somente um atendente pode alterar o status.');
    }
    if (!this.transicaoPermitida(conversa.status, dto.status)) {
      throw new BadRequestException('Transição de status inválida.');
    }

    conversa.status = dto.status;
    await conversa.save();
    return conversa;
  }

  private validarAcesso(conversa: Conversa, usuario: JwtUserPayload): void {
    if (
      !this.ehAdministrador(usuario) &&
      conversa.atendenteId !== usuario.id &&
      conversa.clienteId !== usuario.id
    ) {
      throw new ForbiddenException('Você não tem acesso a esta conversa.');
    }
  }

  private transicaoPermitida(
    atual: StatusConversa,
    novo: StatusConversa,
  ): boolean {
    if (atual === novo) return true;
    if (atual === StatusConversa.ABERTA) {
      return novo === StatusConversa.EM_ATENDIMENTO || novo === StatusConversa.ENCERRADA;
    }
    return atual === StatusConversa.EM_ATENDIMENTO && novo === StatusConversa.ENCERRADA;
  }

  private ehAtendente(usuario: JwtUserPayload): boolean {
    return ATENDENTE_NIVEIS.has(usuario.nivel);
  }

  private ehAdministrador(usuario: JwtUserPayload): boolean {
    return usuario.nivel === 'administrador';
  }
}
