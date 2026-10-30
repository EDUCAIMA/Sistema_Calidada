"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Save, Download, Send, CheckCircle2, History, RotateCcw, Trash2, FileText, ClipboardList, Pencil, RefreshCw, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { downloadStandardPdf } from '@/lib/document-pdf';
import { auditPdfOptions } from '@/lib/audits/export';
import { AUDIT_FORMS, auditStatusLabels, blankAuditData, blankAuditRow, formDefinition, type AuditKind, type AuditData, type AuditRow, type AuditSource, type AuditDocumentView, type AuditProgramView, type AuditView, type Field, type DirectoryPerson, type DirectoryProcess } from '@/lib/audits/forms';

const endpoint = '/api/evaluacion/auditorias';
const selectClass = 'h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-600';
const errorText = (error: unknown) => error instanceof Error ? error.message : 'No fue posible completar la operación.';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const dateText = (value: string) => value.slice(0, 10);
type Summary = { id: string; kind: AuditKind; status: string };
type Overview = { programs: (AuditProgramView & { documents: Summary[] })[]; audits: (AuditView & { auditDocuments: Summary[] })[]; people: DirectoryPerson[]; processes: DirectoryProcess[]; canManage: boolean };
type Detail = AuditSource & { editableKinds: AuditKind[]; canApprove: boolean };
type Selection = { id: string; type: 'program' | 'audit' };
type HistoryItem = { id: string; action: string; version: number; userName: string; note: string; createdAt: string };
async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo procesar la solicitud.');
  return result;
}

