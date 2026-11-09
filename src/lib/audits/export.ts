import type { PdfSection, DocumentStandardContext, StandardPdfOptions } from '@/lib/document-pdf';
import { auditStatusLabels, formDefinition, referenceLabel, type AuditData, type AuditDocumentView, type AuditKind, type AuditSource } from './forms';

export type AuditExportSnapshot = { context: DocumentStandardContext; sections: PdfSection[] };
const date = (value: string) => value.slice(0, 10);
export function auditSections(kind: AuditKind, data: AuditData, source: AuditSource): PdfSection[] {
  const definition = formDefinition(kind);
  const { audit, program } = source;
  const identification = [
    ['Programa', program ? `${program.code} · ${program.name}` : 'Sin programa vinculado'],
    ...(program ? [['Periodo', `${date(program.startDate)} a ${date(program.endDate)}`]] : []),
    ...(audit ? [
      ['Auditoría', `${audit.code || audit.id} · ${audit.name}`],
      ['Tipo / fecha programada', `${audit.type} · ${date(audit.scheduledDate)}`],
      ['Auditor líder', audit.leadAuditorName || source.people.find(person => person.id === audit.leadAuditor)?.name || '—'],
      ['Equipo auditor', audit.teamMemberIds.map(id => source.people.find(person => person.id === id)?.name || id).join('; ') || '—'],
      ['Procesos', audit.processes.map(id => source.processes.find(process => process.id === id)?.name || id).join('; ') || '—'],
    ] : []),
  ];
  const sections: PdfSection[] = [{ title: 'Identificación', head: ['Campo', 'Información'], rows: identification }];
  if (definition.fields.length) sections.push({ title: 'Información del formato', head: ['Campo', 'Información'], rows: definition.fields.map(f => [f.label, referenceLabel(f, data.values[f.key], source)]) });
  if (kind === 'F1') sections.push({ title: 'Cronograma de auditorías vinculadas', head: ['Código / auditoría', 'Tipo', 'Fecha', 'Auditor líder', 'Procesos', 'Estado'], rows: source.audits.map(item => [`${item.code || item.id} · ${item.name}`, item.type, date(item.scheduledDate), item.leadAuditorName || '—', item.processes.map(id => source.processes.find(p => p.id === id)?.name || id).join('; '), item.status]) });
  if (kind === 'F2') sections.push({ title: definition.rowTitle, head: definition.rowFields.map(f => f.label), rows: data.rows.map(row => definition.rowFields.map(f => referenceLabel(f, row[f.key], source))) });
  else if (definition.rowFields.length) {
    if (!data.rows.length) sections.push({ title: definition.rowTitle, text: kind === 'F4' ? 'Sin hallazgos registrados. Consulte el resumen de resultados.' : 'Sin registros.' });
    data.rows.forEach((row, index) => {
      sections.push({ title: `${definition.rowTitle} · ${index + 1}`, head: ['Campo', 'Información'], rows: definition.rowFields.map(f => [f.label, referenceLabel(f, row[f.key], source)]) });
      if (kind === 'F8' && row.verifiedAt) sections.push({ text: `Verificación registrada por ${row.verifiedBy} el ${row.verifiedAt}.` });
    });
  }
  sections.push(...auditLinkedSections(kind, source));
  if (kind === 'F6') sections.push({ text: 'El cierre de la reunión de auditoría no implica el cierre de las acciones de mejoramiento.' });
  if (kind === 'F5' || kind === 'F6') sections.push({ text: 'Los nombres y referencias de confirmación registrados no constituyen por sí solos una firma electrónica.' });
  return sections;
}

