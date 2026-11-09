const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { blankAuditData, blankAuditRow, formDefinition } = require('../src/lib/audits/forms.ts');
const { auditPdfOptions, auditReportLinkedSections, auditSections } = require('../src/lib/audits/export.ts');
const { AuditReportLinks } = require('../src/components/audits/AuditReportLinks.tsx');
const { buildStandardPdf } = require('../src/lib/document-pdf.ts');
const { DEFAULT_DOCUMENT_STANDARD } = require('../src/lib/document-standard.ts');

function fixture() {
  const document = (kind, data) => ({ id: kind, kind, status: 'BORRADOR', version: 1, revision: 1, data,
    approvedAt: null, approvedByName: null, updatedAt: '2026-11-09', updatedByName: 'Auditor', auditId: 'audit', programId: null });
  const findings = blankAuditData('F4');
  findings.values.summary = 'Se identificaron cinco hallazgos en el proceso.';
  findings.rows = formDefinition('F4').rowFields.find(field => field.key === 'classification').options.map((classification, index) => ({
    ...blankAuditRow('F4', `h${index + 1}`), questionId: 'q1', processId: 'process', criterion: 'Criterio ' + index,
    classification, description: `Descripción del hallazgo ${index}`, evidence: `Evidencia objetiva ${index}`,
    auditorId: 'auditor', date: '2026-11-09',
  }));
  const plan = blankAuditData('F2');
  Object.assign(plan.values, { objectives: 'Verificar eficacia', scope: 'Proceso de calidad', criteria: 'Procedimiento vigente' });
  const report = document('F7', blankAuditData('F7'));
  const source = { program: null, audit: { id: 'audit', code: 'AI-001', name: 'Auditoría de calidad',
    type: 'INTERNA', scheduledDate: '2026-11-09', leadAuditor: 'auditor', teamMemberIds: [], processes: ['process'] },
    audits: [], people: [{ id: 'auditor', name: 'Ana Auditora', active: true, role: 'AUDITOR_INTERNO' }],
    processes: [{ id: 'process', code: 'GC', name: 'Gestión de calidad', active: true }],
    documents: [document('F2', plan), document('F3', { values: {}, rows: [{ id: 'q1', question: '¿Se revisan los registros?' }] }), document('F4', findings), report] };
  const context = { tenant: { id: 't', name: 'Empresa de pruebas', logo: null }, config: DEFAULT_DOCUMENT_STANDARD, revision: 1, formats: [] };
  return { report, source, findings, context };
}

test('F7 incluye el registro completo de F4 con referencias legibles en pantalla y PDF', () => {
  const { report, source, findings, context } = fixture();
  const sections = auditReportLinkedSections(report, source);
  assert.equal(sections.filter(section => section.title?.startsWith('Hallazgo H')).length, findings.rows.length);
  const html = renderToStaticMarkup(React.createElement(AuditReportLinks, { document: report, source }));
  const options = auditPdfOptions('t', report, source);
  const text = buildStandardPdf(options, context).internal.pages.flat().join('\n');
  assert.match(html, /Registro de hallazgos encontrados/);
  assert.match(html, /Total de hallazgos: 5/);
  for (const field of formDefinition('F4').rowFields) assert.ok(html.includes(field.label), field.label);
  for (const row of findings.rows) for (const value of [row.classification, row.description, row.evidence, row.criterion, row.date]) {
    assert.ok(html.includes(value), value);
    assert.ok(text.includes(value), value);
  }
  for (const value of ['Ana Auditora', 'Gestión de calidad', '¿Se revisan los registros?']) {
    assert.ok(html.includes(value), value);
    assert.ok(text.includes(value), value);
  }
  assert.match(html, /<dl/);
  assert.doesNotMatch(html, /<input|<textarea|<select/);
});

test('F7 distingue un registro sin hallazgos de un F4 ausente', () => {
  const { report, source, findings } = fixture();
  findings.rows = [];
  findings.values.summary = 'La auditoría no identificó hallazgos.';
  const empty = JSON.stringify(auditReportLinkedSections(report, source));
  assert.match(empty, /Sin hallazgos registrados en F4/);
  assert.match(empty, /La auditoría no identificó hallazgos/);
  source.documents = source.documents.filter(document => document.kind !== 'F4');
  const missing = JSON.stringify(auditReportLinkedSections(report, source));
  assert.match(missing, /El registro F4 no está disponible/);
  assert.doesNotMatch(missing, /Sin hallazgos registrados/);
});

