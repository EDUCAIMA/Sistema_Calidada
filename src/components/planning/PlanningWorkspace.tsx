"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Option = { id: string; name: string };
type Form = Record<string, string>;
type Review = {
    id: string; result: string; evaluation: string; evidence: string; followUp: string | null;
    userName: string; createdAt: string; residualProbability?: number; residualImpact?: number; planSnapshot?: Record<string, unknown>;
};
type Plan = {
    id: string; description?: string; title?: string; kind?: string; status: string;
    processName: string; responsible?: string; responsibleName?: string; dueDate: string | null; evaluationDueDate?: string | null;
    riskValue?: number; reviews: Review[]; updatedAt: string; createdAt: string; createdByName?: string;
    [key: string]: unknown;
};
type Metadata = {
    processes: Option[]; users: Option[]; stakeholders: Option[];
    dofa: { id: string; description: string; category: string }[];
};
type Field = {
    name: string; label: string; type?: 'text' | 'textarea' | 'select' | 'date' | 'number';
    options?: Option[]; hint?: string; optional?: boolean;
};

const selectClass = 'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-70';
const statuses: Record<string, string> = {
    ABIERTA: 'Planificado', EN_PROGRESO: 'En ejecución', CERRADA: 'Evaluado y cerrado', VENCIDA: 'Vencido',
    PLANIFICADO: 'Planificado', EN_EJECUCION: 'En ejecución', COMPLETADO: 'Evaluado y completado',
};
const sourceTypes = [
    { id: 'CONTEXTO', name: 'Contexto (DOFA)' },
    { id: 'PARTE_INTERESADA', name: 'Parte interesada' },
    { id: 'PROCESO', name: 'Proceso' },
];
const emptyMetadata: Metadata = { processes: [], users: [], stakeholders: [], dofa: [] };
function isClosed(plan: Plan) { return plan.status === 'CERRADA' || plan.status === 'COMPLETADO'; }
function dateText(value: string | null) { return value ? value.slice(0, 10) : 'Sin fecha'; }

