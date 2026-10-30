"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { AuditData, DirectoryPerson, DirectoryProcess } from '@/lib/audits/forms';

type FollowUpDocument = { id: string; kind: string; data: AuditData; status: string; audit: { id: string; name: string; code: string | null } };
type Payload = { documents: FollowUpDocument[]; people: DirectoryPerson[]; processes: DirectoryProcess[] };
export function AuditFollowUp({ mode }: { mode: 'findings' | 'actions' }) {
  const { tenant } = useApp();
  return <FollowUp key={`${tenant.id}-${mode}`} tenantId={tenant.id} mode={mode} />;
}
function FollowUp({ tenantId, mode }: { tenantId: string; mode: 'findings' | 'actions' }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (!tenantId) return;
    const abort = new AbortController();
    fetch(`/api/evaluacion/auditorias?tenantId=${encodeURIComponent(tenantId)}&followUp=true`, { cache: 'no-store', signal: abort.signal })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error); if (!abort.signal.aborted) setData(result); })
      .catch(error => { if (!abort.signal.aborted) setError(error.message); });
    return () => abort.abort();
  }, [tenantId]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const rows = (data?.documents || []).filter(doc => doc.kind === (mode === 'actions' ? 'F8' : 'F4')).flatMap(doc => doc.data.rows.map((row, index) => ({ row, doc, index })))
    .filter(({ row, doc }) => (mode === 'actions' || row.classification?.startsWith('No conformidad')) && `${doc.audit?.name || ''} ${Object.values(row).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5">
    <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-800">Estos registros están vinculados al expediente de auditoría. Abra el formato de origen para actualizarlo o descargarlo; el seguimiento utiliza la misma información.</p>
    <label className="block max-w-lg space-y-2 font-medium">Buscar por auditoría o contenido<Input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar registros…" /></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!data && !error && <p className="text-slate-500">Cargando seguimiento…</p>}
    {data && !rows.length && <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">No hay {mode === 'actions' ? 'actividades de mejoramiento' : 'no conformidades de auditoría'} para mostrar. <Link className="text-blue-600 underline" href="/evaluacion/auditorias">Ir a auditorías</Link></div>}
    {rows.map(({ row, doc, index }) => <article key={`${doc.id}-${row.id}`} className="space-y-3 rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{doc.audit?.name} · {mode === 'actions' ? 'Actividad' : 'Hallazgo H'}{index + 1}</h2><Badge variant="outline">{mode === 'actions' ? row.status : row.classification}</Badge></div>
      <p className="whitespace-pre-wrap">{mode === 'actions' ? row.action : row.description}</p>
      {mode === 'actions' ? <><p className="text-sm text-slate-500">Responsable: {data?.people.find(person => person.id === row.responsibleId)?.name || 'Sin asignar'} · Plazo: {row.dueDate || 'Sin definir'} {row.dueDate && row.dueDate < today && row.status !== 'Cerrada' && <span className="font-semibold text-red-600">· Vencida</span>}</p><p className="text-sm text-slate-500">Eficacia: {row.effectiveness || 'Pendiente'} {row.verifiedBy && `· Verificó ${row.verifiedBy}`}</p></> : <p className="text-sm text-slate-500">Criterio: {row.criterion} · Proceso: {data?.processes.find(process => process.id === row.processId)?.name || 'Sin asignar'}</p>}
      <Link className="inline-block rounded-lg border border-blue-200 px-3 py-2 font-medium text-blue-700 hover:bg-blue-50" href={`/evaluacion/auditorias?audit=${encodeURIComponent(doc.audit.id)}&format=${doc.kind}`}>Abrir {doc.kind} y gestionar registro</Link>
    </article>)}
  </div>;
}
