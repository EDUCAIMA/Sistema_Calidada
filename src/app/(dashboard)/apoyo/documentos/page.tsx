"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus, Download, Search, Filter, Eye, Trash2,
    FileText, FileSpreadsheet, File, Clock, CheckCircle2, XCircle, AlertCircle, Save,
    ArrowRight, History, Settings2, FileCheck, Info, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { mockDocuments, mockProcesses } from '@/lib/mock-data';
import type { Document, DocumentStatus, DocumentType, ProcessCategory, Process } from '@/lib/types';
import { toast } from 'sonner';
import { useApp } from '@/context/app-context';

// Initial ISO 9001:2015 Coding Standards
const initialCategoryPrefixes: Record<ProcessCategory, string> = {
    ESTRATEGICO: 'EST',
    MISIONAL: 'MIS',
    APOYO: 'APO',
    EVALUACION: 'EVA',
};

const initialTypePrefixes: Record<DocumentType, string> = {
    MANUAL: 'MAN',
    PROCEDIMIENTO: 'PRO',
    INSTRUCTIVO: 'INS',
    FORMATO: 'FOR',
    POLITICA: 'POL',
    GUIA: 'GUI',
    REGISTRO: 'REG',
    OTRO: 'OTR',
};

const statusConfig: Record<DocumentStatus, { label: string; icon: React.ReactNode; className: string }> = {
    BORRADOR: { label: 'Borrador', icon: <Clock className="h-3 w-3" />, className: 'bg-slate-100 text-slate-600 border-slate-200' },
    EN_REVISION: { label: 'En Revisión', icon: <AlertCircle className="h-3 w-3" />, className: 'bg-amber-50 text-amber-700 border-amber-200' },
    APROBADO: { label: 'Aprobado', icon: <CheckCircle2 className="h-3 w-3" />, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    OBSOLETO: { label: 'Obsoleto', icon: <XCircle className="h-3 w-3" />, className: 'bg-red-50 text-red-600 border-red-200' },
};

const typeLabels: Record<DocumentType, string> = {
    MANUAL: 'Manual', PROCEDIMIENTO: 'Procedimiento', INSTRUCTIVO: 'Instructivo',
    FORMATO: 'Formato', POLITICA: 'Política', GUIA: 'Guía', REGISTRO: 'Registro', OTRO: 'Otro',
};

function getFileIcon(name?: string) {
    if (!name) return <File className="h-4 w-4 text-muted-foreground" />;
    if (name.endsWith('.pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
    if (name.endsWith('.docx') || name.endsWith('.doc')) return <FileText className="h-4 w-4 text-blue-600" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
}

export default function DocumentosPage() {
    const { tenant, currentUser } = useApp();
    const [documents, setDocuments] = useState<Document[]>(mockDocuments);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [showNew, setShowNew] = useState(false);
    
    // Coding matrix state
    const [catPrefixes, setCatPrefixes] = useState(initialCategoryPrefixes);
    const [docTypePrefixes, setDocTypePrefixes] = useState(initialTypePrefixes);
    
    // Process management state
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loadingProcesses, setLoadingProcesses] = useState(true);
    
    // Dialos states
    const [showStandardization, setShowStandardization] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);
    
    // Temp states for editing
    const [tempCatPrefixes, setTempCatPrefixes] = useState(catPrefixes);
    const [tempDocTypePrefixes, setTempDocTypePrefixes] = useState(docTypePrefixes);
    const [newProcess, setNewProcess] = useState({ name: '', code: '', category: 'APOYO' });

    const [newDoc, setNewDoc] = useState<Partial<Document>>({ 
        type: 'PROCEDIMIENTO', 
        status: 'BORRADOR',
        processId: ''
    });

    // Fetch real processes from API
    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const res = await fetch(`/api/procesos?tenantId=${tenant.id}`);
                const data = await res.json();
                if (data && !data.error) {
                    setProcesses(data);
                    // Actualizar el proceso por defecto una vez cargados
                    if (data.length > 0 && !newDoc.processId) {
                        setNewDoc(prev => ({ ...prev, processId: data[0].id }));
                    }
                }
            } catch (error) {
                console.error('Error fetching processes:', error);
            } finally {
                setLoadingProcesses(false);
            }
        };
        fetchProcesses();
    }, [tenant.id]);

    // Auto-generate code effect
    useEffect(() => {
        if (showNew && newDoc.type && newDoc.processId) {
            const process = processes.find(p => p.id === newDoc.processId);
            if (process) {
                const catPrefix = catPrefixes[process.category as ProcessCategory] || 'GEN';
                const typePrefix = docTypePrefixes[newDoc.type as DocumentType] || 'DOC';
                
                // Count existing for this category and type to get next index
                const count = documents.filter(d => d.processId === newDoc.processId && d.type === newDoc.type).length;
                const index = (count + 1).toString().padStart(3, '0');
                
                const generatedCode = `${catPrefix}-${typePrefix}-${index}`;
                setNewDoc(prev => ({ ...prev, code: generatedCode }));
            }
        }
    }, [newDoc.type, newDoc.processId, showNew, documents, catPrefixes, docTypePrefixes, processes]);

    const filtered = useMemo(() => {
        return documents.filter(d => {
            const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.code && d.code.toLowerCase().includes(search.toLowerCase()));
            const matchType = filterType === 'ALL' || d.type === filterType;
            const matchStatus = filterStatus === 'ALL' || d.status === filterStatus;
            return matchSearch && matchType && matchStatus;
        });
    }, [documents, search, filterType, filterStatus]);

    const handleCreate = () => {
        if (!newDoc.code || !newDoc.name) { toast.error('Se requieren todos los campos obligatorios'); return; }
        const doc: Document = {
            id: `doc-${Date.now()}`,
            tenantId: 'tenant-1',
            code: newDoc.code!,
            name: newDoc.name!,
            type: (newDoc.type as DocumentType) || 'PROCEDIMIENTO',
            status: 'BORRADOR',
            processId: newDoc.processId,
            processName: processes.find(p => p.id === newDoc.processId)?.name,
            currentVersion: 1,
            createdBy: 'user-1',
            createdByName: 'Carlos Administrador',
            nextReviewDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year by default
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setDocuments([doc, ...documents]);
        setShowNew(false);
        toast.success(`Documento "${doc.code}" registrado exitosamente`);
    };

    const handleSaveStandardization = () => {
        setCatPrefixes(tempCatPrefixes);
        setDocTypePrefixes(tempDocTypePrefixes);
        setShowStandardization(false);
        toast.success("Estandarización de códigos actualizada con éxito");
    };

    const handleCreateProcess = async () => {
        if (!newProcess.name || !newProcess.code) {
            toast.error("Complete el nombre y código del proceso");
            return;
        }
        
        try {
            const res = await fetch('/api/procesos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: tenant.id,
                    name: newProcess.name,
                    code: newProcess.code,
                    category: newProcess.category,
                    responsibleId: currentUser?.id || 'user-1',
                }),
            });
            
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setProcesses([...processes, { ...data, responsibleName: currentUser?.name || '—' }]);
            setShowProcessModal(false);
            setNewProcess({ name: '', code: '', category: 'APOYO' });
            toast.success(`Proceso "${data.code}" sincronizado exitosamente con el Mapa de Procesos`);
        } catch (error) {
            console.error('Error creating process:', error);
            toast.error('Error al guardar el proceso y sincronizar con el Mapa');
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800 italic">7.5 Información documentada</h1>
                    <p className="text-muted-foreground mt-1">
                        Estandarización y control documental bajo numerales 7.5.2 y 7.5.3.
                    </p>
                </div>
                <Button onClick={() => setShowNew(true)} className="shadow-lg gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4" /> Nuevo Registro Documental
                </Button>
            </div>

            <Tabs defaultValue="listado" className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1 border h-auto flex flex-wrap gap-1">
                    <TabsTrigger value="generalidades" className="gap-2 px-4 py-2 text-xs font-bold uppercase"><Info className="w-4 h-4" /> 7.5.1 Generalidades</TabsTrigger>
                    <TabsTrigger value="estandarizacion" className="gap-2 px-4 py-2 text-xs font-bold uppercase"><Settings2 className="w-4 h-4" /> 7.5.2 Matriz de Estandarización</TabsTrigger>
                    <TabsTrigger value="listado" className="gap-2 px-4 py-2 text-xs font-bold uppercase"><FileText className="w-4 h-4" /> 7.5.2 Listado Maestro</TabsTrigger>
                    <TabsTrigger value="control" className="gap-2 px-4 py-2 text-xs font-bold uppercase"><FileCheck className="w-4 h-4" /> 7.5.3 Control</TabsTrigger>
                </TabsList>

                <TabsContent value="generalidades" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white/60">
                        <CardHeader><CardTitle className="text-lg font-bold">7.5.1 Requerimientos Documentales</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-900 italic">
                                "La información documentada del SGC es el soporte de la operación y la base para la mejora continua."
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-4 border-slate-100 bg-white shadow-none">
                                    <h4 className="font-bold text-sm mb-3">Exigido por ISO 9001:2015</h4>
                                    <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                                        <li>Alcance del sistema (Clause 4.3).</li>
                                        <li>Operación de procesos (Clause 4.4).</li>
                                        <li>Política y Objetivos (Clause 5.2/6.2).</li>
                                        <li>Evidencia de Seguimiento (Clause 7.1.5).</li>
                                    </ul>
                                </Card>
                                <Card className="p-4 border-slate-100 bg-white shadow-none">
                                    <h4 className="font-bold text-sm mb-3">Identificación (7.5.2)</h4>
                                    <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                                        <li>Título y Código único.</li>
                                        <li>Fecha y Autoría.</li>
                                        <li>Formato y Soporte idóneo.</li>
                                        <li>Revisión y Aprobación periódica.</li>
                                    </ul>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="estandarizacion" className="space-y-6">
                    <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                        <div>
                            <h3 className="font-bold text-indigo-900">Configuración Global (7.5.2)</h3>
                            <p className="text-xs text-indigo-700">Asegure que la codificación cumpla con la trazabilidad exigida.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => {
                                setTempCatPrefixes(catPrefixes);
                                setTempDocTypePrefixes(docTypePrefixes);
                                setShowStandardization(true);
                            }} className="gap-2 bg-white border-indigo-200 text-indigo-700">
                                <Settings2 className="h-4 w-4" /> Editar Prefijos
                            </Button>
                            <Button onClick={() => setShowProcessModal(true)} className="gap-2 bg-indigo-600 shadow-md">
                                <Plus className="h-4 w-4" /> Crear Proceso
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Summary View */}
                        <Card className="border-none shadow-sm bg-white/60">
                            <CardHeader>
                                <CardTitle className="text-base font-black uppercase text-slate-700">Resumen de Macroprocesos</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3">
                                {Object.entries(catPrefixes).map(([cat, prefix]) => (
                                    <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{cat}</span>
                                        <Badge className="bg-indigo-600 font-black">{prefix}</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white/60">
                            <CardHeader>
                                <CardTitle className="text-base font-black uppercase text-slate-700">Resumen de Documentos</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-3 gap-2">
                                {Object.entries(docTypePrefixes).slice(0, 6).map(([type, prefix]) => (
                                    <div key={type} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center gap-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{typeLabels[type as DocumentType]}</span>
                                        <span className="text-xs font-black text-indigo-700">{prefix}</span>
                                    </div>
                                ))}
                                <div className="p-2 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                                    <span className="text-[9px] font-bold text-slate-400">+{Object.keys(docTypePrefixes).length - 6} más</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Procesos */}
                        <Card className="col-span-1 lg:col-span-2 border-none shadow-sm bg-slate-900 text-white overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl font-black italic">Estructura por Procesos Operativos</CardTitle>
                                <CardDescription className="text-slate-400">Listado de procesos que afectan la generación automática de códigos.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {processes.map(proc => (
                                        <div key={proc.id} className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex justify-between items-center hover:bg-white/20 transition-all">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-indigo-400 uppercase mb-1">{proc.category}</span>
                                                <p className="font-bold text-sm leading-tight text-white">{proc.name}</p>
                                            </div>
                                            <span className="font-black text-xl text-white/40 tracking-tighter">{proc.code}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="listado" className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="relative flex-1 w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por código (ej: APO), nombre o proceso..."
                                className="pl-10 h-10 bg-slate-50/50 border-none"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                             <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-40 border-slate-100 bg-slate-50/50 h-10"><SelectValue placeholder="Tipo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos los tipos</SelectItem>
                                    {Object.entries(typeLabels).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md overflow-hidden">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider pl-6 py-4">Código (7.5.2)</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-4">Nombre Documental</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-4">Macroproceso</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-4 text-center">v.</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-4">Revisión</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-4 text-right pr-6">Registro</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(doc => (
                                        <TableRow key={doc.id} className="group hover:bg-white transition-colors border-slate-100/50 text-xs">
                                            <TableCell className="pl-6 py-4 font-black text-indigo-600 tracking-tight">{doc.code}</TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-indigo-50 transition-colors">{getFileIcon(doc.fileName)}</div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800">{doc.name}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase">{typeLabels[doc.type]}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4"><Badge variant="outline" className="text-[9px] uppercase font-bold text-slate-400 border-slate-100">{doc.processName || 'General'}</Badge></TableCell>
                                            <TableCell className="text-center py-4 text-slate-500 font-bold">{doc.currentVersion}</TableCell>
                                            <TableCell className="py-4 font-medium text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3" />
                                                    {doc.nextReviewDate ? new Date(doc.nextReviewDate).toLocaleDateString() : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"><Eye className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100"><Download className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="control" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="border-none shadow-sm bg-amber-50/40 border-l-4 border-l-amber-400">
                             <CardHeader className="pb-2">
                                <CardTitle className="text-xs flex items-center gap-2 text-amber-900"><Clock className="h-4 w-4" /> Versiones en Borrador</CardTitle>
                            </CardHeader>
                            <CardContent><p className="text-3xl font-black text-amber-900">3</p></CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-indigo-50/40 border-l-4 border-l-indigo-400">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs flex items-center gap-2 text-indigo-900"><FileCheck className="h-4 w-4" /> Control de Obsoletos</CardTitle>
                            </CardHeader>
                            <CardContent><p className="text-3xl font-black text-indigo-900">12</p></CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* NEW ENHANCED ISO 9001 DIALOG */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-black italic text-slate-900">
                            <Settings2 className="h-6 w-6 text-primary" /> Nuevo Registro Documental (7.5.2)
                        </DialogTitle>
                        <DialogDescription>Defina los metadatos y la codificación estandarizada para el SGC.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 gap-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Macroproceso de Origen *</Label>
                            <Select value={newDoc.processId} onValueChange={v => setNewDoc({ ...newDoc, processId: v })}>
                                <SelectTrigger className="bg-slate-50 border-none h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {processes.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tipo de Información *</Label>
                            <Select value={newDoc.type} onValueChange={v => setNewDoc({ ...newDoc, type: v as DocumentType })}>
                                <SelectTrigger className="bg-slate-50 border-none h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(typeLabels).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 space-y-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                            <Label className="text-xs font-black uppercase text-indigo-900">Código Generado Automáticamente</Label>
                            <div className="flex items-center gap-3">
                                <code className="text-2xl font-black text-indigo-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-indigo-200 block w-fit">
                                    {newDoc.code || '...'}
                                </code>
                                <div className="text-[10px] text-indigo-700 italic font-medium">
                                    Sintaxis: [PROCESO]-[TIPO]-[INDICE]
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Título del Documento *</Label>
                            <Input 
                                placeholder="Ej: Procedimiento de Control de Plagas" 
                                className="bg-slate-50 border-none h-11 text-base font-semibold"
                                value={newDoc.name || ''} 
                                onChange={e => setNewDoc({ ...newDoc, name: e.target.value })} 
                            />
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl border-t">
                        <Button variant="ghost" onClick={() => setShowNew(false)} className="font-bold text-slate-500">Descartar</Button>
                        <Button onClick={handleCreate} className="h-11 px-8 font-black gap-2 shadow-xl">
                            <Save className="h-4 w-4" /> Registrar en Listado Maestro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* STANDARDIZATION MODAL (7.5.2) */}
            <Dialog open={showStandardization} onOpenChange={setShowStandardization}>
                <DialogContent className="max-w-2xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-indigo-900 flex items-center gap-2 italic">
                            <Settings2 className="h-6 w-6 text-indigo-600" /> Estandarización de Códigos
                        </DialogTitle>
                        <DialogDescription>Defina los prefijos que regirán la codificación de todo el sistema.</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-8 py-4">
                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase text-slate-500">Macroprocesos</Label>
                            <div className="space-y-2">
                                {Object.entries(tempCatPrefixes).map(([cat, pref]) => (
                                    <div key={cat} className="flex items-center gap-3">
                                        <span className="flex-1 text-xs font-bold text-slate-600">{cat}</span>
                                        <Input 
                                            value={pref} 
                                            onChange={e => setTempCatPrefixes({...tempCatPrefixes, [cat]: e.target.value.toUpperCase()})}
                                            className="w-20 h-9 font-black text-center text-indigo-600"
                                            maxLength={3}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase text-slate-500">Tipos de Documento</Label>
                            <ScrollArea className="h-[250px] pr-4">
                                <div className="space-y-2">
                                    {Object.entries(tempDocTypePrefixes).map(([type, pref]) => (
                                        <div key={type} className="flex items-center gap-3">
                                            <span className="flex-1 text-[11px] font-bold text-slate-600">{typeLabels[type as DocumentType]}</span>
                                            <Input 
                                                value={pref} 
                                                onChange={e => setTempDocTypePrefixes({...tempDocTypePrefixes, [type]: e.target.value.toUpperCase()})}
                                                className="w-16 h-8 text-xs font-black text-center text-indigo-600"
                                                maxLength={3}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl border-t">
                        <Button variant="ghost" onClick={() => setShowStandardization(false)} className="font-bold text-slate-500">Cancelar</Button>
                        <Button onClick={handleSaveStandardization} className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 gap-2 font-bold shadow-xl">
                            <Save className="h-4 w-4" /> Guardar Estandarización
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* NEW PROCESS MODAL */}
            <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
                <DialogContent className="max-w-md border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 italic flex items-center gap-2">
                            <Plus className="h-6 w-6 text-indigo-600" /> Crear Nuevo Proceso
                        </DialogTitle>
                        <DialogDescription>Añada un nuevo proceso al mapa organizacional.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Categoría ISO</Label>
                            <Select value={newProcess.category} onValueChange={v => setNewProcess({...newProcess, category: v})}>
                                <SelectTrigger className="h-11 bg-slate-50 border-none"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.keys(catPrefixes).map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Nombre del Proceso</Label>
                            <Input 
                                placeholder="Ej: GESTIÓN DE TALENTO HUMANO"
                                value={newProcess.name}
                                onChange={e => setNewProcess({...newProcess, name: e.target.value.toUpperCase()})}
                                className="h-11 font-black bg-slate-50 border-none uppercase text-indigo-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Código del Proceso</Label>
                            <Input 
                                placeholder="Ej: GTH"
                                value={newProcess.code}
                                onChange={e => setNewProcess({...newProcess, code: e.target.value.toUpperCase()})}
                                className="h-11 font-black text-indigo-600 uppercase bg-slate-50 border-none"
                                maxLength={3}
                            />
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl border-t">
                        <Button variant="ghost" onClick={() => setShowProcessModal(false)} className="font-bold text-slate-500">Cancelar</Button>
                        <Button onClick={handleCreateProcess} className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 font-black shadow-xl">
                            Guardar Proceso
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
