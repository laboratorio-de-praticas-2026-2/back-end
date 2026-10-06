export const TERMOS_OBRIGACOES_SHORT_RELEASE = [
  'das',
  'darf',
  'inss',
  'sped',
  'dctf',
  'esocial',
  'ir',
  'imposto de renda',
] as const;

export function pertenceAoEscopo(
  descricao: string | null | undefined,
): boolean {
  if (!descricao) return false;
  const texto = descricao.toLowerCase();

  return TERMOS_OBRIGACOES_SHORT_RELEASE.some((termo) => {
    if (termo.includes(' ')) return texto.includes(termo);
    return new RegExp(`\\b${termo}\\b`, 'i').test(texto);
  });
}