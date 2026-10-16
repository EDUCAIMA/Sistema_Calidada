"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/app-context';
import { toast } from 'sonner';
import {
    Calendar, ChevronLeft, ChevronRight, ClipboardList, Download, Edit, Eye, Filter,
    Info, MoreVertical, Plus, Save, Search, Target, Trash2, User,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

type Lookup = { id: string; name?: string; title?: string; email?: string; code?: string; status?: string };
type Tracking = { id: string; date: string; note: string; progress: number; actual?: string | null };
type Objective = {
    id: string;
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
    responsibleId: string;
    deadline: string;
    evaluationFreq: string;
    communicationRecipients: string;
    communicationDate: string;
    communicationEvidence: string;
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
    responsibleId: '',
    deadline: '',
    evaluationFreq: '',
    communicationRecipients: '',
    communicationDate: '',
    communicationEvidence: '',
});

const toDateInput = (value?: string | null) => value ? new Date(value).toISOString().split('T')[0] : '';
const displayDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('es-CO') : '—';

export default function ObjetivosPage() {
    const { tenant } = useApp();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [policies, setPolicies] = useState<Lookup[]>([]);
    const [processes, setProcesses] = useState<Lookup[]>([]);
    const [users, setUsers] = useState<Lookup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');
    const [processFilter, setProcessFilter] = useState('TODOS');
    const [showFilters, setShowFilters] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formTab, setFormTab] = useState('alignment');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormState>(emptyForm());
    const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [trackingData, setTrackingData] = useState({ note: '', progress: 0, actual: '' });
    const [docMetadata, setDocMetadata] = useState({
        code: 'PLA-REG-001',
        version: '01',
        approvalDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (!tenant?.id) return;
        const loadData = async () => {
            setLoading(true);
            try {
                const query = `tenantId=${encodeURIComponent(tenant.id)}`;
                const [objectivesRes, policiesRes, processesRes, usersRes, metadataRes] = await Promise.all([
                    fetch(`/api/planificacion/objetivos?${query}`, { cache: 'no-store' }),
                    fetch(`/api/liderazgo/politicas?${query}`, { cache: 'no-store' }),
                    fetch(`/api/procesos?${query}`, { cache: 'no-store' }),
                    fetch(`/api/admin/users?${query}`, { cache: 'no-store' }),
                    fetch(`/api/formatos?${query}&moduleKey=6.2`, { cache: 'no-store' }),
                ]);
                const [objectiveData, policyData, processData, userData, metadata] = await Promise.all([
                    objectivesRes.json(), policiesRes.json(), processesRes.json(), usersRes.json(), metadataRes.json(),
                ]);
                if (!objectivesRes.ok) throw new Error(objectiveData.error || 'No fue posible cargar los objetivos.');
                setObjectives(objectiveData);
                setPolicies(Array.isArray(policyData) ? policyData : []);
                setProcesses(Array.isArray(processData) ? processData : []);
                setUsers(Array.isArray(userData) ? userData : []);
                if (metadata && !metadata.error) {
                    setDocMetadata({
                        code: metadata.code || 'PLA-REG-001',
                        version: metadata.version || '01',
                        approvalDate: metadata.approvalDate || new Date().toISOString().split('T')[0],
                    });
                }
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
        const matchesStatus = statusFilter === 'TODOS' || objective.status === statusFilter;
        const matchesProcess = processFilter === 'TODOS' || objective.processId === processFilter;
        return matchesTerm && matchesStatus && matchesProcess;
    }), [objectives, processFilter, searchTerm, statusFilter]);

    const openNew = () => {
        setEditingId(null);
        setFormData(emptyForm());
        setFormTab('alignment');
        setIsFormOpen(true);
    };

    const openEdit = (objective: Objective) => {
        setEditingId(objective.id);
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
            responsibleId: objective.responsibleId || '',
            deadline: toDateInput(objective.deadline),
            evaluationFreq: objective.evaluationFreq || '',
            communicationRecipients: objective.communicationRecipients || '',
            communicationDate: toDateInput(objective.communicationDate),
            communicationEvidence: objective.communicationEvidence || '',
        });
        setFormTab('alignment');
        setIsDetailOpen(false);
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        const required: Array<[keyof FormState, string]> = [
            ['policyId', 'Política'], ['processId', 'Proceso'], ['organizationalLevel', 'Nivel organizacional'],
            ['description', 'Descripción'], ['indicator', 'Indicador'], ['target', 'Meta'],
            ['applicableRequirements', 'Requisitos aplicables'], ['relevance', 'Relevancia'],
            ['resources', 'Recursos'], ['responsibleId', 'Responsable'], ['deadline', 'Fecha límite'],
            ['evaluationFreq', 'Frecuencia'], ['communicationRecipients', 'Destinatarios'],
            ['communicationDate', 'Fecha de comunicación'],
        ];
        const missing = required.filter(([key]) => !formData[key].trim()).map(([, label]) => label);
        if (missing.length) {
            const firstMissingKey = required.find(([key]) => !formData[key].trim())?.[0];
            if (firstMissingKey && ['description', 'indicator', 'target'].includes(firstMissingKey)) {
                setFormTab('measurement');
            } else if (firstMissingKey && ['resources', 'responsibleId', 'deadline', 'evaluationFreq', 'communicationRecipients', 'communicationDate'].includes(firstMissingKey)) {
                setFormTab('planning');
            } else {
                setFormTab('alignment');
            }
            toast.error(`Completa los campos obligatorios: ${missing.join(', ')}.`);
            return;
        }

        try {
            const response = await fetch('/api/planificacion/objetivos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingId, tenantId: tenant.id, ...formData }),
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
            toast.success(editingId ? 'Objetivo actualizado.' : 'Objetivo creado y documentado.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al guardar el objetivo.');
        }
    };

    const handleDelete = async (objective: Objective) => {
        if (!window.confirm(`¿Eliminar el objetivo “${objective.description}”? Esta acción también elimina su historial.`)) return;
        try {
            const response = await fetch(
                `/api/planificacion/objetivos?id=${encodeURIComponent(objective.id)}&tenantId=${encodeURIComponent(tenant.id)}`,
                { method: 'DELETE' },
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible eliminar el objetivo.');
            setObjectives((current) => current.filter((item) => item.id !== objective.id));
            toast.success('Objetivo eliminado.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al eliminar el objetivo.');
        }
    };

    const openDetail = (objective: Objective) => {
        setSelectedObjective(objective);
        setTrackingData({ note: '', progress: objective.progress || 0, actual: objective.actual || '' });
        setIsDetailOpen(true);
    };

    const handleSaveTracking = async () => {
        if (!selectedObjective || !trackingData.note.trim() || !trackingData.actual.trim()) {
            toast.error('El resultado actual y la nota de seguimiento son obligatorios.');
            return;
        }
        try {
            const response = await fetch('/api/planificacion/objetivos/tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ objectiveId: selectedObjective.id, tenantId: tenant.id, ...trackingData }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible guardar el seguimiento.');
            setObjectives((current) => current.map((item) => item.id === data.objective.id ? data.objective : item));
            setSelectedObjective(data.objective);
            setTrackingData({ note: '', progress: data.objective.progress, actual: data.objective.actual || '' });
            toast.success('Seguimiento registrado y estado actualizado.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al registrar el seguimiento.');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { label: string; className: string }> = {
            CUMPLIDO: { label: 'Cumplido', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            Logrado: { label: 'Cumplido', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            EN_RIESGO: { label: 'En riesgo', className: 'bg-amber-50 text-amber-700 border-amber-200' },
            'En Riesgo': { label: 'En riesgo', className: 'bg-amber-50 text-amber-700 border-amber-200' },
            ATRASADO: { label: 'Atrasado', className: 'bg-rose-50 text-rose-700 border-rose-200' },
            Retrasado: { label: 'Atrasado', className: 'bg-rose-50 text-rose-700 border-rose-200' },
            EN_PROGRESO: { label: 'En progreso', className: 'bg-blue-50 text-blue-700 border-blue-200' },
            'En progreso': { label: 'En progreso', className: 'bg-blue-50 text-blue-700 border-blue-200' },
        };
        const config = styles[status] || styles.EN_PROGRESO;
        return <Badge variant="outline" className={`${config.className} rounded-full px-3 py-1`}>{config.label}</Badge>;
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF('l', 'mm', 'letter');
        const tenantName = tenant?.name || 'SISTEMA DE GESTIÓN DE CALIDAD';
        doc.setFontSize(15).setFont('helvetica', 'bold');
        doc.text('MATRIZ DE OBJETIVOS DE CALIDAD — ISO 9001:2015, 6.2', 14, 16);
        doc.setFontSize(8).setFont('helvetica', 'normal');
        doc.text(`${tenantName} · Código ${docMetadata.code} · Versión ${docMetadata.version} · Aprobación ${docMetadata.approvalDate}`, 14, 22);
        autoTable(doc, {
            startY: 27,
            head: [['Objetivo', 'Política / proceso', 'Indicador / meta', 'Responsable', 'Plazo / evaluación', 'Actual / avance', 'Estado']],
            body: filteredObjectives.map((objective) => [
                objective.description,
                `${getPolicyName(objective.policyId)}\n${getProcessName(objective.processId)}`,
                `${objective.indicator}\nMeta: ${objective.target}`,
                objective.responsibleName || '—',
                `${displayDate(objective.deadline)}\n${objective.evaluationFreq || '—'}`,
                `${objective.actual || '—'}\n${objective.progress}%`,
                getStatusLabel(objective.status),
            ]),
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontSize: 7 },
            styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak' },
        });
        doc.save(`OBJETIVOS_CALIDAD_${tenantName.replace(/\s+/g, '_').toUpperCase()}.pdf`);
        toast.success('Matriz de objetivos descargada.');
    };

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" /></div>;
    }

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <div className="flex flex-col gap-5 border-b border-slate-100 bg-slate-50/40 px-8 py-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">6.2 Objetivos de <span className="text-blue-600">Calidad</span></h1>
                    <p className="mt-2 text-sm text-slate-500">Registro, planificación, comunicación y seguimiento conforme a 6.2.1 y 6.2.2.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 rounded-xl" onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4 text-red-500" />Descargar PDF</Button>
                    <Button className="h-11 rounded-xl bg-blue-600" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo objetivo</Button>
                </div>
            </div>

            <div className="space-y-4 bg-slate-50/50 px-8 py-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative max-w-xl flex-1">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input className="h-11 rounded-xl bg-white pl-11" placeholder="Buscar objetivo, indicador o responsable..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                    </div>
                    <Button variant="outline" className="h-11 rounded-xl" onClick={() => setShowFilters((value) => !value)}><Filter className="mr-2 h-4 w-4" />Filtros</Button>
                </div>
                {showFilters && (
                    <div className="grid max-w-3xl gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODOS">Todos los estados</SelectItem>
                                <SelectItem value="EN_PROGRESO">En progreso</SelectItem>
                                <SelectItem value="EN_RIESGO">En riesgo</SelectItem>
                                <SelectItem value="ATRASADO">Atrasado</SelectItem>
                                <SelectItem value="CUMPLIDO">Cumplido</SelectItem>
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
            </div>

            <div className="flex-1 px-8 pb-10">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
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
                                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openDetail(objective)}><Eye className="mr-2 h-4 w-4" />Seguimiento</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEdit(objective)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-rose-600" onClick={() => void handleDelete(objective)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!filteredObjectives.length && <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-500">No hay objetivos que coincidan con la búsqueda. Registre el primero desde “Nuevo objetivo”.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setFormTab('alignment'); }}>
                <DialogContent className="grid max-h-[92vh] min-w-0 w-[calc(100vw-1.5rem)] max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-5xl">
                    <DialogHeader className="min-w-0 border-b bg-slate-50/70 px-4 py-4 pr-10 sm:px-8 sm:py-5 sm:pr-14">
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                            <span className="shrink-0 rounded-xl bg-blue-100 p-2 text-blue-600 sm:p-2.5"><Target className="h-5 w-5 sm:h-6 sm:w-6" /></span>
                            <div className="min-w-0 space-y-1.5 text-left">
                                <DialogTitle className="break-words text-lg font-bold leading-tight text-slate-900 sm:text-2xl">{editingId ? 'Editar objetivo de calidad' : 'Planificar objetivo de calidad'}</DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm">Complete los tres pasos para documentar los requisitos de ISO 9001:2015.</DialogDescription>
                                <div className="flex flex-wrap gap-2 pt-1"><Badge variant="outline" className="bg-white text-[10px]">6.2.1 Objetivos</Badge><Badge variant="outline" className="bg-white text-[10px]">6.2.2 Planificación</Badge></div>
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs value={formTab} onValueChange={setFormTab} className="min-h-0 min-w-0 gap-0 overflow-hidden">
                        <div className="min-w-0 border-b bg-white px-2 py-3 sm:px-8">
                            <TabsList className="grid h-auto min-w-0 w-full grid-cols-3 bg-slate-100 p-1">
                                <TabsTrigger value="alignment" className="min-h-10 min-w-0 whitespace-normal px-1 text-[11px] sm:px-2 sm:text-sm"><span className="mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold shadow-sm sm:mr-1.5">1</span>Alineación</TabsTrigger>
                                <TabsTrigger value="measurement" className="min-h-10 min-w-0 whitespace-normal px-1 text-[11px] sm:px-2 sm:text-sm"><span className="mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold shadow-sm sm:mr-1.5">2</span>Medición</TabsTrigger>
                                <TabsTrigger value="planning" className="min-h-10 min-w-0 whitespace-normal px-1 text-[11px] leading-tight sm:px-2 sm:text-sm"><span className="mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold shadow-sm sm:mr-1.5">3</span>Plan y comunicación</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="min-h-0 min-w-0 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
                            <TabsContent value="alignment" className="m-0 min-w-0 space-y-5">
                                <StepHeading title="Alineación y alcance" description="Vincule el objetivo con la política, el proceso y los requisitos aplicables." />
                                <Field label="Política de calidad *"><Select value={formData.policyId} onValueChange={(value) => setFormData({ ...formData, policyId: value })}><SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar política vigente" /></SelectTrigger><SelectContent>{policies.filter((policy) => policy.status === 'VIGENTE').map((policy) => <SelectItem key={policy.id} value={policy.id}>{policy.title}</SelectItem>)}</SelectContent></Select></Field>
                                {!policies.some((policy) => policy.status === 'VIGENTE') && <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><Info className="mt-0.5 h-4 w-4 shrink-0" /><span>Para crear el objetivo debe registrar o aprobar primero una política con estado <b>VIGENTE</b>.</span></div>}
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="Proceso o función pertinente *"><Select value={formData.processId} onValueChange={(value) => setFormData({ ...formData, processId: value })}><SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar proceso" /></SelectTrigger><SelectContent>{processes.map((process) => <SelectItem key={process.id} value={process.id}>{getProcessName(process.id)}</SelectItem>)}</SelectContent></Select></Field>
                                    <Field label="Nivel organizacional *"><Select value={formData.organizationalLevel} onValueChange={(value) => setFormData({ ...formData, organizationalLevel: value })}><SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger><SelectContent>{['Organización', 'Proceso', 'Área', 'Cargo'].map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select></Field>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="Requisitos aplicables considerados *"><Textarea className="min-h-28 resize-none" value={formData.applicableRequirements} onChange={(event) => setFormData({ ...formData, applicableRequirements: event.target.value })} placeholder="Legales, reglamentarios, contractuales o del cliente..." /></Field>
                                    <Field label="Relevancia para la conformidad y el cliente *"><Textarea className="min-h-28 resize-none" value={formData.relevance} onChange={(event) => setFormData({ ...formData, relevance: event.target.value })} placeholder="Explique cómo contribuye el objetivo..." /></Field>
                                </div>
                            </TabsContent>

                            <TabsContent value="measurement" className="m-0 min-w-0 space-y-5">
                                <StepHeading title="Objetivo medible" description="Defina con claridad qué se logrará y cómo se comprobará el resultado." />
                                <Field label="¿Qué se va a lograr? *"><Textarea className="min-h-28 resize-none" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} placeholder="Ej.: Reducir las devoluciones por defectos..." /></Field>
                                <div className="grid gap-5 md:grid-cols-3">
                                    <Field label="Indicador *"><Input value={formData.indicator} onChange={(event) => setFormData({ ...formData, indicator: event.target.value })} placeholder="% devoluciones" /></Field>
                                    <Field label="Meta esperada *"><Input value={formData.target} onChange={(event) => setFormData({ ...formData, target: event.target.value })} placeholder="≤ 2%" /></Field>
                                    <Field label="Resultado actual"><Input value={formData.actual} onChange={(event) => setFormData({ ...formData, actual: event.target.value })} placeholder="4,5%" /></Field>
                                </div>
                                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-relaxed text-blue-900"><b>Sugerencia:</b> indique unidad, fórmula o fuente dentro del indicador y use la misma unidad en la meta y el resultado actual.</div>
                            </TabsContent>

                            <TabsContent value="planning" className="m-0 min-w-0 space-y-6">
                                <StepHeading title="Plan y comunicación" description="Asigne recursos, responsables, plazos, evaluación y evidencia de comunicación." />
                                <div className="grid gap-5 md:grid-cols-3">
                                    <Field label="Responsable *"><Select value={formData.responsibleId} onValueChange={(value) => setFormData({ ...formData, responsibleId: value })}><SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger><SelectContent>{users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}{user.email ? ` · ${user.email}` : ''}</SelectItem>)}</SelectContent></Select></Field>
                                    <Field label="Fecha límite *"><Input type="date" value={formData.deadline} onChange={(event) => setFormData({ ...formData, deadline: event.target.value })} /></Field>
                                    <Field label="Frecuencia de evaluación *"><Select value={formData.evaluationFreq} onValueChange={(value) => setFormData({ ...formData, evaluationFreq: value })}><SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar frecuencia" /></SelectTrigger><SelectContent>{['Mensual', 'Trimestral', 'Semestral', 'Anual'].map((frequency) => <SelectItem key={frequency} value={frequency}>{frequency}</SelectItem>)}</SelectContent></Select></Field>
                                </div>
                                <Field label="Recursos requeridos *"><Textarea className="min-h-24 resize-none" value={formData.resources} onChange={(event) => setFormData({ ...formData, resources: event.target.value })} placeholder="Personas, presupuesto, equipos, formación..." /></Field>
                                <div className="border-t pt-5">
                                    <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-600">Comunicación del objetivo</p>
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field label="Personas o grupos comunicados *"><Input value={formData.communicationRecipients} onChange={(event) => setFormData({ ...formData, communicationRecipients: event.target.value })} placeholder="Equipo comercial y producción" /></Field>
                                        <Field label="Fecha de comunicación *"><Input type="date" value={formData.communicationDate} onChange={(event) => setFormData({ ...formData, communicationDate: event.target.value })} /></Field>
                                    </div>
                                    <div className="mt-5"><Field label="Evidencia o ubicación del soporte"><Input value={formData.communicationEvidence} onChange={(event) => setFormData({ ...formData, communicationEvidence: event.target.value })} placeholder="Acta, correo, enlace o código documental" /></Field></div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <DialogFooter className="min-w-0 flex-row items-center justify-between gap-2 border-t bg-white px-4 py-3 sm:px-8 sm:py-4">
                        <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                        <div className="flex min-w-0 gap-2">
                            {formTab !== 'alignment' && <Button variant="outline" className="px-3 sm:px-4" onClick={() => setFormTab(formTab === 'planning' ? 'measurement' : 'alignment')}><ChevronLeft className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Anterior</span></Button>}
                            {formTab !== 'planning'
                                ? <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setFormTab(formTab === 'alignment' ? 'measurement' : 'planning')}>Siguiente<ChevronRight className="ml-1 h-4 w-4" /></Button>
                                : <Button className="bg-blue-600 px-3 hover:bg-blue-700 sm:px-4" onClick={() => void handleSave()}><Save className="mr-1 h-4 w-4 sm:mr-2" /><span className="sm:hidden">{editingId ? 'Actualizar' : 'Guardar'}</span><span className="hidden sm:inline">{editingId ? 'Actualizar objetivo' : 'Guardar objetivo'}</span></Button>}
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
                                <Detail icon={<User className="h-4 w-4" />} label="Responsable" value={selectedObjective.responsibleName} />
                                <Detail icon={<Calendar className="h-4 w-4" />} label="Fecha límite" value={displayDate(selectedObjective.deadline)} />
                                <Detail icon={<Calendar className="h-4 w-4" />} label="Próxima evaluación" value={`${displayDate(selectedObjective.nextEvaluationDate)} · ${selectedObjective.evaluationFreq || '—'}`} />
                                <Detail icon={<ClipboardList className="h-4 w-4" />} label="Recursos" value={selectedObjective.resources} />
                                <Detail icon={<ClipboardList className="h-4 w-4" />} label="Requisitos aplicables" value={selectedObjective.applicableRequirements} />
                                <Detail icon={<ClipboardList className="h-4 w-4" />} label="Relevancia" value={selectedObjective.relevance} />
                                <Detail icon={<ClipboardList className="h-4 w-4" />} label="Comunicación" value={`${selectedObjective.communicationRecipients || '—'} · ${displayDate(selectedObjective.communicationDate)}${selectedObjective.communicationEvidence ? ` · ${selectedObjective.communicationEvidence}` : ''}`} />
                            </FormSection>
                            <FormSection title="Nuevo seguimiento">
                                <div className="grid gap-4 sm:grid-cols-2"><Field label="Resultado actual *"><Input value={trackingData.actual} onChange={(event) => setTrackingData({ ...trackingData, actual: event.target.value })} placeholder="Ej.: 2,8%" /></Field><Field label="Progreso (0–100) *"><Input type="number" min="0" max="100" value={trackingData.progress} onChange={(event) => setTrackingData({ ...trackingData, progress: Number(event.target.value) })} /></Field></div>
                                <Field label="Análisis y evidencia *"><Textarea value={trackingData.note} onChange={(event) => setTrackingData({ ...trackingData, note: event.target.value })} placeholder="Resultado de la medición, análisis y acciones tomadas..." /></Field>
                                <Button className="bg-blue-600" onClick={() => void handleSaveTracking()}><Save className="mr-2 h-4 w-4" />Guardar seguimiento</Button>
                            </FormSection>
                            <FormSection title="Historial de seguimiento">
                                {selectedObjective.tracking.length ? selectedObjective.tracking.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{displayDate(item.date)}</span><Badge variant="outline">{item.progress}%</Badge></div><p className="text-sm font-semibold">Resultado: {item.actual || '—'}</p><p className="mt-1 text-sm text-slate-600">{item.note}</p></div>) : <p className="text-sm text-slate-500">Aún no hay mediciones registradas.</p>}
                            </FormSection>
                        </div>
                        <div className="flex gap-3 border-t pt-5"><Button variant="outline" className="flex-1" onClick={() => setIsDetailOpen(false)}>Cerrar</Button><Button className="flex-1" onClick={() => openEdit(selectedObjective)}><Edit className="mr-2 h-4 w-4" />Editar planificación</Button></div>
                    </>}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function getStatusLabel(status: string) {
    return ({ EN_PROGRESO: 'En progreso', EN_RIESGO: 'En riesgo', ATRASADO: 'Atrasado', CUMPLIDO: 'Cumplido' } as Record<string, string>)[status] || status;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return <section className="space-y-4"><h3 className="border-b pb-2 text-xs font-bold uppercase tracking-widest text-slate-700">{title}</h3>{children}</section>;
}

function StepHeading({ title, description }: { title: string; description: string }) {
    return <div className="space-y-1"><h3 className="text-lg font-bold text-slate-900">{title}</h3><p className="text-sm text-slate-500">{description}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div className="min-w-0 space-y-2"><Label className="text-sm font-semibold text-slate-700">{label}</Label>{children}</div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
    return <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    return <div className="flex gap-3 rounded-xl border p-4"><span className="mt-0.5 text-slate-400">{icon}</span><div><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-medium text-slate-700">{value || '—'}</p></div></div>;
}
