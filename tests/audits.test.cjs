const test = require('node:test');
const assert = require('node:assert/strict');
const { auditKinds, blankAuditData, blankAuditRow, parseAuditData, protectVerification } = require('../src/lib/audits/forms.ts');
const { auditPdfOptions } = require('../src/lib/audits/export.ts');
const { buildStandardPdf } = require('../src/lib/document-pdf.ts');
const { DEFAULT_DOCUMENT_STANDARD } = require('../src/lib/document-standard.ts');
const { DOCUMENT_CATALOG } = require('../src/lib/document-catalog.ts');
const context = { tenant: { id: 't', name: 'Empresa de pruebas', logo: null }, config: DEFAULT_DOCUMENT_STANDARD, revision: 1, formats: [] };
const source = { program: { id: 'p', code: 'PA-TEST', name: 'Programa de pruebas', startDate: '2026-01-01', endDate: '2026-12-31', revision: 1 }, audit: null, audits: [], people: [], processes: [], documents: [] };

test('auditorías: ocho plantillas independientes se exportan con encabezado común y sin aprobación inventada', () => {
  for (const kind of auditKinds) {
    assert.ok(DOCUMENT_CATALOG.some(entry => entry.key === '9.2.' + kind));
    const document = { kind, version: 1, status: 'BORRADOR', data: blankAuditData(kind), updatedByName: 'Auditor', updatedAt: '2026-10-30', approvedAt: null };
    const pdf = buildStandardPdf(auditPdfOptions('t', document, source, true), context);
    assert.ok(pdf.output('arraybuffer').byteLength > 1000);
    const text = pdf.internal.pages.flat().join('\n');
    assert.match(text, /Plantilla sin diligenciar/);
    assert.match(text, /Sin aprobaci.n registrada/);
    assert.match(text, new RegExp('ISO-92' + kind));
  }
});
test('auditorías: fechas imposibles, horas invertidas, pendientes y no aplica sin justificación se rechazan', () => {
  const plan = blankAuditData('F2');
  plan.rows = [{ ...blankAuditRow('F2', 'r1'), date: '2026-02-30' }];
  assert.throws(() => parseAuditData('F2', plan));
  plan.rows[0] = { ...blankAuditRow('F2', 'r1'), startTime: '15:30', endTime: '14:00' };
  assert.throws(() => parseAuditData('F2', plan), /posterior/);
  const list = blankAuditData('F3');
  list.rows = [{ ...blankAuditRow('F3', 'q1'), processId: 'p', criterion: '7.5', question: '¿Existe evidencia?', result: 'No aplica' }];
  assert.throws(() => parseAuditData('F3', list, true), /justifique/);
  list.rows[0].notes = 'Proceso fuera del alcance aprobado.';
  assert.equal(parseAuditData('F3', list, true).rows.length, 1);
});
test('auditorías: los clientes no pueden inventar la verificación ni cerrar sin eficacia', () => {
  const row = { ...blankAuditRow('F8', 'a1'), status: 'Cerrada', evidence: 'Registro 10', effectiveness: 'Eficaz', evaluation: '' };
  const data = { ...blankAuditData('F8'), rows: [row] };
  assert.throws(() => parseAuditData('F8', data), /evaluación/);
  row.evaluation = 'Muestreo posterior conforme, evidencia 12.';
  assert.throws(() => protectVerification(data, blankAuditData('F8'), false, 'Persona', '2026-10-30'), /administrador/);
  row.verifiedBy = 'Falsificado';
  const result = protectVerification(data, blankAuditData('F8'), true, 'Revisor real', '2026-10-30');
  assert.equal(result.rows[0].verifiedBy, 'Revisor real');
  assert.throws(() => protectVerification(blankAuditData('F8'), result, true, 'Revisor', '2026-10-30'), /no puede eliminarse/);
});
test('auditorías: los informes y actividades extensos no se truncan y el PDF aprobado usa su snapshot', () => {
  const data = blankAuditData('F8');
  data.values.objectives = 'Seguimiento';
  data.rows = Array.from({ length: 12 }, (_, i) => ({ ...blankAuditRow('F8', 'a'+i), action: ('Acción con evidencia verificable. ').repeat(80) + 'FIN-' + i, status: 'En curso' }));
  const document = { kind: 'F8', version: 1, status: 'BORRADOR', data, updatedByName: 'Auditor', updatedAt: '2026-10-30', approvedAt: null };
  const pdf = buildStandardPdf(auditPdfOptions('t', document, source), context);
  assert.ok(pdf.getNumberOfPages() > 5);
  assert.ok(pdf.internal.pages.flat().join('\n').includes('FIN-11'));
  for (const page of pdf.internal.pages.slice(1)) assert.match(page.join('\n'), /SGC-FO-ISO-92F8/);
  const snapshot = { context, sections: [{ text: 'CONTENIDO-APROBADO' }] };
  const options = auditPdfOptions('t', { ...document, status: 'APROBADO', approvedAt: '2026-10-30', exportSnapshot: snapshot }, source);
  assert.equal(options.sections[0].text, 'CONTENIDO-APROBADO');
  assert.deepEqual(options.contextSnapshot, context);
});
