import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RelatorioPdfDto } from './dto/relatorio-pdf.dto.js';

export interface RelatorioDocumentoData {
  nome: string;
  categoria: string;
  descricao: string;
  dataInicio: Date | string;
  dataTermino: Date | string;
}

const LOGO_PATH = join(
  process.cwd(),
  'src',
  'static',
  'images',
  'Logo Grupo Principal.png',
);

@Injectable()
export class RelatorioTemplateService {
  private readonly logger = new Logger(RelatorioTemplateService.name);
  private logoDataUri?: string | null;

  /**
   * HTML do PDF de um relatório persistido: capa (identidade do Portal Contábil,
   * período analisado e data de emissão) e página com os dados reais cadastrados.
   * Não inclui métricas que não existam no cadastro do relatório.
   */
  renderRelatorio(data: RelatorioDocumentoData): string {
    const inicio = this.formatDate(data.dataInicio);
    const termino = this.formatDate(data.dataTermino);
    const emissao = this.formatDate(new Date());
    const logo = this.getLogo();
    const logoHtml = logo
      ? `<img class="logo" src="${logo}" alt="Portal Contábil" />`
      : '<div class="logo-text">PORTAL CONTÁBIL</div>';

    return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${this.escapeHtml(data.nome)}</title><style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: "Open Sans", Arial, sans-serif; color: #111; }
      .page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      .wave-top { position: absolute; top: 0; left: 0; width: 100%; height: 70mm; background: #0a3c5b; border-radius: 0 0 60% 40% / 0 0 60% 40%; }
      .wave-bottom { position: absolute; bottom: 0; left: 0; width: 100%; height: 55mm; background: #0a3c5b; border-radius: 60% 40% 0 0 / 70% 60% 0 0; }
      .cover { text-align: center; padding-top: 95mm; }
      .logo { width: 90mm; }
      .logo-text { font-size: 28px; font-weight: 800; color: #0a3c5b; }
      .cover h1 { font-size: 24px; margin: 24mm 30mm 0; }
      .cover .label { margin-top: 16mm; font-weight: 700; font-size: 14px; }
      .cover .value { font-size: 14px; margin-top: 2mm; }
      .cover .issued { position: absolute; bottom: 75mm; width: 100%; font-size: 10px; color: #888; }
      .content { padding: 22mm 20mm; }
      .content .header { border-bottom: 3px solid #0a3c5b; padding-bottom: 6mm; margin-bottom: 10mm; }
      .content .header .logo { width: 42mm; }
      .content h2 { font-size: 20px; color: #0a3c5b; margin: 0 0 8mm; overflow-wrap: anywhere; }
      dl { margin: 0; }
      dt { font-weight: 700; font-size: 12px; color: #555; text-transform: uppercase; margin-top: 7mm; }
      dd { margin: 2mm 0 0; font-size: 14px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
    </style></head><body>
      <section class="page cover">
        <div class="wave-top"></div>
        ${logoHtml}
        <h1>${this.escapeHtml(data.nome)}</h1>
        <div class="label">Período Analisado</div>
        <div class="value">${inicio} a ${termino}</div>
        <div class="issued">Data de Emissão: ${emissao}</div>
        <div class="wave-bottom"></div>
      </section>
      <section class="page content">
        <div class="header">${logoHtml}</div>
        <h2>${this.escapeHtml(data.nome)}</h2>
        <dl>
          <dt>Categoria</dt><dd>${this.escapeHtml(data.categoria)}</dd>
          <dt>Período</dt><dd>${inicio} a ${termino}</dd>
          <dt>Descrição</dt><dd>${this.escapeHtml(data.descricao)}</dd>
        </dl>
      </section>
    </body></html>`;
  }

  private formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  private getLogo(): string | null {
    if (this.logoDataUri === undefined) {
      try {
        this.logoDataUri = `data:image/png;base64,${readFileSync(LOGO_PATH).toString('base64')}`;
      } catch (error) {
        this.logger.warn(
          `Logo não encontrada em ${LOGO_PATH}: ${error instanceof Error ? error.message : error}`,
        );
        this.logoDataUri = null;
      }
    }

    return this.logoDataUri;
  }

  render(dto: RelatorioPdfDto): string {
    const total = dto.itens.reduce((soma, item) => soma + item.valor, 0);
    const itens = dto.itens
      .map(
        (item) =>
          `<tr><td>${this.escapeHtml(item.descricao)}</td><td>${this.escapeHtml(item.status ?? '-')}</td><td>R$ ${item.valor.toFixed(2)}</td></tr>`,
      )
      .join('');
    const periodo = dto.periodoInicio || dto.periodoFim ? [dto.periodoInicio, dto.periodoFim].filter(Boolean).join(' a ') : 'Não informado';

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
    return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' } as Record<string, string>)[character] ?? character);
  }
}