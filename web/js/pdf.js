import { pdfFileName } from './format.js';

export async function downloadReportPdf(
  report,
  { api, doc = globalThis.document, urlApi = URL, open = (u) => globalThis.open(u, '_blank', 'noopener') } = {},
) {
  const blob = await api.pdf(report.id);
  const objectUrl = urlApi.createObjectURL(blob);
  const a = doc.createElement('a');

  a.href = objectUrl;
  a.download = pdfFileName(report);
  doc.body.append(a);
  a.click();
  a.remove();

  setTimeout(() => urlApi.revokeObjectURL(objectUrl), 10000);
  return { mode: 'download' };
}

export async function openReportPdf(
  report,
  { api, open = (u) => globalThis.open(u, '_blank', 'noopener'), urlApi = URL } = {},
) {
  const blob = await api.pdf(report.id);
  const objectUrl = urlApi.createObjectURL(blob);
  open(objectUrl);
  setTimeout(() => urlApi.revokeObjectURL(objectUrl), 60000);
  return objectUrl;
}