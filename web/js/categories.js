// Categorias sugeridas para o formulário. Derivadas do enum RelatorioCategoria do projeto
// (prisma/schema.prisma); o backend (CreateReportDto) aceita qualquer texto não vazio.
// Categorias já utilizadas (GET /relatorios/categorias) são mescladas à lista.
export const DEFAULT_CATEGORIES = [
  'Relatório Completo',
  'Performance Financeira',
  'Desempenho Operacional',
  'Performance de Serviços',
  'Gestão de Solicitações',
  'Gestão de Documentos',
  'Gestão de Empresas',
  'Base de Clientes',
  'Análise de Eficiência',
  'Funil de Conversão',
  'Gargalos Operacionais',
];

export function mergeCategories(existing = []) {
  const seen = new Set();
  return [...DEFAULT_CATEGORIES, ...existing].filter((c) => {
    const k = String(c).trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
