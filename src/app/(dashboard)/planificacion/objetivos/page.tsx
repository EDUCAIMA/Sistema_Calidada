"use client";

import { ModulePage, ModuleHeader, ModuleToolbar, ModuleContent, ModulePanel } from '@/components/sgc/module-layout';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { toast } from 'sonner';
import {
    AlertCircle, Building2, Calendar, Check, ChevronLeft, ChevronRight, ClipboardList,
    Download, Edit, Eye, Filter, Info, Loader2, MoreVertical, Plus, RefreshCw,
    Save, Search, ShieldCheck, Target, Archive, User,
} from 'lucide-react';
import { downloadStandardPdf, type PdfSection } from '@/lib/document-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Lookup = { id: string; name?: string; title?: string; email?: string; code?: string; status?: string; type?: string; active?: boolean };
type Tracking = { id: string; date: string; note: string; progress: number; actual?: string | null; eventType?: string; evidence?: string | null; targetMet?: boolean | null; actorName?: string | null; snapshot?: { before?: Record<string, unknown>; after?: Record<string, unknown>; target?: string; evaluationMethod?: string } | null };
type Objective = {
    id: string;
    updatedAt: string;
    tenantId: string;
    policyId?: string | null;
    processId?: string | null;
    organizationalLevel?: string | null;
    description: string;
    indicator: string;
    target: string;
    actual?: string | null;
    applicableRequirements?: string | null;
    relevance?: string | null;
    resources?: string | null;
    actionPlan?: string | null;
    evaluationMethod?: string | null;
    targetMet?: boolean | null;
    archivedAt?: string | null;
    responsibleId?: string | null;
    responsibleName?: string | null;
    deadline: string;
    evaluationFreq?: string | null;
    nextEvaluationDate?: string | null;
    communicationRecipients?: string | null;
    communicationDate?: string | null;
    communicationEvidence?: string | null;
    status: string;
    progress: number;
    tracking: Tracking[];
};

type FormState = {
    policyId: string;
    processId: string;
    organizationalLevel: string;
    description: string;
    indicator: string;
    target: string;
    actual: string;
    applicableRequirements: string;
    relevance: string;
    resources: string;
    actionPlan: string;
    evaluationMethod: string;
    changeReason: string;
    responsibleId: string;
    deadline: string;
    evaluationFreq: string;
    communicationRecipients: string;
    communicationDate: string;
    communicationEvidence: string;
};

type FormTab = 'alignment' | 'measurement' | 'planning';

const STEP_ORDER: FormTab[] = ['alignment', 'measurement', 'planning'];
const STEP_FIELDS: Record<FormTab, Array<keyof FormState>> = {
    alignment: ['policyId', 'processId', 'organizationalLevel', 'applicableRequirements', 'relevance'],
    measurement: ['description', 'indicator', 'target', 'evaluationMethod'],
    planning: ['actionPlan', 'responsibleId', 'deadline', 'evaluationFreq', 'resources', 'communicationRecipients', 'communicationDate', 'communicationEvidence'],
};
const FIELD_LABELS: Partial<Record<keyof FormState, string>> = {
    policyId: 'Selecciona una política vigente.',
    processId: 'Selecciona el proceso o función.',
    organizationalLevel: 'Selecciona el nivel organizacional.',
    applicableRequirements: 'Describe los requisitos aplicables.',
    relevance: 'Explica la contribución a la conformidad y al cliente.',
    description: 'Describe qué se va a lograr.',
    indicator: 'Define el indicador de medición.',
    target: 'Define la meta esperada.',
    evaluationMethod: 'Describe la fórmula, fuente de datos y criterio de evaluación.',
    actionPlan: 'Describe las acciones para alcanzar el objetivo.',
    responsibleId: 'Selecciona la persona responsable.',
    deadline: 'Indica la fecha límite.',
    evaluationFreq: 'Selecciona la frecuencia de evaluación.',
    resources: 'Describe los recursos requeridos.',
    communicationRecipients: 'Indica a quiénes se comunicará.',
    communicationDate: 'Indica la fecha de comunicación.',
    communicationEvidence: 'Identifica la evidencia de comunicación.',
    changeReason: 'Explica el motivo de la actualización.',
};

const emptyForm = (): FormState => ({
    policyId: '',
    processId: '',
    organizationalLevel: '',
    description: '',
    indicator: '',
    target: '',
    actual: '',
    applicableRequirements: '',
    relevance: '',
    resources: '',
    actionPlan: '',
    evaluationMethod: '',
    changeReason: '',
    responsibleId: '',
    deadline: '',
    evaluationFreq: '',
    communicationRecipients: '',
    communicationDate: '',
    communicationEvidence: '',
});

const toDateInput = (value?: string | null) => value ? new Date(value).toISOString().split('T')[0] : '';
const displayDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '—';

