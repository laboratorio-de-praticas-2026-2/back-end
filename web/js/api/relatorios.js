// Serviço de Relatórios e Simulador — únicos pontos que conhecem as rotas da API.
import { ApiError } from '../http.js';

export function createRelatoriosApi(http) {
  return {
    /** GET /relatorios → { dados, total, pagina, limite } */
    async list(filters = {}, { signal } = {}) {
      const data = await http.json('/relatorios', { query: filters, signal });
      if (!data || !Array.isArray(data.dados) || typeof data.total !== 'number') {
        throw new ApiError('parse', 'Listagem de relatórios em formato inesperado');
      }
      return data;
    },
    /** GET /relatorios/categorias → string[] (categorias já utilizadas) */
    async categories({ signal } = {}) {
      const data = await http.json('/relatorios/categorias', { signal });
      if (!Array.isArray(data)) throw new ApiError('parse', 'Categorias em formato inesperado');
      return data;
    },
    /** GET /relatorios/:id */
    get(id, { signal } = {}) {
      return http.json(`/relatorios/${encodeURIComponent(id)}`, { signal });
    },
    /** POST /relatorios */
    create(payload) {
      return http.json('/relatorios', { method: 'POST', body: payload });
    },
    /** POST /relatorios/generate → enfileira a geração do PDF */
    generate(relatorioId) {
      return http.json('/relatorios/generate', { method: 'POST', body: { relatorioId } });
    },
    /** DELETE /relatorios/:id */
    remove(id) {
      return http.json(`/relatorios/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    /** GET /relatorios/:id/pdf → { id, url } (404 enquanto o PDF não existir) */
    async pdf(id, { signal } = {}) {
      const response = await http.raw(`/relatorios/${encodeURIComponent(id)}/pdf`, { signal });
      return response.blob();
    },
    /** POST /relatorios/simulacao */
    async simulate(payload, { signal } = {}) {
      const data = await http.json('/relatorios/simulacao', { method: 'POST', body: payload, signal });
      const keys = ['impostos', 'multas', 'honorarios', 'subtotal', 'parcelas', 'total', 'valorParcela'];
      if (!data || keys.some((k) => typeof data[k] !== 'number' || !Number.isFinite(data[k]))) {
        throw new ApiError('parse', 'Resultado da simulação em formato inesperado');
      }
      return data;
    },
  };
}