/** The report and its PDF share the complete linked records, including resolved references. */
export function auditLinkedSections(kind: AuditKind, source: AuditSource): PdfSection[] {
  const sections: PdfSection[] = [];
  const linkedKinds: AuditKind[] = kind === 'F7' ? ['F2', 'F4'] : kind === 'F6' ? ['F4'] : kind === 'F5' ? ['F2'] : [];
  for (const relatedKind of linkedKinds) {
    const related = source.documents.find(item => item.kind === relatedKind);
    if (!related) {
      if (relatedKind === 'F4') sections.push({ title: 'F4 · Registro de hallazgos', text: 'El registro F4 no está disponible. Registre y guarde los hallazgos de esta auditoría en F4.' });
      continue;
    }
    sections.push({ title: `${relatedKind} · ${formDefinition(relatedKind).title}`, text: `Información vinculada · versión ${related.version} · ${auditStatusLabels[related.status] || related.status}` });
    if (relatedKind === 'F2') sections.push({ head: ['Campo', 'Información'], rows: ['objectives', 'scope', 'criteria'].map(key => [formDefinition('F2').fields.find(f => f.key === key)!.label, related.data.values[key] || '—']) });
    if (relatedKind === 'F4') {
      sections.push({ text: related.data.values.summary || 'Sin resumen registrado.' });
      const counts = new Map<string, number>();
      for (const row of related.data.rows) {
        const classification = row.classification || 'Sin clasificación';
        counts.set(classification, (counts.get(classification) || 0) + 1);
      }
      sections.push({ title: 'Registro de hallazgos encontrados', text: related.data.rows.length
        ? [`Total de hallazgos: ${related.data.rows.length}.`, ...Array.from(counts, ([label, count]) => `${label}: ${count}.`)]
        : 'Sin hallazgos registrados en F4.' });
      related.data.rows.forEach((row, index) => sections.push({ title: `Hallazgo H${index + 1} · ${row.classification}`, head: ['Campo', 'Información'], rows: formDefinition('F4').rowFields.map(f => [f.label, referenceLabel(f, row[f.key], source)]) }));
    }
  }
  return sections;
}

export function auditReportLinkedSections(document: AuditDocumentView, source: AuditSource): PdfSection[] {
  const snapshot = document.status === 'APROBADO' ? document.exportSnapshot as AuditExportSnapshot | null : null;
  if (!snapshot?.sections) return auditLinkedSections('F7', source);
  // Older approvals also store these rendered sections. Never mix an issued report
  // with later changes to F4, the plan, or the people/process directory.
  const start = snapshot.sections.findIndex(section => section.title?.startsWith('F2 · ') || section.title?.startsWith('F4 · '));
  return start < 0 ? [] : snapshot.sections.slice(start);
}
export function auditPdfOptions(tenantId: string, document: AuditDocumentView, source: AuditSource, blank = false): StandardPdfOptions {
  const definition = formDefinition(document.kind);
  const snapshot = !blank && document.status === 'APROBADO' ? document.exportSnapshot as AuditExportSnapshot | null : null;
  const sections = blank ? [
    { title: 'Identificación', head: ['Empresa / auditoría', 'Fecha / responsable'], rows: [[' ', ' ']] },
    { title: definition.title, head: ['Campo', 'Información'], rows: definition.fields.map(f => [f.label, ' ']) },
    ...(definition.rowFields.length ? [{ title: definition.rowTitle, head: ['Campo', 'Información'], rows: definition.rowFields.map(f => [f.label, ' ']) }] : []),
    ...(document.kind === 'F1' ? [{ title: 'Cronograma', head: ['Auditoría', 'Proceso', 'Fecha', 'Auditor', 'Estado'], rows: [[' ', ' ', ' ', ' ', ' ']] }] : []),
    ...(document.kind === 'F7' ? [{ title: 'Registro de hallazgos encontrados', head: ['Campo', 'Información'], rows: formDefinition('F4').rowFields.map(f => [f.label, ' ']) }] : []),
  ] : snapshot?.sections || auditSections(document.kind, document.data, source);
  const metadata = blank
    ? { status: 'Plantilla sin diligenciar', approvalDate: null }
    : { status: auditStatusLabels[document.status], approvalDate: document.approvedAt };
  return {
    tenantId, moduleKey: `9.2.${document.kind}`, title: `${document.kind}. ${definition.title}`,
    filename: `${document.kind}_${blank ? 'Plantilla' : source.audit?.code || source.program?.code || 'Auditoria'}_v${document.version}`,
    orientation: definition.orientation, metadata,
    sections: [...sections, ...(blank ? [] : [{ title: 'Control del registro', keepTogether: true, text: [`Versión del registro: ${document.version}. Última actualización: ${document.updatedAt}.`, `Registrado por: ${document.updatedByName}.`, document.approvedAt ? `Aprobado por: ${document.approvedByName}. Fecha: ${document.approvedAt}.` : 'Este registro no tiene aprobación.'] }])],
    ...(snapshot ? { contextSnapshot: snapshot.context } : {}),
  };
}
