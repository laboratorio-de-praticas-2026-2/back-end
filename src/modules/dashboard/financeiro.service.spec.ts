import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';

import { FinanceiroService } from './financeiro.service.js';
import { Obrigacao } from '../../models/obrigacao.model.js';
import { Pagamento } from '../../models/pagamento.model.js';
import { Parcela } from '../../models/parcela.model.js';
import { ObrigacaoEmpresa } from '../../models/obrigacao-empresa.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';
import { Empresa } from '../../models/empresa.model.js';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { Usuario } from '../../models/usuario.model.js';

describe('FinanceiroService', () => {
  let service: FinanceiroService;

  beforeEach(async () => {
    const models = [
      Obrigacao,
      Pagamento,
      Parcela,
      ObrigacaoEmpresa,
      ObrigacaoServico,
      Empresa,
      Solicitacao,
      Usuario,
    ];

    const module = await Test.createTestingModule({
      providers: [
        FinanceiroService,
        ...models.map((model) => ({
          provide: getModelToken(model),
          useValue: {
            findAll: vi.fn().mockResolvedValue([]),
          },
        })),
      ],
    }).compile();

    service = module.get(FinanceiroService);
  });

  it('retorna indicadores zerados quando não há dados', async () => {
    const resultado = await service.getDashboardFinanceiro(
      '2026-09-01',
      '2026-09-30',
    );

    expect(resultado).toEqual({
      faturamentoRecebido: 0,
      aReceber: 0,
      receitaServicosExtras: 0,
      ticketMedio: 0,
      graficos: {
        historicoMensal: [{ mes: '2026-09', valor: 0 }],
        distribuicaoMetodoPagamento: {
          pix: 0,
          boleto: 0,
          cartao: 0,
          outros: 0,
        },
        distribuicaoTipoPagamento: {
          mensalidadeFixa: 0,
          servicosAvulsos: 0,
        },
      },
      previsaoReceita30Dias: {
        valor: 0,
        parcelasProximas: 0,
      },
      inadimplencia: {
        valorTotalVencido: 0,
        parcelasEmAtraso: 0,
      },
    });
  });
});