"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { toast } from 'sonner';
import {
    Target, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Eye, LineChart, CheckCircle2, AlertCircle,
    Calendar, User, ClipboardList, TrendingUp, History,
    Save, X, ArrowRight, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentHeader } from '@/components/DocumentHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';


export default function ObjetivosPage() {
    const { tenant } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [objectives, setObjectives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedObjective, setSelectedObjective] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [trackingData, setTrackingData] = useState({
        note: '',
        progress: 0
    });

    // Document Metadata State (ISO Header)
    const [docMetadata, setDocMetadata] = useState({
        code: 'PLA-REG-001',
        version: '01',
        approvalDate: new Date().toISOString().split('T')[0]
    });

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        indicator: '',
        target: '',
        responsible: '',
        deadline: '',
        evaluationFreq: '',
        resources: ''
    });

    useEffect(() => {
        const fetchObjectives = async () => {
            if (!tenant?.id) return;
            try {
                const res = await fetch(`/api/planificacion/objetivos?tenantId=${tenant.id}`, {
                    cache: 'no-store',
                    headers: { 'Pragma': 'no-cache' }
                });
                const data = await res.json();
                if (data && !data.error) {
                    // Normalize responsibleName → responsible for display
                    const normalized = data.map((obj: any) => ({
                        ...obj,
                        responsible: obj.responsibleName || obj.responsible || '',
                        deadline: obj.deadline ? new Date(obj.deadline).toISOString().split('T')[0] : ''
                    }));
                    setObjectives(normalized);
                }
            } catch (error) {
                console.error('Error fetching objectives:', error);
                toast.error('Error al cargar objetivos');
            } finally {
                setLoading(false);
            }
        };

        fetchObjectives();
        
        const fetchMetadata = async () => {
            if (!tenant?.id) return;
            try {
                const res = await fetch(`/api/formatos?tenantId=${tenant.id}&moduleKey=6.2`);
                const data = await res.json();
                if (data && !data.error) {
                    setDocMetadata({
                        code: data.code || 'PLA-REG-001',
                        version: data.version || '01',
                        approvalDate: data.approvalDate || new Date().toISOString().split('T')[0]
                    });
                }
            } catch (error) {
                console.error('Error fetching metadata:', error);
            }
        };
        fetchMetadata();
    }, [tenant?.id]);

    const handleDownloadPDF = async () => {
        try {
            toast.loading('Preparando documento...', { id: 'pdf-gen' });
            
            // portrait, millimeters, letter
            const doc = new jsPDF('p', 'mm', 'letter');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;

            const safeTenantName = tenant?.name || "SISTEMA DE GESTIÓN DE CALIDAD";
            const safeCode = docMetadata.code || 'PLA-REG-001';
            const safeVersion = docMetadata.version || '01';
            const safeDate = docMetadata.approvalDate || new Date().toISOString().split('T')[0];

            // --- 1. ENCABEZADO FORMAL ISO (ESTILO TABLA) ---
            const headerHeight = 24;
            const col1Width = 40; // Logo
            const col3Width = 55; // Metadata
            const col2Width = pageWidth - (margin * 2) - col1Width - col3Width; // Title

            // Outer box
            doc.setDrawColor(30, 41, 59);
            doc.setLineWidth(0.5);
            doc.rect(margin, margin, pageWidth - (margin * 2), headerHeight);
            
            // Vertical separators
            doc.line(margin + col1Width, margin, margin + col1Width, margin + headerHeight);
            doc.line(margin + col1Width + col2Width, margin, margin + col1Width + col2Width, margin + headerHeight);

            // Metadata grid (sub-cells in 3rd column)
            const rowH = headerHeight / 3;
            doc.line(margin + col1Width + col2Width, margin + rowH, pageWidth - margin, margin + rowH);
            doc.line(margin + col1Width + col2Width, margin + 2 * rowH, pageWidth - margin, margin + 2 * rowH);
            
            const labelW = 15;
            doc.line(margin + col1Width + col2Width + labelW, margin, margin + col1Width + col2Width + labelW, margin + headerHeight);

            // --- CONTENT: LOGO ---
            if (tenant?.logo) {
                try {
                    // Pre-load image to ensure it renders in PDF
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = tenant.logo;
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        // Timeout after 3s to not block forever
                        setTimeout(resolve, 3000);
                    });
                    doc.addImage(img, 'PNG', margin + 5, margin + 3, col1Width - 10, headerHeight - 6, undefined, 'FAST');
                } catch (e) {
                    doc.setFontSize(7).setFont('helvetica', 'bold');
                    doc.text(safeTenantName.substring(0, 15).toUpperCase(), margin + col1Width/2, margin + headerHeight/2 + 2, { align: 'center', maxWidth: col1Width - 4 });
                }
            } else {
                doc.setFontSize(7).setFont('helvetica', 'bold');
                doc.text(safeTenantName.substring(0, 15).toUpperCase(), margin + col1Width/2, margin + headerHeight/2 + 2, { align: 'center', maxWidth: col1Width - 4 });
            }

            // --- CONTENT: TITLE ---
            doc.setFontSize(11).setFont('helvetica', 'bold');
            doc.text("MATRIZ DE OBJETIVOS DE CALIDAD", margin + col1Width + col2Width/2, margin + headerHeight/2 + 2, { align: 'center', maxWidth: col2Width - 4 });

            // --- CONTENT: METADATA ---
            doc.setFontSize(7).setFont('helvetica', 'bold');
            const metaXLabel = margin + col1Width + col2Width + 2;
            const metaXValue = margin + col1Width + col2Width + labelW + (col3Width - labelW)/2;
            
            // Row 1: Code
            doc.text("CÓDIGO", metaXLabel, margin + rowH/2 + 1.5);
            doc.setFont('helvetica', 'normal').text(safeCode, metaXValue, margin + rowH/2 + 1.5, { align: 'center' });
            
            // Row 2: Version
            doc.setFont('helvetica', 'bold').text("VERSIÓN", metaXLabel, margin + rowH + rowH/2 + 1.5);
            doc.setFont('helvetica', 'normal').text(String(safeVersion), metaXValue, margin + rowH + rowH/2 + 1.5, { align: 'center' });
            
            // Row 3: Date
            doc.setFont('helvetica', 'bold').text("FECHA", metaXLabel, margin + 2*rowH + rowH/2 + 1.5);
            doc.setFont('helvetica', 'normal').text(safeDate, metaXValue, margin + 2*rowH + rowH/2 + 1.5, { align: 'center' });

            let currentY = margin + headerHeight + 10;

            // --- 2. TABLA DE OBJETIVOS ---
            const tableData = objectives.map(obj => [
                obj.description.toUpperCase(),
                `${obj.target}\n(${obj.indicator})`,
                obj.responsibleName || obj.responsible || 'N/A',
                obj.deadline ? new Date(obj.deadline).toLocaleDateString('es-ES') : 'N/A',
                `${obj.progress}%`,
                obj.status.toUpperCase()
            ]);

            autoTable(doc, {
                startY: currentY,
                margin: { left: margin, right: margin },
                head: [['OBJETIVO / QUÉ SE VA A HACER', 'META / INDICADOR', 'RESPONSABLE', 'FECHA LÍMITE', 'AVANCE', 'ESTADO']],
                body: tableData,
                theme: 'grid',
                headStyles: { 
                    fillColor: [30, 41, 59], 
                    textColor: [255, 255, 255], 
                    fontSize: 7, 
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle'
                },
                styles: { 
                    fontSize: 6.5, 
                    cellPadding: 3,
                    overflow: 'linebreak',
                    textColor: [51, 65, 85]
                },
                columnStyles: {
                    0: { cellWidth: 'auto' }, // Objetivo
                    1: { cellWidth: 35 },      // Meta
                    2: { cellWidth: 32 },      // Responsable
                    3: { cellWidth: 22, halign: 'center' }, // Fecha
                    4: { cellWidth: 14, halign: 'center' }, // Avance
                    5: { cellWidth: 22, halign: 'center' }  // Estado
                },
                didDrawPage: (data) => {
                    // Footer with page number
                    const str = "Página " + doc.getNumberOfPages();
                    doc.setFontSize(7);
                    doc.setTextColor(150);
                    doc.text(str, pageWidth - margin - 20, pageHeight - 10);
                    doc.text("Generado por SGC SaaS", margin, pageHeight - 10);
                }
            });

            // --- 3. SECCIÓN DE FIRMA ---
            const finalY = (doc as any).lastAutoTable.finalY || currentY;
            const spaceNeeded = 40;
            
            // Check if there is enough space on the current page, otherwise add a new one
            if (finalY + spaceNeeded > pageHeight - margin) {
                doc.addPage();
                doc.setDrawColor(30, 41, 59);
                doc.setLineWidth(0.5);
                // Redraw header on the new page if it's for signature? (Optional, usually not needed)
            }

            const signatureY = Math.max(finalY + 25, pageHeight - 45);
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(margin + 60, signatureY, margin + 130, signatureY);
            doc.setFontSize(8).setFont('helvetica', 'bold');
            doc.text("FIRMA REPRESENTANTE LEGAL", margin + 95, signatureY + 5, { align: 'center' });

            doc.save(`OBJETIVOS_CALIDAD_${safeTenantName.replace(/ /g, '_').toUpperCase()}.pdf`);
            toast.success('Documento descargado exitosamente');
        } catch (error) {
            console.error('Error generando PDF:', error);
            toast.error('Error al generar el PDF');
        }
    };

    const filteredObjectives = objectives.filter(obj =>
        obj.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (obj.responsibleName || obj.responsible || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async () => {
        if (!formData.description || !formData.target) {
            toast.error('La descripción y la meta son obligatorias');
            return;
        }

        try {
            const res = await fetch('/api/planificacion/objetivos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: tenant.id,
                    ...formData
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setObjectives([
                { ...data, responsible: data.responsibleName || data.responsible || '', deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '' },
                ...objectives
            ]);
            setFormData({
                description: '',
                indicator: '',
                target: '',
                responsible: '',
                deadline: '',
                evaluationFreq: '',
                resources: ''
            });
            setIsCreateOpen(false);
            toast.success('Objetivo guardado exitosamente');
        } catch (error) {
            toast.error('Error al guardar el objetivo');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/planificacion/objetivos?id=${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setObjectives(objectives.filter(obj => obj.id !== id));
            toast.success('Objetivo eliminado');
        } catch (error) {
            toast.error('Error al eliminar el objetivo');
        }
    };

    const handleSaveTracking = async () => {
        if (!selectedObjective || !trackingData.note) {
            toast.error('La nota de seguimiento es obligatoria');
            return;
        }
        
        try {
            const res = await fetch('/api/planificacion/objetivos/tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    objectiveId: selectedObjective.id,
                    ...trackingData
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Actualizar estado local
            const updatedObjectives = objectives.map(obj => {
                if (obj.id === selectedObjective.id) {
                    return {
                        ...obj,
                        progress: trackingData.progress,
                        tracking: [data, ...(obj.tracking || [])]
                    };
                }
                return obj;
            });
            setObjectives(updatedObjectives);
            setSelectedObjective({
                ...selectedObjective, 
                progress: trackingData.progress, 
                tracking: [data, ...(selectedObjective.tracking || [])]
            });
            setTrackingData({ ...trackingData, note: '' });
            toast.success('Seguimiento registrado exitosamente');
        } catch (error) {
            toast.error('Error al registrar el seguimiento');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Logrado':
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full px-3 py-1 font-medium shadow-none flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    🟢 Al día
                </Badge>;
            case 'En Riesgo':
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200 rounded-full px-3 py-1 font-medium shadow-none flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    🟡 En Riesgo
                </Badge>;
            case 'Retrasado':
                return <Badge className="bg-rose-50 text-rose-700 border-rose-200 rounded-full px-3 py-1 font-medium shadow-none flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    🔴 Atrasado
                </Badge>;
            default:
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-full px-3 py-1 font-medium shadow-none flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    🔵 En progreso
                </Badge>;
        }
    };

    const handleRowClick = (obj: any) => {
        setSelectedObjective(obj);
        setTrackingData({
            note: '',
            progress: obj.progress || 0
        });
        setIsDetailOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white animate-fade-in min-h-screen">
            {/* Header Moderno y Minimalista */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-8 border-b border-slate-100 bg-slate-50/30">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">6.2 Objetivos de <span className="text-blue-600">Calidad</span></h1>
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        <Badge variant="outline" className="bg-white text-[10px] font-bold uppercase tracking-wider">ISO 9001:2015</Badge>
                        Planeación y control de metas institucionales
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={handleDownloadPDF}
                        variant="outline" 
                        className="h-12 rounded-xl border-slate-200 text-slate-700 font-bold px-5 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Download className="w-5 h-5 text-red-500" />
                        Descargar PDF
                    </Button>
                    <Button 
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-12 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo Objetivo
                    </Button>
                </div>
            </div>

            {/* Barra de Búsqueda y Filtros */}
            <div className="px-8 py-6 flex items-center gap-4 bg-slate-50/50">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por descripción o responsable..."
                        className="pl-11 h-11 bg-white border-slate-200 rounded-xl focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 font-medium px-4">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                </Button>
            </div>

            {/* Tabla Principal */}
            <div className="flex-1 px-8 pb-10">
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
                                <TableHead className="font-bold text-slate-600 h-14 pl-6">Objetivo / Qué se va a hacer</TableHead>
                                <TableHead className="font-bold text-slate-600 h-14">Meta / Indicador</TableHead>
                                <TableHead className="font-bold text-slate-600 h-14">Responsable</TableHead>
                                <TableHead className="font-bold text-slate-600 h-14">Cumplimiento</TableHead>
                                <TableHead className="font-bold text-slate-600 h-14">Estado</TableHead>
                                <TableHead className="font-bold text-slate-600 h-14 text-right pr-6">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredObjectives.map((obj) => (
                                <TableRow 
                                    key={obj.id} 
                                    onClick={() => handleRowClick(obj)}
                                    className="group cursor-pointer hover:bg-blue-50/20 transition-colors border-b border-slate-50 last:border-0"
                                >
                                    <TableCell className="pl-6 py-6 max-w-sm">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                                                {obj.description}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{obj.target}</span>
                                            <span className="text-[11px] text-slate-500 italic">{obj.indicator}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">{obj.responsible}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 w-32">
                                            <div className="flex justify-between text-[11px] font-bold">
                                                <span className="text-slate-400 uppercase tracking-tighter">Progreso</span>
                                                <span className="text-blue-600">{obj.progress}%</span>
                                            </div>
                                            <Progress value={obj.progress} className="h-1.5 bg-slate-100" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(obj.status)}
                                    </TableCell>
                                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-white hover:shadow-md rounded-lg">
                                                    <MoreVertical className="h-5 w-5 text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl">
                                                <DropdownMenuItem onClick={() => handleRowClick(obj)} className="gap-2 py-2.5 font-medium cursor-pointer">
                                                    <Eye className="h-4 w-4 text-blue-500" /> Seguimiento
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 py-2.5 font-medium cursor-pointer">
                                                    <Edit className="h-4 w-4 text-slate-500" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={() => handleDelete(obj.id)}
                                                    className="gap-2 py-2.5 font-medium cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                                >
                                                    <Trash2 className="h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal de Creación (Panel Lateral) */}
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                    <SheetHeader className="pb-6 border-b border-slate-100">
                        <SheetTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Target className="w-6 h-6" />
                            </div>
                            Planificación de Objetivo
                        </SheetTitle>
                        <SheetDescription>
                            Define los parámetros requeridos por la norma ISO 9001:2015 para la gestión de calidad.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-6 py-8">
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-blue-500" />
                                ¿Qué se va a hacer? (Descripción)
                            </Label>
                            <Textarea 
                                placeholder="Ej: Aumentar la eficiencia en el proceso de ensamblaje..."
                                className="min-h-[100px] rounded-xl focus:ring-blue-500 border-slate-200"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                    ¿Cómo se medirá?
                                </Label>
                                <Input 
                                    placeholder="Nombre del indicador" 
                                    className="rounded-xl" 
                                    value={formData.indicator}
                                    onChange={(e) => setFormData({...formData, indicator: e.target.value})}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700">Meta esperada</Label>
                                <Input 
                                    placeholder="Ej: > 90%" 
                                    className="rounded-xl" 
                                    value={formData.target}
                                    onChange={(e) => setFormData({...formData, target: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-500" />
                                ¿Quién es el responsable?
                            </Label>
                            <Input 
                                placeholder="Nombre del cargo o responsable" 
                                className="rounded-xl" 
                                value={formData.responsible}
                                onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    ¿Cuándo finalizará?
                                </Label>
                                <Input 
                                    type="date" 
                                    className="rounded-xl" 
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700">Frecuencia de Evaluación</Label>
                                <Select 
                                    value={formData.evaluationFreq}
                                    onValueChange={(val) => setFormData({...formData, evaluationFreq: val})}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Mensual">Mensual</SelectItem>
                                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                                        <SelectItem value="Semestral">Semestral</SelectItem>
                                        <SelectItem value="Anual">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700">¿Qué recursos se requerirán?</Label>
                            <Textarea 
                                placeholder="Personal, herramientas, presupuesto, etc."
                                className="rounded-xl border-slate-200"
                                value={formData.resources}
                                onChange={(e) => setFormData({...formData, resources: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                        <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-bold" onClick={handleSave}>Guardar Objetivo</Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Panel de Detalle y Seguimiento (Seguimiento Simple) */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                    {selectedObjective && (
                        <>
                            <SheetHeader className="pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    {getStatusBadge(selectedObjective.status)}
                                </div>
                                <SheetTitle className="text-2xl font-bold leading-tight">
                                    {selectedObjective.description}
                                </SheetTitle>
                                <SheetDescription className="pt-2">
                                    Seguimiento y Plan de Acción - ISO 9001:2015
                                </SheetDescription>
                            </SheetHeader>

                            <div className="py-8 space-y-8">
                                {/* Info Clave */}
                                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta</p>
                                        <p className="text-xl font-black text-slate-900 italic">{selectedObjective.target}</p>
                                        <p className="text-[11px] text-slate-500">{selectedObjective.indicator}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual</p>
                                        <p className="text-xl font-black text-blue-600 italic">{selectedObjective.actual}</p>
                                        <div className="w-full h-1.5 bg-blue-100 rounded-full mt-2">
                                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${selectedObjective.progress}%` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Detalles de Planeación */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                        <ClipboardList className="w-4 h-4 text-blue-500" />
                                        Detalles de Planeación
                                    </h4>
                                    <div className="grid gap-4">
                                        <div className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-xl">
                                            <User className="w-4 h-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Responsable</p>
                                                <p className="text-sm font-semibold">{selectedObjective.responsible}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-xl">
                                            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha Límite</p>
                                                <p className="text-sm font-semibold">{selectedObjective.deadline}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-xl">
                                            <TrendingUp className="w-4 h-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Recursos Asignados</p>
                                                <p className="text-sm font-medium text-slate-600 italic">{selectedObjective.resources}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección de Seguimiento / Plan de Acción */}
                                <div className="space-y-4 pt-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                        <History className="w-4 h-4 text-blue-500" />
                                        Historial de Seguimiento
                                    </h4>
                                    
                                    {/* Campo para nueva actualización */}
                                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-tight">Registrar nueva actualización</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Nuevo Progreso:</span>
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    max="100"
                                                    value={trackingData.progress}
                                                    onChange={(e) => setTrackingData({...trackingData, progress: parseInt(e.target.value) || 0})}
                                                    className="w-16 h-8 bg-white border border-blue-200 rounded-lg text-center text-xs font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-xs font-bold text-blue-600">%</span>
                                            </div>
                                        </div>
                                        <Textarea 
                                            placeholder="Ej: Medición de Junio: 94% - Se optimizaron los procesos..."
                                            className="bg-white rounded-xl border-blue-200 focus:ring-blue-500 text-sm"
                                            value={trackingData.note}
                                            onChange={(e) => setTrackingData({...trackingData, note: e.target.value})}
                                        />
                                        <div className="flex justify-end">
                                            <Button 
                                                onClick={handleSaveTracking}
                                                size="sm" 
                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 font-bold"
                                            >
                                                <Save className="w-3.5 h-3.5 mr-2" /> Guardar Seguimiento
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Lista de actualizaciones previas */}
                                    <div className="space-y-3 mt-6">
                                        {selectedObjective.tracking?.map((item: any, idx: number) => (
                                            <div key={idx} className="relative pl-6 pb-6 border-l border-slate-100 last:pb-0">
                                                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                {new Date(item.date).toLocaleDateString()}
                                                            </span>
                                                            <Badge variant="outline" className="text-[9px] font-bold h-4 px-1 bg-slate-50">
                                                                {item.progress}% Avance
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-600 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                                                        {item.note}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <Button variant="outline" className="w-full rounded-xl h-12 font-bold" onClick={() => setIsDetailOpen(false)}>Cerrar Detalles</Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
