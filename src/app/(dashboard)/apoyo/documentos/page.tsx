"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus, Download, Search, Filter, Eye, Trash2,
    FileText, FileSpreadsheet, File, Clock, CheckCircle2, XCircle, AlertCircle, Save,
    ArrowRight, History, Settings2, FileCheck, Info, Calendar,
    HelpCircle, ShieldAlert, Share2, Layers, BookOpen, 
    FileSignature, LayoutGrid, MoreVertical, Edit
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { mockDocuments } from '@/lib/mock-data';
import type { Document, DocumentStatus, DocumentType, ProcessCategory, Process } from '@/lib/types';
import { toast } from 'sonner';
import { useApp } from '@/context/app-context';

const initialCategoryPrefixes: Record<ProcessCategory, string> = {
    ESTRATEGICO: 'ES',
    MISIONAL: 'MI',
    APOYO: 'AP',
    EVALUACION: 'EV',
};

const initialTypePrefixes: Record<DocumentType, string> = {
    MANUAL: 'MA',
    PROCEDIMIENTO: 'PR',
    INSTRUCTIVO: 'IN',
    FORMATO: 'FO',
    POLITICA: 'PO',
    GUIA: 'GU',
    REGISTRO: 'RE',
    OTRO: 'OT',
};

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

const baseDocuments: Document[] = [
    { id: 'bd-1', tenantId: 'default', code: 'ES.CAL.MA.01', name: 'Alcance del Sistema de Gestión', type: 'MANUAL', processName: 'ESTRATEGICO', processId: 'p-cal-01', currentVersion: 1, status: 'APROBADO', author: 'Eduardo Caicedo', fileName: 'alcance-sgc.pdf', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
    { id: 'bd-2', tenantId: 'default', code: 'ES.CAL.PO.01', name: 'Política de Calidad', type: 'POLITICA', processName: 'ESTRATEGICO', processId: 'p-cal-01', currentVersion: 1, status: 'APROBADO', author: 'Eduardo Caicedo', fileName: 'politica-calidad.pdf', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
    { id: 'bd-3', tenantId: 'default', code: 'AP.CAL.OT.01', name: 'Mapa de Procesos', type: 'OTRO', processName: 'APOYO', processId: 'p-cal-01', currentVersion: 2, status: 'APROBADO', author: 'Eduardo Caicedo', fileName: 'mapa-procesos.pdf', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
    { id: 'bd-4', tenantId: 'default', code: 'ES.CAL.RE.01', name: 'Matriz de Partes Interesadas', type: 'REGISTRO', processName: 'ESTRATEGICO', processId: 'p-cal-01', currentVersion: 1, status: 'APROBADO', author: 'Director de Calidad', fileName: 'partes-interesadas.pdf', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
    { id: 'bd-5', tenantId: 'default', code: 'ES.CAL.RE.02', name: 'Matriz DOFA', type: 'REGISTRO', processName: 'ESTRATEGICO', processId: 'p-cal-01', currentVersion: 1, status: 'APROBADO', author: 'Director de Calidad', fileName: 'matriz-dofa.pdf', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
];

export default function DocumentosPage() {
    const { tenant, currentUser } = useApp();
    
    // States FIRST
    const [documents, setDocuments] = useState<Document[]>([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [showNew, setShowNew] = useState(false);
    const [showISOInfo, setShowISOInfo] = useState(false);
    
    const [catPrefixes, setCatPrefixes] = useState<Record<ProcessCategory, string>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sgc_cat_prefixes');
            return saved ? JSON.parse(saved) : initialCategoryPrefixes;
        }
        return initialCategoryPrefixes;
    });

    const [docTypePrefixes, setDocTypePrefixes] = useState<Record<DocumentType, string>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sgc_doc_prefixes');
            return saved ? JSON.parse(saved) : initialTypePrefixes;
        }
        return initialTypePrefixes;
    });

    const [processes, setProcesses] = useState<Process[]>([]);
    const [showStandardization, setShowStandardization] = useState(false);
    const [activeStandardizationTab, setActiveStandardizationTab] = useState('listado');
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [tempCatPrefixes, setTempCatPrefixes] = useState(catPrefixes);
    const [tempDocTypePrefixes, setTempDocTypePrefixes] = useState(docTypePrefixes);
    const [newProcess, setNewProcess] = useState({ name: '', code: '', category: 'APOYO' });
    const [newDoc, setNewDoc] = useState<any>({ 
        type: 'PROCEDIMIENTO', 
        status: 'BORRADOR',
        processId: '',
        medio: 'DIGITAL',
        version: 1,
        autor: currentUser?.name || 'Sistema'
    });
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

    // Persistencia Local para este demo
    useEffect(() => {
        const saved = localStorage.getItem('sgc_master_list');
        const docs = saved ? JSON.parse(saved) : [];
        const hasOldCodes = docs.some((d: any) => d.code && d.code.startsWith('SIG-'));
        
        if (saved && !hasOldCodes) {
            try {
                setDocuments(docs);
            } catch (e) {
                setDocuments([...baseDocuments, ...mockDocuments]);
            }
        } else {
            // Si hay códigos viejos (SIG-*) o no hay nada, forzar bases nuevas
            console.log("Migrando listado maestro a nueva codificación dot-format...");
            setDocuments([...baseDocuments, ...mockDocuments]);
            localStorage.setItem('sgc_master_list', JSON.stringify([...baseDocuments, ...mockDocuments]));
        }
    }, []);

    useEffect(() => {
        if (documents.length > 0) {
            localStorage.setItem('sgc_master_list', JSON.stringify(documents));
        }
    }, [documents]);

    useEffect(() => {
        localStorage.setItem('sgc_cat_prefixes', JSON.stringify(catPrefixes));
        localStorage.setItem('sgc_doc_prefixes', JSON.stringify(docTypePrefixes));
    }, [catPrefixes, docTypePrefixes]);

    useEffect(() => {
        if (showStandardization) {
            setTempCatPrefixes(catPrefixes);
            setTempDocTypePrefixes(docTypePrefixes);
        }
    }, [showStandardization]);

    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const res = await fetch(`/api/procesos?tenantId=${tenant.id}`);
                const data = await res.json();
                if (data && !data.error) {
                    setProcesses(data);
                    
                    // Sincronizar caracterizaciones en el listado maestro
                    setDocuments(prevDocs => {
                        const newDocs = [...prevDocs];
                        data.forEach((p: Process) => {
                            const macro = catPrefixes[p.category as ProcessCategory] || 'GN';
                            const cpCode = `${macro}.${p.code}.CP.01`;
                            const exists = newDocs.some(d => d.code === cpCode);
                            if (!exists) {
                                newDocs.push({
                                    id: `cp-${p.id}`,
                                    code: cpCode,
                                    name: `Caracterización del Proceso ${p.name}`,
                                    type: 'PROCEDIMIENTO',
                                    processName: p.category,
                                    currentVersion: 1,
                                    status: 'APROBADO',
                                    author: 'Director de Calidad',
                                    fileName: `cp-${p.code.toLowerCase()}.pdf`
                                } as any);
                            }
                        });
                        return newDocs;
                    });

                    if (data.length > 0 && !newDoc.processId) {
                        setNewDoc((prev: any) => ({ ...prev, processId: data[0].id }));
                    }
                }
            } catch (error) { 
                console.error('Error fetching processes:', error); 
                // Si la API falla, al menos mantén las bases
                if (documents.length === 0) setDocuments([...baseDocuments, ...mockDocuments]);
            }
        };
        fetchProcesses();
    }, [tenant.id]);

    useEffect(() => {
        if (showNew && newDoc.processId && newDoc.type) {
            const process = processes.find(p => p.id === newDoc.processId);
            const macroPref = process ? catPrefixes[process.category as ProcessCategory] : 'GN';
            const processPref = process ? process.code : 'GNS';
            const typePref = docTypePrefixes[newDoc.type as DocumentType] || 'OT';
            
            // Contar cuántos documentos de este mismo tipo y proceso existen para el consecutivo
            const prefixToMatch = `${macroPref}.${processPref}.${typePref}`;
            const count = documents.filter(d => 
                d.code && d.code.startsWith(prefixToMatch)
            ).length + 1;
            
            const nextIdx = count.toString().padStart(2, '0');
            const generatedCode = `${prefixToMatch}.${nextIdx}`;
            
            if (newDoc.code !== generatedCode) {
                setNewDoc((prev: any) => ({ ...prev, code: generatedCode }));
            }
        }
    }, [newDoc.type, newDoc.processId, showNew, docTypePrefixes, catPrefixes, documents]);

    const filtered = useMemo(() => {
        return documents.filter(d => {
            const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.code && d.code.toLowerCase().includes(search.toLowerCase()));
            const matchType = filterType === 'ALL' || d.type === filterType;
            return matchSearch && matchType;
        });
    }, [documents, search, filterType]);

    function getFileIcon(name?: string) {
        if (!name) return <File className="h-4 w-4 text-muted-foreground" />;
        if (name.endsWith('.pdf')) return <FileText className="h-4 w-4 text-rose-500" />;
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
        return <FileText className="h-4 w-4 text-blue-600" />;
    }

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
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase group-hover:border-slate-800 group-hover:text-slate-900 transition-colors">Código: SIG-DOC-05</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="flex items-center gap-2 px-4 py-2 bg-white border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs transition-all shadow-sm h-10">
                        <History className="w-4 h-4 text-slate-400" /> Registro de Cambios
                    </Button>
                    <Button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-black font-bold text-xs shadow-lg transition-all h-10 uppercase tracking-wider">
                        <Plus className="w-4 h-4" /> Nuevo Documento
                    </Button>
                </div>
            </div>

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
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Versión Actual: {selectedDoc.currentVersion} | Creado por: {selectedDoc.author || 'Eduardo Caicedo'}</p>
                                    </div>
                                    <Button variant="ghost" onClick={() => setSelectedDoc(null)} className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"><XCircle className="w-5 h-5 text-slate-300" /></Button>
                                </div>

                                {/* B. CUERPO CENTRAL (VISUALIZACIÓN) */}
                                <div className="flex-1 p-0 bg-slate-200/50 flex items-center justify-center relative">
                                    <div className="bg-white w-[90%] h-[90%] shadow-2xl rounded-lg border border-slate-300 flex flex-col overflow-hidden">
                                        <div className="bg-slate-800 p-2 flex items-center justify-between text-white/50">
                                            <div className="flex items-center gap-4 ml-4">
                                                <div className="flex items-center gap-1"><FileText className="w-3 h-3"/> <span className="text-[10px] font-bold">Página 1 de 4</span></div>
                                            </div>
                                            <div className="flex items-center gap-2 mr-2">
                                                <Button variant="ghost" className="h-6 text-white text-[10px] hover:bg-white/10 uppercase font-black">Imprimir Copia Controlada</Button>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                                            <FileSignature className="w-20 h-20 text-slate-100" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Visor de Documento Seguro (PDF)</p>
                                            <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                                <p className="text-slate-500 italic text-sm">Contenido del documento "{selectedDoc.name}" protegido por norma ISO 9001:2015</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Flujo de Estados Popover (Simulado) */}
                                    <div className="absolute bottom-6 right-6">
                                        <Card className="shadow-2xl border-none p-1 bg-white/80 backdrop-blur rounded-2xl">
                                            <div className="flex gap-1">
                                                {['BORRADOR', 'EN_REVISION', 'PARA_APROBACION', 'APROBADO'].map((st, i) => (
                                                    <div key={st} className={cn(
                                                        "h-2 w-8 rounded-full",
                                                        i === 3 ? "bg-emerald-500" : "bg-slate-200"
                                                    )} title={st}></div>
                                                ))}
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
                                                <History className="w-3 h-3 text-indigo-500" /> Historial de Versiones
                                            </p>
                                            <div className="space-y-4 border-l-2 border-slate-100 ml-1.5 pl-4">
                                                <div className="relative">
                                                     <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
                                                     <p className="text-[11px] font-black text-slate-800">Ver 1.0 (Vigente)</p>
                                                     <p className="text-[10px] text-slate-400 font-bold uppercase">21 Mar 2026 — Manuel Rojas</p>
                                                     <p className="text-[10px] text-slate-500 mt-1 leading-tight italic">"Creación inicial bajo nueva estructura de procesos 2026"</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <p className="text-[10px] font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                                                <FileSignature className="w-3 h-3 text-emerald-500" /> Firma Electrónica (Log)
                                            </p>
                                            <div className="p-4 bg-slate-50 rounded-2xl space-y-3 font-mono">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Aprobado por:</p>
                                                    <p className="text-[10px] font-black text-slate-800 truncate">Eduardo Caicedo (Gerencia)</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Fecha:</p>
                                                        <p className="text-[10px] font-black text-slate-800">2026-03-21</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">IP Registro:</p>
                                                        <p className="text-[10px] font-black text-slate-800">190.12.33.x</p>
                                                    </div>
                                                </div>
                                                <div className="pt-2 border-t border-slate-200">
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 text-[8px] border-none font-black shadow-none tracking-tighter uppercase px-1 h-4">FIRMA DIGITAL VERIFICADA SIG</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 space-y-4">
                                            <Button variant="outline" className="w-full h-11 border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50">Solicitar Cambio</Button>
                                            <Button className="w-full h-11 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg">Descargar Original</Button>
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
                                            {Object.entries(typeLabels).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>{v.toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" className="h-10 w-10 p-0 border-slate-200 bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><Filter className="w-4 h-4"/></Button>
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
                                        {filtered.map(doc => (
                                            <TableRow key={doc.id} className="hover:bg-slate-50 transition-colors border-slate-100 group">
                                                <TableCell className="px-6 py-4 border-r border-slate-100 font-black text-slate-400 tracking-tighter text-xs font-mono">{doc.code}</TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors border border-slate-100">{getFileIcon(doc.fileName)}</div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 text-sm leading-tight group-hover:text-blue-600 transition-colors">{doc.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{typeLabels[doc.type]}</span>
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
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </TabsContent>

                {/* 7.5.2 ESTANDARIZACION (Configuracion) */}
                <TabsContent value="estandarizacion" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-tight">Prefijos de Tipos de Documento</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest">Identificación única (7.5.2-a)</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowStandardization(true)} className="h-8 w-8 text-slate-400 hover:text-slate-900"><Settings2 className="w-4 h-4"/></Button>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {Object.entries(docTypePrefixes).map(([type, pref]) => (
                                        <div key={type} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{typeLabels[type as DocumentType]}</span>
                                            <span className="text-xs font-black text-slate-900">{pref}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-tight">Iniciadores de Proceso</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest">Codificación de Cláusula 4.4</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowStandardization(true)} className="h-8 w-8 text-slate-400 hover:text-slate-900"><Settings2 className="w-4 h-4"/></Button>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(catPrefixes).map(([cat, pref]) => (
                                        <div key={cat} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{cat}</span>
                                            <span className="text-xs font-black text-indigo-600">{pref}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-2xl bg-slate-900 rounded-[2rem] overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><LayoutGrid className="w-32 h-32 text-white"/></div>
                            <CardHeader className="p-10 pb-6 relative z-10">
                                <CardTitle className="text-white text-3xl font-[900] italic tracking-tighter flex items-center gap-4">
                                     <Layers className="w-8 h-8 text-indigo-400" /> Procesos Operativos
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-2 ml-12">Vinculación Cláusula 4.4</CardDescription>
                            </CardHeader>
                            <CardContent className="px-10 pb-10 pt-0 relative z-10 space-y-6">
                                <div className="space-y-3">
                                    {processes.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group/item">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xs border border-indigo-500/30">
                                                    {p.code}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-black text-sm tracking-tight group-hover/item:text-indigo-300 transition-colors uppercase">{p.name}</span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.category}</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-white/20 group-hover/item:text-white/60 group-hover/item:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                    {processes.length === 0 && (
                                        <div className="py-10 text-center border-2 border-dashed border-white/10 rounded-[2rem]">
                                            <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">No hay procesos sincronizados</p>
                                        </div>
                                    )}
                                </div>
                                <Button 
                                    onClick={() => setShowProcessModal(true)} 
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-[900] uppercase text-xs tracking-widest h-14 w-full rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 mt-6"
                                >
                                    <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center"><Plus className="w-3 h-3"/></div>
                                    Sincronizar Nuevo Proceso
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
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

            {/* Modals from previous code preserved and redesigned */}
            {/* STANDARDIZATION DIALOG (Prefixes) */}
            <Dialog open={showStandardization} onOpenChange={setShowStandardization}>
                <DialogContent className="max-w-2xl border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden font-sans bg-white">
                    <header className="bg-slate-900 text-white p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Settings2 className="w-20 h-20"/></div>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 font-sans">
                             Configuración de Prefijos
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Personalización de la Codificación (ISO 7.5.2)</DialogDescription>
                    </header>
                    
                    <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-500"/> Tipos de Documento
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(tempDocTypePrefixes).map(([type, pref]) => (
                                        <div key={type} className="flex flex-col gap-1.5 focus-within:translate-x-1 transition-transform">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">{typeLabels[type as DocumentType]}</Label>
                                            <Input 
                                                value={pref} 
                                                onChange={e => setTempDocTypePrefixes({...tempDocTypePrefixes, [type]: e.target.value.toUpperCase()})}
                                                className="h-10 bg-slate-50 border-none rounded-xl font-black text-xs uppercase"
                                                maxLength={4}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator className="bg-slate-100" />

                            <div>
                                <h4 className="text-xs font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4 text-emerald-500"/> Categorías de Proceso
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(tempCatPrefixes).map(([cat, pref]) => (
                                        <div key={cat} className="flex flex-col gap-1.5 focus-within:translate-x-1 transition-transform">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">{cat}</Label>
                                            <Input 
                                                value={pref} 
                                                onChange={e => setTempCatPrefixes({...tempCatPrefixes, [cat]: e.target.value.toUpperCase()})}
                                                className="h-10 bg-slate-50 border-none rounded-xl font-black text-xs uppercase"
                                                maxLength={4}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 bg-white">
                        <Button variant="ghost" onClick={() => setShowStandardization(false)} className="h-12 px-8 font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</Button>
                        <Button 
                            onClick={() => {
                                setDocTypePrefixes(tempDocTypePrefixes);
                                setCatPrefixes(tempCatPrefixes);
                                setShowStandardization(false);
                                toast.success("Codificación actualizada", {
                                    description: "Los nuevos prefijos se aplicarán a los futuros documentos."
                                });
                            }} 
                            className="h-12 px-10 bg-slate-900 text-white font-black uppercase text-xs rounded-xl shadow-xl"
                        >
                            <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* NEW RECORD MODAL REDESIGN 7.5.2 */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-2xl border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden font-sans">
                    <header className="bg-slate-900 text-white p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><FileSignature className="w-24 h-24"/></div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                             <Plus className="h-8 w-8 text-emerald-400" /> Acta de Nacimiento
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
                                     <Select value={newDoc.type} onValueChange={v => setNewDoc({ ...newDoc, type: v as DocumentType })}>
                                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold shadow-inner"><SelectValue /></SelectTrigger>
                                        <SelectContent className="font-sans">{Object.entries(typeLabels).map(([k,v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 pt-2">
                                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Soporte / Medio (7.5.2 b)</label>
                                     <Select value={newDoc.medio} onValueChange={v => setNewDoc({ ...newDoc, medio: v })}>
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
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2">Código Generado (7.5.2 a)</label>
                                    <div className="text-3xl font-black text-white tracking-tighter">{newDoc.code || '---'}</div>
                                    <div className="mt-4 flex gap-4">
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase">Versión</p>
                                            <p className="text-white font-black text-lg">{newDoc.version}</p>
                                        </div>
                                        <div className="w-px h-8 bg-white/10"></div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase">Autor</p>
                                            <p className="text-white font-black text-[10px] uppercase truncate max-w-[80px]">{newDoc.autor.split(' ')[0]}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título descriptivo del recurso *</label>
                                     <Input placeholder="Ej: Procedimiento de Ventas" className="h-14 bg-slate-50 border-none rounded-2xl font-black text-sm uppercase px-6 focus-visible:ring-indigo-500" value={newDoc.name || ''} onChange={e => setNewDoc({ ...newDoc, name: e.target.value })} />
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
                        <Button variant="ghost" onClick={() => setShowNew(false)} className="h-14 px-8 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600">Cancelar</Button>
                        <Button 
                            onClick={() => {
                                if(!newDoc.name) {
                                    toast.error("El nombre es obligatorio");
                                    return;
                                }
                                const docToAdd: any = {
                                    ...newDoc,
                                    id: `doc-${Date.now()}`,
                                    currentVersion: newDoc.version,
                                    author: newDoc.autor,
                                    fileName: newDoc.name.toLowerCase().replace(/ /g, '-') + '.pdf'
                                };
                                setDocuments([docToAdd, ...documents]);
                                setShowNew(false);
                                toast.success("Documento registrado con éxito");
                            }} 
                            className="h-14 px-12 bg-slate-900 text-white font-black uppercase text-xs rounded-2xl shadow-2xl shadow-slate-900/20"
                        >
                            Registrar Documento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: SINCRONIZAR NUEVO PROCESO (Vinculación 4.4 <-> 7.5) */}
            <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
                <DialogContent className="max-w-xl border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden font-sans bg-white">
                    <header className="bg-indigo-900 text-white p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Layers className="w-20 h-20"/></div>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                             <Plus className="h-6 w-6 text-indigo-400" /> Sincronizar Proceso
                        </DialogTitle>
                        <DialogDescription className="text-indigo-300 font-bold uppercase tracking-widest text-[10px] mt-2 leading-relaxed">
                            Crea un nuevo proceso en el Mapa (4.4) y genera automáticamente su documentación base.
                        </DialogDescription>
                    </header>
                    
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Macroproceso (Categoría)</Label>
                                <Select value={newProcess.category} onValueChange={v => setNewProcess({...newProcess, category: v})}>
                                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(initialCategoryPrefixes).map(cat => (
                                            <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Código del Proceso (ej: COM)</Label>
                                <Input 
                                    placeholder="COM, OPS, CAL..." 
                                    className="h-12 bg-slate-50 border-none rounded-xl font-black uppercase" 
                                    value={newProcess.code}
                                    onChange={e => setNewProcess({...newProcess, code: e.target.value.toUpperCase()})}
                                    maxLength={4}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Nombre Completo del Proceso</Label>
                            <Input 
                                placeholder="Ej: Gestión Comercial" 
                                className="h-12 bg-slate-50 border-none rounded-xl font-black uppercase" 
                                value={newProcess.name}
                                onChange={e => setNewProcess({...newProcess, name: e.target.value.toUpperCase()})}
                            />
                        </div>
                        
                        <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
                            <Info className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <p className="text-[11px] text-indigo-900/70 font-medium leading-relaxed">
                                Al sincronizar, el sistema creará automáticamente el documento de <strong>Caracterización</strong> en el Listado Maestro con el código: {catPrefixes[newProcess.category as ProcessCategory] || '--'}.{newProcess.code || '---'}.CP.01
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 bg-white">
                        <Button variant="ghost" onClick={() => setShowProcessModal(false)} className="h-12 px-8 font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</Button>
                        <Button 
                            onClick={() => {
                                if(!newProcess.name || !newProcess.code) {
                                    toast.error("Complete todos los campos del proceso");
                                    return;
                                }
                                
                                const pToAdd: any = {
                                    id: `proc-${Date.now()}`,
                                    tenantId: tenant.id,
                                    name: newProcess.name,
                                    code: newProcess.code,
                                    category: newProcess.category as ProcessCategory,
                                    active: true,
                                    order: processes.length,
                                    objective: '',
                                    scope: '',
                                    responsibleId: ''
                                };
                                
                                // 1. Agregar a la lista de procesos para que salga en la tarjeta
                                setProcesses(prev => [...prev, pToAdd]);
                                
                                // 2. Generar automáticamente su caracterización en el listado maestro
                                const macro = catPrefixes[pToAdd.category as ProcessCategory] || 'GN';
                                const cpCode = `${macro}.${pToAdd.code}.CP.01`;
                                
                                const cpDoc: any = {
                                    id: `cp-${pToAdd.id}`,
                                    code: cpCode,
                                    name: `Caracterización del Proceso ${pToAdd.name}`,
                                    type: 'PROCEDIMIENTO',
                                    processName: pToAdd.category,
                                    processId: pToAdd.id,
                                    currentVersion: 1,
                                    status: 'BORRADOR', // Inicia en borrador como exige la norma para nuevos
                                    author: currentUser?.name || 'Sistema',
                                    fileName: `cp-${pToAdd.code.toLowerCase()}.pdf`
                                };
                                
                                setDocuments(prev => [cpDoc, ...prev]);
                                
                                setShowProcessModal(false);
                                toast.success("Proceso Sincronizado", {
                                    description: `Se ha creado el proceso y su caracterización ${cpCode}.`
                                });
                            }} 
                            className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs rounded-xl shadow-xl shadow-indigo-500/20"
                        >
                            Confirmar Sincronización
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
