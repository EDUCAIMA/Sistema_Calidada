"use client";

import { ModuleContent, ModuleHeader, ModulePage, ModuleToolbar } from '@/components/sgc/module-layout';

import Link from 'next/link';

import React, { useState, useRef } from 'react';
import { 
    Plus, Eye, Edit, ArrowRight, HelpCircle,
    Box, TrendingUp, Settings2,
    Download, Trash2, Archive, Printer, FileEdit, Check, Clock
} from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import { downloadStandardPdf, type PdfSection } from '@/lib/document-pdf';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockUsers } from '@/lib/mock-data';
import type { Process, ProcessCategory, ProcessCharacterization, PHVARow } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const categoryLabels: Record<ProcessCategory, string> = {
    ESTRATEGICO: 'Estratégicos',
    MISIONAL: 'Misionales',
    APOYO: 'De Apoyo',
    EVALUACION: 'Evaluación',
};
const categoryColors: Record<ProcessCategory, { bg: string; border: string; text: string; accent: string }> = {
    ESTRATEGICO: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', accent: 'bg-indigo-600' },
    MISIONAL: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-600' },
    APOYO: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-600' },
    EVALUACION: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', accent: 'bg-slate-600' },
};

function ProcessCard({ process, onView, onCharacterize }: { process: Process; onView: () => void; onCharacterize: () => void }) {
    const colors = categoryColors[process.category];
    return (
        <div className={cn(
            "group relative rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg cursor-pointer",
            colors.bg, colors.border, "hover:scale-[1.02]"
        )}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-[10px] h-5 font-bold", colors.text)}>
                            {process.code}
                        </Badge>
                    </div>
                    <h3 className="text-sm font-semibold truncate">{process.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{process.objective}</p>
                </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/10">
                <span className="text-[10px] text-muted-foreground">👤 {process.responsibleName}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onView(); }}>
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onCharacterize(); }}>
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function CharacterizationView({ process, characterization: initialChar, tenant, onClose, onRefresh }: { process: Process; characterization: ProcessCharacterization | null; tenant: any; onClose: () => void; onRefresh: () => void }) {
    const colors = categoryColors[process.category];
    const [isEditing, setIsEditing] = useState(false);
    
    // Default characterization if none exists
    const defaultChar: Partial<ProcessCharacterization> = {
        version: '1',
        date: new Date().toLocaleDateString(),
        planear: [],
        hacer: [],
        verificar: [],
        actuar: [],
        resources: [],
        indicators: [],
        documents: [],
        risks: [],
    };

    const [formData, setFormData] = useState<any>({
        ...(initialChar || defaultChar),
        objective: process.objective || '',
        scope: process.scope || '',
        responsibleId: process.responsibleId || ''
    });

    const [saving, setSaving] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

    const phaseConfig = {
        planear: { label: 'PLANEAR', color: 'bg-blue-600', headerBg: 'bg-blue-600', text: 'text-white' },
        hacer: { label: 'HACER', color: 'bg-emerald-600', headerBg: 'bg-emerald-600', text: 'text-white' },
        verificar: { label: 'VERIFICAR', color: 'bg-amber-600', headerBg: 'bg-amber-600', text: 'text-white' },
        actuar: { label: 'ACTUAR', color: 'bg-red-600', headerBg: 'bg-red-600', text: 'text-white' },
    };

    const cellClass = "px-1.5 py-1.5 text-[11px] border border-border/60 align-top";
    const headerCellClass = "px-1.5 py-1 text-[9px] font-bold uppercase tracking-wider border border-border/60 text-center";

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/procesos/caracterizacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    processId: process.id
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.details || data.error);
            
            toast.success('Caracterización guardada correctamente');
            setIsEditing(false);
            onRefresh();
        } catch (error: any) {
            console.error('Error saving:', error);
            const detailMsg = error?.message || 'Error desconocido';
            toast.error(`Error al guardar: ${detailMsg}`);
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = async () => {
        if (isEditing || !initialChar) {
            toast.error('Guarde la caracterización antes de descargar el PDF.');
            return;
        }
        const toastId = toast.loading('Generando PDF de caracterización...');
        try {
            const sections: PdfSection[] = [{
                title: 'Información del proceso',
                head: ['Campo', 'Información'],
                rows: [
                    ['Proceso', process.name],
                    ['Código del proceso', process.code],
                    ['Categoría', categoryLabels[process.category]],
                    ['Responsable', process.responsibleName || '—'],
                    ['Objetivo', formData.objective || '—'],
                    ['Alcance', formData.scope || '—'],
                    ['Fecha de caracterización', formData.date || 'Sin registrar'],
                ],
            }];
            (['planear', 'hacer', 'verificar', 'actuar'] as const).forEach(phase => {
                const rows: PHVARow[] = formData[phase] || [];
                if (rows.length === 0) return;
                sections.push({
                    title: phase.toUpperCase(),
                    head: ['Proveedores', 'Insumos', 'Actividad', 'Productos', 'Clientes'],
                    rows: rows.map(row => [
                        row.providers?.join(', ') || '—',
                        row.inputs?.join(', ') || '—',
                        row.activity || '—',
                        row.outputs?.join(', ') || '—',
                        row.clients?.join(', ') || '—',
                    ]),
                });
            });
            sections.push({
                head: ['Recursos', 'Documentos', 'Riesgos'],
                rows: [[
                    formData.resources?.join(', ') || 'N/A',
                    formData.documents?.join(', ') || 'N/A',
                    formData.risks?.join(', ') || 'N/A',
                ]],
            });
            if (formData.indicators?.length) {
                sections.push({
                    title: 'Indicadores del proceso',
                    head: ['Indicador', 'Fórmula', 'Frecuencia', 'Meta'],
                    rows: (formData.indicators as ProcessCharacterization['indicators']).map(indicator => [
                        indicator.name, indicator.formula, indicator.frequency, indicator.target,
                    ]),
                });
            }
            await downloadStandardPdf({
                tenantId: tenant.id,
                moduleKey: '4.4',
                title: `Caracterización del proceso: ${process.name}`,
                filename: `Caracterizacion_${process.code}.pdf`,
                metadata: { code: process.code, version: formData.version, status: 'Sin aprobación registrada', approvalDate: null },
                sections,
            });
            toast.success('PDF generado con éxito', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Error al generar PDF', { id: toastId });
        }
    };

    const addPHVARow = (phase: keyof typeof phaseConfig) => {
        const newRow: PHVARow = {
            id: `new-${Date.now()}`,
            providers: [],
            inputs: [],
            activity: '',
            outputs: [],
            clients: []
        };
        setFormData({ ...formData, [phase]: [...formData[phase], newRow] });
    };

    const updatePHVARow = (phase: string, rowId: string, field: string, value: any) => {
        const updatedPhase = formData[phase].map((row: any) => 
            row.id === rowId ? { ...row, [field]: value } : row
        );
        setFormData({ ...formData, [phase]: updatedPhase });
    };

    const removePHVARow = (phase: string, rowId: string) => {
        setFormData({ ...formData, [phase]: formData[phase].filter((r: any) => r.id !== rowId) });
    };

    return (
        <DialogContent className="max-w-5xl sm:max-w-5xl w-[92vw] max-h-[92vh] p-0 gap-0 overflow-hidden bg-white">
            <DialogHeader className="px-4 py-5 pr-12 sm:px-7 sm:pr-14 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-50 via-white to-slate-50">
                <div className="flex min-w-0 items-center gap-2">
                    <FileEdit className="w-5 h-5 text-indigo-600" />
                    <DialogTitle className="text-lg font-bold">
                        {isEditing ? 'Editando Caracterización' : 'Caracterización del Proceso: ' + process.name}
                    </DialogTitle>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {!isEditing ? (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                <Edit className="w-4 h-4" /> Editar
                            </Button>
                            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-100">
                                <Printer className="w-4 h-4" /> Imprimir
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                <Check className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </>
                    )}
                </div>
            </DialogHeader>

            <ScrollArea className="flex-1 max-h-[calc(92vh-60px)]">
                <div ref={componentRef} className="p-5 bg-white min-w-[850px]">
                    {/* ═══════════ DOCUMENT HEADER (formal) ═══════════ */}
                    <div className="border-2 border-slate-200 rounded-t-xl overflow-hidden">
                        <table className="w-full border-collapse">
                            <tbody>
                                <tr>
                                    <td rowSpan={3} className="w-[120px] border border-slate-200 p-3 text-center align-middle bg-slate-50/50">
                                        <div className={cn("h-14 w-14 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-lg", colors.accent)}>
                                            {process.code.split('-')[0]}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 font-bold tracking-tighter">VEXVEL SGC</p>
                                    </td>
                                    <td colSpan={4} className="border border-slate-200 px-3 py-1.5 text-center bg-slate-50/30">
                                        <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Sistema Integrado de Gestión</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="border border-slate-200 px-3 py-2 text-center">
                                        <p className="text-base font-black tracking-tight text-slate-800">PROCESO: {process.name.toUpperCase()}</p>
                                        <p className="text-[9px] text-slate-500 font-bold tracking-[0.3em] uppercase mt-0.5">Caracterización del Proceso</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-200 px-3 py-2 text-[11px] bg-white">
                                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Código:</span>
                                        <span className="font-black font-mono text-slate-700">{process.code}</span>
                                    </td>
                                    <td className="border border-slate-200 px-3 py-2 text-[11px] bg-white">
                                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Versión:</span>
                                        {isEditing ? (
                                            <input className="w-full font-black text-slate-700 border-none p-0 focus:ring-0" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} />
                                        ) : <span className="font-black text-slate-700">{formData.version}</span>}
                                    </td>
                                    <td className="border border-slate-200 px-3 py-2 text-[11px] bg-white">
                                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Fecha:</span>
                                        {isEditing ? (
                                            <input type="date" className="w-full font-black text-slate-700 border-none p-0 focus:ring-0" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                        ) : <span className="font-black text-slate-700">{formData.date}</span>}
                                    </td>
                                    <td className="border border-slate-200 px-3 py-2 text-[11px] bg-white">
                                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Página:</span>
                                        <span className="font-black text-slate-700">1 de 1</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ─── PROCESS INFO TABLE ─── */}
                    <table className="w-full border-collapse border-x-2 border-slate-200">
                        <tbody>
                            <tr>
                                <td className="w-[140px] bg-slate-100/80 border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
                                    Macroproceso
                                </td>
                                <td className="border border-slate-200 px-3 py-2 text-[11px]" colSpan={4}>
                                    <span className={cn("px-2.5 py-0.5 rounded-full font-bold", colors.bg, colors.text)}>
                                        {categoryLabels[process.category]}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-slate-100/80 border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
                                    Responsable
                                </td>
                                <td className="border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700" colSpan={4}>
                                    {isEditing ? (
                                        <Select value={formData.responsibleId} onValueChange={v => setFormData({...formData, responsibleId: v})}>
                                            <SelectTrigger className="h-7 border-none bg-slate-50 focus:ring-0 text-[11px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mockUsers.map(u => <SelectItem key={u.id} value={u.id} className="text-[11px]">{u.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (process.responsibleName || '—')}
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-slate-100/80 border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
                                    Objetivo
                                </td>
                                <td className="border border-slate-200 px-3 py-2 text-[11px] leading-relaxed text-slate-700" colSpan={4}>
                                    {isEditing ? (
                                        <textarea 
                                            className="w-full min-h-[50px] bg-slate-50 border-none rounded p-1.5 focus:ring-1 focus:ring-indigo-200 text-[11px]" 
                                            value={formData.objective} 
                                            onChange={e => setFormData({...formData, objective: e.target.value})}
                                        />
                                    ) : formData.objective}
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-slate-100/80 border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
                                    Alcance
                                </td>
                                <td className="border border-slate-200 px-3 py-2 text-[11px] leading-relaxed text-slate-700" colSpan={4}>
                                    {isEditing ? (
                                        <textarea 
                                            className="w-full min-h-[50px] bg-slate-50 border-none rounded p-1.5 focus:ring-1 focus:ring-indigo-200 text-[11px]" 
                                            value={formData.scope} 
                                            onChange={e => setFormData({...formData, scope: e.target.value})}
                                        />
                                    ) : formData.scope}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ─── PHVA TABLE: ENTRADAS → ACTIVIDADES → SALIDAS ─── */}
                    <div className="border-x-2 border-slate-200">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th colSpan={2} className={cn(headerCellClass, "bg-slate-700 text-white py-3")}>
                                        Entradas
                                    </th>
                                    <th rowSpan={2} className={cn(headerCellClass, "bg-slate-800 text-white w-[28%] py-3")}>
                                        Actividades
                                    </th>
                                    <th colSpan={2} className={cn(headerCellClass, "bg-slate-700 text-white py-3")}>
                                        Salidas
                                    </th>
                                </tr>
                                <tr>
                                    <th className={cn(headerCellClass, "bg-slate-600 text-white w-[14%]")}>Proveedor</th>
                                    <th className={cn(headerCellClass, "bg-slate-600 text-white w-[18%]")}>Insumos</th>
                                    <th className={cn(headerCellClass, "bg-slate-600 text-white w-[22%]")}>Productos</th>
                                    <th className={cn(headerCellClass, "bg-slate-600 text-white w-[18%]")}>Cliente</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(['planear', 'hacer', 'verificar', 'actuar'] as const).map(phase => {
                                    const config = phaseConfig[phase];
                                    const rows = formData[phase] || [];
                                    return (
                                        <React.Fragment key={phase}>
                                            {/* Phase header row */}
                                            <tr className="group">
                                                <td colSpan={5} className={cn(
                                                    "px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-center border border-slate-200 relative",
                                                    config.headerBg, config.text
                                                )}>
                                                    {config.label}
                                                    {isEditing && (
                                                        <Button 
                                                            variant="secondary" 
                                                            size="icon" 
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 bg-white/20 hover:bg-white/40 border-none text-white" 
                                                            onClick={() => addPHVARow(phase)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                            {/* Activity rows */}
                                            {rows.length === 0 && isEditing && (
                                                <tr><td colSpan={5} className="p-4 text-center text-slate-400 italic text-xs">Sin actividades registradas. Haz clic en + para agregar.</td></tr>
                                            )}
                                            {rows.map((row: any) => (
                                                <tr key={row.id} className="hover:bg-slate-50 transition-colors relative group">
                                                    {/* Proveedor */}
                                                    <td className={cellClass}>
                                                        {isEditing ? (
                                                            <textarea 
                                                                className="w-full bg-indigo-50/30 border-none text-[11px] p-1 font-medium min-h-[60px]" 
                                                                placeholder="Un proveedor por línea..."
                                                                value={row.providers?.join('\n') || ''} 
                                                                onChange={e => updatePHVARow(phase, row.id, 'providers', e.target.value.split('\n'))} 
                                                            />
                                                        ) : (
                                                            <ul className="space-y-1 list-none m-0 p-0 text-slate-600">
                                                                {row.providers?.map((p: any, i: any) => (
                                                                    <li key={i} className="flex items-start gap-1.5"><span className="h-1 w-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />{p}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </td>
                                                    {/* Insumos */}
                                                    <td className={cellClass}>
                                                        {isEditing ? (
                                                            <textarea 
                                                                className="w-full bg-indigo-50/30 border-none text-[11px] p-1 font-medium min-h-[60px]" 
                                                                placeholder="Un insumo por línea..."
                                                                value={row.inputs?.join('\n') || ''} 
                                                                onChange={e => updatePHVARow(phase, row.id, 'inputs', e.target.value.split('\n'))} 
                                                            />
                                                        ) : (
                                                            <ul className="space-y-1 list-none m-0 p-0 text-slate-600">
                                                                {row.inputs?.map((inp: any, i: any) => (
                                                                    <li key={i} className="flex items-start gap-1.5"><span className="h-1 w-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />{inp}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </td>
                                                    {/* Actividades */}
                                                    <td className={cn(cellClass, "text-[11px] leading-relaxed font-bold text-slate-800")}>
                                                        {isEditing ? (
                                                            <textarea 
                                                                className="w-full min-h-[60px] bg-white border border-slate-100 rounded p-1.5 shadow-sm"
                                                                value={row.activity} 
                                                                onChange={e => updatePHVARow(phase, row.id, 'activity', e.target.value)} 
                                                            />
                                                        ) : row.activity}
                                                    </td>
                                                    {/* Productos */}
                                                    <td className={cellClass}>
                                                        {isEditing ? (
                                                            <textarea 
                                                                className="w-full bg-indigo-50/30 border-none text-[11px] p-1 font-medium min-h-[60px]" 
                                                                placeholder="Un producto por línea..."
                                                                value={row.outputs?.join('\n') || ''} 
                                                                onChange={e => updatePHVARow(phase, row.id, 'outputs', e.target.value.split('\n'))} 
                                                            />
                                                        ) : (
                                                            <ul className="space-y-1 list-none m-0 p-0 text-slate-600">
                                                                {row.outputs?.map((out: any, i: any) => (
                                                                    <li key={i} className="flex items-start gap-1.5"><span className="h-1 w-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />{out}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </td>
                                                    {/* Cliente */}
                                                    <td className={cellClass}>
                                                        <div className="flex flex-col h-full">
                                                            {isEditing ? (
                                                                <textarea 
                                                                    className="w-full flex-1 bg-indigo-50/30 border-none text-[11px] p-1 font-medium min-h-[60px]" 
                                                                    placeholder="Un cliente por línea..."
                                                                    value={row.clients?.join('\n') || ''} 
                                                                    onChange={e => updatePHVARow(phase, row.id, 'clients', e.target.value.split('\n'))} 
                                                                />
                                                            ) : (
                                                                <ul className="space-y-1 list-none m-0 p-0 text-slate-600">
                                                                    {row.clients?.map((c: any, i: any) => (
                                                                        <li key={i} className="flex items-start gap-1.5"><span className="h-1 w-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />{c}</li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                            {isEditing && (
                                                                <button 
                                                                    className="p-1 mt-2 text-rose-400 hover:text-rose-600 transition-colors self-end"
                                                                    onClick={() => removePHVARow(phase, row.id)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ─── SECTION: RECURSOS, DOCUMENTOS Y RIESGOS (Resumen) ─── */}
                    <div className="border-2 border-slate-200 border-t-0 rounded-b-xl overflow-hidden grid grid-cols-3">
                        <div className="border-r border-slate-200">
                            <div className="bg-slate-700 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center">Recursos</div>
                            <div className="p-4 bg-white min-h-[100px]">
                                {isEditing ? (
                                    <textarea 
                                        className="w-full h-full min-h-[100px] border-none text-[11px] resize-none focus:ring-0" 
                                        value={formData.resources?.join('\n')} 
                                        onChange={e => setFormData({...formData, resources: e.target.value.split('\n')})}
                                        placeholder="Un recurso por línea..."
                                    />
                                ) : (
                                    <ul className="space-y-1.5">
                                        {formData.resources?.map((r: any) => <li key={r} className="text-xs flex items-center gap-2 text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-indigo-300" />{r}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div className="border-r border-slate-200">
                            <div className="bg-slate-700 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center">Documentos</div>
                            <div className="p-4 bg-white min-h-[100px]">
                                {isEditing ? (
                                    <textarea 
                                        className="w-full h-full min-h-[100px] border-none text-[11px] resize-none focus:ring-0" 
                                        value={formData.documents?.join('\n')} 
                                        onChange={e => setFormData({...formData, documents: e.target.value.split('\n')})}
                                        placeholder="Un documento por línea..."
                                    />
                                ) : (
                                    <ul className="space-y-1.5">
                                        {formData.documents?.map((d: any) => <li key={d} className="text-xs flex items-center gap-2 text-slate-600 font-mono"><span className="w-1.5 h-1.5 rounded-full bg-sky-300" />{d}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="bg-slate-700 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center">Riesgos</div>
                            <div className="p-4 bg-white min-h-[100px]">
                                {isEditing ? (
                                    <textarea 
                                        className="w-full h-full min-h-[100px] border-none text-[11px] resize-none focus:ring-0" 
                                        value={formData.risks?.join('\n')} 
                                        onChange={e => setFormData({...formData, risks: e.target.value.split('\n')})}
                                        placeholder="Un riesgo por línea..."
                                    />
                                ) : (
                                    <ul className="space-y-1.5">
                                        {formData.risks?.map((r: any) => <li key={r} className="text-xs flex items-center gap-2 text-slate-600 text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-rose-300" />{r}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </DialogContent>
    );
}

import { useApp } from '@/context/app-context';
import { useEffect } from 'react';

export default function ProcessMapPage() {
    const { tenant, currentUser } = useApp();
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
    const [showCharacterization, setShowCharacterization] = useState(false);
    const [showNewProcess, setShowNewProcess] = useState(false);
    const [newProcess, setNewProcess] = useState<Partial<Process>>({ category: 'MISIONAL' });
    const [showISOInfo, setShowISOInfo] = useState(false);
    
    // Document Metadata State (Configurable)
    const [docMetadata, setDocMetadata] = useState({
        code: '',
        version: '01',
        approvalDate: ''
    });
    const [showConfig, setShowConfig] = useState(false);

    const mapRef = useRef<HTMLDivElement>(null);

    const fetchProcesses = async () => {
        try {
            const res = await fetch(`/api/procesos?tenantId=${tenant.id}`);
            const data = await res.json();
            if (data && !data.error) {
                setProcesses(data);
                if (selectedProcess) {
                  const updated = data.find((p: any) => p.id === selectedProcess.id);
                  if (updated) setSelectedProcess(updated);
                }
            }
        } catch (error) {
            console.error('Error fetching processes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchMetadata = async () => {
            setDocMetadata({ code: '', version: '01', approvalDate: '' });
            try {
                const res = await fetch(`/api/formatos?tenantId=${tenant.id}&moduleKey=4.4`);
                const data = await res.json();
                if (data && !data.error) {
                    setDocMetadata({
                        code: data.code,
                        version: data.version,
                        approvalDate: data.approvalDate
                    });
                }
            } catch (error) {
                console.error('Error fetching metadata:', error);
            }
        };

        fetchProcesses();
        if (tenant?.id) {
            fetchMetadata();
        }
    }, [tenant?.id]);

    const handleCreateProcess = async () => {
        if (!newProcess.name || !newProcess.code) {
            toast.error('Nombre y código son requeridos');
            return;
        }
        
        try {
            const isEditing = !!newProcess.id;
            const res = await fetch('/api/procesos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newProcess.id,
                    tenantId: tenant.id,
                    name: newProcess.name,
                    code: newProcess.code,
                    category: newProcess.category,
                    objective: newProcess.objective,
                    scope: newProcess.scope,
                    responsibleId: currentUser?.id || 'user-1',
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (isEditing) {
                setProcesses(processes.map(p => p.id === data.id ? { ...data, responsibleName: p.responsibleName } : p));
                toast.success(`Proceso "${data.name}" actualizado`);
            } else {
                setProcesses([...processes, { ...data, responsibleName: currentUser?.name || '—' }]);
                toast.success(`Proceso "${data.name}" guardado exitosamente`);
            }
            setShowNewProcess(false);
            setNewProcess({ category: 'MISIONAL' });
        } catch (error) {
            toast.error('Error al guardar el proceso');
        }
    };

    const handleArchiveProcess = async (id: string, name: string) => {
        if (!confirm(`¿Deseas archivar el proceso "${name}"? Dejará de aparecer en el mapa de procesos activos. Se conservarán sus responsabilidades, documentos, riesgos e historial.`)) return;

        try {
            const res = await fetch(`/api/procesos?id=${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'No se pudo archivar el proceso.');

            setProcesses(previous => previous.filter(p => p.id !== id));
            if (selectedProcess?.id === id) {
                setSelectedProcess(null);
                setShowCharacterization(false);
            }
            toast.success('Proceso archivado. Sus registros e historial se conservan.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No se pudo archivar el proceso.');
        }
    };

    const handleDownload = async () => {
        if (!mapRef.current) return;
        const toastId = toast.loading('Exportando mapa de procesos...');
        try {
            // Capturamos el mapa usando modern-screenshot que soporta lab/oklch
            const dataUrl = await domToPng(mapRef.current, {
                scale: 2,
                backgroundColor: '#f8fafc',
            });

            await downloadStandardPdf({
                tenantId: tenant.id,
                moduleKey: '4.4',
                title: 'Mapa de procesos',
                filename: 'Mapa_de_Procesos.pdf',
                orientation: 'landscape',
                sections: [{ image: { dataUrl } }, {
                    title: 'Relación de procesos',
                    head: ['Código', 'Proceso', 'Categoría', 'Responsable', 'Objetivo'],
                    rows: processes.map(process => [
                        process.code, process.name, categoryLabels[process.category],
                        process.responsibleName || '—', process.objective || '—',
                    ]),
                }],
            });
            toast.success('¡PDF descargado con éxito!', { id: toastId });

        } catch (error) {
            console.error('ERROR_DOWNLOADING_PDF:', error);
            toast.error(error instanceof Error ? error.message : 'No se pudo generar el PDF.', { id: toastId });
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#136dec]"></div>
        </div>
    );

    return (
        <ModulePage>
            <ModuleHeader clause="4.4" title="Mapa de procesos" description="Consulte los procesos activos y sus interacciones. Los procesos archivados conservan sus responsabilidades, registros e historial." actions={<>
                <Button variant="outline" onClick={() => setShowISOInfo(true)} aria-label="Ver información normativa ISO 9001:2015"><HelpCircle className="h-4 w-4" />Guía ISO</Button>
                <Button variant="outline"><Clock className="h-4 w-4" />Historial</Button>
                <Button variant="outline" onClick={handleDownload}><Download className="h-4 w-4 text-red-500" />Descargar mapa</Button>
                <Button onClick={() => { setNewProcess({ category: 'MISIONAL' }); setShowNewProcess(true); }}><Plus className="h-4 w-4" />Nuevo proceso</Button>
            </>} />
            <ModuleToolbar>
                <button type="button" className="flex flex-wrap items-center gap-2 text-left text-xs font-medium text-slate-600 transition-colors hover:text-blue-600" onClick={() => setShowConfig(true)} aria-label="Configurar metadatos del mapa de procesos">
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Código: {docMetadata.code || 'Automático según estándar'}</span>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Versión: {docMetadata.version}</span>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Aprobación: {docMetadata.approvalDate || 'Sin registrar'}</span>
                </button>
            </ModuleToolbar>
            <ModuleContent>
            {/* ═══════════ NEW PROCESS MAP DESIGN (LINEAR STYLE) ═══════════ */}
            <div ref={mapRef} className="relative rounded-2xl border border-slate-100 bg-slate-50/50 shadow-sm overflow-hidden min-h-[900px] flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 group">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #64748b 1px, transparent 0)', backgroundSize: '24px 24px' }} />


                <div className="flex flex-col lg:flex-row items-stretch justify-center w-full gap-4 z-10">
                    {/* Left Bar: Requirements (Stakeholders) */}
                    <div className="flex flex-col items-center justify-center w-full lg:w-16 xl:w-20 bg-white rounded-2xl border border-slate-100 py-4 lg:py-12 relative overflow-hidden group/sidebar shadow-sm shrink-0 transition-all hover:border-blue-200">
                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity"></div>
                        <span className="lg:[writing-mode:vertical-lr] lg:rotate-180 text-sm font-semibold text-slate-700">Partes interesadas</span>
                        <p className="lg:[writing-mode:vertical-lr] lg:rotate-180 mt-2 lg:mt-8 text-sm text-blue-600">Requerimientos</p>
                    </div>

                    {/* Flow Arrow (Input) */}
                    <div className="hidden lg:flex flex-col justify-center shrink-0">
                        <div className="text-blue-600/20">
                            <ArrowRight className="w-10 h-10" strokeWidth={3} />
                        </div>
                    </div>

                    {/* The Core Map: Main Flow */}
                    <div className="min-w-0 flex-1 flex flex-col items-center gap-3 relative">
                        
                        {/* 1. STRATEGIC PROCESSES */}
                        <div className="w-full">
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 sm:p-6 shadow-sm transition-all hover:bg-emerald-50">
                                <div className="flex items-center justify-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        <h3 className="text-emerald-700 text-sm font-semibold">Procesos Estratégicos</h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {processes.filter(p => p.category === 'ESTRATEGICO').map(p => (
                                        <div key={p.id} className="group/item relative">
                                            <div 
                                                onClick={() => { setSelectedProcess(p); setShowCharacterization(true); }}
                                                className="min-h-16 flex items-center justify-center bg-emerald-600 rounded-2xl border-2 border-emerald-500 shadow-sm hover:bg-emerald-700 hover:scale-[1.02] transition-all cursor-pointer p-4 text-center"
                                            >
                                                <p className="text-sm font-semibold text-white leading-snug tracking-tight">{p.name}</p>
                                            </div>
                                            <div className="absolute top-[-8px] right-[-8px] flex gap-1 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 lg:group-focus-within/item:opacity-100 transition-opacity z-30">
                                                <button onClick={(e) => { e.stopPropagation(); setNewProcess(p); setShowNewProcess(true); }} className="p-1.5 bg-white rounded-lg shadow-md border border-emerald-100 text-emerald-600 hover:bg-emerald-50">
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button title="Archivar proceso" aria-label={`Archivar ${p.name}`} onClick={(e) => { e.stopPropagation(); handleArchiveProcess(p.id, p.name); }} className="p-1.5 bg-white rounded-lg shadow-md border border-red-100 text-red-600 hover:bg-red-50">
                                                    <Archive className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Flow Arrow (Strategic -> Misional) */}
                        <div className="text-slate-200">
                            <ArrowRight className="w-8 h-8 rotate-90" />
                        </div>

                        {/* 2. MISIONAL PROCESSES */}
                        <div className="w-full">
                            <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 sm:p-6 shadow-sm relative z-20">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                                    Valor Agregado
                                </div>
                                <div className="flex items-center justify-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <Box className="w-6 h-6 text-blue-600" />
                                        <h3 className="text-blue-900 text-sm font-semibold">Procesos Misionales</h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {processes.filter(p => p.category === 'MISIONAL').map(p => (
                                        <div key={p.id} className="group/item relative">
                                            <div 
                                                onClick={() => { setSelectedProcess(p); setShowCharacterization(true); }}
                                                className="min-h-20 flex items-center justify-center bg-blue-600 rounded-2xl border-2 border-blue-500 shadow-md hover:bg-blue-700 hover:scale-[1.05] transition-all cursor-pointer p-5 text-center"
                                            >
                                                <p className="text-sm font-semibold text-white leading-snug">{p.name}</p>
                                            </div>
                                            <div className="absolute top-[-10px] right-[-10px] flex gap-1 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 lg:group-focus-within/item:opacity-100 transition-opacity z-30">
                                                <button onClick={(e) => { e.stopPropagation(); setNewProcess(p); setShowNewProcess(true); }} className="p-2 bg-white rounded-xl shadow-lg border border-blue-100 text-blue-600 hover:bg-blue-50">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button title="Archivar proceso" aria-label={`Archivar ${p.name}`} onClick={(e) => { e.stopPropagation(); handleArchiveProcess(p.id, p.name); }} className="p-2 bg-white rounded-xl shadow-lg border border-red-100 text-red-600 hover:bg-red-50">
                                                    <Archive className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Flow Arrow (Misional -> Support) */}
                        <div className="text-slate-200">
                            <ArrowRight className="w-8 h-8 -rotate-90" />
                        </div>

                        {/* 3. SUPPORT PROCESSES */}
                        <div className="w-full">
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 sm:p-6 shadow-sm transition-all hover:bg-amber-50">
                                <div className="flex items-center justify-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <Settings2 className="w-5 h-5 text-amber-600" />
                                        <h3 className="text-amber-700 text-sm font-semibold">Procesos de Apoyo</h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {processes.filter(p => p.category === 'APOYO').map(p => (
                                        <div key={p.id} className="group/item relative">
                                            <div 
                                                onClick={() => { setSelectedProcess(p); setShowCharacterization(true); }}
                                                className="min-h-16 flex items-center justify-center bg-amber-500 rounded-2xl border-2 border-amber-400 shadow-sm hover:bg-amber-600 hover:scale-[1.02] transition-all cursor-pointer p-4 text-center"
                                            >
                                                <p className="text-sm font-semibold text-white leading-snug tracking-tight">{p.name}</p>
                                            </div>
                                            <div className="absolute top-[-8px] right-[-8px] flex gap-1 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 lg:group-focus-within/item:opacity-100 transition-opacity z-30">
                                                <button onClick={(e) => { e.stopPropagation(); setNewProcess(p); setShowNewProcess(true); }} className="p-1.5 bg-white rounded-lg shadow-md border border-amber-100 text-amber-600 hover:bg-amber-50">
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button title="Archivar proceso" aria-label={`Archivar ${p.name}`} onClick={(e) => { e.stopPropagation(); handleArchiveProcess(p.id, p.name); }} className="p-1.5 bg-white rounded-lg shadow-md border border-red-100 text-red-600 hover:bg-red-50">
                                                    <Archive className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Flow Arrow (Output) */}
                    <div className="hidden lg:flex flex-col justify-center shrink-0">
                        <div className="text-blue-600/20">
                            <ArrowRight className="w-10 h-10" strokeWidth={3} />
                        </div>
                    </div>

                    {/* Right Bar: Satisfaction (Stakeholders) */}
                    <div className="flex flex-col items-center justify-center w-full lg:w-16 xl:w-20 bg-blue-600 rounded-2xl border border-blue-500 py-4 lg:py-12 relative overflow-hidden group/sidebar shadow-sm shrink-0 transition-all hover:bg-blue-700">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/sidebar:opacity-100 transition-opacity"></div>
                        <span className="lg:[writing-mode:vertical-lr] text-sm font-semibold text-white">Partes interesadas</span>
                        <p className="lg:[writing-mode:vertical-lr] mt-2 lg:mt-8 text-sm text-white/90">Satisfacción</p>
                    </div>
                </div>
            </div>

            {/* Characterization Dialog */}
            <Dialog open={showCharacterization} onOpenChange={setShowCharacterization}>
                {selectedProcess && (
                    <CharacterizationView
                        key={selectedProcess.id}
                        process={selectedProcess}
                        characterization={selectedProcess.characterization as any}
                        tenant={tenant}
                        onClose={() => setShowCharacterization(false)}
                        onRefresh={fetchProcesses}
                    />
                )}
            </Dialog>

            {/* New Process Dialog */}
            <Dialog open={showNewProcess} onOpenChange={setShowNewProcess}>
                <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[94vh] sm:max-w-2xl bg-white border-0 p-0 gap-0 overflow-y-auto rounded-3xl shadow-2xl">
                    <div className="px-4 py-5 pr-12 sm:px-7 sm:pr-14 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-600 text-white">
                                {newProcess.id ? <Edit className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
                            </div>
                            <DialogTitle className="text-xl font-semibold text-slate-900">
                                {newProcess.id ? 'Editar Proceso' : 'Nuevo Proceso'}
                            </DialogTitle>
                        </div>
                    </div>
                    
                    <div className="px-4 py-6 sm:px-7 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <Label className="text-sm font-semibold text-slate-500">Código del Proceso *</Label>
                                <Input 
                                    className="bg-white border border-slate-200 h-11 rounded-xl text-sm font-medium"
                                    placeholder="Ej: PR-01" 
                                    value={newProcess.code || ''} 
                                    onChange={e => setNewProcess({ ...newProcess, code: e.target.value.toUpperCase() })} 
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="text-sm font-semibold text-slate-500">Macroproceso *</Label>
                                <Select value={newProcess.category} onValueChange={v => {
                                    setNewProcess({ ...newProcess, category: v as ProcessCategory });
                                }}>
                                    <SelectTrigger className="bg-slate-50/50 border border-slate-200 h-11 rounded-xl font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ESTRATEGICO">Estratégico</SelectItem>
                                        <SelectItem value="MISIONAL">Misional</SelectItem>
                                        <SelectItem value="APOYO">Apoyo</SelectItem>
                                        <SelectItem value="EVALUACION">Evaluación</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-500">Nombre del Proceso *</Label>
                            <Input 
                                className="bg-white border border-slate-200 h-11 rounded-xl text-sm font-medium"
                                placeholder="Ej: GESTIÓN COMERCIAL" 
                                value={newProcess.name || ''} 
                                onChange={e => setNewProcess({ ...newProcess, name: e.target.value.toUpperCase() })} 
                            />
                        </div>
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-500">Objetivo del Proceso</Label>
                            <Textarea 
                                className="bg-white border border-slate-200 rounded-xl p-4 min-h-[100px] text-sm"
                                placeholder="Describa el propósito..." 
                                value={newProcess.objective || ''} 
                                onChange={e => setNewProcess({ ...newProcess, objective: e.target.value })} 
                            />
                        </div>
                    </div>

                    <div className="px-4 py-4 sm:px-7 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-end gap-3">
                        <Button variant="ghost" className="font-medium text-sm h-11 rounded-xl px-6" onClick={() => setShowNewProcess(false)}>Cancelar</Button>
                        <Button onClick={handleCreateProcess} className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700">
                            {newProcess.id ? 'Actualizar Proceso' : 'Guardar Proceso'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ISO 9001:2015 Clause 4.4 Info Dialog */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden flex flex-col p-0 gap-0 font-sans">
                    <DialogHeader className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                            <DialogTitle className="text-3xl font-bold text-gray-900 tracking-tight">
                                4 Contexto de la organización
                            </DialogTitle>
                            <h2 className="text-xl font-medium text-[#1e3a8a]">
                                4.4 Sistema de gestión de la calidad y sus procesos
                            </h2>
                        </div>
                    </DialogHeader>
                    <div className="px-6 pt-4 pb-8 space-y-6 bg-white overflow-y-auto max-h-[60vh]">
                        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-5 space-y-4">
                            <section className="space-y-6">
                                <p className="text-lg text-gray-800 leading-relaxed italic">
                                    La organización <strong className="font-black text-gray-900 not-italic">debe</strong> establecer, implementar, mantener y mejorar continuamente un sistema de gestión de la calidad, incluidos los procesos necesarios y sus interacciones.
                                </p>
                                <p className="text-lg text-gray-800 leading-relaxed italic">
                                    En la medida en que sea necesario, la organización <strong className="font-black text-gray-900 not-italic">debe</strong>:
                                </p>
                                <div className="flex flex-col gap-4 text-lg text-gray-800 leading-relaxed italic md:ml-6 text-left">
                                    <p>a) mantener información documentada para apoyar la operación de sus procesos;</p>
                                    <p>b) conservar la información documentada para tener la confianza de que los procesos se realizan según lo planificado.</p>
                                </div>
                            </section>
                        </div>
                    </div>
                    <footer className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-xs text-gray-400 font-bold tracking-tight uppercase">
                            SISTEMA DE GESTIÓN DE LA CALIDAD (SGC)
                        </div>
                        <Button 
                            onClick={() => setShowISOInfo(false)}
                            className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold py-3 px-10 rounded shadow-md transition-all duration-200 ease-in-out active:scale-95 h-auto uppercase tracking-wider"
                        >
                            ENTENDIDO
                        </Button>
                    </footer>
                </DialogContent>
            </Dialog>

            {/* Configuration Dialog */}
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Estándar documental de la empresa</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-600">El logo, el encabezado, los tipos documentales y los códigos se administran en un único lugar. Las descargas PDF usan siempre esa configuración.</p>
                    <Button asChild><Link href="/apoyo/estandar-documental">Abrir estándar documental</Link></Button>
                </DialogContent>
            </Dialog>
            </ModuleContent>
        </ModulePage>
    );
}