export default function ObjetivosPage() {
    const { tenant, currentUser } = useApp();
    const canWrite = Boolean(currentUser && ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'USUARIO'].includes(currentUser.role));
    const canArchive = currentUser?.role === 'ADMIN_EMPRESA' || currentUser?.role === 'SUPER_ADMIN';
    const router = useRouter();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [policies, setPolicies] = useState<Lookup[]>([]);
    const [processes, setProcesses] = useState<Lookup[]>([]);
    const [users, setUsers] = useState<Lookup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ACTIVOS');
    const [processFilter, setProcessFilter] = useState('TODOS');
    const [showFilters, setShowFilters] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formTab, setFormTab] = useState<FormTab>('alignment');
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [refreshingPolicies, setRefreshingPolicies] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingVersion, setEditingVersion] = useState<string | undefined>();
    const [formData, setFormData] = useState<FormState>(emptyForm());
    const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [trackingData, setTrackingData] = useState({ note: '', progress: 0, actual: '', evidence: '', targetMet: '' });
    const [savingTracking, setSavingTracking] = useState(false);

    useEffect(() => {
        if (!tenant?.id) return;
        const loadData = async () => {
            setLoading(true);
            try {
                const query = `tenantId=${encodeURIComponent(tenant.id)}`;
                const [objectivesRes, policiesRes, processesRes, usersRes] = await Promise.all([
                    fetch(`/api/planificacion/objetivos?${query}`, { cache: 'no-store' }),
                    fetch(`/api/liderazgo/politicas?${query}`, { cache: 'no-store' }),
                    fetch(`/api/procesos?${query}`, { cache: 'no-store' }),
                    fetch(`/api/admin/users?${query}`, { cache: 'no-store' }),
                ]);
                const [objectiveData, policyData, processData, userData] = await Promise.all([
                    objectivesRes.json(), policiesRes.json(), processesRes.json(), usersRes.json(),
                ]);
                if (!objectivesRes.ok) throw new Error(objectiveData.error || 'No fue posible cargar los objetivos.');
                setObjectives(objectiveData);
                setPolicies(Array.isArray(policyData) ? policyData : []);
                setProcesses(Array.isArray(processData) ? processData : []);
                setUsers(Array.isArray(userData) ? userData : []);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Error al cargar el módulo.');
            } finally {
                setLoading(false);
            }
        };
        void loadData();
    }, [tenant?.id]);

    const getPolicyName = (id?: string | null) => policies.find((item) => item.id === id)?.title || '—';
    const getProcessName = (id?: string | null) => {
        const process = processes.find((item) => item.id === id);
        return process ? `${process.code ? `${process.code} · ` : ''}${process.name}` : '—';
    };

    const filteredObjectives = useMemo(() => objectives.filter((objective) => {
        const term = searchTerm.toLowerCase();
        const matchesTerm = [objective.description, objective.indicator, objective.responsibleName]
            .some((value) => value?.toLowerCase().includes(term));
        const matchesStatus = statusFilter === 'TODOS' || (statusFilter === 'ACTIVOS' ? !objective.archivedAt : objective.status === statusFilter);
        const matchesProcess = processFilter === 'TODOS' || objective.processId === processFilter;
        return matchesTerm && matchesStatus && matchesProcess;
    }), [objectives, processFilter, searchTerm, statusFilter]);

    const currentStepIndex = STEP_ORDER.indexOf(formTab);
    const currentStepNumber = currentStepIndex + 1;
    const vigentePolicies = useMemo(
        () => policies.filter((policy) => policy.status === 'VIGENTE' && ['General', 'Calidad'].includes(policy.type || '')),
        [policies],
    );
    const selectablePolicies = policies.filter((policy) => vigentePolicies.some((item) => item.id === policy.id) || (Boolean(editingId) && policy.id === formData.policyId));

    const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setFormData((current) => ({ ...current, [key]: value }));
        setFormErrors((current) => {
            if (!current[key]) return current;
            const next = { ...current };
            delete next[key];
            return next;
        });
    };

    const validateFields = (fields: Array<keyof FormState>) => {
        const nextErrors: Partial<Record<keyof FormState, string>> = {};
        fields.forEach((key) => {
            if (!formData[key].trim()) nextErrors[key] = FIELD_LABELS[key] || 'Este campo es obligatorio.';
        });
        setFormErrors((current) => {
            const next = { ...current };
            fields.forEach((key) => delete next[key]);
            return { ...next, ...nextErrors };
        });
        return Object.keys(nextErrors).length === 0;
    };

    const isStepComplete = (step: FormTab) => STEP_FIELDS[step].every((key) => formData[key].trim());

    const refreshPolicies = async (showFeedback = true) => {
        if (!tenant?.id) return;
        setRefreshingPolicies(true);
        try {
            const response = await fetch(`/api/liderazgo/politicas?tenantId=${encodeURIComponent(tenant.id)}`, { cache: 'no-store' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible consultar las políticas.');
            const items = Array.isArray(data) ? data : [];
            const activePolicies = items.filter((policy: Lookup) => policy.status === 'VIGENTE' && ['General', 'Calidad'].includes(policy.type || ''));
            setPolicies(items);
            if (!editingId && activePolicies.length === 1) {
                updateField('policyId', activePolicies[0].id);
            }
            if (showFeedback) {
                if (activePolicies.length) toast.success(`${activePolicies.length} política${activePolicies.length === 1 ? '' : 's'} vigente${activePolicies.length === 1 ? '' : 's'} disponible${activePolicies.length === 1 ? '' : 's'}.`);
                else toast.info(`No se encontraron políticas vigentes para ${tenant.name}.`);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al consultar las políticas.');
        } finally {
            setRefreshingPolicies(false);
        }
    };

    const handleStepChange = (nextStep: string) => {
        const next = nextStep as FormTab;
        const nextIndex = STEP_ORDER.indexOf(next);
        if (nextIndex > currentStepIndex && !validateFields(STEP_FIELDS[formTab])) {
            toast.error('Completa los campos señalados antes de continuar.');
            return;
        }
        setFormTab(next);
    };

    const handleNextStep = () => {
        if (!validateFields(STEP_FIELDS[formTab])) {
            toast.error('Completa los campos señalados antes de continuar.');
            return;
        }
        const next = STEP_ORDER[currentStepIndex + 1];
        if (next) setFormTab(next);
    };

    const handlePreviousStep = () => {
        const previous = STEP_ORDER[currentStepIndex - 1];
        if (previous) setFormTab(previous);
    };

    const handleManagePolicies = () => {
        setIsFormOpen(false);
        router.push('/liderazgo/politicas');
    };

    const openNew = () => {
        setEditingId(null);
        setEditingVersion(undefined);
        setFormData(emptyForm());
        setFormErrors({});
        setFormTab('alignment');
        setIsFormOpen(true);
        void refreshPolicies(false);
    };

    const openEdit = (objective: Objective) => {
        setEditingId(objective.id);
        setEditingVersion(objective.updatedAt);
        setFormData({
            policyId: objective.policyId || '',
            processId: objective.processId || '',
            organizationalLevel: objective.organizationalLevel || '',
            description: objective.description,
            indicator: objective.indicator,
            target: objective.target,
            actual: objective.actual || '',
            applicableRequirements: objective.applicableRequirements || '',
            relevance: objective.relevance || '',
            resources: objective.resources || '',
            actionPlan: objective.actionPlan || '',
            evaluationMethod: objective.evaluationMethod || '',
            changeReason: '',
            responsibleId: objective.responsibleId || '',
            deadline: toDateInput(objective.deadline),
            evaluationFreq: objective.evaluationFreq || '',
            communicationRecipients: objective.communicationRecipients || '',
            communicationDate: toDateInput(objective.communicationDate),
            communicationEvidence: objective.communicationEvidence || '',
        });
        setFormErrors({});
        setFormTab('alignment');
        setIsDetailOpen(false);
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        const allRequired = [...STEP_ORDER.flatMap((step) => STEP_FIELDS[step]), ...(editingId ? ['changeReason' as const] : [])];
        if (!validateFields(allRequired)) {
            const firstInvalidStep = STEP_ORDER.find((step) => STEP_FIELDS[step].some((key) => !formData[key].trim()));
            if (firstInvalidStep) setFormTab(firstInvalidStep);
            toast.error('Revisa los campos señalados para guardar el objetivo.');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/planificacion/objetivos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingId, expectedUpdatedAt: editingVersion, tenantId: tenant.id, ...formData }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible guardar el objetivo.');
            setObjectives((current) => editingId
                ? current.map((objective) => objective.id === editingId ? data : objective)
                : [data, ...current]);
            setSelectedObjective((current) => current?.id === editingId ? data : current);
            setIsFormOpen(false);
            setEditingId(null);
            setFormData(emptyForm());
            setFormErrors({});
            toast.success(editingId ? 'Objetivo actualizado.' : 'Objetivo creado y documentado.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al guardar el objetivo.');
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (objective: Objective) => {
        if (!window.confirm(`¿Archivar el objetivo “${objective.description}”? Se conservará el historial para consulta.`)) return;
        try {
            const response = await fetch(
                `/api/planificacion/objetivos?id=${encodeURIComponent(objective.id)}&tenantId=${encodeURIComponent(tenant.id)}&expectedUpdatedAt=${encodeURIComponent(objective.updatedAt)}`,
                { method: 'DELETE' },
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible archivar el objetivo.');
            setObjectives((current) => current.map((item) => item.id === objective.id ? data : item));
            toast.success('Objetivo archivado. Su historial sigue disponible.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al archivar el objetivo.');
        }
    };

    const openDetail = (objective: Objective) => {
        setSelectedObjective(objective);
        setTrackingData({ note: '', progress: objective.progress || 0, actual: objective.actual || '', evidence: '', targetMet: '' });
        setIsDetailOpen(true);
    };

    const handleSaveTracking = async () => {
        if (!selectedObjective || !trackingData.note.trim() || !trackingData.actual.trim() || !trackingData.evidence.trim() || !trackingData.targetMet) {
            toast.error('Registra el resultado, análisis, evidencia y evaluación frente a la meta.');
            return;
        }
        setSavingTracking(true);
        try {
            const response = await fetch('/api/planificacion/objetivos/tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ objectiveId: selectedObjective.id, expectedUpdatedAt: selectedObjective.updatedAt, tenantId: tenant.id, ...trackingData, targetMet: trackingData.targetMet === 'SI' }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible guardar el seguimiento.');
            setObjectives((current) => current.map((item) => item.id === data.objective.id ? data.objective : item));
            setSelectedObjective(data.objective);
            setTrackingData({ note: '', progress: data.objective.progress, actual: data.objective.actual || '', evidence: '', targetMet: '' });
            toast.success('Seguimiento registrado y estado actualizado.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al registrar el seguimiento.');
        } finally {
            setSavingTracking(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { label: string; className: string }> = {
            CUMPLIDO: { label: 'Cumplido', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            EN_RIESGO: { label: 'En riesgo', className: 'bg-amber-50 text-amber-700 border-amber-200' },
            ATRASADO: { label: 'Atrasado', className: 'bg-rose-50 text-rose-700 border-rose-200' },
            EN_PROGRESO: { label: 'En progreso', className: 'bg-blue-50 text-blue-700 border-blue-200' },
            ARCHIVADO: { label: 'Archivado', className: 'bg-slate-50 text-slate-700 border-slate-200' },
        };
        const config = styles[status] || styles.EN_PROGRESO;
        return <Badge variant="outline" className={`${config.className} rounded-full px-3 py-1`}>{config.label}</Badge>;
    };

    const handleDownloadPDF = async () => {
        const toastId = toast.loading('Generando matriz de objetivos...');
        try {
            const sections: PdfSection[] = [{
                title: 'Resumen de los objetivos seleccionados',
                head: ['Objetivo', 'Política / proceso', 'Indicador / meta', 'Responsable', 'Plazo / evaluación', 'Actual / avance', 'Estado'],
                rows: filteredObjectives.map(objective => [
                    objective.description,
                    `${getPolicyName(objective.policyId)}\n${getProcessName(objective.processId)}`,
                    `${objective.indicator}\nMeta: ${objective.target}`,
                    objective.responsibleName || '—',
                    `${displayDate(objective.deadline)}\n${objective.evaluationFreq || '—'}`,
                    `${objective.actual || '—'}\n${objective.progress}%`,
                    getStatusLabel(objective.status),
                ]),
            }];
            for (const objective of filteredObjectives) {
                sections.push({
                    title: 'Planificación y seguimiento del objetivo',
                    head: ['Campo', 'Información documentada'],
                    rows: [
                        ['Objetivo', objective.description],
                        ['Política / proceso / nivel', `${getPolicyName(objective.policyId)} / ${getProcessName(objective.processId)} / ${objective.organizationalLevel || '—'}`],
                        ['Requisitos y relevancia', `${objective.applicableRequirements || '—'}\n${objective.relevance || '—'}`],
                        ['Indicador, meta y método', `${objective.indicator}\nMeta: ${objective.target}\n${objective.evaluationMethod || 'Sin definir'}`],
                        ['Acciones', objective.actionPlan || 'Sin definir'],
                        ['Recursos', objective.resources || '—'],
                        ['Responsable y plazos', `${objective.responsibleName || '—'}\nPlazo: ${displayDate(objective.deadline)}\nEvaluación: ${objective.evaluationFreq || '—'}; próxima: ${displayDate(objective.nextEvaluationDate)}`],
                        ['Comunicación', `${objective.communicationRecipients || '—'}\nFecha: ${displayDate(objective.communicationDate)}\nEvidencia: ${objective.communicationEvidence || 'Sin soporte'}`],
                        ['Resultado y estado', `${objective.actual || 'Sin medición'}\nAvance de acciones: ${objective.progress}%\n${getStatusLabel(objective.status)}`],
                        ...objective.tracking.map(event => [
                            `${displayDate(event.date)}\n${event.actorName || 'Autor no registrado'}`,
                            `${event.eventType === 'MEASUREMENT' ? `Medición: ${event.actual || '—'}; meta ${event.targetMet == null ? 'sin evaluar' : event.targetMet ? 'cumplida' : 'no cumplida'}. ` : ''}${event.note}${event.evidence ? `\nEvidencia: ${event.evidence}` : ''}`,
                        ]),
                    ],
                });
            }
            await downloadStandardPdf({
                tenantId: tenant.id,
                moduleKey: '6.2',
                title: 'Matriz de objetivos de calidad',
                filename: 'Objetivos_de_Calidad.pdf',
                orientation: 'landscape',
                sections,
            });
            toast.success('Matriz de objetivos descargada.', { id: toastId });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No fue posible generar el PDF.', { id: toastId });
        }
    };

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" /></div>;
    }

    return (
        <ModulePage>
            <ModuleHeader clause="6.2" title="Objetivos de calidad"
                description="Planifique acciones, comunique objetivos y evalúe resultados con evidencia."
                actions={<>
                    <Button variant="outline" className="h-11 rounded-xl" onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4 text-red-500" />Descargar PDF</Button>
                    {canWrite && <Button className="h-11 rounded-xl bg-blue-600" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo objetivo</Button>}
                </>} />

            <ModuleToolbar className="flex-col items-stretch">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 max-w-xl flex-1">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input aria-label="Buscar objetivos" className="h-11 rounded-xl bg-white pl-11" placeholder="Buscar objetivo, indicador o responsable..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                    </div>
                    <Button variant="outline" className="h-11 rounded-xl" aria-expanded={showFilters} onClick={() => setShowFilters((value) => !value)}><Filter className="mr-2 h-4 w-4" />Filtros</Button>
                </div>
                {showFilters && (
                    <div className="grid max-w-3xl gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODOS">Todos los estados</SelectItem>
                                <SelectItem value="ACTIVOS">Objetivos activos</SelectItem>
                                <SelectItem value="EN_PROGRESO">En progreso</SelectItem>
                                <SelectItem value="EN_RIESGO">En riesgo</SelectItem>
                                <SelectItem value="ATRASADO">Atrasado</SelectItem>
                                <SelectItem value="CUMPLIDO">Cumplido</SelectItem>
                                <SelectItem value="ARCHIVADO">Archivados</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={processFilter} onValueChange={setProcessFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODOS">Todos los procesos</SelectItem>
                                {processes.map((process) => <SelectItem key={process.id} value={process.id}>{process.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </ModuleToolbar>

            <ModuleContent>
                <ModulePanel>
                    <Table>
                        <TableHeader><TableRow className="bg-slate-50/80">
                            <TableHead className="pl-6">Objetivo / proceso</TableHead><TableHead>Meta / indicador</TableHead>
                            <TableHead>Responsable</TableHead><TableHead>Avance</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {filteredObjectives.map((objective) => (
                                <TableRow key={objective.id} className="cursor-pointer" onClick={() => openDetail(objective)}>
                                    <TableCell className="max-w-sm py-5 pl-6"><p className="font-semibold text-slate-900">{objective.description}</p><p className="mt-1 text-xs text-slate-500">{getProcessName(objective.processId)}</p></TableCell>
                                    <TableCell><p className="font-semibold">{objective.target}</p><p className="text-xs text-slate-500">{objective.indicator}</p></TableCell>
                                    <TableCell>{objective.responsibleName || '—'}</TableCell>
                                    <TableCell><div className="w-32"><div className="mb-1 flex justify-between text-xs"><span>Progreso</span><b>{objective.progress}%</b></div><Progress value={objective.progress} /></div></TableCell>
                                    <TableCell>{getStatusBadge(objective.status)}</TableCell>
                                    <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                                        <DropdownMenu><DropdownMenuTrigger asChild><Button aria-label={`Acciones de ${objective.description}`} variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openDetail(objective)}><Eye className="mr-2 h-4 w-4" />Seguimiento</DropdownMenuItem>
                                                {canWrite && !objective.archivedAt && <DropdownMenuItem onClick={() => openEdit(objective)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>}
                                                {canArchive && !objective.archivedAt && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => void handleArchive(objective)}><Archive className="mr-2 h-4 w-4" />Archivar</DropdownMenuItem></>}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!filteredObjectives.length && <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-500">No hay objetivos que coincidan con la búsqueda. Registre el primero desde “Nuevo objetivo”.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </ModulePanel>
            </ModuleContent>

            <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) { setFormTab('alignment'); setFormErrors({}); } }}>
                <DialogContent className="grid max-h-[94vh] min-w-0 w-[calc(100vw-1rem)] max-w-4xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-2xl sm:max-w-4xl">
                    <DialogHeader className="min-w-0 border-b bg-gradient-to-r from-blue-50 via-white to-slate-50 px-4 py-4 pr-11 sm:px-7 sm:py-5 sm:pr-14">
                        <div className="flex min-w-0 items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                                <span className="shrink-0 rounded-2xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-200 sm:p-3"><Target className="h-5 w-5 sm:h-6 sm:w-6" /></span>
                                <div className="min-w-0 space-y-1 text-left">
                                    <DialogTitle className="break-words text-lg font-extrabold leading-tight text-slate-950 sm:text-2xl">{editingId ? 'Editar objetivo de calidad' : 'Planificar objetivo de calidad'}</DialogTitle>
                                    <DialogDescription className="text-xs leading-relaxed text-slate-600 sm:text-sm">Asistente de planificación conforme a ISO 9001:2015, numerales 6.2.1 y 6.2.2.</DialogDescription>
                                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                        <Badge className="border-blue-200 bg-blue-100 text-[10px] font-bold text-blue-700 hover:bg-blue-100">ISO 9001:2015</Badge>
                                        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-500"><Building2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{tenant?.name || 'Organización'}</span></span>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden w-32 shrink-0 pt-1 sm:block">
                                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-500"><span>Paso {currentStepNumber} de 3</span><span>{Math.round((currentStepNumber / 3) * 100)}%</span></div>
                                <Progress value={(currentStepNumber / 3) * 100} className="h-1.5 bg-slate-200" />
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs value={formTab} onValueChange={handleStepChange} className="min-h-0 min-w-0 gap-0 overflow-hidden bg-slate-50/70">
                        <div className="min-w-0 border-b bg-white px-2 py-2.5 sm:px-6 sm:py-3">
                            <TabsList className="grid h-auto min-w-0 w-full grid-cols-3 gap-1.5 bg-transparent p-0 sm:gap-2">
                                <WizardStepTrigger value="alignment" number={1} title="Alineación" subtitle="Política y alcance" complete={isStepComplete('alignment')} />
                                <WizardStepTrigger value="measurement" number={2} title="Medición" subtitle="Indicador y meta" complete={isStepComplete('measurement')} />
                                <WizardStepTrigger value="planning" number={3} title="Plan y comunicación" subtitle="Responsables y recursos" complete={isStepComplete('planning')} />
                            </TabsList>
                        </div>

                        <div className="min-h-0 min-w-0 overflow-y-auto p-3 sm:p-5">
                            <TabsContent value="alignment" className="m-0 min-w-0">
                                <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                                    <StepHeading step="Paso 1" title="Alineación y alcance" description="Relacione el objetivo con la política de calidad, el proceso y los requisitos aplicables." />
                                    <Field label="Política de calidad *" error={formErrors.policyId} hint={vigentePolicies.length ? `${vigentePolicies.length} política${vigentePolicies.length === 1 ? '' : 's'} vigente${vigentePolicies.length === 1 ? '' : 's'} disponible${vigentePolicies.length === 1 ? '' : 's'}.` : undefined}>
                                        <Select value={formData.policyId} onValueChange={(value) => updateField('policyId', value)} disabled={!selectablePolicies.length || refreshingPolicies}><SelectTrigger className="h-11 w-full" aria-invalid={Boolean(formErrors.policyId)}><SelectValue placeholder={refreshingPolicies ? 'Consultando políticas...' : 'Seleccionar política vigente'} /></SelectTrigger><SelectContent>{selectablePolicies.map((policy) => <SelectItem key={policy.id} value={policy.id}>{policy.title}{policy.status !== 'VIGENTE' ? ' · Vínculo histórico' : ''}</SelectItem>)}</SelectContent></Select>
                                    </Field>
                                    {!selectablePolicies.length && (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                                            <div className="flex gap-3"><span className="rounded-full bg-amber-100 p-2 text-amber-700"><Info className="h-4 w-4" /></span><div className="min-w-0"><p className="font-bold text-amber-950">No hay una política vigente en {tenant?.name || 'esta organización'}</p><p className="mt-1 text-sm leading-relaxed text-amber-800">Regístrela o apruébela en Liderazgo 5.2 para garantizar la trazabilidad del objetivo.</p></div></div>
                                            <div className="mt-3 flex flex-wrap gap-2 pl-0 sm:pl-11"><Button type="button" size="sm" variant="outline" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100" onClick={() => void refreshPolicies()} disabled={refreshingPolicies}>{refreshingPolicies ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Recargar</Button><Button type="button" size="sm" className="bg-amber-700 text-white hover:bg-amber-800" onClick={handleManagePolicies}>Gestionar políticas<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
                                        </div>
                                    )}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field label="Proceso o función pertinente *" error={formErrors.processId}><Select value={formData.processId} onValueChange={(value) => updateField('processId', value)}><SelectTrigger className="h-11 w-full" aria-invalid={Boolean(formErrors.processId)}><SelectValue placeholder="Seleccionar proceso" /></SelectTrigger><SelectContent>{processes.map((process) => <SelectItem key={process.id} value={process.id}>{getProcessName(process.id)}</SelectItem>)}</SelectContent></Select></Field>
                                        <Field label="Nivel organizacional *" error={formErrors.organizationalLevel}><Select value={formData.organizationalLevel} onValueChange={(value) => updateField('organizationalLevel', value)}><SelectTrigger className="h-11 w-full" aria-invalid={Boolean(formErrors.organizationalLevel)}><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger><SelectContent>{['Organización', 'Proceso', 'Área', 'Cargo'].map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select></Field>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field label="Requisitos aplicables considerados *" error={formErrors.applicableRequirements}><Textarea className="min-h-24 resize-none" aria-invalid={Boolean(formErrors.applicableRequirements)} value={formData.applicableRequirements} onChange={(event) => updateField('applicableRequirements', event.target.value)} placeholder="Legales, reglamentarios, contractuales o del cliente..." /></Field>
                                        <Field label="Relevancia para la conformidad y el cliente *" error={formErrors.relevance}><Textarea className="min-h-24 resize-none" aria-invalid={Boolean(formErrors.relevance)} value={formData.relevance} onChange={(event) => updateField('relevance', event.target.value)} placeholder="Explique cómo contribuye el objetivo..." /></Field>
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="measurement" className="m-0 min-w-0">
                                <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                                    <StepHeading step="Paso 2" title="Objetivo medible" description="Defina el resultado esperado y la forma objetiva de comprobarlo." />
                                    <Field label="¿Qué se va a lograr? *" error={formErrors.description} hint={`${formData.description.length}/500 caracteres`}><Textarea maxLength={500} className="min-h-28 resize-none" aria-invalid={Boolean(formErrors.description)} value={formData.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Ej.: Reducir las devoluciones por defectos de fabricación..." /></Field>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Field label="Indicador *" error={formErrors.indicator}><Input className="h-11" aria-invalid={Boolean(formErrors.indicator)} value={formData.indicator} onChange={(event) => updateField('indicator', event.target.value)} placeholder="% de devoluciones" /></Field>
                                        <Field label="Meta esperada *" error={formErrors.target}><Input className="h-11" aria-invalid={Boolean(formErrors.target)} value={formData.target} onChange={(event) => updateField('target', event.target.value)} placeholder="≤ 2%" /></Field>
                                        <Field label={editingId ? 'Último resultado registrado' : 'Línea base'} hint={editingId ? 'Se actualiza en seguimiento' : 'Opcional'}><Input className="h-11" disabled={Boolean(editingId)} value={formData.actual} onChange={(event) => updateField('actual', event.target.value)} placeholder="4,5%" /></Field>
                                    </div>
                                    <Field label="Método de evaluación *" error={formErrors.evaluationMethod}><Textarea value={formData.evaluationMethod} onChange={(event) => updateField('evaluationMethod', event.target.value)} placeholder="Fórmula, unidad, fuente de datos y criterio para decidir si el resultado cumple la meta." /></Field>
                                    <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-relaxed text-blue-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><p><b>Objetivo verificable:</b> use la misma unidad en el indicador, la meta y el resultado actual. Incluya la fuente o fórmula cuando sea necesario.</p></div>
                                </section>
                            </TabsContent>

                            <TabsContent value="planning" className="m-0 min-w-0">
                                <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                                    <StepHeading step="Paso 3" title="Plan y comunicación" description="Determine responsables, recursos, plazos, evaluación y evidencia de comunicación." />
                                    <Field label="Acciones para lograr el objetivo *" error={formErrors.actionPlan}><Textarea value={formData.actionPlan} onChange={(event) => updateField('actionPlan', event.target.value)} placeholder="Describa las actividades y sus hitos. Si intervienen varias personas, indique quién realiza cada acción y en qué plazo." /></Field>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Field label="Responsable *" error={formErrors.responsibleId}><Select value={formData.responsibleId} onValueChange={(value) => updateField('responsibleId', value)}><SelectTrigger className="h-11 w-full" aria-invalid={Boolean(formErrors.responsibleId)}><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger><SelectContent>{users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}{user.email ? ` · ${user.email}` : ''}</SelectItem>)}</SelectContent></Select></Field>
                                        <Field label="Fecha límite *" error={formErrors.deadline}><Input className="h-11" type="date" aria-invalid={Boolean(formErrors.deadline)} value={formData.deadline} onChange={(event) => updateField('deadline', event.target.value)} /></Field>
                                        <Field label="Frecuencia de evaluación *" error={formErrors.evaluationFreq}><Select value={formData.evaluationFreq} onValueChange={(value) => updateField('evaluationFreq', value)}><SelectTrigger className="h-11 w-full" aria-invalid={Boolean(formErrors.evaluationFreq)}><SelectValue placeholder="Seleccionar frecuencia" /></SelectTrigger><SelectContent>{['Mensual', 'Trimestral', 'Semestral', 'Anual'].map((frequency) => <SelectItem key={frequency} value={frequency}>{frequency}</SelectItem>)}</SelectContent></Select></Field>
                                    </div>
                                    <Field label="Recursos requeridos *" error={formErrors.resources}><Textarea className="min-h-20 resize-none" aria-invalid={Boolean(formErrors.resources)} value={formData.resources} onChange={(event) => updateField('resources', event.target.value)} placeholder="Personas, presupuesto, equipos, tecnología o formación..." /></Field>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                                        <div className="mb-4 flex items-center gap-2"><span className="rounded-lg bg-white p-2 text-slate-600 shadow-sm"><ClipboardList className="h-4 w-4" /></span><div><p className="text-sm font-bold text-slate-900">Comunicación del objetivo</p><p className="text-xs text-slate-500">Registre destinatarios, fecha y evidencia.</p></div></div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field label="Personas o grupos comunicados *" error={formErrors.communicationRecipients}><Input className="h-11 bg-white" aria-invalid={Boolean(formErrors.communicationRecipients)} value={formData.communicationRecipients} onChange={(event) => updateField('communicationRecipients', event.target.value)} placeholder="Equipo comercial y producción" /></Field>
                                            <Field label="Fecha de comunicación *" error={formErrors.communicationDate}><Input className="h-11 bg-white" type="date" aria-invalid={Boolean(formErrors.communicationDate)} value={formData.communicationDate} onChange={(event) => updateField('communicationDate', event.target.value)} /></Field>
                                        </div>
                                        <div className="mt-4"><Field label="Evidencia o ubicación del soporte *" error={formErrors.communicationEvidence}><Input className="h-11 bg-white" value={formData.communicationEvidence} onChange={(event) => updateField('communicationEvidence', event.target.value)} placeholder="Acta, correo, enlace o código documental verificable" /></Field></div>
                                    </div>
                                    {editingId && <Field label="Motivo de la actualización *" error={formErrors.changeReason}><Textarea value={formData.changeReason} onChange={(event) => updateField('changeReason', event.target.value)} placeholder="Explique qué cambió y por qué. Si cambia la meta o el método, será necesaria una nueva evaluación." /></Field>}
                                </section>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <DialogFooter className="min-w-0 flex-row items-center justify-between gap-2 border-t bg-white px-4 py-3 sm:px-7 sm:py-4">
                        <div className="hidden min-w-0 sm:block"><p className="text-xs font-bold text-slate-700">Paso {currentStepNumber} de 3</p><p className="truncate text-[11px] text-slate-500">Los campos marcados con * son obligatorios.</p></div>
                        <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
                            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                            <div className="flex min-w-0 gap-2">
                                {formTab !== 'alignment' && <Button type="button" variant="outline" className="px-3 sm:px-4" onClick={handlePreviousStep}><ChevronLeft className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Anterior</span></Button>}
                                {formTab !== 'planning'
                                    ? <Button type="button" className="bg-blue-600 shadow-sm hover:bg-blue-700" onClick={handleNextStep} disabled={refreshingPolicies || (formTab === 'alignment' && !selectablePolicies.length)}>Siguiente<ChevronRight className="ml-1 h-4 w-4" /></Button>
                                    : <Button type="button" className="bg-blue-600 px-3 shadow-sm hover:bg-blue-700 sm:px-4" onClick={() => void handleSave()} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4 sm:mr-2" />}<span className="sm:hidden">{editingId ? 'Actualizar' : 'Guardar'}</span><span className="hidden sm:inline">{editingId ? 'Actualizar objetivo' : 'Guardar objetivo'}</span></Button>}
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="overflow-y-auto sm:max-w-[640px]">
                    {selectedObjective && <>
                        <SheetHeader className="border-b pb-5"><div>{getStatusBadge(selectedObjective.status)}</div><SheetTitle className="pt-2 text-2xl">{selectedObjective.description}</SheetTitle><SheetDescription>{getPolicyName(selectedObjective.policyId)} · {getProcessName(selectedObjective.processId)}</SheetDescription></SheetHeader>
                        <div className="space-y-7 py-7">
                            <div className="grid grid-cols-2 gap-4 rounded-2xl border bg-slate-50 p-5"><Metric label="Meta" value={selectedObjective.target} detail={selectedObjective.indicator} /><Metric label="Resultado actual" value={selectedObjective.actual || 'Sin medición'} detail={`${selectedObjective.progress}% de avance`} /><div className="col-span-2"><Progress value={selectedObjective.progress} /></div></div>
                            <FormSection title="Planificación documentada">
                                <Detail icon={<ClipboardList className="h-4 w-4" />} label="Acciones" value={selectedObjective.actionPlan} />
                                <Detail icon={<ClipboardList className="h-4 w-4" />} label="Método de evaluación" value={selectedObjective.evaluationMethod} />
                                <Detail icon={<User className="h-4 w-4" />} label="Responsable" value={selectedObjective.responsibleName} />
                                <Detail icon={<Calendar className="h-4 w-4" />} label="Fecha límite" value={displayDate(selectedObjective.deadline)} />
                                <Detail icon={<Calendar className="h-4 w-4" />} label="Próxima evaluación" value={`${displayDate(selectedObjective.nextEvaluationDate)} · ${selectedObjective.evaluationFreq || '—'}`} />
                                <Detail icon={<ClipboardList className="h-4 w-4" />} label="Recursos" value={selectedObjective.resources} />
                                <Detail icon={<ClipboardList className="h-4 w-4" />} label="Requisitos aplicables" value={selectedObjective.applicableRequirements} />
                                <Detail icon={<ClipboardList className="h-4 w-4" />} label="Relevancia" value={selectedObjective.relevance} />
                                <Detail icon={<ClipboardList className="h-4 w-4" />} label="Comunicación" value={`${selectedObjective.communicationRecipients || '—'} · ${displayDate(selectedObjective.communicationDate)}${selectedObjective.communicationEvidence ? ` · ${selectedObjective.communicationEvidence}` : ''}`} />
                            </FormSection>
                            {canWrite && !selectedObjective.archivedAt && <FormSection title="Nuevo seguimiento">
                                <p className="text-sm text-slate-600">El avance de las acciones no demuestra el cumplimiento de la meta. Evalúe el resultado con el método y la evidencia registrados.</p>
                                <div className="grid gap-4 sm:grid-cols-2"><Field label="Resultado actual *"><Input value={trackingData.actual} onChange={(event) => setTrackingData({ ...trackingData, actual: event.target.value })} placeholder="Ej.: 2,8%" /></Field><Field label="Avance de acciones (0–100) *"><Input type="number" min="0" max="100" step="1" value={trackingData.progress} onChange={(event) => setTrackingData({ ...trackingData, progress: Number(event.target.value) })} /></Field></div>
                                <Field label="¿El resultado cumple la meta? *"><Select value={trackingData.targetMet} onValueChange={(value) => setTrackingData({ ...trackingData, targetMet: value })}><SelectTrigger><SelectValue placeholder="Evaluar frente a la meta" /></SelectTrigger><SelectContent><SelectItem value="SI">Sí, la evidencia demuestra cumplimiento</SelectItem><SelectItem value="NO">No, la meta aún no se cumple</SelectItem></SelectContent></Select></Field>
                                <Field label="Análisis y acciones *"><Textarea value={trackingData.note} onChange={(event) => setTrackingData({ ...trackingData, note: event.target.value })} placeholder="Compare el resultado con la meta y explique las acciones o ajustes necesarios." /></Field>
                                <Field label="Evidencia de medición *"><Input value={trackingData.evidence} onChange={(event) => setTrackingData({ ...trackingData, evidence: event.target.value })} placeholder="Enlace, informe o registro que permite verificar el resultado" /></Field>
                                <Button disabled={savingTracking} className="bg-blue-600" onClick={() => void handleSaveTracking()}>{savingTracking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Guardar seguimiento</Button>
                            </FormSection>}
                            <FormSection title="Historial de seguimiento">
                                {selectedObjective.tracking.length ? selectedObjective.tracking.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{new Date(item.date).toLocaleString('es-CO')} · {item.actorName || 'Registro histórico sin autor'}</span><Badge variant="outline">{item.progress}% de acciones</Badge></div><p className="text-sm font-semibold">{({ PLAN_CREATED: 'Planificación inicial', PLAN_UPDATED: 'Actualización del plan', ARCHIVED: 'Archivo', MEASUREMENT: 'Medición' } as Record<string, string>)[item.eventType || 'MEASUREMENT']}</p>{(!item.eventType || item.eventType === 'MEASUREMENT') && <><p className="text-sm">Resultado: {item.actual || '—'} · {item.targetMet == null ? 'Sin evaluación de cumplimiento' : item.targetMet ? 'Meta cumplida' : 'Meta no cumplida'}</p>{item.snapshot?.target && <p className="text-xs text-slate-500">Meta evaluada: {item.snapshot.target}</p>}</>}<p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.note}</p>{item.evidence && <p className="mt-2 break-words text-xs text-slate-600">Evidencia: {item.evidence}</p>}{item.snapshot?.after && <details className="mt-3"><summary className="cursor-pointer text-xs text-blue-700">Ver planificación registrada</summary><PlanSnapshot snapshot={item.snapshot.after} /></details>}</div>) : <p className="text-sm text-slate-500">Aún no hay registros de seguimiento.</p>}
                            </FormSection>
                        </div>
                        <div className="flex gap-3 border-t pt-5"><Button variant="outline" className="flex-1" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>{canWrite && !selectedObjective.archivedAt && <Button className="flex-1" onClick={() => openEdit(selectedObjective)}><Edit className="mr-2 h-4 w-4" />Editar planificación</Button>}</div>
                    </>}
                </SheetContent>
            </Sheet>
        </ModulePage>
    );
}

function getStatusLabel(status: string) {
    return ({ EN_PROGRESO: 'En progreso', EN_RIESGO: 'En riesgo', ATRASADO: 'Atrasado', CUMPLIDO: 'Cumplido', ARCHIVADO: 'Archivado' } as Record<string, string>)[status] || status;
}

function PlanSnapshot({ snapshot }: { snapshot: Record<string, unknown> }) {
    const labels: Record<string, string> = { description: 'Objetivo', policyTitle: 'Política', processName: 'Proceso', organizationalLevel: 'Nivel', applicableRequirements: 'Requisitos', relevance: 'Relevancia', indicator: 'Indicador', target: 'Meta', actionPlan: 'Acciones', evaluationMethod: 'Método', resources: 'Recursos', responsibleName: 'Responsable', deadline: 'Plazo', evaluationFreq: 'Frecuencia', communicationRecipients: 'Destinatarios', communicationDate: 'Fecha de comunicación', communicationEvidence: 'Evidencia de comunicación' };
    return <dl className="mt-3 space-y-2 text-xs">{Object.entries(labels).map(([key, label]) => <div key={key}><dt className="font-semibold">{label}</dt><dd className="whitespace-pre-wrap break-words text-slate-600">{snapshot[key] ? String(snapshot[key]) : '—'}</dd></div>)}</dl>;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return <section className="space-y-4"><h3 className="border-b pb-2 text-xs font-bold uppercase tracking-widest text-slate-700">{title}</h3>{children}</section>;
}

function WizardStepTrigger({ value, number, title, subtitle, complete }: { value: FormTab; number: number; title: string; subtitle: string; complete: boolean }) {
    return (
        <TabsTrigger value={value} className="h-auto min-w-0 justify-start gap-2 rounded-xl border border-transparent px-2 py-2.5 text-left whitespace-normal data-[state=active]:border-blue-200 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 data-[state=active]:shadow-none sm:gap-3 sm:px-3">
            <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${complete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 group-data-[state=active]/tabs-trigger:bg-blue-600 group-data-[state=active]/tabs-trigger:text-white'}`}>{complete ? <Check className="h-4 w-4" /> : number}</span>
            <span className="min-w-0"><span className="block text-[11px] font-bold leading-tight sm:text-sm">{title}</span><span className="mt-0.5 hidden truncate text-[10px] font-normal text-slate-500 sm:block">{subtitle}</span></span>
        </TabsTrigger>
    );
}

function StepHeading({ step, title, description }: { step: string; title: string; description: string }) {
    return <div className="flex items-start gap-3 border-b border-slate-100 pb-4"><span className="mt-0.5 shrink-0 whitespace-nowrap rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">{step}</span><div className="min-w-0"><h3 className="text-lg font-extrabold text-slate-950">{title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p></div></div>;
}

function Field({ label, children, error, hint }: { label: string; children: React.ReactNode; error?: string; hint?: string }) {
    return <div className="min-w-0 space-y-2"><div className="flex items-end justify-between gap-3"><Label className="text-sm font-semibold text-slate-700">{label}</Label>{hint && !error && <span className="shrink-0 text-[10px] font-medium text-slate-400">{hint}</span>}</div>{children}{error && <p className="flex items-start gap-1.5 text-xs font-medium text-rose-600"><AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />{error}</p>}</div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
    return <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    return <div className="flex gap-3 rounded-xl border p-4"><span className="mt-0.5 text-slate-400">{icon}</span><div><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-medium text-slate-700">{value || '—'}</p></div></div>;
}
