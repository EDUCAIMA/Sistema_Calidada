"use client";

import { useState } from 'react';
import { Download, Loader2, Plus, Pencil, History } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LeadershipHistory, leadershipSelectClass, useLeadershipRecords } from '@/components/leadership-records';
import { leadershipCommitmentSchema, LEADERSHIP_CATEGORIES, COMMITMENT_STATUSES, type LeadershipCommitmentInput } from '@/lib/leadership';
import { downloadStandardPdf, type PdfSection } from '@/lib/document-pdf';

interface Commitment extends LeadershipCommitmentInput { id: string; responsibleName: string; updatedAt: string; createdAt?: string; createdByName?: string; updatedByName?: string }
const blank: LeadershipCommitmentInput = { category: 'RESPONSABILIDAD', title: '', description: '', responsibleId: '', dueDate: '', status: 'ABIERTA', evidence: '', result: '', customerRequirements: '', customerRisks: '', customerSatisfaction: '' };

export default function CompromisosPage() {
  const { tenant } = useApp();
  return <CompromisosContent key={tenant.id} />;
}

function CompromisosContent() {
  const { tenant, currentUser } = useApp();
  const { records, users, events, loading, error, refresh } = useLeadershipRecords<Commitment>('/api/liderazgo/compromisos', tenant.id);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [form, setForm] = useState<LeadershipCommitmentInput>(blank);
  const [editing, setEditing] = useState<Commitment | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const canWrite = !!currentUser && ['ADMIN_EMPRESA', 'SUPER_ADMIN', 'USUARIO'].includes(currentUser.role);
  const visible = records.filter(record => (!category || record.category === category) && `${record.title} ${record.responsibleName}`.toLowerCase().includes(query.toLowerCase()));
  const missing = Object.entries(LEADERSHIP_CATEGORIES).filter(([key]) => !records.some(record => record.category === key));
  const update = <K extends keyof LeadershipCommitmentInput>(key: K, value: LeadershipCommitmentInput[K]) => setForm(previous => ({ ...previous, [key]: value }));

  function edit(record: Commitment | null) {
    setEditing(record);
    setForm(record ? { ...record, dueDate: record.dueDate.slice(0, 10), evidence: record.evidence || '', result: record.result || '', customerRequirements: record.customerRequirements || '', customerRisks: record.customerRisks || '', customerSatisfaction: record.customerSatisfaction || '' } : { ...blank });
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = leadershipCommitmentSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    try {
      const response = await fetch('/api/liderazgo/compromisos', {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, tenantId: tenant.id, ...(editing && { id: editing.id, expectedUpdatedAt: editing.updatedAt }) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar el compromiso.');
      toast.success('Compromiso guardado.'); setOpen(false); await refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo guardar.'); }
    finally { setSaving(false); }
  }

  async function exportPdf(record?: Commitment) {
    if (loading || error || saving || exporting || !tenant.id) return;
    setExporting(true);
    try {
      const included = record ? [record] : visible;
      const detailRows = (item: Partial<Commitment>): Array<Array<string | number>> => [
        ['Título', item.title || 'Sin título'],
        ['Tema', item.category ? LEADERSHIP_CATEGORIES[item.category] || item.category : 'Sin tema'],
        ['Decisión o actividad de la dirección', item.description || 'Sin información registrada'],
        ['Responsable', item.responsibleName || users.find(user => user.id === item.responsibleId)?.name || 'Sin responsable registrado'],
        ['Fecha objetivo', item.dueDate?.slice(0, 10) || 'Sin fecha'],
        ['Estado', item.status ? COMMITMENT_STATUSES[item.status] || item.status : 'Sin estado'],
        ['Evidencia verificable', item.evidence || 'Pendiente'],
        ['Evaluación de resultados', item.result || 'Pendiente'],
        ...(item.category === 'CLIENTE' ? [
          ['Requisitos del cliente y requisitos legales aplicables', item.customerRequirements || 'Pendiente'],
          ['Riesgos y oportunidades para conformidad y satisfacción', item.customerRisks || 'Pendiente'],
          ['Seguimiento y mejora de la satisfacción', item.customerSatisfaction || 'Pendiente'],
        ] : []),
        ['Creado por', item.createdByName || 'Sin dato histórico'],
        ['Fecha de creación', item.createdAt?.slice(0, 10) || 'Sin dato histórico'],
        ['Actualizado por', item.updatedByName || 'Sin dato histórico'],
        ['Última actualización', item.updatedAt?.slice(0, 10) || 'Sin dato histórico'],
      ];
      const sections: PdfSection[] = [{
        text: `Registros incluidos: ${included.length}. ${record ? 'Detalle del compromiso guardado.' : `Filtros: ${query || 'sin texto de búsqueda'}; tema: ${category ? LEADERSHIP_CATEGORIES[category as keyof typeof LEADERSHIP_CATEGORIES] : 'todos'}.`} Son registros de gestión y seguimiento; la descarga no supone aprobación ni demuestra por sí sola eficacia.`,
      }];
      if (!record) sections.push({ title: 'Listado de compromisos', head: ['Título', 'Tema', 'Responsable', 'Fecha objetivo', 'Estado'], rows: included.map(item => [item.title, LEADERSHIP_CATEGORIES[item.category], item.responsibleName, item.dueDate.slice(0, 10), COMMITMENT_STATUSES[item.status]]) });
      included.forEach((item, index) => {
        sections.push({ title: `${index + 1}. ${item.title}`, head: ['Campo', 'Información'], rows: detailRows(item) });
        const history = events.filter(event => event.recordId === item.id);
        if (!history.length) sections.push({ title: 'Historial', text: 'Sin eventos registrados.' });
        history.forEach((event, eventIndex) => {
          const action = ({ CREADO: 'Creación', ACTUALIZADO: 'Actualización', CERRADO: 'Cierre con evaluación', REABIERTO: 'Reapertura' } as Record<string, string>)[event.action] || event.action;
          sections.push(
            { title: `Historial ${eventIndex + 1}: ${action}`, text: `Responsable: ${event.userName}. Fecha: ${new Date(event.createdAt).toLocaleString('es-CO')}.` },
            { head: ['Campo', 'Información conservada'], rows: detailRows(event.snapshot as Partial<Commitment>) },
          );
        });
      });
      await downloadStandardPdf({
        tenantId: tenant.id, moduleKey: '5.1',
        title: record ? `Compromiso de liderazgo: ${record.title}` : 'Compromisos de liderazgo y enfoque al cliente',
        filename: record ? 'Compromiso_liderazgo_detalle.pdf' : 'Compromisos_liderazgo.pdf',
        metadata: { status: record ? COMMITMENT_STATUSES[record.status] : 'Registro de seguimiento', approvalDate: null },
        sections,
      });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No fue posible generar el PDF.');
    } finally {
      setExporting(false);
    }
  }

  return <div className="space-y-6 pb-10">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Liderazgo y enfoque al cliente</h1><p className="mt-2 text-slate-600">5.1 · Registre decisiones, acciones de la dirección y evidencia de sus resultados.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={loading || !!error || saving || exporting || !tenant.id} onClick={() => void exportPdf()}>{exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Descargar PDF</Button>{canWrite && <Button disabled={loading || !!error || saving} onClick={() => edit(null)}><Plus className="mr-2 h-4 w-4" />Nuevo compromiso</Button>}</div></div>
    <p className="text-sm text-slate-500">Los registros ayudan a demostrar la gestión realizada. Su existencia no sustituye la evaluación de la eficacia del sistema.</p>
    {!loading && !error && missing.length > 0 && <details className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm"><summary className="cursor-pointer font-medium">{missing.length} temas sin registros de liderazgo</summary><ul className="mt-3 space-y-1">{missing.map(([key, label]) => <li key={key}>{label}</li>)}</ul></details>}
    <div className="flex flex-wrap gap-3"><Input aria-label="Buscar compromisos" className="max-w-sm" placeholder="Buscar título o responsable" value={query} onChange={event => setQuery(event.target.value)} /><select aria-label="Filtrar por tema" className={`${leadershipSelectClass} max-w-lg`} value={category} onChange={event => setCategory(event.target.value)}><option value="">Todos los temas</option>{Object.entries(LEADERSHIP_CATEGORIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
    {error && <div role="alert" className="rounded border border-red-200 p-4 text-red-700">{error}<Button variant="outline" className="ml-3" onClick={() => void refresh()}>Reintentar</Button></div>}
    {loading && <p role="status">Cargando compromisos…</p>}
    {!loading && !error && !visible.length && <div className="rounded-lg border border-dashed p-8 text-slate-500">No hay compromisos para mostrar. Registre las acciones y decisiones reales de su organización.</div>}
    <div className="space-y-4">{visible.map(record => <article key={record.id} className="space-y-4 rounded-lg border bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-blue-700">{LEADERSHIP_CATEGORIES[record.category]}</p><h2 className="mt-1 text-lg font-semibold">{record.title}</h2><p className="text-sm text-slate-600">{record.responsibleName} · Fecha objetivo: {record.dueDate.slice(0, 10)}</p></div><div className="flex items-start gap-2"><Badge variant={record.status === 'CERRADA' ? 'default' : 'secondary'}>{COMMITMENT_STATUSES[record.status]}</Badge>{record.status !== 'CERRADA' && record.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10) && <Badge variant="destructive">Vencido</Badge>}</div></div>
      <p className="whitespace-pre-wrap text-sm">{record.description}</p>
      {record.category === 'CLIENTE' && <dl className="grid gap-3 rounded bg-blue-50 p-3 text-sm md:grid-cols-3"><div><dt className="font-medium">Requisitos del cliente y requisitos legales aplicables</dt><dd className="whitespace-pre-wrap">{record.customerRequirements}</dd></div><div><dt className="font-medium">Riesgos y oportunidades para la conformidad y satisfacción</dt><dd className="whitespace-pre-wrap">{record.customerRisks}</dd></div><div><dt className="font-medium">Seguimiento y mejora de la satisfacción</dt><dd className="whitespace-pre-wrap">{record.customerSatisfaction}</dd></div></dl>}
      {(record.evidence || record.result) && <dl className="grid gap-3 rounded bg-slate-50 p-3 text-sm md:grid-cols-2"><div><dt className="font-medium">Evidencia verificable</dt><dd className="whitespace-pre-wrap">{record.evidence || 'Pendiente'}</dd></div><div><dt className="font-medium">Evaluación de resultados</dt><dd className="whitespace-pre-wrap">{record.result || 'Pendiente'}</dd></div></dl>}
      <div className="flex flex-wrap gap-2">{canWrite && <Button size="sm" variant="outline" onClick={() => edit(record)}><Pencil className="mr-2 h-4 w-4" />Actualizar / evaluar</Button>}<Button size="sm" variant="outline" onClick={() => setHistoryId(record.id)}><History className="mr-2 h-4 w-4" />Historial</Button><Button size="sm" variant="outline" disabled={loading || !!error || saving || exporting} onClick={() => void exportPdf(record)}><Download className="mr-2 h-4 w-4" /> PDF del compromiso</Button></div>
    </article>)}</div>
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editing ? 'Actualizar compromiso y resultados' : 'Nuevo compromiso de liderazgo'}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <label className="block space-y-1 text-sm">Tema *<select required className={leadershipSelectClass} value={form.category} onChange={event => update('category', event.target.value as LeadershipCommitmentInput['category'])}>{Object.entries(LEADERSHIP_CATEGORIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="block space-y-1 text-sm">Título *<Input required minLength={3} maxLength={200} value={form.title} onChange={event => update('title', event.target.value)} /></label>
        <label className="block space-y-1 text-sm">Decisión o actividad de la dirección *<Textarea required minLength={10} maxLength={6000} value={form.description} onChange={event => update('description', event.target.value)} placeholder="Describa la acción, su propósito y el resultado esperado." /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Responsable *<select required className={leadershipSelectClass} value={form.responsibleId} onChange={event => update('responsibleId', event.target.value)}><option value="">Seleccione una persona</option>{users.map(user => <option key={user.id} value={user.id}>{user.name}{user.position ? ` · ${user.position}` : ''}</option>)}</select></label><label className="space-y-1 text-sm">Fecha objetivo *<Input required type="date" value={form.dueDate} onChange={event => update('dueDate', event.target.value)} /></label></div>
        {form.category === 'CLIENTE' && <fieldset className="space-y-3 rounded border border-blue-200 p-3"><legend className="px-1 text-sm font-medium">Enfoque al cliente</legend>
          <label className="block space-y-1 text-sm">Requisitos del cliente, legales y reglamentarios aplicables *<Textarea required minLength={10} maxLength={6000} value={form.customerRequirements} onChange={event => update('customerRequirements', event.target.value)} placeholder="Cómo se determinan, comprenden y cumplen; identifique registros de soporte." /></label>
          <label className="block space-y-1 text-sm">Riesgos y oportunidades *<Textarea required minLength={10} maxLength={6000} value={form.customerRisks} onChange={event => update('customerRisks', event.target.value)} placeholder="Efectos sobre conformidad de productos / servicios y satisfacción del cliente; acciones y referencia a la matriz de riesgos." /></label>
          <label className="block space-y-1 text-sm">Seguimiento y mejora de la satisfacción *<Textarea required minLength={10} maxLength={6000} value={form.customerSatisfaction} onChange={event => update('customerSatisfaction', event.target.value)} placeholder="Método de seguimiento, resultados disponibles y decisiones de mejora." /></label>
        </fieldset>}
        <label className="block space-y-1 text-sm">Estado<select className={leadershipSelectClass} value={form.status} onChange={event => update('status', event.target.value as LeadershipCommitmentInput['status'])}>{Object.entries(COMMITMENT_STATUSES).filter(([key]) => editing || key !== 'CERRADA').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="block space-y-1 text-sm">Evidencia verificable {form.status === 'CERRADA' && '*'}<Textarea required={form.status === 'CERRADA'} minLength={form.status === 'CERRADA' ? 10 : undefined} maxLength={6000} value={form.evidence} onChange={event => update('evidence', event.target.value)} placeholder="Acta, aprobación, informe o documento: fecha, referencia y ubicación consultable." /></label>
        <label className="block space-y-1 text-sm">Evaluación de resultados {form.status === 'CERRADA' && '*'}<Textarea required={form.status === 'CERRADA'} minLength={form.status === 'CERRADA' ? 10 : undefined} maxLength={6000} value={form.result} onChange={event => update('result', event.target.value)} placeholder="Qué se logró, cómo se comprobó y qué seguimiento se necesita." /></label>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar compromiso'}</Button></div>
      </form>
    </DialogContent></Dialog>
    <Dialog open={!!historyId} onOpenChange={() => setHistoryId(null)}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Historial del compromiso</DialogTitle></DialogHeader><LeadershipHistory events={events.filter(event => event.recordId === historyId)} /></DialogContent></Dialog>
  </div>;
}
