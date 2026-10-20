"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, History, MessageSquare, Pencil, Plus, Printer, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LeadershipHistory, leadershipSelectClass, type LeadershipEvent } from '@/components/leadership-records';
import {
  RACI_ROLES,
  RESPONSIBILITY_MATRIX_STATUSES,
  responsibilityAssignmentSchema,
  SGC_DUTIES,
  type ResponsibilityAssignmentInput,
} from '@/lib/leadership';

interface Matrix {
  id: string; code: string; version: number; status: keyof typeof RESPONSIBILITY_MATRIX_STATUSES; scope: string;
  submittedByName: string | null; submittedAt: string | null; approvedByName: string | null; approvedAt: string | null;
  approvalNote: string | null; effectiveAt: string | null; nextReviewAt: string | null; updatedAt: string;
}
interface Assignment {
  id: string; matrixId: string; processId: string | null; processName: string | null; title: string; department: string;
  assignedToId: string; assignedToName: string; reportsTo: string; responsibilities: string; authorities: string;
  raciRoles: (keyof typeof RACI_ROLES)[]; sgcDuties: (keyof typeof SGC_DUTIES)[]; active: boolean;
  communicatedAt: string | null; communicationMethod: string | null; communicationAudience: string | null;
  communicationEvidence: string | null; acknowledgedAt: string | null; understandingEvidence: string | null; updatedAt: string;
}
interface DirectoryUser { id: string; name: string; position: string | null; topManagement: boolean }
interface ProcessOption { id: string; name: string; code: string; responsibleId: string }
interface Coverage {
  assignmentCount: number; missingDuties: string[]; missingResponsibleProcessIds: string[]; missingAccountableProcessIds: string[];
  inactiveAssigneeIds: string[]; uncommunicatedIds: string[]; unacknowledgedIds: string[]; structuralReady: boolean; implementationStatus: string;
  invalidProcessAssignmentIds: string[]; staleResponsibleAssignmentIds: string[]; incompleteAssignmentIds: string[];
}
interface RolesResponse {
  matrices: Matrix[]; matrix: Matrix | null; records: Assignment[]; users: DirectoryUser[]; processes: ProcessOption[];
  events: LeadershipEvent[]; coverage: Coverage;
}

const blank = (): ResponsibilityAssignmentInput => ({
  matrixId: undefined, processId: '', title: '', department: '', assignedToId: '', reportsTo: '',
  responsibilities: '', authorities: '', raciRoles: [], sgcDuties: [], active: true,
});
const emptyCoverage: Coverage = {
  assignmentCount: 0, missingDuties: Object.keys(SGC_DUTIES), missingResponsibleProcessIds: [], missingAccountableProcessIds: [],
  inactiveAssigneeIds: [], uncommunicatedIds: [], unacknowledgedIds: [], structuralReady: false, implementationStatus: 'BORRADOR',
  invalidProcessAssignmentIds: [], staleResponsibleAssignmentIds: [], incompleteAssignmentIds: [],
};
const implementationLabels: Record<string, string> = {
  BORRADOR: 'En elaboración', EN_REVISION: 'Pendiente de aprobación', VIGENTE: 'Vigente', OBSOLETA: 'Obsoleta',
  REQUIERE_REVISION: 'Requiere revisión', PENDIENTE_COMUNICACION: 'Pendiente de comunicación',
  PENDIENTE_COMPRENSION: 'Pendiente de comprensión', IMPLEMENTADA: 'Implementada',
};

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function localToday() { return localDateValue(new Date()); }
function localTomorrow() { const date = new Date(); date.setDate(date.getDate() + 1); return localDateValue(date); }
function defaultReviewDate() { const date = new Date(); date.setFullYear(date.getFullYear() + 1); return localDateValue(date); }
function blankApproval() { return { nextReviewAt: defaultReviewDate(), approvalNote: '' }; }