test('F7 aprobado muestra los mismos hallazgos históricos que su PDF aunque cambie F4', () => {
  const { report, source, findings, context } = fixture();
  report.status = 'APROBADO';
  report.exportSnapshot = { context, sections: auditSections('F7', report.data, source) };
  // Existing approvals predate the summary/count section and must also be readable.
  report.exportSnapshot.sections = report.exportSnapshot.sections.filter(section => section.title !== 'Registro de hallazgos encontrados');
  findings.rows[0].description = 'HALLAZGO-NUEVO-NO-EMITIDO';
  findings.rows[0].evidence = 'EVIDENCIA-NUEVA-NO-EMITIDA';
  source.people[0].name = 'OTRO-AUDITOR';
  source.processes[0].name = 'OTRO-PROCESO';
  const html = renderToStaticMarkup(React.createElement(AuditReportLinks, { document: report, source }));
  const options = auditPdfOptions('t', report, source);
  const text = buildStandardPdf(options, options.contextSnapshot).internal.pages.flat().join('\n');
  for (const value of ['Descripción del hallazgo 0', 'Evidencia objetiva 0', 'Ana Auditora', 'Gestión de calidad']) {
    assert.ok(html.includes(value)); assert.ok(text.includes(value));
  }
  for (const value of ['HALLAZGO-NUEVO-NO-EMITIDO', 'EVIDENCIA-NUEVA-NO-EMITIDA', 'OTRO-AUDITOR', 'OTRO-PROCESO']) {
    assert.ok(!html.includes(value)); assert.ok(!text.includes(value));
  }
  report.exportSnapshot.sections = [{ text: 'Informe histórico sin anexos' }];
  assert.deepEqual(auditReportLinkedSections(report, source), []);
});

test('F7 plantilla incluye campos de hallazgos vacíos sin filtrar datos del expediente', () => {
  const { report, source, context } = fixture();
  const options = auditPdfOptions('t', report, source, true);
  const section = options.sections.find(section => section.title === 'Registro de hallazgos encontrados');
  assert.ok(section.rows.some(([label]) => label === 'Evidencia objetiva / referencia verificable'));
  assert.ok(section.rows.every(([, value]) => value.trim() === ''));
  const text = buildStandardPdf(options, context).internal.pages.flat().join('\n');
  assert.ok(!text.includes('Descripción del hallazgo 0'));
  assert.ok(!text.includes('Ana Auditora'));
  assert.ok(!text.includes('Gestión de calidad'));
  assert.ok(!text.includes('AI-001'));
  assert.match(text, /Plantilla sin diligenciar/);
});

test('F7 conserva hallazgos extensos en todas las páginas y escapa texto en pantalla', () => {
  const { report, source, findings, context } = fixture();
  findings.rows = Array.from({ length: 8 }, (_, index) => ({ ...findings.rows[0], id: `long-${index}`,
    description: '<script>alert("hallazgo")</script>\n' + ('Descripción extensa para verificar el registro. ').repeat(70) + `FIN-DESCRIPCION-${index}`,
    evidence: ('Referencia documental verificable. ').repeat(50) + `FIN-EVIDENCIA-${index}` }));
  const html = renderToStaticMarkup(React.createElement(AuditReportLinks, { document: report, source }));
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  const pdf = buildStandardPdf(auditPdfOptions('t', report, source), context);
  assert.ok(pdf.getNumberOfPages() > 8);
  const text = pdf.internal.pages.flat().join('\n');
  for (let index = 0; index < findings.rows.length; index++) {
    assert.ok(text.includes(`FIN-DESCRIPCION-${index}`));
    assert.ok(text.includes(`FIN-EVIDENCIA-${index}`));
  }
  for (const page of pdf.internal.pages.slice(1)) assert.match(page.join('\n'), /SGC-FO-ISO-92F7/);
});
