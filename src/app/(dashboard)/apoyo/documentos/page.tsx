"use client";

import React, { useState, useMemo } from 'react';
import {
    Plus, Download, Upload, Search, Filter, Eye, Trash2,
    FileText, FileSpreadsheet, File, Clock, CheckCircle2, XCircle, AlertCircle, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { mockDocuments, mockProcesses } from '@/lib/mock-data';
import type { Document, DocumentStatus, DocumentType } from '@/lib/types';
import { toast } from 'sonner';

const statusConfig: Record<DocumentStatus, { label: string; icon: React.ReactNode; className: string }> = {
    BORRADOR: { label: 'Borrador', icon: <Clock className="h-3 w-3" />, className: 'bg-slate-100 text-slate-600 border-slate-200' },
    EN_REVISION: { label: 'En Revisión', icon: <AlertCircle className="h-3 w-3" />, className: 'bg-amber-50 text-amber-700 border-amber-200' },
    APROBADO: { label: 'Aprobado', icon: <CheckCircle2 className="h-3 w-3" />, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    OBSOLETO: { label: 'Obsoleto', icon: <XCircle className="h-3 w-3" />, className: 'bg-red-50 text-red-600 border-red-200' },
};

const typeLabels: Record<DocumentType, string> = {
    MANUAL: 'Manual', PROCEDIMIENTO: 'Procedimiento', INSTRUCTIVO: 'Instructivo',
    FORMATO: 'Formato', POLITICA: 'Política', REGISTRO: 'Registro', OTRO: 'Otro',
};

function getFileIcon(name?: string) {
    if (!name) return <File className="h-4 w-4 text-muted-foreground" />;
    if (name.endsWith('.pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
    if (name.endsWith('.docx') || name.endsWith('.doc')) return <FileText className="h-4 w-4 text-blue-600" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatFileSize(bytes?: number) {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentosPage() {
    const [documents, setDocuments] = useState<Document[]>(mockDocuments);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [showNew, setShowNew] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [newDoc, setNewDoc] = useState<Partial<Document>>({ type: 'PROCEDIMIENTO', status: 'BORRADOR' });

    const filtered = useMemo(() => {
        return documents.filter(d => {
            const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase());
            const matchType = filterType === 'ALL' || d.type === filterType;
            const matchStatus = filterStatus === 'ALL' || d.status === filterStatus;
            return matchSearch && matchType && matchStatus;
        });
    }, [documents, search, filterType, filterStatus]);

    const statCounts = {
        total: documents.length,
        aprobados: documents.filter(d => d.status === 'APROBADO').length,
        enRevision: documents.filter(d => d.status === 'EN_REVISION').length,
        borradores: documents.filter(d => d.status === 'BORRADOR').length,
    };

    const handleCreate = () => {
        if (!newDoc.code || !newDoc.name) { toast.error('Código y nombre son requeridos'); return; }
        const doc: Document = {
            id: `doc-${Date.now()}`,
            tenantId: 'tenant-1',
            code: newDoc.code!,
            name: newDoc.name!,
            type: (newDoc.type as DocumentType) || 'PROCEDIMIENTO',
            status: 'BORRADOR',
            processId: newDoc.processId,
            processName: mockProcesses.find(p => p.id === newDoc.processId)?.name,
            currentVersion: 1,
            createdBy: 'user-1',
            createdByName: 'Carlos Administrador',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setDocuments([doc, ...documents]);
        setShowNew(false);
        setNewDoc({ type: 'PROCEDIMIENTO', status: 'BORRADOR' });
        toast.success(`Documento "${doc.name}" creado`);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Listado Maestro de Documentos</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Cláusula 7.5 — Información documentada · Gestión y control de documentos del SGC
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Upload className="h-3.5 w-3.5 mr-2" />Cargar Documento</Button>
                    <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-3.5 w-3.5 mr-2" />Nuevo Documento</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Documentos', value: statCounts.total, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Aprobados', value: statCounts.aprobados, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'En Revisión', value: statCounts.enRevision, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Borradores', value: statCounts.borradores, color: 'text-slate-600', bg: 'bg-slate-50' },
                ].map(s => (
                    <Card key={s.label} className="border-0 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold", s.bg, s.color)}>
                                {s.value}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por código o nombre..."
                                className="pl-9 h-9"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los tipos</SelectItem>
                                {Object.entries(typeLabels).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los estados</SelectItem>
                                {Object.entries(statusConfig).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-24">Código</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Documento</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Tipo</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Proceso</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Versión</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Estado</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Archivo</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(doc => {
                                const status = statusConfig[doc.status];
                                return (
                                    <TableRow key={doc.id} className="group cursor-pointer" onClick={() => { setSelectedDoc(doc); setShowDetail(true); }}>
                                        <TableCell className="text-xs font-mono font-semibold text-primary">{doc.code}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getFileIcon(doc.fileName)}
                                                <span className="text-xs font-medium">{doc.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px] h-5">{typeLabels[doc.type]}</Badge></TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{doc.processName || '-'}</TableCell>
                                        <TableCell className="text-center"><Badge variant="secondary" className="text-[10px] h-5">v{doc.currentVersion}</Badge></TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[10px] h-5 gap-1", status.className)}>
                                                {status.icon}{status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground">{doc.fileName || '-'}</span>
                                                <span className="text-[10px] text-muted-foreground/60">{formatFileSize(doc.fileSize)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toast.info('Descargando...'); }}>
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setShowDetail(true); }}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                                        No se encontraron documentos
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Document Detail Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                {selectedDoc && (
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                {getFileIcon(selectedDoc.fileName)}
                                <div>
                                    <Badge variant="outline" className="text-[10px] mb-1">{selectedDoc.code}</Badge>
                                    <DialogTitle>{selectedDoc.name}</DialogTitle>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-3">
                                <div><p className="text-[10px] text-muted-foreground font-semibold uppercase">Tipo</p><p className="text-sm">{typeLabels[selectedDoc.type]}</p></div>
                                <div><p className="text-[10px] text-muted-foreground font-semibold uppercase">Proceso</p><p className="text-sm">{selectedDoc.processName || 'General'}</p></div>
                                <div><p className="text-[10px] text-muted-foreground font-semibold uppercase">Versión</p><p className="text-sm">v{selectedDoc.currentVersion}</p></div>
                            </div>
                            <div className="space-y-3">
                                <div><p className="text-[10px] text-muted-foreground font-semibold uppercase">Estado</p><Badge variant="outline" className={cn("text-[10px]", statusConfig[selectedDoc.status].className)}>{statusConfig[selectedDoc.status].label}</Badge></div>
                                <div><p className="text-[10px] text-muted-foreground font-semibold uppercase">Creado por</p><p className="text-sm">{selectedDoc.createdByName}</p></div>
                                <div><p className="text-[10px] text-muted-foreground font-semibold uppercase">Última actualización</p><p className="text-sm">{selectedDoc.updatedAt.toLocaleDateString('es-CO')}</p></div>
                            </div>
                        </div>
                        {selectedDoc.fileName && (
                            <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getFileIcon(selectedDoc.fileName)}
                                    <div>
                                        <p className="text-xs font-medium">{selectedDoc.fileName}</p>
                                        <p className="text-[10px] text-muted-foreground">{formatFileSize(selectedDoc.fileSize)}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => toast.info('Descargando...')}><Download className="h-3.5 w-3.5 mr-2" />Descargar</Button>
                            </div>
                        )}
                    </DialogContent>
                )}
            </Dialog>

            {/* New Document Dialog */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Nuevo Documento</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Código *</Label>
                                <Input placeholder="Ej: PR-02-P01" value={newDoc.code || ''} onChange={e => setNewDoc({ ...newDoc, code: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Tipo *</Label>
                                <Select value={newDoc.type} onValueChange={v => setNewDoc({ ...newDoc, type: v as DocumentType })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(typeLabels).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Nombre *</Label>
                            <Input placeholder="Nombre del documento" value={newDoc.name || ''} onChange={e => setNewDoc({ ...newDoc, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Proceso Asociado</Label>
                            <Select value={newDoc.processId || ''} onValueChange={v => setNewDoc({ ...newDoc, processId: v })}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar proceso" /></SelectTrigger>
                                <SelectContent>
                                    {mockProcesses.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Archivo</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Arrastra un archivo o haz clic para seleccionar</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1">PDF, Word, Excel — Máx 10MB</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
                        <Button onClick={handleCreate}><Save className="h-4 w-4 mr-2" />Crear Documento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