export default function RolesPage() {
  const { tenant, currentUser } = useApp();
  const [data, setData] = useState<RolesResponse>({ matrices: [], matrix: null, records: [], users: [], processes: [], events: [], coverage: emptyCoverage });
  const [loadedTenant, setLoadedTenant] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState<ResponsibilityAssignmentInput>(blank());
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [matrixHistoryOpen, setMatrixHistoryOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approval, setApproval] = useState(blankApproval);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [communicating, setCommunicating] = useState<Assignment | null>(null);
  const [communication, setCommunication] = useState({ communicatedAt: localToday(), communicationMethod: '', communicationAudience: '', communicationEvidence: '' });
  const [acknowledging, setAcknowledging] = useState<Assignment | null>(null);

  const canManage = currentUser?.role === 'ADMIN_EMPRESA' || currentUser?.role === 'SUPER_ADMIN';

  const refresh = useCallback(async (matrixId?: string, signal?: AbortSignal) => {
    if (!tenant.id) return;
    setLoading(true);
    try {
      const suffix = matrixId ? `&matrixId=${encodeURIComponent(matrixId)}` : '';
      const response = await fetch(`/api/liderazgo/roles?tenantId=${encodeURIComponent(tenant.id)}${suffix}`, { signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo cargar la matriz.');
      setData(result);
      setLoadedTenant(tenant.id);
      setError('');
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : 'No se pudo cargar la matriz.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [tenant.id]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(undefined, controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const current = loadedTenant === tenant.id ? data : { ...data, matrix: null, records: [], matrices: [], users: [], processes: [], events: [], coverage: emptyCoverage };
  const isAuditor = currentUser?.role === 'AUDITOR_INTERNO' || currentUser?.role === 'AUDITOR_EXTERNO';
  const canApprove = Boolean(currentUser && !isAuditor && currentUser.tenantId === tenant.id
    && current.users.some(user => user.id === currentUser.id && user.topManagement));
  const processNames = useMemo(() => new Map(current.processes.map(process => [process.id, `${process.code} · ${process.name}`])), [current.processes]);
  const visible = current.records.filter(record => (showArchived || record.active)
    && `${record.processName || ''} ${record.title} ${record.assignedToName} ${record.department}`.toLowerCase().includes(query.toLowerCase()));
  const editable = current.matrix?.status === 'BORRADOR';
  const selectedProcess = current.processes.find(process => process.id === form.processId);
  const selectedResponsible = current.users.find(user => user.id === selectedProcess?.responsibleId);
  const responsibleMismatch = Boolean(selectedProcess && form.assignedToId && form.raciRoles.includes('RESPONSABLE')
    && selectedProcess.responsibleId !== form.assignedToId);

  const update = <K extends keyof ResponsibilityAssignmentInput>(key: K, value: ResponsibilityAssignmentInput[K]) => setForm(previous => ({ ...previous, [key]: value }));

  function edit(record: Assignment | null) {
    setEditing(record);
    setForm(record ? {
      matrixId: record.matrixId, processId: record.processId || '', title: record.title, department: record.department,
      assignedToId: record.assignedToId, reportsTo: record.reportsTo, responsibilities: record.responsibilities,
      authorities: record.authorities, raciRoles: record.raciRoles, sgcDuties: record.sgcDuties, active: record.active,
    } : { ...blank(), matrixId: current.matrix?.id });
    setAssignmentOpen(true);
  }

  async function saveAssignment(event: React.FormEvent) {
    event.preventDefault();
    const parsed = responsibilityAssignmentSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (parsed.data.raciRoles.includes('RESPONSABLE') && selectedProcess?.responsibleId !== parsed.data.assignedToId) {
      toast.error('La función R debe asignarse al responsable vigente del proceso.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/liderazgo/roles', {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, tenantId: tenant.id, matrixId: current.matrix?.id, ...(editing && { id: editing.id, expectedUpdatedAt: editing.updatedAt }) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar la asignación.');
      toast.success('Asignación guardada en el borrador.');
      setAssignmentOpen(false);
      await refresh(result.matrixId || current.matrix?.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo guardar.'); }
    finally { setSaving(false); }
  }

  async function matrixAction(action: 'SUBMIT_MATRIX' | 'CREATE_REVISION' | 'RETURN_TO_DRAFT', note = '') {
    if (!current.matrix) return;
    setSaving(true);
    try {
      const response = await fetch('/api/liderazgo/roles', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        tenantId: tenant.id, matrixId: current.matrix.id, expectedUpdatedAt: current.matrix.updatedAt, action, note,
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo actualizar la matriz.');
      toast.success(action === 'SUBMIT_MATRIX' ? 'Matriz enviada a revisión.' : action === 'CREATE_REVISION' ? 'Nueva revisión creada.' : 'Matriz devuelta para ajustes.');
      setAdjustmentOpen(false); setAdjustmentNote('');
      await refresh(result.id || current.matrix.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la matriz.'); }
    finally { setSaving(false); }
  }

  async function approveMatrix(event: React.FormEvent) {
    event.preventDefault();
    if (!current.matrix) return;
    setSaving(true);
    try {
      const response = await fetch('/api/liderazgo/roles', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        tenantId: tenant.id, matrixId: current.matrix.id, expectedUpdatedAt: current.matrix.updatedAt,
        action: 'APPROVE_MATRIX', ...approval,
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo aprobar la matriz.');
      toast.success(`Matriz versión ${result.version} aprobada y vigente.`);
      setApprovalOpen(false);
      setApproval(blankApproval());
      await refresh(result.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo aprobar.'); }
    finally { setSaving(false); }
  }

  function openCommunication(record: Assignment) {
    setCommunicating(record);
    setCommunication({
      communicatedAt: localToday(),
      communicationMethod: '',
      communicationAudience: `${record.assignedToName} · ${record.title}`,
      communicationEvidence: '',
    });
  }

  async function communicate(event: React.FormEvent) {
    event.preventDefault();
    if (!communicating) return;
    setSaving(true);
    try {
      const response = await fetch('/api/liderazgo/roles', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        tenantId: tenant.id, id: communicating.id, expectedUpdatedAt: communicating.updatedAt, action: 'COMMUNICATE', ...communication,
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo registrar la comunicación.');
      toast.success('Comunicación registrada; el titular ya puede confirmar su comprensión.');
      setCommunicating(null);
      await refresh(current.matrix?.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo comunicar.'); }
    finally { setSaving(false); }
  }

  async function acknowledge(record: Assignment) {
    setSaving(true);
    try {
      const response = await fetch('/api/liderazgo/roles', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        tenantId: tenant.id, id: record.id, expectedUpdatedAt: record.updatedAt, action: 'ACKNOWLEDGE',
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo confirmar la comprensión.');
      toast.success('Su confirmación quedó registrada en esta versión.');
      setAcknowledging(null);
      await refresh(current.matrix?.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo confirmar.'); }
    finally { setSaving(false); }
  }

  const gaps = [
    ...current.coverage.missingDuties.map(key => SGC_DUTIES[key as keyof typeof SGC_DUTIES]),
    ...current.coverage.missingResponsibleProcessIds.map(id => `Falta R en ${processNames.get(id) || id}`),
    ...current.coverage.missingAccountableProcessIds.map(id => `Falta A en ${processNames.get(id) || id}`),
    ...(current.coverage.inactiveAssigneeIds.length ? ['Hay titulares inactivos que deben reemplazarse'] : []),
    ...(current.coverage.invalidProcessAssignmentIds.length ? ['Hay filas vinculadas a procesos inexistentes o inactivos'] : []),
    ...(current.coverage.staleResponsibleAssignmentIds.length ? ['Hay funciones R que no coinciden con el responsable vigente del proceso'] : []),
    ...(current.coverage.incompleteAssignmentIds.length ? ['Hay filas incompletas: revise cargo, área, reporte, responsabilidades, autoridades y RACI'] : []),
  ];

  return <div className="space-y-6 pb-10">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-bold">Matriz de responsabilidades y autoridades</h1><p className="mt-2 text-slate-600">ISO 9001:2015 · 5.3 — versiones, aprobación, comunicación y comprensión verificables.</p></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
        {canManage && !loading && !error && (editable || !current.matrix) && <Button onClick={() => edit(null)}><Plus className="mr-2 h-4 w-4" />Agregar asignación</Button>}
      </div>
    </div>

    {error && <div role="alert" className="rounded border border-red-200 p-4 text-red-700">{error}<Button variant="outline" className="ml-3" onClick={() => void refresh(current.matrix?.id)}>Reintentar</Button></div>}
    {loading && <p role="status">Cargando matriz…</p>}

    {!loading && !error && <>
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{current.matrix ? `${current.matrix.code} · Versión ${current.matrix.version}` : 'Primera versión pendiente'}</h2>
              {current.matrix && <Badge>{RESPONSIBILITY_MATRIX_STATUSES[current.matrix.status]}</Badge>}
              <Badge variant="outline">{implementationLabels[current.coverage.implementationStatus] || current.coverage.implementationStatus}</Badge>
            </div>
            {current.matrix?.approvedByName && <p className="text-sm text-slate-600">Aprobó {current.matrix.approvedByName} el {new Date(current.matrix.approvedAt!).toLocaleString('es-CO')} · próxima revisión {current.matrix.nextReviewAt?.slice(0, 10)}</p>}
            {!current.matrix && <p className="text-sm text-slate-600">Agregue la primera asignación para crear automáticamente el borrador.</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {current.matrices.length > 0 && <select aria-label="Seleccionar versión" className={leadershipSelectClass} value={current.matrix?.id || ''} onChange={event => void refresh(event.target.value)}>{current.matrices.map(matrix => <option key={matrix.id} value={matrix.id}>v{matrix.version} · {RESPONSIBILITY_MATRIX_STATUSES[matrix.status]}</option>)}</select>}
            <Button variant="outline" size="sm" onClick={() => setMatrixHistoryOpen(true)} disabled={!current.matrix}><History className="mr-2 h-4 w-4" />Historial</Button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
          {canManage && current.matrix?.status === 'BORRADOR' && <Button disabled={saving || !current.coverage.structuralReady} onClick={() => void matrixAction('SUBMIT_MATRIX')}><Send className="mr-2 h-4 w-4" />Enviar a revisión</Button>}
          {(canManage || canApprove) && current.matrix?.status === 'EN_REVISION' && <Button variant="outline" disabled={saving} onClick={() => setAdjustmentOpen(true)}><RefreshCw className="mr-2 h-4 w-4" />Solicitar ajustes</Button>}
          {canApprove && current.matrix?.status === 'EN_REVISION' && <Button disabled={saving || !current.coverage.structuralReady} onClick={() => { setApproval(blankApproval()); setApprovalOpen(true); }}><ShieldCheck className="mr-2 h-4 w-4" />Aprobar y poner vigente</Button>}
          {canManage && current.matrix?.status === 'VIGENTE' && <Button variant="outline" disabled={saving} onClick={() => void matrixAction('CREATE_REVISION')}><RefreshCw className="mr-2 h-4 w-4" />Crear nueva revisión</Button>}
          {current.matrix?.status === 'EN_REVISION' && !canApprove && <p className="text-sm text-amber-700">La aprobación requiere una persona designada como alta dirección y con permiso de escritura.</p>}
        </div>
      </section>

      <section className={`rounded-lg border p-4 text-sm ${current.coverage.structuralReady ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <p className="font-semibold">{current.coverage.structuralReady ? 'Cobertura estructural completa' : 'Brechas antes de enviar o aprobar'}</p>
        {gaps.length > 0 && <ul className="mt-2 grid gap-1 md:grid-cols-2">{gaps.map(gap => <li key={gap}>• {gap}</li>)}</ul>}
        {current.matrix?.status === 'VIGENTE' && <p className="mt-2">Pendientes de comunicación: {current.coverage.uncommunicatedIds.length} · pendientes de comprensión: {current.coverage.unacknowledgedIds.length}.</p>}
      </section>

      <div className="flex flex-wrap items-center gap-4"><Input aria-label="Buscar asignaciones" className="max-w-lg" placeholder="Buscar proceso, cargo, área o persona" value={query} onChange={event => setQuery(event.target.value)} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} />Mostrar filas archivadas</label></div>

      {!visible.length && <div className="rounded-lg border border-dashed p-8 text-slate-500">No hay asignaciones para mostrar. {editable || !current.matrix ? 'Registre los cargos y autoridades pertinentes.' : ''}</div>}
      {visible.length > 0 && <div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-[1200px] w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Proceso</th><th className="p-3">Cargo y titular</th><th className="p-3">RACI</th><th className="p-3">Responsabilidades</th><th className="p-3">Autoridades</th><th className="p-3">Deberes 5.3</th><th className="p-3">Implementación</th><th className="p-3 text-right">Acciones</th></tr></thead><tbody>{visible.map(record => <tr key={record.id} className="border-t align-top">
        <td className="p-3 font-medium">{record.processName || 'Proceso pendiente'}</td>
        <td className="p-3"><p className="font-medium">{record.title}</p><p>{record.assignedToName}</p><p className="text-xs text-slate-500">{record.department} · reporta a {record.reportsTo}</p></td>
        <td className="p-3"><div className="flex flex-wrap gap-1">{record.raciRoles.map(role => <Badge key={role} variant="outline">{role === 'RESPONSABLE' ? 'R' : role === 'APRUEBA' ? 'A' : role === 'CONSULTADO' ? 'C' : 'I'}</Badge>)}</div></td>
        <td className="max-w-xs whitespace-pre-wrap p-3">{record.responsibilities}</td>
        <td className="max-w-xs whitespace-pre-wrap p-3">{record.authorities}</td>
        <td className="p-3"><ul className="space-y-1 text-xs">{record.sgcDuties.map(key => <li key={key}>{SGC_DUTIES[key]}</li>)}</ul></td>
        <td className="p-3">{current.matrix?.status === 'BORRADOR' || current.matrix?.status === 'EN_REVISION'
          ? <p className="text-slate-600">{current.matrix.status === 'BORRADOR' ? 'En elaboración' : 'En revisión'}; se comunicará al entrar en vigencia.</p>
          : <><p>{record.communicatedAt ? `Comunicado ${record.communicatedAt.slice(0, 10)}` : 'Sin comunicar'}</p><p className={record.acknowledgedAt ? 'text-emerald-700' : 'text-amber-700'}>{record.acknowledgedAt ? 'Comprensión confirmada' : 'Comprensión pendiente'}</p></>}
          {!record.active && <Badge variant="secondary">Archivada</Badge>}
        </td>
        <td className="p-3"><div className="flex justify-end gap-1">
          {canManage && editable && <Button variant="outline" size="sm" onClick={() => edit(record)}><Pencil className="h-4 w-4" /><span className="sr-only">Editar</span></Button>}
          {canManage && current.matrix?.status === 'VIGENTE' && record.active && <Button variant="outline" size="sm" onClick={() => openCommunication(record)}><MessageSquare className="h-4 w-4" /><span className="sr-only">Comunicar</span></Button>}
          {record.active && current.matrix?.status === 'VIGENTE' && record.communicatedAt && !record.acknowledgedAt && record.assignedToId === currentUser?.id && <Button size="sm" disabled={saving} title="Confirmar comprensión" aria-haspopup="dialog" onClick={() => setAcknowledging(record)}><CheckCircle2 className="h-4 w-4" /><span className="sr-only">Confirmar comprensión</span></Button>}
          <Button variant="ghost" size="sm" onClick={() => setHistoryId(record.id)}><History className="h-4 w-4" /><span className="sr-only">Historial</span></Button>
        </div></td>
      </tr>)}</tbody></table></div>}
    </>}

    <Dialog open={assignmentOpen} onOpenChange={value => { if (!saving) setAssignmentOpen(value); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{editing ? 'Editar fila del borrador' : 'Agregar asignación'}</DialogTitle><DialogDescription>Defina quién ejecuta, decide, es consultado o debe ser informado en cada proceso.</DialogDescription></DialogHeader><form onSubmit={saveAssignment} className="space-y-4">
      <label className="block space-y-1 text-sm">Proceso *<select required className={leadershipSelectClass} value={form.processId} onChange={event => update('processId', event.target.value)}><option value="">Seleccione un proceso</option>{current.processes.map(process => <option key={process.id} value={process.id}>{process.code} · {process.name}</option>)}</select></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Persona asignada *<select required className={leadershipSelectClass} value={form.assignedToId} onChange={event => { const user = current.users.find(item => item.id === event.target.value); setForm(previous => ({ ...previous, assignedToId: event.target.value, title: previous.title || user?.position || '' })); }}><option value="">Seleccione una persona</option>{current.users.map(user => <option key={user.id} value={user.id}>{user.name}{user.position ? ` · ${user.position}` : ''}</option>)}</select></label><label className="space-y-1 text-sm">Cargo *<Input required maxLength={200} value={form.title} onChange={event => update('title', event.target.value)} /></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Área *<Input required maxLength={200} value={form.department} onChange={event => update('department', event.target.value)} /></label><label className="space-y-1 text-sm">Reporta a *<Input required maxLength={200} value={form.reportsTo} onChange={event => update('reportsTo', event.target.value)} /></label></div>
      <fieldset aria-describedby="responsible-role-guidance" className="space-y-2 rounded border p-3"><legend className="px-1 text-sm font-medium">Funciones RACI *</legend>{Object.entries(RACI_ROLES).map(([key, label]) => <label key={key} className="flex gap-2 text-sm"><input type="checkbox" checked={form.raciRoles.includes(key as keyof typeof RACI_ROLES)} onChange={event => update('raciRoles', event.target.checked ? [...form.raciRoles, key as keyof typeof RACI_ROLES] : form.raciRoles.filter(value => value !== key))} />{label}</label>)}<p id="responsible-role-guidance" className="text-xs text-slate-600">La función R debe corresponder al responsable vigente del proceso. {selectedProcess ? selectedResponsible ? `Actualmente: ${selectedResponsible.name}.` : 'El responsable configurado no aparece en el directorio activo; actualice primero el proceso.' : 'Seleccione un proceso para identificarlo.'}</p>{responsibleMismatch && <p role="alert" className="text-sm font-medium text-red-700">La persona seleccionada no es la responsable vigente de este proceso. Cambie la persona o retire la función R.</p>}</fieldset>
      <label className="block space-y-1 text-sm">Responsabilidades *<Textarea required minLength={10} maxLength={6000} value={form.responsibilities} onChange={event => update('responsibilities', event.target.value)} placeholder="Qué debe asegurar, ejecutar y entregar." /></label>
      <label className="block space-y-1 text-sm">Autoridades *<Textarea required minLength={10} maxLength={6000} value={form.authorities} onChange={event => update('authorities', event.target.value)} placeholder="Qué puede aprobar, decidir, solicitar, rechazar o detener." /></label>
      <fieldset className="space-y-2 rounded border p-3"><legend className="px-1 text-sm font-medium">Responsabilidades específicas del SGC</legend>{Object.entries(SGC_DUTIES).map(([key, label]) => <label key={key} className="flex gap-2 text-sm"><input type="checkbox" checked={form.sgcDuties.includes(key as keyof typeof SGC_DUTIES)} onChange={event => update('sgcDuties', event.target.checked ? [...form.sgcDuties, key as keyof typeof SGC_DUTIES] : form.sgcDuties.filter(value => value !== key))} />{label}</label>)}<p className="text-xs text-slate-600">Un deber 5.3 cuenta como cubierto únicamente cuando esta fila también tiene función R o A.</p></fieldset>
      {editing && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={event => update('active', event.target.checked)} />Fila activa dentro del borrador</label>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setAssignmentOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar fila'}</Button></div>
    </form></DialogContent></Dialog>

    <Dialog open={approvalOpen} onOpenChange={value => { if (!saving) { if (value) setApproval(blankApproval()); setApprovalOpen(value); } }}><DialogContent><DialogHeader><DialogTitle>Aprobar matriz</DialogTitle><DialogDescription>La versión quedará inmutable y sustituirá la matriz vigente anterior. Después deberá comunicarse a cada titular.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={approveMatrix}><label className="block space-y-1 text-sm">Próxima revisión *<Input required type="date" min={localTomorrow()} value={approval.nextReviewAt} onChange={event => setApproval(previous => ({ ...previous, nextReviewAt: event.target.value }))} /></label><label className="block space-y-1 text-sm">Fundamento de aprobación *<Textarea required minLength={10} maxLength={2000} value={approval.approvalNote} onChange={event => setApproval(previous => ({ ...previous, approvalNote: event.target.value }))} placeholder="Indique la revisión realizada y la decisión de la alta dirección." /></label><div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setApprovalOpen(false)}>Cancelar</Button><Button disabled={saving} type="submit"><ClipboardCheck className="mr-2 h-4 w-4" />{saving ? 'Aprobando…' : 'Aprobar versión'}</Button></div></form></DialogContent></Dialog>

    <Dialog open={adjustmentOpen} onOpenChange={value => { if (!saving) setAdjustmentOpen(value); }}><DialogContent><DialogHeader><DialogTitle>Solicitar ajustes</DialogTitle><DialogDescription>La versión volverá a borrador y conservará la decisión en su historial.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={event => { event.preventDefault(); void matrixAction('RETURN_TO_DRAFT', adjustmentNote); }}><label className="block space-y-1 text-sm">Ajustes requeridos *<Textarea required minLength={10} value={adjustmentNote} onChange={event => setAdjustmentNote(event.target.value)} /></label><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAdjustmentOpen(false)}>Cancelar</Button><Button disabled={saving} type="submit">Devolver a borrador</Button></div></form></DialogContent></Dialog>

    <Dialog open={Boolean(communicating)} onOpenChange={value => { if (!value && !saving) setCommunicating(null); }}><DialogContent><DialogHeader><DialogTitle>Comunicar asignación</DialogTitle><DialogDescription>{communicating?.assignedToName} · versión {current.matrix?.version}. Una nueva comunicación invalida una confirmación anterior de esta misma versión y debe aportar evidencia actual.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={communicate}><label className="block space-y-1 text-sm">Fecha *<Input required type="date" max={localToday()} value={communication.communicatedAt} onChange={event => setCommunication(previous => ({ ...previous, communicatedAt: event.target.value }))} /></label><label className="block space-y-1 text-sm">Método *<Input required minLength={3} maxLength={200} value={communication.communicationMethod} onChange={event => setCommunication(previous => ({ ...previous, communicationMethod: event.target.value }))} placeholder="Inducción, reunión, correo corporativo…" /></label><label className="block space-y-1 text-sm">Destinatarios *<Textarea required minLength={3} maxLength={1000} value={communication.communicationAudience} onChange={event => setCommunication(previous => ({ ...previous, communicationAudience: event.target.value }))} /></label><label className="block space-y-1 text-sm">Evidencia verificable *<Textarea required minLength={10} maxLength={6000} value={communication.communicationEvidence} onChange={event => setCommunication(previous => ({ ...previous, communicationEvidence: event.target.value }))} placeholder="Acta, correo o registro: referencia y ubicación." /></label><div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setCommunicating(null)}>Cancelar</Button><Button disabled={saving} type="submit">Registrar comunicación</Button></div></form></DialogContent></Dialog>

    <Dialog open={Boolean(acknowledging)} onOpenChange={value => { if (!value && !saving) setAcknowledging(null); }}><DialogContent><DialogHeader><DialogTitle>Confirmar comprensión</DialogTitle><DialogDescription>Esta confirmación quedará registrada a su nombre en la versión {current.matrix?.version}. Confirme únicamente si conoce y comprende la responsabilidad y la autoridad asignadas.</DialogDescription></DialogHeader>{acknowledging && <div className="space-y-4"><div className="rounded border bg-slate-50 p-3 text-sm"><p className="font-medium">{acknowledging.title} · {acknowledging.processName}</p><p className="mt-2 font-medium">Responsabilidades</p><p className="whitespace-pre-wrap text-slate-700">{acknowledging.responsibilities}</p><p className="mt-2 font-medium">Autoridades</p><p className="whitespace-pre-wrap text-slate-700">{acknowledging.authorities}</p></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setAcknowledging(null)}>Cancelar</Button><Button type="button" disabled={saving} onClick={() => void acknowledge(acknowledging)}><CheckCircle2 className="mr-2 h-4 w-4" />{saving ? 'Confirmando…' : 'Sí, confirmo que comprendo'}</Button></div></div>}</DialogContent></Dialog>

    <Dialog open={Boolean(historyId)} onOpenChange={value => { if (!value) setHistoryId(null); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Historial de la asignación</DialogTitle><DialogDescription>Eventos y evidencias registrados para esta asignación dentro de la matriz.</DialogDescription></DialogHeader><LeadershipHistory events={current.events.filter(event => event.recordId === historyId)} /></DialogContent></Dialog>
    <Dialog open={matrixHistoryOpen} onOpenChange={setMatrixHistoryOpen}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Historial de la versión</DialogTitle><DialogDescription>Decisiones y cambios de estado registrados para la versión seleccionada.</DialogDescription></DialogHeader><LeadershipHistory events={current.events.filter(event => event.recordId === current.matrix?.id)} /></DialogContent></Dialog>
  </div>;
}