function FieldInput({ field, form, setForm, disabled = false }: { field: Field; form: Form; setForm: (next: Form) => void; disabled?: boolean }) {
    const value = form[field.name] || '';
    const onChange = (next: string) => setForm({ ...form, [field.name]: next, ...(field.name === 'sourceType' ? { sourceId: '' } : {}) });
    return <div className={field.type === 'textarea' ? 'space-y-2 md:col-span-2' : 'space-y-2'}>
        <Label htmlFor={`plan-${field.name}`}>{field.label}{!field.optional && ' *'}</Label>
        {field.type === 'select' ? <select id={`plan-${field.name}`} className={selectClass} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={!field.optional}>
            <option value="">Selecciona…</option>
            {field.options?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select> : field.type === 'textarea' ? <Textarea id={`plan-${field.name}`} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={!field.optional} maxLength={5000} rows={3} />
            : <Input id={`plan-${field.name}`} type={field.type || 'text'} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={!field.optional} maxLength={5000} min={field.type === 'number' ? 1 : undefined} max={field.type === 'number' ? 5 : undefined} step={field.type === 'number' ? 1 : undefined} />}
        {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
    </div>;
}

export function PlanningWorkspace({ kind }: { kind: 'risk' | 'change' }) {
    const { tenant, currentUser } = useApp();
    const [records, setRecords] = useState<Plan[]>([]);
    const [metadata, setMetadata] = useState<Metadata>(emptyMetadata);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [selected, setSelected] = useState<Plan | null>(null);
    const [form, setForm] = useState<Form>({});
    const [open, setOpen] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const risk = kind === 'risk';
    const canWrite = !!currentUser && ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'USUARIO'].includes(currentUser.role);
    const endpoint = `/api/planificacion/${risk ? 'riesgos' : 'cambios'}`;

    const load = useCallback(async (signal?: AbortSignal) => {
        if (!tenant.id) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${endpoint}?tenantId=${encodeURIComponent(tenant.id)}`, { cache: 'no-store', signal });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible cargar los registros.');
            if (!signal?.aborted) { setRecords(data.records); setMetadata(data); }
        } catch (caught) {
            if (!signal?.aborted) { setError(caught instanceof Error ? caught.message : 'Error de conexión.'); setRecords([]); setMetadata(emptyMetadata); }
        } finally { if (!signal?.aborted) setLoading(false); }
    }, [endpoint, tenant.id]);

    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        return () => controller.abort();
    }, [load]);

    const sourceOptions = form.sourceType === 'CONTEXTO' ? metadata.dofa.map((item) => ({ id: item.id, name: `${item.category}: ${item.description}` }))
        : form.sourceType === 'PARTE_INTERESADA' ? metadata.stakeholders : metadata.processes;
    const fields: Field[] = risk ? [
        { name: 'kind', label: 'Tipo', type: 'select', options: [{ id: 'RIESGO', name: 'Riesgo' }, { id: 'OPORTUNIDAD', name: 'Oportunidad' }] },
        { name: 'processId', label: 'Proceso afectado', type: 'select', options: metadata.processes },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        { name: 'sourceType', label: 'Origen', type: 'select', options: sourceTypes },
        { name: 'sourceId', label: 'Registro de origen', type: 'select', options: sourceOptions },
        { name: 'sourceReference', label: 'Requisito o situación del origen que se aborda', type: 'textarea', hint: 'Explica la relación con el contexto, las partes interesadas o el proceso seleccionado.' },
        { name: 'cause', label: 'Causa o condición de origen', type: 'textarea' },
        { name: 'consequence', label: 'Efecto previsto sobre la conformidad, el cliente o los resultados del SGC', type: 'textarea' },
        { name: 'probability', label: 'Probabilidad (1–5)', type: 'number', hint: '1: muy baja; 5: muy alta.' },
        { name: 'impact', label: form.kind === 'OPORTUNIDAD' ? 'Beneficio esperado (1–5)' : 'Impacto (1–5)', type: 'number', hint: '1: menor; 5: significativo.' },
        { name: 'existingControls', label: 'Controles o condiciones existentes', type: 'textarea', hint: 'Indica “ninguno” si no existen.' },
        { name: 'treatmentPlan', label: 'Acción a realizar', type: 'textarea' },
        { name: 'treatmentJustification', label: 'Justificación de la acción y proporcionalidad con el efecto previsto', type: 'textarea' },
        { name: 'resources', label: 'Recursos necesarios y su disponibilidad', type: 'textarea' },
        { name: 'integrationPlan', label: 'Cómo se integra e implementa la acción en el proceso', type: 'textarea' },
        { name: 'responsibleId', label: 'Responsable', type: 'select', options: metadata.users },
        { name: 'dueDate', label: 'Fecha límite de la acción', type: 'date' },
        { name: 'evaluationMethod', label: 'Cómo se evaluará la eficacia y con qué criterio', type: 'textarea' },
        { name: 'evaluationDueDate', label: 'Fecha de evaluación', type: 'date' },
    ] : [
        { name: 'title', label: 'Cambio propuesto' },
        { name: 'processId', label: 'Proceso afectado', type: 'select', options: metadata.processes },
        { name: 'purpose', label: 'Propósito del cambio', type: 'textarea' },
        { name: 'consequences', label: 'Consecuencias potenciales y procesos o documentos afectados', type: 'textarea' },
        { name: 'integrityMeasures', label: 'Medidas para mantener la integridad del SGC', type: 'textarea', hint: 'Considera interacciones de procesos, controles, continuidad y documentos vigentes.' },
        { name: 'resources', label: 'Recursos necesarios y confirmación de su disponibilidad', type: 'textarea' },
        { name: 'responsibilityChanges', label: 'Asignación o reasignación de responsabilidades y autoridades', type: 'textarea' },
        { name: 'implementationPlan', label: 'Actividades y secuencia de implementación', type: 'textarea' },
        { name: 'responsibleId', label: 'Responsable', type: 'select', options: metadata.users },
        { name: 'dueDate', label: 'Fecha prevista de finalización y revisión', type: 'date' },
        { name: 'evaluationMethod', label: 'Criterios y método para revisar el resultado del cambio', type: 'textarea' },
    ];
    fields.push({ name: 'status', label: 'Estado', type: 'select', options: risk ? [
        { id: 'ABIERTA', name: 'Planificado' }, { id: 'EN_PROGRESO', name: 'En ejecución' }, { id: 'CERRADA', name: 'Evaluado y cerrado' },
    ] : [{ id: 'PLANIFICADO', name: 'Planificado' }, { id: 'EN_EJECUCION', name: 'En ejecución' }, { id: 'COMPLETADO', name: 'Evaluado y completado' }] });

    const reviewFields: Field[] = [
        { name: 'result', label: 'Resultado de la evaluación', type: 'select', options: [{ id: 'EFICAZ', name: 'Eficaz: cerrar el registro' }, { id: 'NO_EFICAZ', name: 'No eficaz: continuar ejecución' }] },
        { name: 'evaluation', label: 'Resultado observado frente al criterio planificado', type: 'textarea' },
        { name: 'evidence', label: 'Evidencia verificable (registro, ubicación, fecha y resultado)', type: 'textarea' },
        { name: 'followUp', label: 'Ajustes y próximo seguimiento', type: 'textarea', optional: form.result !== 'NO_EFICAZ' },
        ...(risk && selected?.kind === 'RIESGO' ? [
            { name: 'residualProbability', label: 'Probabilidad residual (1–5)', type: 'number' as const },
            { name: 'residualImpact', label: 'Impacto residual (1–5)', type: 'number' as const },
        ] : []),
    ];

    const filtered = useMemo(() => records.filter((record) => {
        const matchesQuery = `${record.description || record.title} ${record.processName} ${record.responsible || record.responsibleName}`.toLocaleLowerCase().includes(query.toLocaleLowerCase());
        return matchesQuery && (filter === 'ALL' || (filter === 'CLOSED' ? isClosed(record) : filter === 'OPEN' ? !isClosed(record) : record.kind === filter));
    }), [records, query, filter]);
    const editable = canWrite && (!selected || !isClosed(selected));

    const openPlan = (plan: Plan | null) => {
        setSelected(plan); setEvaluating(false); setFormError('');
        if (plan) {
            const next: Form = {};
            for (const [key, value] of Object.entries(plan)) if (typeof value === 'string' || typeof value === 'number') next[key] = String(value);
            next.dueDate = next.dueDate?.slice(0, 10) || '';
            next.evaluationDueDate = next.evaluationDueDate?.slice(0, 10) || '';
            if (next.status === 'VENCIDA') next.status = 'EN_PROGRESO';
            setForm(next);
        } else setForm(risk ? { kind: 'RIESGO', sourceType: 'CONTEXTO', probability: '3', impact: '3', status: 'ABIERTA' } : { status: 'PLANIFICADO' });
        setOpen(true);
    };

    const save = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true); setFormError('');
        try {
            const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                ...form, tenantId: tenant.id, id: selected?.id, updatedAt: selected?.updatedAt,
                ...(evaluating ? { action: 'review' } : {}),
            }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'No fue posible guardar.');
            toast.success(evaluating ? 'Evaluación y evidencia guardadas.' : 'Plan guardado.');
            setOpen(false);
            await load();
        } catch (caught) { setFormError(caught instanceof Error ? caught.message : 'Error de conexión.'); }
        finally { setSaving(false); }
    };

    return <div className="space-y-6 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div><h1 className="text-2xl font-semibold">{risk ? 'Riesgos y oportunidades' : 'Planificación de cambios'}</h1>
                <p className="mt-1 text-sm text-muted-foreground">ISO 9001:2015 · {risk ? '6.1 · Acciones, integración en procesos y evaluación de eficacia.' : '6.3 · Propósito, consecuencias, integridad del SGC, recursos y responsabilidades.'}</p></div>
            {canWrite && <Button onClick={() => openPlan(null)} disabled={loading || !!error || !metadata.processes.length || !metadata.users.length}><Plus className="mr-2 h-4 w-4" />{risk ? 'Nuevo registro' : 'Planificar cambio'}</Button>}
        </div>
        {!loading && !error && (!metadata.processes.length || !metadata.users.length) && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Se necesita un proceso y un responsable activos de la empresa. Revisa <Link className="underline" href="/contexto/procesos">Procesos</Link> y <Link className="underline" href="/admin/usuarios">Usuarios</Link> para poder planificar.</p>}
        {error && <div role="alert" className="rounded-md border border-red-200 p-4 text-red-700">{error}<Button variant="outline" className="ml-3" onClick={() => void load()}>Reintentar</Button></div>}
        {!error && <>
            <div className="flex flex-wrap gap-3">
                <div className="relative min-w-64 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar registros" placeholder="Buscar descripción, proceso o responsable" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
                <select className={`${selectClass} max-w-56`} aria-label="Filtrar registros" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">Todos</option><option value="OPEN">Pendientes</option><option value="CLOSED">Cerrados</option>{risk && <><option value="RIESGO">Riesgos</option><option value="OPORTUNIDAD">Oportunidades</option></>}</select>
            </div>
            <div className="overflow-x-auto rounded-lg border bg-card"><Table>
                <TableHeader><TableRow>{risk && <TableHead>Tipo</TableHead>}<TableHead>Descripción / proceso</TableHead><TableHead>Responsable</TableHead><TableHead>{risk ? 'Acción / evaluación' : 'Fecha límite'}</TableHead>{risk && <TableHead>Valoración</TableHead>}<TableHead>Estado</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader>
                <TableBody>{loading ? <TableRow><TableCell colSpan={risk ? 7 : 5} className="h-28 text-center">Cargando registros…</TableCell></TableRow> : filtered.length === 0 ? <TableRow><TableCell colSpan={risk ? 7 : 5} className="h-28 text-center text-muted-foreground">{records.length ? 'No hay registros con estos filtros.' : 'Aún no hay registros. Comienza con una necesidad real de la empresa.'}</TableCell></TableRow> : filtered.map((record) => <TableRow key={record.id}>
                    {risk && <TableCell><Badge variant="outline">{record.kind === 'OPORTUNIDAD' ? 'Oportunidad' : 'Riesgo'}</Badge></TableCell>}
                    <TableCell className="max-w-md whitespace-normal"><p className="font-medium">{record.description || record.title}</p><p className="mt-1 text-xs text-muted-foreground">{record.processName || 'Proceso pendiente'}</p></TableCell>
                    <TableCell>{record.responsible || record.responsibleName}</TableCell><TableCell className="whitespace-nowrap">{dateText(record.dueDate)}{!isClosed(record) && record.dueDate && record.dueDate.slice(0, 10) < new Date().toLocaleDateString('en-CA', { timeZone: tenant.timezone || 'America/Bogota' }) && <p className="text-xs text-red-600">Plazo vencido</p>}{risk && <p className="mt-1 text-xs text-muted-foreground">Evaluación: {dateText(record.evaluationDueDate || null)}</p>}</TableCell>
                    {risk && <TableCell>{record.riskValue}/25 <span className="block text-xs text-muted-foreground">{record.kind === 'OPORTUNIDAD' ? 'Potencial' : 'Exposición'}</span></TableCell>}
                    <TableCell><Badge variant={isClosed(record) ? 'secondary' : 'outline'}>{statuses[record.status] || record.status}</Badge></TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => openPlan(record)}>Ver {canWrite && !isClosed(record) ? '/ editar' : ''}</Button></TableCell>
                </TableRow>)}</TableBody>
            </Table></div>
            {risk && <p className="text-xs text-muted-foreground">La valoración (probabilidad × impacto o beneficio) prioriza los registros. Los riesgos y las oportunidades se evalúan por separado; un puntaje no demuestra eficacia ni cumplimiento.</p>}
        </>}
        <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader><DialogTitle>{evaluating ? 'Evaluar resultados y registrar evidencia' : selected ? 'Plan y seguimiento' : risk ? 'Nuevo riesgo u oportunidad' : 'Planificar cambio'}</DialogTitle><DialogDescription>{evaluating ? 'Compara el resultado observado con el criterio planificado. Solo una evaluación eficaz permite cerrar.' : 'Los campos con * son obligatorios. Completa el plan antes de iniciar su ejecución.'}</DialogDescription></DialogHeader>
            {evaluating && selected && <div className="rounded-md border p-3 text-sm"><p className="font-medium">{selected.description || selected.title}</p><p className="mt-1 whitespace-pre-wrap">Criterio: {String(selected.evaluationMethod || '')}</p></div>}
            <form onSubmit={save} className="space-y-5">
                <fieldset disabled={saving || !editable} className="grid gap-4 md:grid-cols-2">{(evaluating ? reviewFields : fields).map((field) => <FieldInput key={field.name} field={field.name === 'status' && (!selected || !isClosed(selected)) ? { ...field, options: field.options?.filter((option) => option.id !== 'CERRADA' && option.id !== 'COMPLETADO') } : field} form={form} setForm={setForm} disabled={(field.name === 'kind' && !!selected) || (field.name === 'status' && !selected)} />)}</fieldset>
                {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
                <DialogFooter className="flex-wrap gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cerrar</Button>
                    {editable && selected && !evaluating && ['EN_PROGRESO', 'EN_EJECUCION'].includes(selected.status) && <Button type="button" variant="outline" onClick={() => { setForm({ result: 'NO_EFICAZ' }); setFormError(''); setEvaluating(true); }}>Evaluar eficacia</Button>}
                    {editable && <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : evaluating ? 'Registrar evaluación' : 'Guardar plan'}</Button>}
                </DialogFooter>
            </form>
            {selected && !evaluating && <section className="space-y-3 border-t pt-4"><h2 className="font-semibold">Trazabilidad y evaluaciones</h2><p className="text-xs text-muted-foreground">Creado por {selected.createdByName || 'Sin dato histórico'} · {dateText(selected.createdAt)}. Última actualización: {new Date(selected.updatedAt).toLocaleString('es-CO')}.</p>
                {!selected.reviews.length && <p className="text-sm text-muted-foreground">No hay evaluaciones registradas.</p>}
                {selected.reviews.map((review) => <article key={review.id} className="space-y-2 rounded-md border p-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{review.result === 'EFICAZ' ? 'Eficaz' : 'No eficaz'}</strong><span>{review.userName} · {new Date(review.createdAt).toLocaleString('es-CO')}</span></div><p className="whitespace-pre-wrap">{review.evaluation}</p><p className="whitespace-pre-wrap"><strong>Evidencia: </strong>{review.evidence}</p>{review.followUp && <p className="whitespace-pre-wrap"><strong>Seguimiento: </strong>{review.followUp}</p>}{review.residualProbability && review.residualImpact && <p>Valoración residual: {review.residualProbability} × {review.residualImpact} = {review.residualProbability * review.residualImpact}.</p>}
                    {review.planSnapshot && <details><summary className="cursor-pointer text-muted-foreground">Plan al momento de la evaluación</summary><dl className="mt-3 space-y-3">{fields.filter((field) => !['status', 'sourceId', 'responsibleId', 'processId'].includes(field.name)).map((field) => <div key={field.name}><dt className="font-medium">{field.label}</dt><dd className="whitespace-pre-wrap">{String(review.planSnapshot?.[field.name] || '—')}</dd></div>)}</dl></details>}
                </article>)}
            </section>}
        </DialogContent></Dialog>
    </div>;
}
