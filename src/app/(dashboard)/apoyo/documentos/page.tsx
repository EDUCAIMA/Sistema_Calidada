"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Download, Search, Filter, Eye,
    FileText, FileSpreadsheet, File, Clock, CheckCircle2, XCircle, AlertCircle,
    History, Settings2, FileCheck, Info,
    HelpCircle, ShieldAlert, Layers, BookOpen,
    FileSignature, LayoutGrid, Edit, Send, ShieldCheck, Loader2, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Document, DocumentStatus, DocumentType, Process } from '@/lib/types';
import { formatDocumentCode, type DocumentStandardConfig } from '@/lib/document-standard';
import { downloadStandardPdf } from '@/lib/document-pdf';
import { toast } from 'sonner';
import { useApp } from '@/context/app-context';

const statusConfig: Record<DocumentStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    BORRADOR: { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-600', icon: <Edit className="w-3 h-3" /> },
    EN_REVISION: { label: 'En Revisión', bg: 'bg-indigo-100', text: 'text-indigo-700', icon: <Clock className="w-3 h-3" /> },
    APROBADO: { label: 'Vigente', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    OBSOLETO: { label: 'Obsoleto', bg: 'bg-rose-100', text: 'text-rose-700', icon: <AlertCircle className="w-3 h-3" /> },
};

const typeLabels: Record<DocumentType, string> = {
    MANUAL: 'Manual', PROCEDIMIENTO: 'Procedimiento', INSTRUCTIVO: 'Instructivo',
    FORMATO: 'Formato', POLITICA: 'Política', GUIA: 'Guía', REGISTRO: 'Registro', OTRO: 'Otro',
};

interface DocumentForm {
    id?: string;
    code?: string;
    name?: string;
    type: DocumentType;
    documentTypeId?: string;
    status: DocumentStatus;
    processId: string;
    medio: 'DIGITAL' | 'FISICO';
    version: number;
    autor: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
}

export default function DocumentosPage() {
    const { tenant } = useApp();
    return <DocumentosContent key={tenant.id} />;
}

function DocumentosContent() {
    const { tenant, currentUser } = useApp();
    
    // States FIRST
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loadingDocuments, setLoadingDocuments] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [showNew, setShowNew] = useState(false);
    const [showISOInfo, setShowISOInfo] = useState(false);
    
    const [standard, setStandard] = useState<DocumentStandardConfig | null>(null);
    const [standardError, setStandardError] = useState('');
    const [pdfBusy, setPdfBusy] = useState(false);
    const [processes, setProcesses] = useState<Process[]>([]);
    const [newDoc, setNewDoc] = useState<DocumentForm>({
        type: 'PROCEDIMIENTO', 
        status: 'BORRADOR',
        processId: '',
        medio: 'DIGITAL',
        version: 1,
        autor: currentUser?.name || 'Sistema'
    });
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
    const [workflowDoc, setWorkflowDoc] = useState<Document | null>(null);
    const [workflowAction, setWorkflowAction] = useState<'APPROVE' | 'CHANGES'>('APPROVE');
    const [workflowNote, setWorkflowNote] = useState('');
    const [workflowBusy, setWorkflowBusy] = useState(false);
    const canApprove = currentUser?.role === 'ADMIN_EMPRESA' || currentUser?.role === 'SUPER_ADMIN';
    const canWrite = canApprove || currentUser?.role === 'USUARIO';
    const activeTypes = standard?.documentTypes.filter(type => type.active) || [];

    useEffect(() => {
        if (!tenant?.id) return;
        const controller = new AbortController();
        const fetchDocuments = async () => {
            setLoadingDocuments(true);
            try {
                const response = await fetch(`/api/apoyo/documentos?tenantId=${encodeURIComponent(tenant.id)}`, { signal: controller.signal, cache: 'no-store' });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'No fue posible cargar los documentos.');
                setDocuments(data);
            } catch (error) {
                if (controller.signal.aborted) return;
                toast.error(error instanceof Error ? error.message : 'No fue posible cargar los documentos.');
            } finally {
                if (!controller.signal.aborted) setLoadingDocuments(false);
            }
        };
        fetchDocuments();
        return () => controller.abort();
    }, [tenant?.id]);

    useEffect(() => {
        if (!tenant.id) return;
        let cancelled = false;
        setStandard(null);
        setStandardError('');
        fetch('/api/document-standard?tenantId=' + encodeURIComponent(tenant.id))
            .then(async response => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'No fue posible cargar los tipos documentales.');
                if (data.tenant?.id !== tenant.id) throw new Error('El estándar no corresponde a esta empresa.');
                if (!cancelled) setStandard(data.config);
            })
            .catch(error => { if (!cancelled) setStandardError(error instanceof Error ? error.message : 'No fue posible cargar el estándar.'); });
        return () => { cancelled = true; };
    }, [tenant.id]);

    useEffect(() => {
        if (!tenant.id) return;
        const controller = new AbortController();
        const fetchProcesses = async () => {
            try {
                const res = await fetch(`/api/procesos?tenantId=${encodeURIComponent(tenant.id)}`, { signal: controller.signal });
                const data = await res.json();
                if (data && !data.error) {
                    setProcesses(data);
                    
                    if (data.length > 0) {
                        setNewDoc(prev => prev.processId ? prev : { ...prev, processId: data[0].id });
                    }
                }
            } catch (error) { 
                if (controller.signal.aborted) return;
                console.error('Error fetching processes:', error); 
            }
        };
        fetchProcesses();
        return () => controller.abort();
    }, [tenant.id]);

    const filtered = useMemo(() => {
        return documents.filter(d => {
            const matchSearch = !search || `${d.name} ${d.code} ${d.processName || ''}`.toLowerCase().includes(search.toLowerCase());
            const matchType = filterType === 'ALL' || (d.documentTypeId || d.type) === filterType;
            return matchSearch && matchType;
        });
    }, [documents, search, filterType]);

    function getFileIcon(name?: string) {
        if (!name) return <File className="h-4 w-4 text-muted-foreground" />;
        if (name.endsWith('.pdf')) return <FileText className="h-4 w-4 text-rose-500" />;
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
        return <FileText className="h-4 w-4 text-blue-600" />;
    }

    const replaceDocument = (document: Document, supersededIds: string[] = []) => {
        const superseded = new Set(supersededIds);
        setDocuments(current => current.map(item => {
            if (item.id === document.id) return document;
            if (superseded.has(item.id)) return { ...item, status: 'OBSOLETO' as const };
            return item;
        }));
        setSelectedDoc(current => current?.id === document.id ? document : current);
    };

    const resetDocumentForm = () => {
        setEditingDocumentId(null);
        const defaultType = activeTypes.find(type => type.baseType === 'PROCEDIMIENTO') || activeTypes[0];
        setNewDoc({
            type: defaultType?.baseType || 'PROCEDIMIENTO',
            documentTypeId: defaultType?.id,
            status: 'BORRADOR',
            processId: processes[0]?.id || '',
            medio: 'DIGITAL',
            version: 1,
            autor: currentUser?.name || 'Sistema',
        });
    };

    const openNewDocument = () => {
        resetDocumentForm();
        setShowNew(true);
    };

    const openEditDocument = (document: Document) => {
        if (document.status !== 'BORRADOR') return;
        setEditingDocumentId(document.id);
        setNewDoc({
            id: document.id,
            code: document.code,
            name: document.name,
            type: document.type,
            documentTypeId: document.documentTypeId || undefined,
            status: document.status,
            processId: document.processId || '',
            medio: 'DIGITAL',
            version: document.currentVersion,
            autor: document.createdByName || document.author || currentUser?.name || 'Sistema',
            fileUrl: document.fileUrl,
            fileName: document.fileName,
            fileSize: document.fileSize,
        });
        setShowNew(true);
    };

    const handleSaveDocument = async () => {
        if (!tenant?.id || !newDoc.name?.trim() || !newDoc.processId || (!editingDocumentId && !newDoc.documentTypeId)) {
            toast.error('Complete el proceso, el nombre y el tipo documental.');
            return;
        }
        setWorkflowBusy(true);
        try {
            const process = processes.find(item => item.id === newDoc.processId);
            const response = await fetch('/api/apoyo/documentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingDocumentId || undefined,
                    tenantId: tenant.id,
                    code: newDoc.code,
                    name: newDoc.name,
                    type: newDoc.type,
                    documentTypeId: newDoc.documentTypeId,
                    processId: newDoc.processId,
                    processName: process?.name,
                    currentVersion: Number(newDoc.version) || 1,
                    fileUrl: newDoc.fileUrl,
                    fileName: newDoc.fileName,
                    fileSize: newDoc.fileSize,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible guardar el documento.');

            if (editingDocumentId) {
                replaceDocument(data);
                toast.success('Borrador actualizado.');
            } else {
                setDocuments(current => [data, ...current]);
                toast.success('Documento creado como borrador.');
            }
            setShowNew(false);
            resetDocumentForm();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No fue posible guardar el documento.');
        } finally {
            setWorkflowBusy(false);
        }
    };

    const handleSubmitForReview = async (document: Document) => {
        if (!tenant?.id) return;
        setWorkflowBusy(true);
        try {
            const response = await fetch(`/api/apoyo/documentos/${document.id}/enviar-revision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: tenant.id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible enviar el documento a revisión.');
            replaceDocument(data);
            toast.success('Documento enviado a revisión.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No fue posible enviar el documento a revisión.');
        } finally {
            setWorkflowBusy(false);
        }
    };

    const openWorkflow = (document: Document, action: 'APPROVE' | 'CHANGES') => {
        setWorkflowDoc(document);
        setWorkflowAction(action);
        setWorkflowNote('');
    };

    const handleWorkflowDecision = async () => {
        if (!tenant?.id || !workflowDoc) return;
        if (workflowAction === 'CHANGES' && !workflowNote.trim()) {
            toast.error('Indique los ajustes requeridos.');
            return;
        }
        setWorkflowBusy(true);
        try {
            const endpoint = workflowAction === 'APPROVE' ? 'aprobar' : 'solicitar-ajustes';
            const response = await fetch(`/api/apoyo/documentos/${workflowDoc.id}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: tenant.id, note: workflowNote }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible completar la decisión.');

            if (workflowAction === 'APPROVE') {
                replaceDocument(data.document, data.supersededDocumentIds || []);
                toast.success('Documento aprobado y puesto en vigencia.');
            } else {
                replaceDocument(data);
                toast.success('Documento devuelto a borrador con observaciones.');
            }
            setWorkflowDoc(null);
            setWorkflowNote('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No fue posible completar la decisión.');
        } finally {
            setWorkflowBusy(false);
        }
    };

    const handleCreateVersion = async (document: Document) => {
        if (!tenant?.id) return;
        setWorkflowBusy(true);
        try {
            const response = await fetch('/api/apoyo/documentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: tenant.id,
                    code: document.code,
                    name: document.name,
                    type: document.type,
                    documentTypeId: document.documentTypeId || undefined,
                    processId: document.processId,
                    processName: document.processName,
                    currentVersion: document.currentVersion + 1,
                    fileUrl: document.fileUrl,
                    fileName: document.fileName,
                    fileSize: document.fileSize,
                    sourceDocumentId: document.id,
                    changeDescription: `Nueva versión basada en la versión ${document.currentVersion}.`,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible crear la nueva versión.');
            setDocuments(current => [data, ...current]);
            setSelectedDoc(data);
            toast.success(`Versión ${data.currentVersion} creada como borrador.`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No fue posible crear la nueva versión.');
        } finally {
            setWorkflowBusy(false);
        }
    };

    const eventLabel = (action: string) => ({
        CREATED: 'Documento creado como borrador',
        NEW_VERSION_CREATED: 'Nueva versión creada',
        SUBMITTED_FOR_REVIEW: 'Enviado a revisión',
        APPROVED: 'Aprobado y puesto en vigencia',
        CHANGES_REQUESTED: 'Devuelto para ajustes',
        SUPERSEDED: 'Versión sustituida',
    }[action] || action.replaceAll('_', ' '));

    const downloadDocumentPdf = async (document?: Document) => {
        setPdfBusy(true);
        try {
            const dateLabel = (date?: Date | string) => date ? new Date(date).toLocaleDateString('es-CO') : 'Pendiente';
            await downloadStandardPdf({
                tenantId: tenant.id,
                moduleKey: '7.5',
                title: document ? `Ficha documental: ${document.name}` : 'Listado maestro de documentos',
                filename: document ? `Ficha_${document.code}_v${document.currentVersion}.pdf` : 'Listado_maestro_documentos.pdf',
                orientation: document ? 'portrait' : 'landscape',
                metadata: document ? {
                    code: document.code,
                    version: String(document.currentVersion),
                    status: document.status,
                    approvalDate: document.approvedDate ? new Date(document.approvedDate).toISOString() : undefined,
                    approvedBy: document.approvedByName,
                } : undefined,
                sections: document ? [
                    { title: 'Identificación y control', head: ['Campo', 'Información'], rows: [
                        ['Título', document.name], ['Código', document.code],
                        ['Tipo documental', document.documentTypeName || typeLabels[document.type]],
                        ['Proceso', document.processName || 'General'], ['Versión', document.currentVersion],
                        ['Estado', statusConfig[document.status].label],
                        ['Elaborado por', document.createdByName || document.author || 'No registrado'],
                        ['Creación', dateLabel(document.createdAt)],
                        ['Enviado a revisión por', document.submittedByName || 'Pendiente'],
                        ['Fecha de envío', dateLabel(document.submittedAt)],
                        ['Aprobado por', document.approvedByName || 'Pendiente'],
                        ['Fecha de aprobación', dateLabel(document.approvedDate)],
                        ['Próxima revisión', dateLabel(document.nextReviewDate)],
                        ['Archivo original', document.fileName || 'Sin archivo adjunto'],
                    ] },
                    { title: 'Historial documental', head: ['Fecha', 'Acción', 'Responsable', 'Observación'],
                        rows: (document.approvalEvents || []).map(event => [dateLabel(event.createdAt), eventLabel(event.action), event.userName, event.note || '—']) },
                    { text: 'Esta ficha resume la identificación y trazabilidad del registro. No sustituye el contenido del archivo original adjunto, que conserva su formato.' },
                ] : [
                    { text: `Documentos incluidos: ${filtered.length}. Filtros: ${search || 'sin texto de búsqueda'}; tipo: ${filterType === 'ALL' ? 'todos' : standard?.documentTypes.find(type => type.id === filterType)?.name || typeLabels[filterType as DocumentType] || filterType}.` },
                    { head: ['Código', 'Documento', 'Tipo', 'Proceso', 'Versión', 'Estado', 'Aprobación'],
                        rows: filtered.map(item => [item.code, item.name, item.documentTypeName || typeLabels[item.type], item.processName || 'General', item.currentVersion, statusConfig[item.status].label, dateLabel(item.approvedDate)]) },
                ],
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No fue posible generar el PDF.');
        } finally {
            setPdfBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] -m-6 p-8 font-sans text-slate-900 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase">Información Documentada</h1>
                        <button
                            onClick={() => setShowISOInfo(true)}
                            className="p-1.5 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-all active:scale-95"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Cláusula 7.5</span>
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Control Documental</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button asChild variant="outline"><Link href="/apoyo/estandar-documental"><Settings2 className="mr-2 h-4 w-4" /> Estándar documental</Link></Button>
                    <Button variant="outline" disabled={pdfBusy || loadingDocuments} onClick={() => void downloadDocumentPdf()} className="flex items-center gap-2 px-4 py-2 bg-white border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs transition-all shadow-sm h-10">
                        {pdfBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Listado PDF
                    </Button>
                    <Button onClick={openNewDocument} disabled={!canWrite || !standard} className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-black font-bold text-xs shadow-lg transition-all h-10 uppercase tracking-wider">
                        <Plus className="w-4 h-4" /> Nuevo Documento
                    </Button>
                </div>
            </div>

            {standardError && <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{standardError} Los documentos existentes siguen disponibles; recargue para crear nuevos registros con la codificación corporativa.</p>}
            {/* Document Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Vigentes', value: documents.filter(d => d.status === 'APROBADO').length, sub: 'Listado Maestro', icon: <FileCheck className="w-5 h-5"/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'En Revisión', value: documents.filter(d => d.status === 'EN_REVISION').length, sub: 'Pendientes Ajuste', icon: <Clock className="w-5 h-5"/>, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Macroprocesos', value: processes.length, sub: 'Sincronizados', icon: <Layers className="w-5 h-5"/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Obsoletos', value: documents.filter(d => d.status === 'OBSOLETO').length, sub: 'Históricos', icon: <XCircle className="w-5 h-5"/>, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className={cn("p-2 rounded-xl", stat.bg, stat.color)}>{stat.icon}</div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                             <div className="text-3xl font-black text-slate-800">{stat.value}</div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            <Tabs defaultValue="listado" className="space-y-6">
                <TabsList className="bg-white p-1.5 border border-slate-200 h-auto flex flex-wrap gap-1.5 justify-start rounded-xl shadow-sm">
                    <TabsTrigger value="generalidades" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all rounded-lg"><Info className="w-4 h-4" /> 7.5.1 Generalidades</TabsTrigger>
                    <TabsTrigger value="estandarizacion" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all rounded-lg"><Settings2 className="w-4 h-4" /> 7.5.2 Estandarización</TabsTrigger>
                    <TabsTrigger value="listado" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all rounded-lg"><LayoutGrid className="w-4 h-4" /> 7.5.2 Listado Maestro</TabsTrigger>
                    <TabsTrigger value="control" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all rounded-lg"><ShieldAlert className="w-4 h-4" /> 7.5.3 Control (TI)</TabsTrigger>
                </TabsList>

                {/* 7.5.2 LISTADO MAESTRO (Principal) */}
                <TabsContent value="listado" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {selectedDoc ? (
                        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
                            {/* A. CABECERA (IDENTIFICACIÓN RÁPIDA) - Mobile/Side Logic */}
                            <div className="flex-1 flex flex-col border-r border-slate-100">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-400 text-xs tracking-tighter uppercase">{selectedDoc.code}</span>
                                            <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none", statusConfig[selectedDoc.status || 'BORRADOR'].bg, statusConfig[selectedDoc.status || 'BORRADOR'].text)}>
                                                {statusConfig[selectedDoc.status || 'BORRADOR'].icon} {statusConfig[selectedDoc.status || 'BORRADOR'].label}
                                            </Badge>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedDoc.name}</h2>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Versión Actual: {selectedDoc.currentVersion} | Creado por: {selectedDoc.createdByName || selectedDoc.author || 'Sistema'}</p>
                                    </div>
                                    <Button variant="ghost" onClick={() => setSelectedDoc(null)} className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"><XCircle className="w-5 h-5 text-slate-300" /></Button>
                                </div>

                                {/* B. CUERPO CENTRAL (VISUALIZACIÓN) */}
                                <div className="flex-1 p-0 bg-slate-200/50 flex items-center justify-center relative">
                                    <div className="bg-white w-[90%] h-[90%] shadow-2xl rounded-lg border border-slate-300 flex flex-col overflow-hidden">
                                        <div className="bg-slate-800 p-2 flex items-center justify-between text-white/50">
                                            <div className="flex items-center gap-4 ml-4">
                                                <div className="flex items-center gap-1"><FileText className="w-3 h-3"/> <span className="text-[10px] font-bold">Ficha de identificación documental</span></div>
                                            </div>
                                            <div className="flex items-center gap-2 mr-2">
                                                <Button variant="ghost" disabled={pdfBusy} onClick={() => void downloadDocumentPdf(selectedDoc)} className="h-6 text-white text-[10px] hover:bg-white/10 uppercase font-black">Descargar ficha PDF</Button>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                                            <FileSignature className="w-20 h-20 text-slate-100" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{selectedDoc.documentTypeName || typeLabels[selectedDoc.type]}</p>
                                            <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                                <p className="text-slate-700 text-sm font-semibold">{selectedDoc.name}</p>
                                                <p className="mt-3 text-slate-500 text-sm">{selectedDoc.fileName ? `Archivo adjunto: ${selectedDoc.fileName}` : 'Este registro aún no tiene un archivo original adjunto.'}</p>
                                                <p className="mt-3 text-xs text-slate-500">La ficha PDF usa el encabezado corporativo y contiene la identificación e historial. El archivo original mantiene su formato.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Flujo real de estados */}
                                    <div className="absolute bottom-6 right-6">
                                        <Card className="shadow-2xl border-none px-3 py-2 bg-white/90 backdrop-blur rounded-2xl">
                                            <div className="mb-1 flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                                                <span>Borrador</span><span>Revisión</span><span>Vigente</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {(['BORRADOR', 'EN_REVISION', 'APROBADO'] as DocumentStatus[]).map((status, index) => {
                                                    const currentIndex = selectedDoc.status === 'OBSOLETO'
                                                        ? 2
                                                        : ['BORRADOR', 'EN_REVISION', 'APROBADO'].indexOf(selectedDoc.status);
                                                    return (
                                                        <div key={status} className={cn(
                                                            "h-2 w-14 rounded-full",
                                                            index <= currentIndex
                                                                ? selectedDoc.status === 'OBSOLETO' ? 'bg-rose-400' : 'bg-emerald-500'
                                                                : 'bg-slate-200'
                                                        )} title={status}></div>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>

                            {/* C. PANEL LATERAL (TRAZABILIDAD) */}
                            <div className="w-full md:w-[350px] bg-white flex flex-col">
                                <ScrollArea className="flex-1 p-6">
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Trazabilidad ISO (7.5.3)</h3>
                                    
                                    <div className="space-y-8">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                                                <History className="w-3 h-3 text-indigo-500" /> Historial de aprobación
                                            </p>
                                            <div className="space-y-4 border-l-2 border-slate-100 ml-1.5 pl-4">
                                                {(selectedDoc.approvalEvents || []).map(event => (
                                                    <div className="relative" key={event.id}>
                                                        <div className={cn(
                                                            "absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ring-4",
                                                            event.action === 'APPROVED' ? 'bg-emerald-500 ring-emerald-50' :
                                                            event.action === 'CHANGES_REQUESTED' ? 'bg-amber-500 ring-amber-50' :
                                                            event.action === 'SUPERSEDED' ? 'bg-rose-500 ring-rose-50' : 'bg-indigo-500 ring-indigo-50'
                                                        )}></div>
                                                        <p className="text-[11px] font-black text-slate-800">{eventLabel(event.action)}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                            {new Date(event.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })} — {event.userName}
                                                        </p>
                                                        {event.note && <p className="text-[10px] text-slate-500 mt-1 leading-tight italic">“{event.note}”</p>}
                                                    </div>
                                                ))}
                                                {(selectedDoc.approvalEvents || []).length === 0 && (
                                                    <p className="text-[10px] italic text-slate-400">Sin eventos registrados.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <p className="text-[10px] font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                                                <FileSignature className="w-3 h-3 text-emerald-500" /> Firma Electrónica (Log)
                                            </p>
                                            <div className="p-4 bg-slate-50 rounded-2xl space-y-3 font-mono">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Aprobado por:</p>
                                                    <p className="text-[10px] font-black text-slate-800 truncate">{selectedDoc.approvedByName || 'Pendiente de aprobación'}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Fecha:</p>
                                                        <p className="text-[10px] font-black text-slate-800">{selectedDoc.approvedDate ? new Date(selectedDoc.approvedDate).toLocaleDateString('es-CO') : '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Versión:</p>
                                                        <p className="text-[10px] font-black text-slate-800">{selectedDoc.currentVersion}</p>
                                                    </div>
                                                </div>
                                                <div className="pt-2 border-t border-slate-200">
                                                    <Badge className={cn(
                                                        "text-[8px] border-none font-black shadow-none tracking-tighter uppercase px-1 h-4",
                                                        selectedDoc.status === 'APROBADO' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-700'
                                                    )}>{selectedDoc.status === 'APROBADO' ? 'APROBACIÓN VERIFICADA' : 'APROBACIÓN PENDIENTE'}</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 space-y-3">
                                            {selectedDoc.status === 'BORRADOR' && canWrite && (
                                                <>
                                                    <Button onClick={() => openEditDocument(selectedDoc)} variant="outline" disabled={workflowBusy} className="w-full h-11 border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50">
                                                        <Edit className="mr-2 h-3.5 w-3.5" /> Editar borrador
                                                    </Button>
                                                    <Button onClick={() => handleSubmitForReview(selectedDoc)} disabled={workflowBusy} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg">
                                                        {workflowBusy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />} Enviar a revisión
                                                    </Button>
                                                </>
                                            )}
                                            {selectedDoc.status === 'EN_REVISION' && canApprove && (
                                                <>
                                                    <Button onClick={() => openWorkflow(selectedDoc, 'CHANGES')} variant="outline" disabled={workflowBusy} className="w-full h-11 border-amber-200 text-amber-700 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-amber-50">
                                                        <RotateCcw className="mr-2 h-3.5 w-3.5" /> Solicitar ajustes
                                                    </Button>
                                                    <Button onClick={() => openWorkflow(selectedDoc, 'APPROVE')} disabled={workflowBusy} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg">
                                                        <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Aprobar y publicar
                                                    </Button>
                                                </>
                                            )}
                                            {selectedDoc.status === 'EN_REVISION' && !canApprove && (
                                                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-[10px] font-bold leading-relaxed text-indigo-800">
                                                    Pendiente de decisión por un administrador de la empresa.
                                                </div>
                                            )}
                                            {canWrite && (selectedDoc.status === 'APROBADO' || selectedDoc.status === 'OBSOLETO') && (
                                                <Button onClick={() => handleCreateVersion(selectedDoc)} disabled={workflowBusy} variant="outline" className="w-full h-11 border-indigo-200 text-indigo-700 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-indigo-50">
                                                    {workflowBusy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />} Crear nueva versión
                                                </Button>
                                            )}
                                            <Button onClick={() => void downloadDocumentPdf(selectedDoc)} disabled={pdfBusy} variant="outline" className="w-full">
                                                {pdfBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} Descargar ficha PDF
                                            </Button>
                                            <Button
                                                disabled={!selectedDoc.fileUrl}
                                                onClick={() => selectedDoc.fileUrl && window.open(selectedDoc.fileUrl, '_blank', 'noopener,noreferrer')}
                                                className="w-full h-11 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg"
                                            >
                                                <Download className="mr-2 h-3.5 w-3.5" /> {selectedDoc.fileUrl ? 'Descargar original' : 'Sin archivo adjunto'}
                                            </Button>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                <div className="relative flex-1 w-full max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar código, nombre o proceso..."
                                        className="pl-10 h-10 border-slate-200 bg-slate-50/50 rounded-xl text-sm"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                     <Select value={filterType} onValueChange={setFilterType}>
                                        <SelectTrigger className="w-44 border-slate-200 bg-white h-10 rounded-xl font-bold uppercase text-[10px] tracking-widest"><SelectValue placeholder="TIPO DOCUMENTO" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">TODOS</SelectItem>
                                            {(standard?.documentTypes || []).map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}
                                            {Object.entries(typeLabels).filter(([id]) => !standard?.documentTypes.some(type => type.id === id)).map(([id, label]) => <SelectItem key={id} value={id}>{label} (histórico)</SelectItem>)}

                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" title="Limpiar filtros" aria-label="Limpiar filtros" onClick={() => { setSearch(''); setFilterType('ALL'); }} className="h-10 w-10 p-0 border-slate-200 bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><Filter className="w-4 h-4"/></Button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                                            <TableHead className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Código</TableHead>
                                            <TableHead className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Documento / Tipo</TableHead>
                                            <TableHead className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Macroproceso</TableHead>
                                            <TableHead className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ver.</TableHead>
                                            <TableHead className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</TableHead>
                                            <TableHead className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Detalle</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingDocuments && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-sm font-bold text-slate-400">
                                                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Cargando documentos...
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {filtered.map(doc => (
                                            <TableRow key={doc.id} className="hover:bg-slate-50 transition-colors border-slate-100 group">
                                                <TableCell className="px-6 py-4 border-r border-slate-100 font-black text-slate-400 tracking-tighter text-xs font-mono">{doc.code}</TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors border border-slate-100">{getFileIcon(doc.fileName)}</div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 text-sm leading-tight group-hover:text-blue-600 transition-colors">{doc.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{doc.documentTypeName || typeLabels[doc.type]}</span>

                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-slate-200 px-2 py-0.5 whitespace-nowrap">{doc.processName || 'GENERAL'}</Badge>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center font-black text-slate-500">{doc.currentVersion}</TableCell>
                                                <TableCell className="px-6 py-4">
                                                    {doc.status && (
                                                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none", statusConfig[doc.status].bg, statusConfig[doc.status].text)}>
                                                            {statusConfig[doc.status].label}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-right">
                                                    <Button onClick={() => setSelectedDoc(doc)} variant="ghost" className="h-8 group-hover:bg-indigo-50 group-hover:text-indigo-600 text-slate-400 transition-all rounded-lg font-black uppercase text-[10px] tracking-widest">Ver Flujo ➔</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!loadingDocuments && filtered.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-sm font-bold text-slate-400">
                                                    No hay documentos para los filtros seleccionados.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="estandarizacion" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Estándar documental corporativo</CardTitle><CardDescription>El logo, encabezado, pie de página, tipos y códigos se administran en un único lugar para esta empresa.</CardDescription></CardHeader>
                        <CardContent className="space-y-5">
                            <Button asChild><Link href="/apoyo/estandar-documental"><Settings2 className="mr-2 h-4 w-4" /> Abrir estándar documental</Link></Button>
                            {standard && <><p className="text-sm text-muted-foreground">Ejemplo de codificación: <strong className="font-mono">{formatDocumentCode(standard, standard.documentTypes.find(type => type.active)?.prefix || 'FO', 1)}</strong>. El consecutivo definitivo se asigna al guardar, sin cambiar códigos históricos.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{standard.documentTypes.map(type => <div key={type.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">{type.name}</p><p className="text-xs text-muted-foreground">{typeLabels[type.baseType]} · {type.active ? 'Activo' : 'Inactivo'}</p></div><Badge variant="outline">{type.prefix}</Badge></div>)}</div></>}
                            <p className="text-sm text-muted-foreground">Los PDF generados usan el estándar corporativo. Los archivos originales adjuntos no se modifican; su ficha PDF identifica el documento, su versión y su trazabilidad.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 7.5.1 GENERALIDADES */}
                <TabsContent value="generalidades" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 bg-blue-50/50 border-2 border-blue-100 rounded-3xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-4 flex items-center gap-3">
                                    <BookOpen className="w-6 h-6"/> Información Exigida
                                </h3>
                                <p className="text-sm text-blue-700/80 leading-relaxed font-medium mb-6">
                                    La extensión de la información documentada del SGC puede variar en función del tamaño de la organización, la complejidad de los procesos y la competencia de las personas.
                                </p>
                                <ul className="space-y-3">
                                    {['Alcance del SGC (4.3)', 'Operación de procesos (4.4)', 'Política y Objetivos (5.2/6.2)', 'Evidencia de Competencia (7.2)'].map(i => (
                                        <li key={i} className="flex items-center gap-3 text-xs font-black text-blue-600 uppercase tracking-tight">
                                            <CheckCircle2 className="w-4 h-4"/> {i}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900 text-white rounded-3xl shadow-2xl flex flex-col justify-center">
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic">7.5.2 Creación y Actualización</h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white"><FileSignature className="w-5 h-5"/></div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-slate-400 mb-1">Identificación</p>
                                        <p className="text-sm font-medium text-slate-300">Cada recurso posee un título, código, fecha y autor responsable.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white"><Eye className="w-5 h-5"/></div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-slate-400 mb-1">Revisión y Aprobación</p>
                                        <p className="text-sm font-medium text-slate-300">El flujo garantiza que la información sea idónea antes de su publicación.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* 7.5.3 CONTROL (Stub) */}
                <TabsContent value="control" className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <ShieldAlert className="w-16 h-16 mx-auto mb-6 text-slate-200" />
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Control de la Información Documentada</h3>
                        <p className="text-sm text-slate-500 font-medium max-w-xl mx-auto mb-8">
                            Aseguramos la disponibilidad, distribución, acceso, recuperación y almacenamiento bajo estrictos criterios de seguridad y control de cambios (7.5.3.1 y 7.5.3.2).
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button className="bg-slate-900 font-black uppercase text-[10px] tracking-widest h-12 px-10 rounded-xl">Matriz de Distribución</Button>
                            <Button variant="outline" className="border-slate-200 font-black uppercase text-[10px] tracking-widest h-12 px-10 rounded-xl">Copias Controladas</Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ISO Info Dialog */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden flex flex-col p-0 gap-0 font-sans">
                    <header className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">7.5 Información Documentada</h1>
                        </div>
                    </header>
                    <div className="px-6 pt-4 pb-8 space-y-6 bg-white overflow-y-auto max-h-[60vh]">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                            <h3 className="font-black text-slate-900 uppercase text-xs mb-4">7.5.3 Control de la Información Documentada</h3>
                            <p className="text-lg text-gray-800 leading-relaxed italic mb-6">
                                La organización <strong className="font-black text-gray-900 not-italic uppercase">debe</strong> controlar la información para asegurarse de:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700 font-medium">
                                <div className="flex gap-3 items-start"><span className="h-2 w-2 rounded-full bg-slate-900 mt-2 flex-shrink-0"></span> Disponibilidad e idoneidad para su uso.</div>
                                <div className="flex gap-3 items-start"><span className="h-2 w-2 rounded-full bg-slate-900 mt-2 flex-shrink-0"></span> Protección adecuada (pérdida de confidencialidad).</div>
                                <div className="flex gap-3 items-start"><span className="h-2 w-2 rounded-full bg-slate-900 mt-2 flex-shrink-0"></span> Distribución, acceso, recuperación y uso.</div>
                                <div className="flex gap-3 items-start"><span className="h-2 w-2 rounded-full bg-slate-900 mt-2 flex-shrink-0"></span> Almacenamiento y preservación.</div>
                                <div className="flex gap-3 items-start"><span className="h-2 w-2 rounded-full bg-slate-900 mt-2 flex-shrink-0"></span> Control de cambios (control de versiones).</div>
                                <div className="flex gap-3 items-start"><span className="h-2 w-2 rounded-full bg-slate-900 mt-2 flex-shrink-0"></span> Retención y disposición.</div>
                            </div>
                        </div>
                    </div>
                    <footer className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end items-center">
                        <Button onClick={() => setShowISOInfo(false)} className="bg-slate-900 hover:bg-black text-white font-black py-3 px-10 rounded shadow-md h-auto uppercase tracking-wider text-xs">Entendido</Button>
                    </footer>
                </DialogContent>
            </Dialog>

            {/* NEW RECORD MODAL REDESIGN 7.5.2 */}
            <Dialog open={showNew} onOpenChange={open => {
                if (!workflowBusy) {
                    setShowNew(open);
                    if (!open) resetDocumentForm();
                }
            }}>
                <DialogContent className="max-w-2xl border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden font-sans">
                    <header className="bg-slate-900 text-white p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><FileSignature className="w-24 h-24"/></div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                             {editingDocumentId ? <Edit className="h-8 w-8 text-amber-400" /> : <Plus className="h-8 w-8 text-emerald-400" />}
                             {editingDocumentId ? 'Editar borrador' : 'Acta de Nacimiento'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Creación y Actualización de Información (ISO 7.5.2)</DialogDescription>
                    </header>
                    
                    <div className="p-10 space-y-8 bg-white max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Macroproceso Asociado *</label>
                                     <Select value={newDoc.processId} onValueChange={v => setNewDoc({ ...newDoc, processId: v })}>
                                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold shadow-inner"><SelectValue placeholder="Seleccione Proceso" /></SelectTrigger>
                                        <SelectContent className="font-sans">{processes.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Documento *</label>
                                     <Select value={newDoc.documentTypeId || (editingDocumentId ? `legacy:${newDoc.type}` : '')} onValueChange={value => {
                                         const selectedType = activeTypes.find(type => type.id === value);
                                         if (selectedType) setNewDoc({ ...newDoc, type: selectedType.baseType, documentTypeId: selectedType.id });
                                     }}>
                                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold shadow-inner"><SelectValue placeholder="Seleccione tipo documental" /></SelectTrigger>
                                        <SelectContent className="font-sans">
                                            {activeTypes.map(type => <SelectItem key={type.id} value={type.id}>{type.name} ({type.prefix})</SelectItem>)}
                                            {editingDocumentId && newDoc.documentTypeId && !activeTypes.some(type => type.id === newDoc.documentTypeId) && <SelectItem value={newDoc.documentTypeId} disabled>{standard?.documentTypes.find(type => type.id === newDoc.documentTypeId)?.name || typeLabels[newDoc.type]} (inactivo)</SelectItem>}
                                            {editingDocumentId && !newDoc.documentTypeId && <SelectItem value={`legacy:${newDoc.type}`} disabled>{typeLabels[newDoc.type]} (clasificación histórica)</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 pt-2">
                                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Soporte / Medio (7.5.2 b)</label>
                                     <Select value={newDoc.medio} onValueChange={v => setNewDoc({ ...newDoc, medio: v as 'DIGITAL' | 'FISICO' })}>
                                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold shadow-inner"><SelectValue /></SelectTrigger>
                                        <SelectContent className="font-sans">
                                            <SelectItem value="DIGITAL" className="font-bold">Digital (PDF, Excel, Web)</SelectItem>
                                            <SelectItem value="FISICO" className="font-bold">Físico (Papel, Tablero)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-6 bg-slate-900 rounded-[2rem] flex flex-col justify-center items-center text-center">
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2">Código documental (7.5.2 a)</label>
                                    <div className="break-all text-xl font-black text-white tracking-tighter">{newDoc.code || 'Se asigna al guardar'}</div>
                                    {!editingDocumentId && <p className="mt-2 text-xs text-slate-400">Consecutivo único de la empresa; no se reserva al abrir este formulario.</p>}
                                    <div className="mt-4 flex gap-4">
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase">Versión</p>
                                            <p className="text-white font-black text-lg">{newDoc.version}</p>
                                        </div>
                                        <div className="w-px h-8 bg-white/10"></div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase">Autor</p>
                                            <p className="text-white font-black text-[10px] uppercase truncate max-w-[80px]">{(newDoc.autor || 'Sistema').split(' ')[0]}</p>
                                        </div>
                                    </div>
                                </div>
                                {!editingDocumentId && <div className="space-y-2"><Label htmlFor="manual-document-code">Código existente (opcional)</Label><Input id="manual-document-code" value={newDoc.code || ''} maxLength={100} placeholder="Vacío = código automático" onChange={event => setNewDoc({ ...newDoc, code: event.target.value.toUpperCase() })} /><p className="text-xs text-muted-foreground">Úselo solo para registrar un documento que ya tiene un código. Se verificará que no esté duplicado.</p></div>}
                                <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título descriptivo del recurso *</label>
                                     <Input placeholder="Ej: PROCEDIMIENTO DE VENTAS" className="h-14 bg-slate-50 border-none rounded-2xl font-black text-sm uppercase px-6 focus-visible:ring-indigo-500" value={newDoc.name || ''} onChange={e => setNewDoc({ ...newDoc, name: e.target.value.toUpperCase() })} />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-emerald-600 mt-1" />
                            <div>
                                <h4 className="font-black text-emerald-900 uppercase text-xs">Cumplimiento Literal C</h4>
                                <p className="text-[11px] text-emerald-800/80 leading-relaxed font-medium mt-1">Al registrar, el documento iniciará en estado <strong>BORRADOR</strong>. Deberá enviarlo a revisión para que el sistema registre la trazabilidad exigida por la norma.</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-10 pt-0 bg-white">
                        <Button variant="ghost" disabled={workflowBusy} onClick={() => { setShowNew(false); resetDocumentForm(); }} className="h-14 px-8 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600">Cancelar</Button>
                        <Button 
                            onClick={handleSaveDocument}
                            disabled={workflowBusy || !canWrite || (!editingDocumentId && !standard)}
                            className="h-14 px-12 bg-slate-900 text-white font-black uppercase text-xs rounded-2xl shadow-2xl shadow-slate-900/20"
                        >
                            {workflowBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingDocumentId ? 'Guardar borrador' : 'Registrar Documento'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DECISIÓN DE APROBACIÓN DOCUMENTAL */}
            <Dialog open={Boolean(workflowDoc)} onOpenChange={open => {
                if (!open && !workflowBusy) {
                    setWorkflowDoc(null);
                    setWorkflowNote('');
                }
            }}>
                <DialogContent className="max-w-lg border-none p-0 overflow-hidden rounded-2xl shadow-2xl">
                    <header className={cn(
                        "p-6 text-white",
                        workflowAction === 'APPROVE' ? 'bg-emerald-700' : 'bg-amber-600'
                    )}>
                        <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                            {workflowAction === 'APPROVE' ? <ShieldCheck className="h-6 w-6" /> : <RotateCcw className="h-6 w-6" />}
                            {workflowAction === 'APPROVE' ? 'Aprobar documento' : 'Solicitar ajustes'}
                        </DialogTitle>
                        <DialogDescription className="mt-2 text-xs font-medium text-white/80">
                            {workflowAction === 'APPROVE'
                                ? 'La versión quedará vigente y la versión anterior del mismo código pasará a obsoleta.'
                                : 'El documento volverá a borrador conservando la observación en su trazabilidad.'}
                        </DialogDescription>
                    </header>
                    <div className="space-y-5 p-6">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-black uppercase text-slate-800">{workflowDoc?.code} · versión {workflowDoc?.currentVersion}</p>
                            <p className="mt-1 text-sm text-slate-600">{workflowDoc?.name}</p>
                            <p className="mt-2 text-[10px] font-bold uppercase text-slate-400">Decisión de {currentUser?.name}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="document-workflow-note" className="text-xs font-bold text-slate-700">
                                Observación {workflowAction === 'CHANGES' ? '*' : '(opcional)'}
                            </Label>
                            <textarea
                                id="document-workflow-note"
                                value={workflowNote}
                                onChange={event => setWorkflowNote(event.target.value.slice(0, 500))}
                                placeholder={workflowAction === 'APPROVE' ? 'Ej.: Revisado en comité de calidad...' : 'Describa claramente los ajustes requeridos...'}
                                className="min-h-28 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                                maxLength={500}
                            />
                            <p className="text-right text-[10px] text-slate-400">{workflowNote.length}/500</p>
                        </div>
                    </div>
                    <DialogFooter className="border-t border-slate-100 bg-slate-50 p-5">
                        <Button variant="ghost" disabled={workflowBusy} onClick={() => setWorkflowDoc(null)}>Cancelar</Button>
                        <Button
                            disabled={workflowBusy || (workflowAction === 'CHANGES' && !workflowNote.trim())}
                            onClick={handleWorkflowDecision}
                            className={cn(
                                "font-bold text-white",
                                workflowAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                            )}
                        >
                            {workflowBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {workflowAction === 'APPROVE' ? 'Aprobar y publicar' : 'Devolver a borrador'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