export function AuditWorkspace({ tenantId }: { tenantId: string }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [kind, setKind] = useState<AuditKind>('F1');
  const [draft, setDraft] = useState<AuditData>(blankAuditData('F1'));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');
  const [creator, setCreator] = useState<{ type: 'program' | 'audit'; existing?: AuditProgramView | AuditView } | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [decision, setDecision] = useState<'return' | 'revise' | null>(null);
  const [note, setNote] = useState('');
  const [copyFrom, setCopyFrom] = useState('');
  const [reload, setReload] = useState(0);
  const initialized = useRef(false);
  const document = detail?.documents.find(item => item.kind === kind);
  const definition = formDefinition(kind);
  const dirty = Boolean(document && JSON.stringify(draft) !== JSON.stringify(document.data));
  const editable = Boolean(document?.status === 'BORRADOR' && detail?.editableKinds.includes(kind));
  const source: AuditSource = detail || { program: null, audit: null, audits: [], people: overview?.people || [], processes: overview?.processes || [], documents: [] };
  const activeProgramId = detail?.program?.id || (selection?.type === 'program' ? selection.id : '');

  const loadOverview = useCallback(async (signal?: AbortSignal) => {
    const result: Overview = await requestJson(`${endpoint}?tenantId=${encodeURIComponent(tenantId)}`, { signal });
    if (signal?.aborted) return;
    setOverview(result);
    if (!initialized.current) {
      initialized.current = true;
      const query = new URLSearchParams(window.location.search);
      const requestedKind = query.get('format') as AuditKind;
      if (AUDIT_FORMS.some(form => form.kind === requestedKind)) setKind(requestedKind);
      const requestedAudit = result.audits.find(audit => audit.id === query.get('audit'));
      const firstAudit = requestedAudit || (requestedKind && requestedKind !== 'F1' ? result.audits[0] : undefined);
      const requestedProgram = result.programs.find(program => program.id === query.get('program'));
      if (firstAudit) { setSelection({ type: 'audit', id: firstAudit.id }); if (!requestedKind) setKind('F2'); }
      else if (requestedProgram || result.programs[0]) setSelection({ type: 'program', id: (requestedProgram || result.programs[0]).id });
      else if (result.audits[0]) { setSelection({ type: 'audit', id: result.audits[0].id }); setKind('F2'); }
    }
  }, [tenantId]);
  useEffect(() => {
    if (!tenantId) return;
    const abort = new AbortController();
    loadOverview(abort.signal).catch(error => { if (!abort.signal.aborted) setFailure(errorText(error)); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [tenantId, loadOverview]);
  useEffect(() => {
    setDetail(null);
    if (!selection) return;
    const abort = new AbortController();
    setLoading(true); setFailure('');
    requestJson(`${endpoint}?tenantId=${encodeURIComponent(tenantId)}&ownerType=${selection.type}&ownerId=${encodeURIComponent(selection.id)}`, { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setDetail(result); })
      .catch(error => { if (!abort.signal.aborted) setFailure(errorText(error)); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [tenantId, selection, reload]);
  useEffect(() => { setDraft(document?.data || blankAuditData(kind)); setCopyFrom(''); }, [document, kind]);

  const allowLeave = () => !dirty || window.confirm('Hay cambios sin guardar. ¿Desea descartarlos y continuar?');
  const choose = (next: Selection, nextKind: AuditKind) => {
    if (busy || !allowLeave()) return;
    setSelection(next); setKind(nextKind); setHistory(null);
  };
  const chooseKind = (next: AuditKind) => {
    if (next === kind || busy || !allowLeave()) return;
    if (next === 'F1' && activeProgramId) setSelection({ type: 'program', id: activeProgramId });
    else if (next !== 'F1' && selection?.type === 'program') {
      const audit = overview?.audits.find(item => item.programId === selection.id);
      if (audit) setSelection({ type: 'audit', id: audit.id });
    }
    setKind(next); setHistory(null);
  };
  const post = (body: object) => requestJson(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId, ...body }) });
  const act = async (action: string, data?: AuditData) => {
    if (!document || busy) return;
    setBusy(true);
    try {
      await post({ action, documentId: document.id, revision: document.revision, ...(action === 'save' ? { data: data || draft } : {}), note });
      setDecision(null); setNote('');
      await loadOverview(); setReload(value => value + 1);
      toast.success(({ save: 'Información guardada.', submit: 'Formato enviado a revisión.', approve: 'Formato aprobado.', return: 'Formato devuelto para ajustes.', revise: 'Nueva versión abierta. La anterior se conserva en el historial.' } as Record<string, string>)[action] || 'Operación completada.');
    } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); }
  };
  const download = async (blank = false, historical?: { document: AuditDocumentView; source: AuditSource }) => {
    if (!tenantId || busy) return;
    const record: AuditDocumentView = historical?.document || document || { id: '', kind, status: 'BORRADOR', version: 1, revision: 1, data: blankAuditData(kind), approvedAt: null, approvedByName: null, updatedAt: '', updatedByName: '', auditId: null, programId: null };
    setBusy(true);
    try { await downloadStandardPdf(auditPdfOptions(tenantId, record, historical?.source || source, blank)); }
    catch (error) { toast.error(errorText(error)); } finally { setBusy(false); }
  };
  const historyDownload = async (event: HistoryItem) => {
    if (!document || busy) return;
    setBusy(true);
    try {
      const result = await requestJson(`${endpoint}?tenantId=${encodeURIComponent(tenantId)}&documentId=${document.id}&eventId=${event.id}`);
      await downloadStandardPdf(auditPdfOptions(tenantId, result.snapshot.document, result.snapshot.source));
    } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); }
  };
  const addLinked = async (targetKind: 'F4' | 'F8', row: AuditRow) => {
    const target = detail?.documents.find(item => item.kind === targetKind);
    if (!target || !detail?.editableKinds.includes(targetKind) || target.status !== 'BORRADOR') { toast.error(`Abra un borrador de ${targetKind} para agregar el registro vinculado.`); return; }
    if (dirty) { toast.error('Guarde primero los cambios del formato actual.'); return; }
    const newRow = blankAuditRow(targetKind, crypto.randomUUID());
    if (targetKind === 'F4') Object.assign(newRow, { questionId: row.id, processId: row.processId, criterion: row.criterion, evidence: row.evidence, auditorId: source.audit?.leadAuditor || '', date: today(), classification: '' });
    else Object.assign(newRow, { findingId: row.id });
    setBusy(true);
    try {
      await post({ action: 'save', documentId: target.id, revision: target.revision, data: { ...target.data, rows: [...target.data.rows, newRow] } });
      setKind(targetKind); setReload(value => value + 1); await loadOverview(); toast.success(`Registro vinculado creado en ${targetKind}. Complete su información.`);
    } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); }
  };
  const copyQuestions = async () => {
    if (!copyFrom || !editable || busy) return;
    setBusy(true);
    try {
      const result: Detail = await requestJson(`${endpoint}?tenantId=${encodeURIComponent(tenantId)}&ownerType=audit&ownerId=${encodeURIComponent(copyFrom)}`);
      const questions = result.documents.find(item => item.kind === 'F3')?.data.rows || [];
      setDraft(previous => ({ ...previous, rows: [...previous.rows, ...questions.map(row => ({ ...blankAuditRow('F3', crypto.randomUUID()), processId: row.processId, criterion: row.criterion, question: row.question, expectedEvidence: row.expectedEvidence }))] }));
      toast.success(`${questions.length} preguntas copiadas sin respuestas ni evidencias. Guarde para conservarlas.`);
    } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); }
  };

  if (!tenantId) return <p className="text-slate-500">Seleccione una empresa para gestionar sus auditorías.</p>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
        <Badge variant="secondary">{overview?.programs.length || 0} programas</Badge>
        <Badge variant="secondary">{overview?.audits.length || 0} auditorías</Badge>
        <Badge variant="secondary">8 formatos integrados</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy || loading} onClick={() => { if (allowLeave()) { loadOverview().catch(error => toast.error(errorText(error))); setReload(value => value + 1); } }}><RefreshCw className="mr-2 h-4 w-4" />Recargar</Button>
        {overview?.canManage && <><Button variant="outline" onClick={() => { if (allowLeave()) setCreator({ type: 'program' }); }} disabled={busy}><Plus className="mr-2 h-4 w-4" />Nuevo programa</Button><Button onClick={() => { if (allowLeave()) setCreator({ type: 'audit' }); }} disabled={busy || !overview.programs.length}><Plus className="mr-2 h-4 w-4" />Nueva auditoría</Button></>}
      </div>
    </div>
    {failure && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{failure}</div>}
    {overview && <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      <label className="space-y-2 font-medium">Programa de auditorías<select className={selectClass} value={activeProgramId} onChange={event => event.target.value && choose({ type: 'program', id: event.target.value }, 'F1')} disabled={busy}>
        <option value="">Seleccione un programa</option>{overview.programs.map(program => <option key={program.id} value={program.id}>{program.code} · {program.name}</option>)}
      </select></label>
      <label className="space-y-2 font-medium">Expediente de auditoría<select className={selectClass} value={selection?.type === 'audit' ? selection.id : ''} onChange={event => event.target.value && choose({ type: 'audit', id: event.target.value }, kind === 'F1' ? 'F2' : kind)} disabled={busy}>
        <option value="">Seleccione una auditoría para diligenciar F2–F8</option>{overview.audits.filter(audit => !activeProgramId || audit.programId === activeProgramId).map(audit => <option key={audit.id} value={audit.id}>{audit.code || 'Legada'} · {audit.name}</option>)}
      </select></label>
    </div>}
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4" role="tablist" aria-label="Formatos de auditoría">
      {AUDIT_FORMS.map(form => <button key={form.kind} type="button" role="tab" aria-selected={kind === form.kind} disabled={busy} onClick={() => chooseKind(form.kind)} className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${kind === form.kind ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
        <span className="block text-xs font-bold">{form.kind}</span><span className="mt-1 block font-medium">{form.title}</span>
      </button>)}
    </div>
    <section role="tabpanel" aria-label={`${kind}. ${definition.title}`} className="space-y-5 rounded-2xl border border-slate-200 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-xl font-bold text-slate-900">{kind}. {definition.title}</h2><p className="mt-1 text-slate-500">{definition.description}</p>
          {document && <div className="mt-3 flex flex-wrap items-center gap-2"><Badge variant="outline">{auditStatusLabels[document.status]}</Badge><span className="text-xs text-slate-500">Versión del registro {document.version} · {dirty ? 'Cambios sin guardar' : `Guardado por ${document.updatedByName}`}</span></div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => download(true)}><FileText className="mr-2 h-4 w-4" />Plantilla PDF</Button>
          {document && <Button variant="outline" size="sm" disabled={busy || dirty || loading} title={dirty ? 'Guarde primero los cambios' : 'Descargar información guardada'} onClick={() => download()}><Download className="mr-2 h-4 w-4" />Descargar PDF</Button>}
        </div>
      </div>
      {loading ? <p className="py-10 text-center text-slate-500">Cargando formatos…</p> : !document ? <div className="rounded-xl bg-slate-50 px-6 py-10 text-center text-slate-600"><ClipboardList className="mx-auto mb-3 h-10 w-10 text-blue-500" /><p>{kind === 'F1' ? 'Cree o seleccione un programa para registrar su planificación.' : 'Cree o seleccione una auditoría para diligenciar este formato.'}</p>
        {selection?.type === 'audit' && detail && overview?.canManage && <Button className="mt-4" disabled={busy} onClick={async () => { setBusy(true); try { await post({ action: 'initialize_audit', id: selection.id }); setReload(value => value + 1); } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); } }}>Habilitar formatos de esta auditoría</Button>}
      </div> : <>
        <div className="flex flex-wrap justify-between gap-4 rounded-xl bg-slate-50 p-4">
          <div><p className="font-semibold">{source.audit?.name || source.program?.name}</p><p className="mt-1 text-xs text-slate-500">{source.audit ? `${source.audit.code || ''} · ${dateText(source.audit.scheduledDate)} · ${source.audit.leadAuditorName || ''}` : source.program ? `${source.program.code} · ${dateText(source.program.startDate)} a ${dateText(source.program.endDate)}` : ''}</p></div>
          {overview?.canManage && <Button size="sm" variant="outline" disabled={busy || dirty || document.status !== 'BORRADOR' || !['F1', 'F2'].includes(kind)} onClick={() => setCreator({ type: source.audit ? 'audit' : 'program', existing: source.audit || source.program! })}><Pencil className="mr-2 h-4 w-4" />Datos generales</Button>}
        </div>
        {document.status === 'APROBADO' && <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-800">Aprobado por {document.approvedByName}. El PDF conserva la información y configuración documental de esta aprobación. Para editar, abra una nueva versión.</p>}
        {!detail?.editableKinds.includes(kind) && <p className="rounded-lg bg-amber-50 p-3 text-amber-800">Acceso de consulta. La edición corresponde a la empresa o al equipo auditor asignado.</p>}
        <div className="grid gap-5 md:grid-cols-2">
          {definition.fields.map(field => <AuditField key={field.key} field={field} value={draft.values[field.key] || ''} source={source} id={`${kind}-field-${field.key}`} disabled={!editable || busy} onChange={value => setDraft(current => ({ ...current, values: { ...current.values, [field.key]: value } }))} />)}
        </div>
        {kind === 'F1' && <div><h3 className="mb-3 font-semibold">Cronograma del programa</h3><div className="relative overflow-x-auto rounded-xl border"><table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-slate-50"><tr>{['Auditoría', 'Fecha', 'Auditor líder', 'Estado', ''].map((label, i) => <th key={i} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>{source.audits.map(audit => <tr key={audit.id} className="border-t"><td className="p-3">{audit.name}<span className="block text-xs text-slate-500">{audit.code}</span></td><td className="p-3">{dateText(audit.scheduledDate)}</td><td className="p-3">{audit.leadAuditorName}</td><td className="p-3">{audit.status}</td><td className="p-3"><Button size="sm" variant="outline" disabled={busy} onClick={() => choose({ type: 'audit', id: audit.id }, 'F2')}>Abrir expediente</Button></td></tr>)}</tbody></table>{!source.audits.length && <p className="p-5 text-slate-500">Use «Nueva auditoría» para agregar actividades al programa.</p>}</div></div>}
        {kind === 'F3' && editable && <div className="flex flex-wrap items-end gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4"><label className="min-w-0 flex-1 space-y-2 font-medium">Reutilizar preguntas de otra auditoría<select className={selectClass} value={copyFrom} onChange={event => setCopyFrom(event.target.value)} disabled={busy}><option value="">Seleccione una lista existente</option>{overview?.audits.filter(audit => audit.id !== source.audit?.id).map(audit => <option key={audit.id} value={audit.id}>{audit.name}</option>)}</select></label><Button variant="outline" disabled={!copyFrom || busy} onClick={copyQuestions}>Copiar preguntas</Button></div>}
        {definition.rowFields.length > 0 && <div className="space-y-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{definition.rowTitle} ({draft.rows.length})</h3>{editable && <Button variant="outline" size="sm" disabled={busy || draft.rows.length >= 300} onClick={() => setDraft(current => ({ ...current, rows: [...current.rows, blankAuditRow(kind, crypto.randomUUID())] }))}><Plus className="mr-2 h-4 w-4" />Agregar registro</Button>}</div>
          {!draft.rows.length && <p className="rounded-xl border border-dashed p-6 text-center text-slate-500">{kind === 'F4' ? 'Registre los hallazgos o documente en el resumen que la auditoría no produjo hallazgos.' : 'Aún no hay registros. Agregue el primero para empezar.'}</p>}
          {draft.rows.map((row, index) => <article key={row.id} className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold text-blue-700">{kind === 'F3' ? 'Pregunta P' : kind === 'F4' ? 'Hallazgo H' : 'Registro '}{index + 1}</h4><div className="flex flex-wrap gap-2">
            {kind === 'F3' && detail?.editableKinds.includes('F4') && <Button size="sm" variant="outline" disabled={busy || dirty} onClick={() => addLinked('F4', row)}><Link2 className="mr-2 h-4 w-4" />Crear hallazgo</Button>}
            {kind === 'F4' && detail?.editableKinds.includes('F8') && <Button size="sm" variant="outline" disabled={busy || dirty} onClick={() => addLinked('F8', row)}><Link2 className="mr-2 h-4 w-4" />Crear actividad</Button>}
            {editable && <Button size="sm" variant="ghost" aria-label={`Eliminar registro ${index + 1}`} disabled={busy || Boolean(row.verifiedAt)} onClick={() => { if (window.confirm('¿Retirar este registro del borrador?')) setDraft(current => ({ ...current, rows: current.rows.filter(item => item.id !== row.id) })); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
          </div></div>
          <div className="grid gap-4 md:grid-cols-2">{definition.rowFields.map(field => <AuditField key={field.key} field={field} value={row[field.key] || ''} source={source} id={`${kind}-${row.id}-${field.key}`} disabled={!editable || busy || (kind === 'F8' && !detail?.canApprove && (['effectiveness', 'evaluation'].includes(field.key) || Boolean(row.verifiedAt)))} onChange={value => setDraft(current => ({ ...current, rows: current.rows.map(item => item.id === row.id ? { ...item, [field.key]: value } : item) }))} />)}</div>
          {kind === 'F8' && <p className="text-xs text-slate-500">{row.verifiedAt ? `Eficacia verificada por ${row.verifiedBy} · ${row.verifiedAt}` : 'La verificación de eficacia corresponde a un administrador. Una actividad implementada no está cerrada hasta verificar su eficacia.'}</p>}
          </article>)}
        </div>}
        {['F5', 'F6', 'F7'].includes(kind) && <LinkedSummary kind={kind} source={source} />}
        <div className="flex flex-wrap gap-2 border-t pt-5">
          {editable && <><Button disabled={busy || !dirty} onClick={() => act('save')}><Save className="mr-2 h-4 w-4" />Guardar borrador</Button><Button variant="outline" disabled={busy || dirty} onClick={() => act('submit')}><Send className="mr-2 h-4 w-4" />Enviar a revisión</Button></>}
          {document.status === 'EN_REVISION' && detail?.canApprove && <><Button disabled={busy} onClick={() => act('approve')}><CheckCircle2 className="mr-2 h-4 w-4" />{kind === 'F7' ? 'Aprobar y emitir informe' : 'Aprobar formato'}</Button><Button variant="outline" disabled={busy} onClick={() => { setDecision('return'); setNote(''); }}>Solicitar ajustes</Button></>}
          {document.status === 'APROBADO' && detail?.editableKinds.includes(kind) && <Button variant="outline" disabled={busy} onClick={() => { setDecision('revise'); setNote(''); }}><RotateCcw className="mr-2 h-4 w-4" />Nueva versión</Button>}
          <Button variant="outline" disabled={busy} onClick={async () => { try { setHistory(await requestJson(`${endpoint}?tenantId=${encodeURIComponent(tenantId)}&documentId=${document.id}`)); } catch (error) { toast.error(errorText(error)); } }}><History className="mr-2 h-4 w-4" />Historial</Button>
          {dirty && <span className="self-center text-xs text-amber-700">Guarde antes de revisar o descargar.</span>}
        </div>
      </>}
    </section>
    {creator && overview && <OwnerDialog key={`${creator.type}-${creator.existing?.id || 'new'}`} creator={creator} overview={overview} programId={activeProgramId} busy={busy} onClose={() => !busy && setCreator(null)} onSave={async fields => { setBusy(true); try { const result = await post({ action: `${creator.existing ? 'update' : 'create'}_${creator.type}`, ...fields, ...(creator.existing ? { id: creator.existing.id, revision: creator.existing.revision } : {}) }); setCreator(null); await loadOverview(); setSelection({ type: creator.type, id: result.id }); setKind(creator.type === 'program' ? 'F1' : 'F2'); setReload(value => value + 1); toast.success('Registro guardado.'); } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); } }} />}
    <Dialog open={Boolean(decision)} onOpenChange={open => !open && !busy && setDecision(null)}><DialogContent><DialogHeader><DialogTitle>{decision === 'revise' ? 'Abrir nueva versión' : 'Solicitar ajustes'}</DialogTitle><DialogDescription>El historial conserva las versiones y decisiones anteriores.</DialogDescription></DialogHeader><label className="space-y-2">Motivo<Textarea value={note} onChange={event => setNote(event.target.value)} maxLength={5000} /></label><Button disabled={busy || !note.trim()} onClick={() => decision && act(decision)}>Confirmar</Button></DialogContent></Dialog>
    <Dialog open={history !== null} onOpenChange={open => !open && setHistory(null)}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Historial · {kind}</DialogTitle><DialogDescription>Versiones guardadas, revisiones y aprobaciones. Se muestran los últimos 100 eventos.</DialogDescription></DialogHeader>{!history?.length && <p className="text-slate-500">Sin cambios registrados todavía.</p>}{history?.map(event => <div key={event.id} className="rounded-xl border p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">Versión {event.version} · {({ save: 'Guardado', submit: 'Enviado a revisión', approve: 'Aprobado', return: 'Devuelto', revise: 'Nueva versión' } as Record<string, string>)[event.action] || event.action}</p><Button size="sm" variant="outline" disabled={busy} onClick={() => historyDownload(event)}><Download className="mr-2 h-4 w-4" />PDF histórico</Button></div><p className="mt-2 text-xs text-slate-500">{event.userName} · {new Date(event.createdAt).toLocaleString('es-CO')}</p>{event.note && <p className="mt-2 whitespace-pre-wrap">{event.note}</p>}</div>)}</DialogContent></Dialog>
  </div>;
}

function AuditField({ field, value, source, id, disabled, onChange }: { field: Field; value: string; source: AuditSource; id: string; disabled: boolean; onChange: (value: string) => void }) {
  let options: { value: string; label: string }[] | null = null;
  if (field.options) options = field.options.map(value => ({ value, label: value }));
  if (field.type === 'person') options = source.people.filter(item => item.active || item.id === value).map(item => ({ value: item.id, label: `${item.name}${item.active ? '' : ' (inactivo)'}` }));
  if (field.type === 'process') options = source.processes.filter(item => item.active || item.id === value).map(item => ({ value: item.id, label: `${item.code} · ${item.name}${item.active ? '' : ' (inactivo)'}` }));
  if (field.type === 'finding' || field.type === 'question') options = (source.documents.find(doc => doc.kind === (field.type === 'finding' ? 'F4' : 'F3'))?.data.rows || []).map((row, index) => ({ value: row.id, label: `${field.type === 'finding' ? 'H' : 'P'}${index + 1} · ${(row.description || row.question || 'Sin descripción').slice(0, 120)}` }));
  return <div className={`min-w-0 space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}><label htmlFor={id} className="block text-sm font-medium text-slate-700">{field.label}{field.required && <span className="ml-1 text-blue-600" title="Requerido para enviar a revisión">*</span>}</label>
    {options ? <select id={id} className={selectClass} value={value} onChange={event => onChange(event.target.value)} disabled={disabled}><option value="">Seleccione…</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      : field.type === 'textarea' ? <Textarea id={id} value={value} onChange={event => onChange(event.target.value)} disabled={disabled} rows={3} maxLength={16000} className="min-h-24 disabled:opacity-100" />
      : <Input id={id} value={value} type={field.type === 'date' || field.type === 'time' ? field.type : 'text'} onChange={event => onChange(event.target.value)} disabled={disabled} maxLength={1000} className="disabled:opacity-100" />}
  </div>;
}
function LinkedSummary({ kind, source }: { kind: AuditKind; source: AuditSource }) {
  const plan = source.documents.find(doc => doc.kind === 'F2');
  const findings = source.documents.find(doc => doc.kind === 'F4');
  return <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4"><h3 className="flex items-center gap-2 font-semibold text-blue-800"><Link2 className="h-4 w-4" />Información vinculada al PDF</h3>
    {kind !== 'F6' && <div><p className="font-medium">F2 · Plan de auditoría ({auditStatusLabels[plan?.status || 'BORRADOR']})</p><p className="mt-1 whitespace-pre-wrap text-slate-600">{plan?.data.values.objectives || 'Complete los objetivos en el plan F2.'}</p><p className="mt-1 whitespace-pre-wrap text-slate-600">{plan?.data.values.scope}</p></div>}
    {kind !== 'F5' && <div><p className="font-medium">F4 · Hallazgos: {findings?.data.rows.length || 0}</p><p className="mt-1 whitespace-pre-wrap text-slate-600">{findings?.data.values.summary || 'Complete el resumen en F4.'}</p>{findings?.data.rows.map((row, index) => <p key={row.id} className="mt-2 text-slate-600">H{index + 1} · {row.classification} · {row.description}</p>)}</div>}
    <p className="text-xs text-slate-500">La aprobación conserva una copia de estos datos. Las versiones aprobadas se descargan con esa información histórica.</p>
  </div>;
}

function OwnerDialog({ creator, overview, programId, busy, onClose, onSave }: { creator: { type: 'program' | 'audit'; existing?: AuditProgramView | AuditView }; overview: Overview; programId: string; busy: boolean; onClose: () => void; onSave: (fields: object) => Promise<void> }) {
  const existing = creator.existing;
  const audit = creator.type === 'audit' ? existing as AuditView | undefined : undefined;
  const program = creator.type === 'program' ? existing as AuditProgramView | undefined : undefined;
  const currentYear = today().slice(0, 4);
  const [name, setName] = useState(existing?.name || '');
  const [startDate, setStartDate] = useState(program ? dateText(program.startDate) : `${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(program ? dateText(program.endDate) : `${currentYear}-12-31`);
  const [selectedProgram, setSelectedProgram] = useState(audit?.programId || programId || overview.programs[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState(audit ? dateText(audit.scheduledDate) : today());
  const [type, setType] = useState(audit?.type || 'INTERNA');
  const [leadAuditor, setLeadAuditor] = useState(audit?.leadAuditor || '');
  const [teamMemberIds, setTeam] = useState<string[]>(Array.isArray(audit?.teamMemberIds) ? audit.teamMemberIds : []);
  const [processes, setProcesses] = useState<string[]>(Array.isArray(audit?.processes) ? audit.processes : []);
  const toggle = (items: string[], id: string, checked: boolean) => checked ? [...new Set([...items, id])] : items.filter(value => value !== id);
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{existing ? 'Editar' : 'Crear'} {creator.type === 'program' ? 'programa de auditorías' : 'auditoría'}</DialogTitle><DialogDescription>{creator.type === 'program' ? 'El programa agrupa las auditorías de la empresa durante un periodo.' : 'Se crearán los siete formatos del expediente vinculados al programa seleccionado.'}</DialogDescription></DialogHeader>
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); onSave(creator.type === 'program' ? { name, startDate, endDate } : { name, programId: selectedProgram, scheduledDate, type, leadAuditor, teamMemberIds, processes }); }}>
      <label className="block space-y-2 font-medium">Nombre<Input value={name} onChange={event => setName(event.target.value)} required minLength={3} maxLength={250} disabled={busy} /></label>
      {creator.type === 'program' ? <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2">Inicio del periodo<Input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} required disabled={busy} /></label><label className="space-y-2">Fin del periodo<Input type="date" value={endDate} min={startDate} onChange={event => setEndDate(event.target.value)} required disabled={busy} /></label></div> : <>
        <label className="block space-y-2">Programa<select className={selectClass} value={selectedProgram} onChange={event => setSelectedProgram(event.target.value)} required disabled={busy}>{overview.programs.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2">Fecha programada<Input type="date" value={scheduledDate} onChange={event => setScheduledDate(event.target.value)} required disabled={busy} /></label><label className="space-y-2">Tipo<select className={selectClass} value={type} onChange={event => setType(event.target.value)} disabled={busy}><option value="INTERNA">Interna</option><option value="EXTERNA">Externa</option></select></label></div>
        <label className="block space-y-2">Auditor líder<select className={selectClass} value={leadAuditor} onChange={event => setLeadAuditor(event.target.value)} required disabled={busy}><option value="">Seleccione un auditor</option>{overview.people.filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <fieldset className="space-y-2 rounded-xl border p-4" disabled={busy}><legend className="px-1 font-medium">Equipo auditor adicional</legend>{overview.people.filter(item => item.active && item.id !== leadAuditor).map(person => <label key={person.id} className="flex items-center gap-2"><input type="checkbox" checked={teamMemberIds.includes(person.id)} onChange={event => setTeam(toggle(teamMemberIds, person.id, event.target.checked))} />{person.name}</label>)}</fieldset>
        <fieldset className="space-y-2 rounded-xl border p-4" disabled={busy}><legend className="px-1 font-medium">Procesos por auditar</legend>{!overview.processes.some(item => item.active) && <p className="text-amber-700">Registre primero los procesos en Contexto → Procesos.</p>}{overview.processes.filter(item => item.active).map(process => <label key={process.id} className="flex items-center gap-2"><input type="checkbox" checked={processes.includes(process.id)} onChange={event => setProcesses(toggle(processes, process.id, event.target.checked))} />{process.code} · {process.name}</label>)}</fieldset>
      </>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" disabled={busy || (creator.type === 'audit' && !processes.length)}>{busy ? 'Guardando…' : 'Guardar'}</Button></div>
    </form>
  </DialogContent></Dialog>;
}
