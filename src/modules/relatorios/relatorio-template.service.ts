import { Injectable } from '@nestjs/common';
import { RelatorioPdfDto } from './dto/relatorio-pdf.dto.js';

@Injectable()
export class RelatorioTemplateService {
  render(dto: RelatorioPdfDto): string {
    const total = dto.itens.reduce((soma, item) => soma + item.valor, 0);
    const itens = dto.itens
      .map(
        (item) =>
          `<tr><td>${this.escapeHtml(item.descricao)}</td><td>${this.escapeHtml(item.status ?? '-')}</td><td>R$ ${item.valor.toFixed(2)}</td></tr>`,
      )
      .join('');
    const periodo = dto.periodoInicio && dto.periodoFim ? `${dto.periodoInicio} a ${dto.periodoFim}` : 'Não informado';

    return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${this.escapeHtml(dto.titulo)}</title><style>
      @page { size: A4; margin: 24mm 18mm; }
      body { font-family: "Open Sans", sans-serif; color: #222; padding: 0; margin: 0; }
      h1 { font-size: 22px; margin: 0 0 18px; }
      p { margin: 6px 0; }
      table { border-collapse: collapse; width: 100%; margin-top: 24px; table-layout: fixed; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; page-break-inside: avoid; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: left; overflow-wrap: anywhere; word-break: break-word; }
      th { background: #f1f1f1; }
      td:last-child, th:last-child { text-align: right; }
    </style></head><body><h1>${this.escapeHtml(dto.titulo)}</h1><p><strong>Cliente:</strong> ${this.escapeHtml(dto.nomeCliente)}</p><p><strong>Período:</strong> ${this.escapeHtml(periodo)}</p><table><thead><tr><th>Descrição</th><th>Status</th><th>Valor</th></tr></thead><tbody>${itens}</tbody><tfoot><tr><th colspan="2">Total</th><th>R$ ${total.toFixed(2)}</th></tr></tfoot></table></body></html>`;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);
  }
}