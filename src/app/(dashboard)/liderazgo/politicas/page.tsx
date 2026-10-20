"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Edit, FilePlus2, Loader2, Plus, RotateCcw, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Status = 'BORRADOR' | 'EN_REVISION' | 'VIGENTE' | 'OBSOLETA';
interface Communication {
  id: string; audience: string; audienceType: string; method: string; date: string;
  evidence: string; understandingEvidence?: string; responsibleName: string; notes?: string;
}
interface ApprovalEvent {
  id: string; action: string; userName: string; note?: string; createdAt: string;
  snapshot?: { title: string; content: string; version: string };
}
interface Policy {
  id: string; title: string; content: string; type: string; version: string; status: Status;
  author: string; objectives: string[]; updatedAt: string; approvedByName?: string; approvedAt?: string;
  communications: Communication[]; approvalEvents: ApprovalEvent[];
}
interface PolicyForm {
  id?: string; supersedesId?: string; expectedUpdatedAt?: string; title: string;
  content: string; type: string; version: string; objectives: string;
}
const emptyForm: PolicyForm = { title: '', content: '', type: 'General', version: '1.0', objectives: '' };
const emptyCommunication = { audience: '', audienceType: 'INTERNA', method: '', date: '', evidence: '', understandingEvidence: '', notes: '' };
const checkLabels = {
  context: 'Es adecuada al propósito, contexto y dirección estratégica de la organización.',
  framework: 'Ofrece un marco para establecer y revisar los objetivos de calidad.',
  requirements: 'Incluye el compromiso de cumplir los requisitos aplicables.',
  improvement: 'Incluye el compromiso de mejora continua del sistema de gestión.',
};
const emptyChecks = { context: false, framework: false, requirements: false, improvement: false };
const labels: Record<Status, string> = { BORRADOR: 'Borrador', EN_REVISION: 'En revisión', VIGENTE: 'Vigente', OBSOLETA: 'Obsoleta' };
const colors: Record<Status, string> = {
  BORRADOR: 'bg-slate-100 text-slate-700', EN_REVISION: 'bg-amber-100 text-amber-900',
  VIGENTE: 'bg-emerald-100 text-emerald-800', OBSOLETA: 'bg-slate-100 text-slate-500',
};
const eventLabels: Record<string, string> = {
  CREATED: 'Borrador creado', CREATED_FOR_REVIEW: 'Registrada para revisión', EDITED: 'Borrador actualizado',
  SUBMITTED_FOR_REVIEW: 'Enviada a revisión', APPROVED: 'Aprobada',
  CHANGES_REQUESTED: 'Ajustes solicitados', SUPERSEDED: 'Reemplazada por una nueva versión',
};
function dateLabel(value?: string) { return value ? new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin aprobación registrada'; }
async function requestJson(url: string, body?: object, signal?: AbortSignal) {
  const response = await fetch(url, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }
    : { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No fue posible procesar la solicitud.');
  return data;
}

export default function PoliticasPage() {
  const { tenant, currentUser } = useApp();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PolicyForm | null>(null);
  const [decision, setDecision] = useState<Policy | null>(null);
  const [checks, setChecks] = useState(emptyChecks);
  const [note, setNote] = useState('');
  const [communicationOpen, setCommunicationOpen] = useState(false);
  const [communication, setCommunication] = useState(emptyCommunication);
  const selected = policies.find(policy => policy.id === selectedId);
  const canWrite = !!currentUser && ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'USUARIO'].includes(currentUser.role);
  const canApprove = !!currentUser && ['SUPER_ADMIN', 'ADMIN_EMPRESA'].includes(currentUser.role);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!tenant.id) return;
    try {
      const data = await requestJson('/api/liderazgo/politicas?tenantId=' + encodeURIComponent(tenant.id), undefined, signal);
      setPolicies(data);
      setError('');
    } catch (cause) {
      if (signal?.aborted) return;
      setPolicies([]);
      setError(cause instanceof Error ? cause.message : 'No fue posible cargar las políticas.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [tenant.id]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const perform = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'La operación no se completó.'); }
    finally { setBusy(false); }
  };

  const save = () => perform(async () => {
    if (!form) return;
    const policy = await requestJson('/api/liderazgo/politicas', {
      ...form, tenantId: tenant.id,
      objectives: form.objectives.split('\n').map(value => value.trim()).filter(Boolean),
    });
    setForm(null);
    setSelectedId(policy.id);
    await load();
    toast.success('Borrador guardado.');
  });

  const submit = (policy: Policy) => perform(async () => {
    await requestJson('/api/liderazgo/politicas/' + policy.id + '/enviar-revision', {
      tenantId: tenant.id, expectedUpdatedAt: policy.updatedAt,
    });
    await load();
    toast.success('Política enviada a revisión.');
  });

  const decide = (action: 'aprobar' | 'solicitar-ajustes') => perform(async () => {
    if (!decision) return;
    await requestJson('/api/liderazgo/politicas/' + decision.id + '/' + action, {
      tenantId: tenant.id, expectedUpdatedAt: decision.updatedAt, note, checks,
    });
    setDecision(null);
    await load();
    toast.success(action === 'aprobar' ? 'Política aprobada. Registre su comunicación.' : 'Política devuelta a borrador con observaciones.');
  });

  const createVersion = (policy: Policy) => {
    const [major, minor = '0'] = policy.version.split('.');
    setForm({
      title: policy.title, content: policy.content, type: policy.type,
      version: Number.isFinite(Number(major)) ? major + '.' + (Number(minor) + 1) : '2.0',
      supersedesId: policy.id, objectives: (policy.objectives || []).join('\n'),
    });
  };

  const saveCommunication = () => perform(async () => {
    if (!selected) return;
    await requestJson('/api/liderazgo/politicas/comunicaciones', { ...communication, policyId: selected.id, tenantId: tenant.id });
    setCommunicationOpen(false);
    setCommunication(emptyCommunication);
    await load();
    toast.success('Evidencia de comunicación registrada.');
  });

  const exportPolicy = (policy: Policy) => {
    const pdf = new jsPDF();
    pdf.setFontSize(11);
    let y = 20;
    const paragraphs = [
      tenant.name, 'Política: ' + policy.title,
      'Versión ' + policy.version + ' | Estado: ' + labels[policy.status],
      'Elaborada por: ' + policy.author,
      'Aprobación: ' + (policy.approvedByName || 'Pendiente') + ' | ' + dateLabel(policy.approvedAt),
      '', policy.content,
      ...(policy.objectives?.length ? ['', 'Marco para los objetivos:', ...policy.objectives] : []),
    ];
    for (const paragraph of paragraphs) {
      for (const line of pdf.splitTextToSize(paragraph, 170)) {
        if (y > 275) { pdf.addPage(); y = 20; }
        pdf.text(line, 20, y); y += 6;
      }
      y += 3;
    }
    pdf.save('Politica-' + policy.version + '-' + policy.status + '.pdf');
  };

  const filtered = policies.filter(policy =>
    (filter === 'ALL' || policy.status === filter) &&
    (policy.title + ' ' + policy.type).toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-semibold text-blue-700">5.2 · Liderazgo</p>
          <h1 className="text-3xl font-bold tracking-tight">Política de calidad</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Elabore, revise y comunique la política. Cada versión conserva su aprobación y evidencia de difusión.</p>
        </div>
        {canWrite && <Button onClick={() => setForm({ ...emptyForm })}><Plus className="mr-2 h-4 w-4" />Nueva política</Button>}
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-slate-50 p-4 text-sm">
        <span className="font-medium">Borrador → Revisión → Vigente</span>
        <span className="text-slate-500">Los ajustes vuelven a borrador. La nueva aprobación archiva la versión anterior del mismo tipo.</span>
        <Link href="/planificacion/objetivos" className="text-blue-700 underline">Objetivos de calidad</Link>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}<Button variant="outline" className="ml-4" onClick={() => void load()}>Reintentar</Button></div>}
      <div className="flex flex-wrap gap-3">
        <Input aria-label="Buscar políticas" placeholder="Buscar política..." value={search} onChange={event => setSearch(event.target.value)} className="max-w-sm" />
        <select aria-label="Filtrar por estado" value={filter} onChange={event => setFilter(event.target.value)} className="rounded-md border bg-white px-3 py-2 text-sm">
          <option value="ALL">Todos los estados</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin" /><p className="mt-2">Cargando políticas...</p></div> :
        !error && !filtered.length ? <div className="rounded-xl border border-dashed p-12 text-center text-slate-500">No hay políticas para mostrar. Registre la política de su organización para iniciar la revisión.</div> :
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(policy => <article key={policy.id} className="space-y-4 rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between gap-2"><Badge className={cn('border-0', colors[policy.status])}>{labels[policy.status]}</Badge><span className="text-xs text-slate-500">{policy.type} · v{policy.version}</span></div>
            <h2 className="text-lg font-semibold">{policy.title}</h2>
            <p className="line-clamp-3 whitespace-pre-line text-sm text-slate-600">{policy.content}</p>
            <p className="text-xs text-slate-500">{policy.approvedAt ? 'Aprobada por ' + policy.approvedByName + ' · ' + dateLabel(policy.approvedAt) : 'Aprobación pendiente'}</p>
            {policy.status === 'VIGENTE' && <p className="text-xs text-blue-700">{policy.communications.length ? policy.communications.length + ' evidencias de comunicación' : 'Pendiente: registrar comunicación y comprensión de la política.'}</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setSelectedId(policy.id)}>Ver política e historial</Button>
              {canWrite && policy.status === 'BORRADOR' && <Button disabled={busy} onClick={() => submit(policy)}><Send className="mr-2 h-4 w-4" />Enviar a revisión</Button>}
              {canApprove && policy.status === 'EN_REVISION' && <Button onClick={() => { setDecision(policy); setNote(''); setChecks(emptyChecks); }}><ShieldCheck className="mr-2 h-4 w-4" />Revisar</Button>}
            </div>
          </article>)}
        </div>}

      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelectedId(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>Versión {selected?.version} · {selected && labels[selected.status]}</DialogDescription></DialogHeader>
          {selected && <>
            <p className="whitespace-pre-wrap text-sm leading-7">{selected.content}</p>
            {!!selected.objectives?.length && <section><h3 className="mb-2 font-semibold">Marco para los objetivos</h3><ul className="list-disc space-y-1 pl-5 text-sm">{selected.objectives.map((objective, index) => <li key={index}>{objective}</li>)}</ul></section>}
            <p className="rounded-lg bg-slate-50 p-3 text-sm">Aprobación: {selected.approvedByName || 'Pendiente'} · {dateLabel(selected.approvedAt)}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => exportPolicy(selected)}><Download className="mr-2 h-4 w-4" />Descargar PDF</Button>
              {canWrite && selected.status === 'BORRADOR' && <Button variant="outline" onClick={() => setForm({
                id: selected.id, expectedUpdatedAt: selected.updatedAt, title: selected.title, content: selected.content,
                type: selected.type, version: selected.version, objectives: (selected.objectives || []).join('\n'),
              })}><Edit className="mr-2 h-4 w-4" />Editar borrador</Button>}
              {canWrite && selected.status === 'VIGENTE' && <Button variant="outline" onClick={() => createVersion(selected)}><FilePlus2 className="mr-2 h-4 w-4" />Nueva versión</Button>}
              {canWrite && selected.status === 'VIGENTE' && <Button onClick={() => { setCommunication(emptyCommunication); setCommunicationOpen(true); }}>Registrar comunicación</Button>}
            </div>
            <section className="border-t pt-4"><h3 className="font-semibold">Comunicación y comprensión · 5.2.2</h3>
              {!selected.communications.length && <p className="mt-2 text-sm text-slate-500">Sin evidencias registradas.</p>}
              {selected.communications.map(item => <div key={item.id} className="mt-3 space-y-1 rounded-lg border p-3 text-sm">
                <p className="font-medium">{item.audience} · {item.audienceType === 'EXTERNA' ? 'Partes interesadas externas' : 'Comunicación interna'}</p>
                <p>{item.method} · {dateLabel(item.date)} · {item.responsibleName}</p>
                <p className="whitespace-pre-wrap break-words">Evidencia: {item.evidence || 'Sin evidencia documentada'}</p>
                <p className="whitespace-pre-wrap">Comprensión y aplicación: {item.understandingEvidence || 'No registrada'}</p>
                {item.notes && <p className="text-slate-600">{item.notes}</p>}
              </div>)}
            </section>
            <section className="border-t pt-4"><h3 className="font-semibold">Historial de versión y revisión</h3>
              {!selected.approvalEvents.length && <p className="mt-2 text-sm text-slate-500">Sin historial previo registrado.</p>}
              {selected.approvalEvents.map(event => <div key={event.id} className="mt-3 border-l-2 border-blue-200 pl-3 text-sm">
                <p className="font-medium">{eventLabels[event.action] || event.action}</p>
                <p className="text-xs text-slate-500">{event.userName} · {dateLabel(event.createdAt)}</p>
                <p className="mt-1 whitespace-pre-wrap">{event.note}</p>
                {event.snapshot && <details className="mt-2"><summary className="cursor-pointer text-blue-700">Contenido registrado en este evento</summary><p className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-3">{event.snapshot.content}</p></details>}
              </div>)}
            </section>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!form} onOpenChange={open => { if (!open && !busy) setForm(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? 'Editar borrador' : form?.supersedesId ? 'Nueva versión de la política' : 'Nueva política'}</DialogTitle><DialogDescription>Incluya adecuación al contexto, marco para objetivos y compromisos con los requisitos aplicables y la mejora continua.</DialogDescription></DialogHeader>
          {form && <form onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="policy-title">Título</Label><Input id="policy-title" required maxLength={200} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="policy-type">Tipo</Label><select id="policy-type" disabled={!!form.id || !!form.supersedesId} value={form.type} onChange={event => setForm({ ...form, type: event.target.value })} className="w-full rounded-md border bg-white p-2 text-sm">
                {Array.from(new Set(['General', 'Calidad', 'Seguridad', 'Riesgos', 'Sostenibilidad', form.type])).map(type => <option key={type}>{type}</option>)}
              </select></div>
              <div className="space-y-2"><Label htmlFor="policy-version">Versión</Label><Input id="policy-version" required disabled={!!form.id} value={form.version} onChange={event => setForm({ ...form, version: event.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="policy-content">Contenido de la política</Label><Textarea id="policy-content" required maxLength={20000} rows={10} value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="policy-objectives">Marco para los objetivos (una orientación por línea, opcional)</Label><Textarea id="policy-objectives" rows={3} value={form.objectives} onChange={event => setForm({ ...form, objectives: event.target.value })} /></div>
            <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setForm(null)}>Cancelar</Button><Button disabled={busy} type="submit">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar borrador</Button></DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!decision} onOpenChange={open => { if (!open && !busy) setDecision(null); }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Revisar política · {decision?.version}</DialogTitle><DialogDescription>La decisión quedará registrada a nombre de {currentUser?.name}. Confirme los criterios revisados antes de aprobar.</DialogDescription></DialogHeader>
          <p className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{decision?.content}</p>
          <div className="space-y-3">{Object.entries(checkLabels).map(([key, label]) => <label key={key} className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1" checked={checks[key as keyof typeof checks]} onChange={event => setChecks({ ...checks, [key]: event.target.checked })} />{label}
          </label>)}</div>
          <Label htmlFor="policy-note">Observación (obligatoria para solicitar ajustes)</Label><Textarea id="policy-note" maxLength={2000} value={note} onChange={event => setNote(event.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={busy || !note.trim()} onClick={() => decide('solicitar-ajustes')}><RotateCcw className="mr-2 h-4 w-4" />Solicitar ajustes</Button>
            <Button disabled={busy || !Object.values(checks).every(Boolean)} onClick={() => decide('aprobar')}><ShieldCheck className="mr-2 h-4 w-4" />Aprobar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={communicationOpen} onOpenChange={open => { if (!busy) setCommunicationOpen(open); }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar comunicación</DialogTitle><DialogDescription>Relacione una evidencia real de difusión. Para personal interno, describa cómo verificó comprensión y aplicación.</DialogDescription></DialogHeader>
          <form onSubmit={event => { event.preventDefault(); void saveCommunication(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="audience-type">Ámbito</Label><select id="audience-type" value={communication.audienceType} onChange={event => setCommunication({ ...communication, audienceType: event.target.value })} className="w-full rounded-md border p-2 text-sm"><option value="INTERNA">Interno</option><option value="EXTERNA">Externo</option></select></div>
              <div className="space-y-2"><Label htmlFor="communication-date">Fecha</Label><Input id="communication-date" type="date" required value={communication.date} onChange={event => setCommunication({ ...communication, date: event.target.value })} /></div>
            </div>
            {([
              ['audience', 'Audiencia'], ['method', 'Medio de comunicación'],
              ['evidence', 'Referencia o enlace de evidencia'],
              ['understandingEvidence', 'Evidencia de comprensión y aplicación'], ['notes', 'Aclaraciones (opcional)'],
            ] as const).map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={'comm-' + key}>{label}</Label><Textarea id={'comm-' + key} required={key !== 'notes' && (key !== 'understandingEvidence' || communication.audienceType === 'INTERNA')} rows={2} maxLength={2000} value={communication[key]} onChange={event => setCommunication({ ...communication, [key]: event.target.value })} /></div>)}
            <DialogFooter><Button variant="outline" type="button" disabled={busy} onClick={() => setCommunicationOpen(false)}>Cancelar</Button><Button type="submit" disabled={busy}>Registrar evidencia</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
