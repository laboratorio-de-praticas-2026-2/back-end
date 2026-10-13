
import test from 'node:test';
import assert from 'node:assert/strict';
import { downloadReportPdf, openReportPdf } from './pdf.js';

const mkDoc = () => {
  const a = { click() { this.clicked = true; }, remove() {} };
  return { a, doc: { createElement: () => a, body: { append() {} } } };
};

test('baixa o PDF real com o nome do arquivo preservado', async () => {
  const { a, doc } = mkDoc();
  const urlApi = {
    createObjectURL: (blob) => {
      assert.ok(blob instanceof Blob);
      return 'blob:1';
    },
    revokeObjectURL() {},
  };

  const r = await downloadReportPdf({ id: '1', nome: 'Gestão Fiscal' }, {
    api: { pdf: async () => new Blob(['%PDF']) },
    doc,
    urlApi,
  });

  assert.equal(r.mode, 'download');
  assert.equal(a.href, 'blob:1');
  assert.equal(a.download, 'gestao-fiscal.pdf');
  assert.equal(a.clicked, true);
});

test('abre a pré-visualização usando uma URL blob do PDF', async () => {
  let opened;
  const urlApi = {
    createObjectURL: (blob) => {
      assert.ok(blob instanceof Blob);
      return 'blob:preview';
    },
    revokeObjectURL() {},
  };

  const url = await openReportPdf({ id: '1', nome: 'A' }, {
    api: { pdf: async () => new Blob(['%PDF']) },
    urlApi,
    open: (u) => { opened = u; },
  });

  assert.equal(url, 'blob:preview');
  assert.equal(opened, 'blob:preview');
});

test('propaga erro da API quando o PDF ainda não existe', async () => {
  const api = { pdf: async () => { throw new Error('404'); } };

  await assert.rejects(
    downloadReportPdf({ id: '1' }, { api }),
    /404/,
  );

  await assert.rejects(
    openReportPdf({ id: '1' }, { api }),
    /404/,
  );
});
