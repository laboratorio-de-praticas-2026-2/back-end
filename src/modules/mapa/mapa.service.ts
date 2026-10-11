import { Injectable } from '@nestjs/common';
import { CreateParceiroDto, ParceiroTipo } from './dto/create-parceiro.dto.js';

export interface Parceiro {
  id: number;
  nomeFantasia: string;
  tipo: ParceiroTipo;
  cidade: string;
  latitude: string;
  longitude: string;
  telefone: string;
  descricao?: string;
  linkLock?: string;
}

@Injectable()
export class MapaService {
  private readonly parceiros: Parceiro[] = [
    {
      id: 1,
      nomeFantasia: 'Banco Exemplo Centro',
      tipo: ParceiroTipo.banco,
      cidade: 'São Paulo',
      latitude: '-23.55052',
      longitude: '-46.633308',
      telefone: '1130000001',
      descricao:
        'Atendimento especializado para empresas, com condições especiais.',
      linkLock: 'https://app.exemplo.com/lock/partner/1',
    },
    {
      id: 2,
      nomeFantasia: 'Cartório Exemplo Campinas',
      tipo: ParceiroTipo.cartorio,
      cidade: 'Campinas',
      latitude: '-22.90556',
      longitude: '-47.06083',
      telefone: '1930000002',
      descricao: 'Reconhecimento de firma, autenticações e registros.',
    },
    {
      id: 3,
      nomeFantasia: 'Receita Federal - Unidade Santos',
      tipo: ParceiroTipo.receita_federal,
      cidade: 'Santos',
      latitude: '-23.96083',
      longitude: '-46.33361',
      telefone: '1330000003',
    },
  ];

  async cadastrar(dto: CreateParceiroDto): Promise<Record<string, unknown>> {
    const id = (this.parceiros.at(-1)?.id ?? 0) + 1;

    this.parceiros.push({ id, ...dto });

    return {
      message: 'Parceria cadastrada com sucesso',
      id,
    };
  }

  // Regra: só parceiros ativos e com latitude/longitude preenchidas.
  // Obs: o cadastro atual ainda não tem o campo "ativo". Quando ele não
  // existir, o parceiro é considerado ativo.
  findAllParceiros(): Parceiro[] {
    return this.parceiros.filter((p) => {
      const ativo = (p as Parceiro & { ativo?: boolean }).ativo !== false;
      return ativo && p.latitude.trim() !== '' && p.longitude.trim() !== '';
    });
  }

  findByTipo(tipo: string): Parceiro[] {
    return this.findAllParceiros().filter(
      (p) => p.tipo.toLowerCase() === tipo.trim().toLowerCase(),
    );
  }

  findByCidade(cidade: string): Parceiro[] {
    return this.findAllParceiros().filter(
      (p) => p.cidade.toLowerCase() === cidade.trim().toLowerCase(),
    );
  }

  // Sem parâmetros: retorna todos os registros válidos
  findComFiltro(tipo?: string, cidade?: string): Parceiro[] {
    return this.findAllParceiros().filter(
      (p) =>
        (!tipo || p.tipo.toLowerCase() === tipo.trim().toLowerCase()) &&
        (!cidade || p.cidade.toLowerCase() === cidade.trim().toLowerCase()),
    );
  }
}