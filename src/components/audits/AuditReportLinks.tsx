import type { AuditDocumentView, AuditSource } from '@/lib/audits/forms';
import { auditReportLinkedSections } from '@/lib/audits/export';

export function AuditReportLinks({ document, source }: { document: AuditDocumentView; source: AuditSource }) {
  const sections = auditReportLinkedSections(document, source);
  return <section aria-label="Plan y registro de hallazgos del informe" className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
    <div>
      <h3 className="font-semibold text-blue-800">Plan y registro de hallazgos del informe</h3>
      <p className="mt-1 text-sm text-slate-600">{document.status === 'APROBADO'
        ? 'Información conservada al aprobar este informe. Coincide con su PDF emitido.'
        : 'Se incluyen automáticamente los hallazgos guardados en F4 de esta auditoría. Para modificarlos, abra F4. Al aprobar el informe se conserva una copia de estos datos.'}</p>
    </div>
    {!sections.length && <p className="text-sm text-slate-600">Esta versión histórica no contiene información vinculada del plan ni del registro de hallazgos.</p>}
    {sections.map((section, index) => <div key={index} className="min-w-0 space-y-2">
      {section.title && <h4 className="break-words font-semibold text-slate-900">{section.title}</h4>}
      {section.text !== undefined && (Array.isArray(section.text) ? section.text : [section.text]).map((text, i) => <p key={i} className="whitespace-pre-wrap break-words text-sm text-slate-600">{text}</p>)}
      {section.rows && <dl className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm">
        {section.rows.map(([label, value], i) => <div key={i} className="grid min-w-0 gap-1 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
          <dt className="break-words font-medium text-slate-700">{label}</dt>
          <dd className="min-w-0 whitespace-pre-wrap break-words text-slate-600">{value}</dd>
        </div>)}
      </dl>}
    </div>)}
  </section>;
}
