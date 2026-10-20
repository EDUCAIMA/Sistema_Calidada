const test = require('node:test');
const assert = require('node:assert/strict');
const { buildStandardPdf, pdfText, pdfDate } = require('../src/lib/document-pdf.ts');
const { DEFAULT_DOCUMENT_STANDARD } = require('../src/lib/document-standard.ts');

const context = {
  tenant: { id: 'test', name: 'Empresa de verificación', logo: null },
  config: DEFAULT_DOCUMENT_STANDARD, revision: 0,
  formats: [{ moduleKey: '5.3', code: 'FORMATO-ANTERIOR', version: '99', approvalDate: '2025-01-01' }],
};
const options = {
  tenantId: 'test', moduleKey: '5.3', title: 'Matriz de responsabilidades y autoridades',
  filename: 'matriz', orientation: 'landscape',
  metadata: { code: 'SGC-MAT-01', version: 3, status: 'Borrador', approvalDate: null },
  sections: [{ title: 'Asignaciones', head: ['Cargo', 'Responsabilidades', 'Autoridades'], rows: Array.from({ length: 90 }, (_, index) => [
    `Responsable ${index + 1}`, 'Planificar, comunicar y verificar las responsabilidades del sistema de gestión. '.repeat(3),
    'Autorizar recursos y aprobar decisiones dentro del alcance delegado. '.repeat(2),
  ]) }],
};
test('PDF multipágina repite encabezado, estado real y paginación; no hereda aprobación de otro formato', () => {
  const pdf = buildStandardPdf(options, context, new Date('2026-10-20T12:00:00Z'));
  const pages = pdf.internal.pages.slice(1);
  assert.ok(pages.length > 3);
  for (const [index, page] of pages.entries()) {
    const content = page.join('\n');
    assert.match(content, /SGC-MAT-01/);
    assert.match(content, /Borrador/);
    assert.match(content, /Sin aprobaci.n registrada/);
    assert.ok(content.includes(`Página ${index + 1} de ${pages.length}`));
    assert.ok(!content.includes('FORMATO-ANTERIOR'));
    assert.ok(!content.includes('2025'));
  }
  assert.match(pages.at(-1).join('\n'), /\(Responsable\) Tj\s+T\* \(90\) Tj/);
  assert.ok(pdf.output('arraybuffer').byteLength > 1000);
});
test('PDF de texto largo pagina sin descartar el final y admite formatos vacíos', () => {
  const pdf = buildStandardPdf({
    ...options, orientation: 'portrait', metadata: undefined, moduleKey: '4.3',
    sections: [{ title: 'Alcance', text: `${'Descripción extensa del alcance. '.repeat(1400)}FIN-DEL-ALCANCE` }],
  }, { ...context, formats: [] });
  assert.ok(pdf.getNumberOfPages() > 1);
  assert.ok(pdf.internal.pages.at(-1).join('\n').includes('FIN-DEL-ALCANCE'));
  assert.match(pdf.internal.pages[1].join('\n'), /SGC-MA-ISO-43/);
  assert.equal(buildStandardPdf({ ...options, sections: [] }, context).getNumberOfPages(), 1);
});
test('Texto español y fecha de documento nunca inventan aprobación', () => {
  assert.equal(pdfText('Información – versión… ✓'), 'Información - versión... Sí');
  assert.equal(pdfDate(null), 'Sin aprobación registrada');
  assert.equal(pdfDate('invalida'), 'Sin aprobación registrada');
});
