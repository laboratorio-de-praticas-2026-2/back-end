import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreationAttributes, UniqueConstraintError } from 'sequelize';
import { PasswordService } from '../../commons/password.service.js';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import {
  Usuario,
  UsuarioCreationAttributes,
} from '../../models/usuario.model.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';

export type ClienteResponse = Omit<Usuario, 'senha'>;

@Injectable()
export class ClienteService {
  constructor(
    @InjectModel(Usuario)
    private readonly usuarioModel: typeof Usuario,
    private readonly passwordService: PasswordService,
  ) {}

  async create(dto: CreateClienteDto): Promise<ClienteResponse> {
    const email = dto.email.trim().toLowerCase();
    const cpfCnpj = dto.cpfCnpj.trim();

    const emailExistente = await this.usuarioModel.findOne({
      where: { email },
    });
    if (emailExistente) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const cpfExistente = await this.usuarioModel.findOne({
      where: { cpfCnpj },
    });
    if (cpfExistente) {
      throw new ConflictException('CPF já cadastrado.');
    }

    const senha = await this.passwordService.hash(dto.senha);
    const usuarioData: CreationAttributes<Usuario> & UsuarioCreationAttributes =
      {
        nome: dto.nome.trim(),
        email,
        senha,
        nivel: NivelUsuarioEnum.cliente,
        cpfCnpj,
        celular: dto.celular?.trim() || null,
        updatedAt: new Date(),
      };

    try {
      const usuario = await this.usuarioModel.create(usuarioData);

      return this.toResponse(usuario);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException('E-mail ou CPF já cadastrado.');
      }
      throw error;
    }
  }

  private toResponse(usuario: Usuario): ClienteResponse {
    const response = usuario.toJSON() as unknown as Record<string, unknown>;
    delete response.senha;
    return response as ClienteResponse;
  }
}
