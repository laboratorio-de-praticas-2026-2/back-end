import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { CadastroPjDto } from '../modules/contato/dto/cadastro-pj.dto.js';
import { validarCNPJ } from './utils/formatters.js';
import { hashPassword } from './utils/crypto.js';

export interface JwtUserPayload {
  id: number;
  nivel: string;
  nome?: string;
  email?: string;
}

@Injectable()
export class AuthService {
  private JWT_SECRET = process.env.JWT_SECRET || 'secret';
  private readonly logger = new Logger(AuthService.name);

  constructor() {}

  verifyToken(token?: string): JwtUserPayload | null {
    this.logger.log('Verificando token:', token);

    if (!token) return null;

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtUserPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  async cadastrarPj(dto: CadastroPjDto) {
    // 1. Validação de campos obrigatórios da requisição
    if (!dto?.nome) {
      throw new BadRequestException('O nome é obrigatório.');
    }

    if (!dto?.email) {
      throw new BadRequestException('O e-mail é obrigatório.');
    }

    if (!dto?.senha) {
      throw new BadRequestException('A senha é obrigatória.');
    }

    // 2. Normalização do E-mail (Trim + Lowercase - Regra do Banco)
    const emailNormalizado = dto.email.toLowerCase().trim();

    // 3. Validação do CNPJ mantendo a formatação original enviada para salvar no banco
    if (dto.cpf_cnpj) {
      const apenasNumeros = dto.cpf_cnpj.replace(/[^\d]+/g, '');
      if (!validarCNPJ(apenasNumeros)) {
        throw new BadRequestException('CNPJ informado é inválido.');
      }
    }

    // 4. Hash seguro da senha usando o padrão scrypt da PR #52
const senhaHash = await hashPassword(dto.senha);

    // 5. Retorno com sucesso e estrutura compatível com a tabela 'Usuario'
    return {
      sucesso: true,
      mensagem: 'Usuário cadastrado com sucesso.',
      usuario: {
        nome: dto.nome,
        email: emailNormalizado,
        cpf_cnpj: dto.cpf_cnpj || null,
        celular: dto.celular || null,
        nivel: 'cliente', // Valor padrão do banco de dados
        senhaHash: senhaHash,
      },
    };
  }
}