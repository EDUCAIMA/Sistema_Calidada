"use client";

import React, { useState } from 'react';
import { Plus, Eye, Edit, ChevronRight, ArrowRight, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { mockProcesses, mockCharacterization, mockUsers } from '@/lib/mock-data';
import type { Process, ProcessCategory, ProcessCharacterization, PHVARow } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const categoryLabels: Record<ProcessCategory, string> = {
    ESTRATEGICO: 'Estratégicos',
    MISIONAL: 'Misionales',
    APOYO: 'De Apoyo',
};
const categoryColors: Record<ProcessCategory, { bg: string; border: string; text: string; accent: string }> = {
    ESTRATEGICO: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', accent: 'bg-indigo-600' },
    MISIONAL: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-600' },
    APOYO: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-600' },
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

function CharacterizationView({ process, characterization, onClose }: { process: Process; characterization: ProcessCharacterization; onClose: () => void }) {
    const colors = categoryColors[process.category];

    const phaseConfig = {
        planear: { label: 'PLANEAR', color: 'bg-blue-600', headerBg: 'bg-blue-600', text: 'text-white' },
        hacer: { label: 'HACER', color: 'bg-emerald-600', headerBg: 'bg-emerald-600', text: 'text-white' },
        verificar: { label: 'VERIFICAR', color: 'bg-amber-600', headerBg: 'bg-amber-600', text: 'text-white' },
        actuar: { label: 'ACTUAR', color: 'bg-red-600', headerBg: 'bg-red-600', text: 'text-white' },
    };

    const cellClass = "px-3 py-2.5 text-xs border border-border/60 align-top";
    const headerCellClass = "px-3 py-2 text-[10px] font-bold uppercase tracking-wider border border-border/60 text-center";

    return (
        <DialogContent className="max-w-7xl sm:max-w-7xl w-[95vw] max-h-[92vh] p-0 gap-0 overflow-hidden">

            {/* ═══════════ DOCUMENT HEADER (formal) ═══════════ */}
            <div className="border-b-2 border-border">
                <table className="w-full border-collapse">
                    <tbody>
                        {/* Row 1: Title block */}
                        <tr>
                            <td rowSpan={3} className="w-[120px] border border-border/60 p-3 text-center align-middle bg-muted/30">
                                <div className={cn("h-14 w-14 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-lg shadow-md", colors.accent)}>
                                    {process.code.split('-')[0]}
                                </div>
                                <p className="text-[9px] text-muted-foreground mt-1.5 font-medium">SGC SaaS</p>
                            </td>
                            <td colSpan={4} className="border border-border/60 px-4 py-1.5 text-center">
                                <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Sistema Integrado de Gestión</p>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={4} className="border border-border/60 px-4 py-1 text-center">
                                <p className="text-sm font-bold tracking-wide">PROCESO: {process.name.toUpperCase()}</p>
                                <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Caracterización del Proceso</p>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-border/60 px-3 py-1.5 text-[10px]">
                                <span className="text-muted-foreground font-medium">Código: </span>
                                <span className="font-bold font-mono">{process.code}</span>
                            </td>
                            <td className="border border-border/60 px-3 py-1.5 text-[10px]">
                                <span className="text-muted-foreground font-medium">Versión: </span>
                                <span className="font-bold">{characterization.version}</span>
                            </td>
                            <td className="border border-border/60 px-3 py-1.5 text-[10px]">
                                <span className="text-muted-foreground font-medium">Fecha: </span>
                                <span className="font-bold">{characterization.date}</span>
                            </td>
                            <td className="border border-border/60 px-3 py-1.5 text-[10px]">
                                <span className="text-muted-foreground font-medium">Página: </span>
                                <span className="font-bold">1 de 1</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ═══════════ SCROLLABLE CONTENT ═══════════ */}
            <ScrollArea className="flex-1 max-h-[calc(92vh-130px)]">
                <div className="px-0">

                    {/* ─── PROCESS INFO TABLE ─── */}
                    <table className="w-full border-collapse">
                        <tbody>
                            <tr>
                                <td className="w-[160px] bg-muted/50 border border-border/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                                    Tipo de Proceso
                                </td>
                                <td className="border border-border/60 px-4 py-2.5 text-xs" colSpan={4}>
                                    <div className="flex items-center gap-6">
                                        {(['ESTRATEGICO', 'MISIONAL', 'APOYO'] as ProcessCategory[]).map(cat => (
                                            <label key={cat} className="flex items-center gap-1.5 cursor-default">
                                                <div className={cn(
                                                    "h-3.5 w-3.5 rounded border-2 flex items-center justify-center",
                                                    process.category === cat
                                                        ? "border-emerald-600 bg-emerald-600"
                                                        : "border-muted-foreground/30"
                                                )}>
                                                    {process.category === cat && (
                                                        <span className="text-white text-[8px] font-bold">✓</span>
                                                    )}
                                                </div>
                                                <span className={cn(
                                                    "text-xs",
                                                    process.category === cat ? "font-semibold" : "text-muted-foreground"
                                                )}>
                                                    {categoryLabels[cat]}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-muted/50 border border-border/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                                    Responsable
                                </td>
                                <td className="border border-border/60 px-4 py-2.5 text-xs" colSpan={4}>
                                    {process.responsibleName || '—'}
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-muted/50 border border-border/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                                    Objetivo
                                </td>
                                <td className="border border-border/60 px-4 py-2.5 text-xs leading-relaxed" colSpan={4}>
                                    {process.objective}
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-muted/50 border border-border/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                                    Alcance
                                </td>
                                <td className="border border-border/60 px-4 py-2.5 text-xs leading-relaxed" colSpan={4}>
                                    {process.scope}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ─── PHVA TABLE: ENTRADAS → ACTIVIDADES → SALIDAS ─── */}
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th colSpan={2} className={cn(headerCellClass, "bg-slate-700 text-white")}>
                                    Entradas
                                </th>
                                <th rowSpan={2} className={cn(headerCellClass, "bg-slate-800 text-white w-[28%]")}>
                                    Actividades
                                </th>
                                <th colSpan={2} className={cn(headerCellClass, "bg-slate-700 text-white")}>
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
                                const rows = characterization[phase];
                                return (
                                    <React.Fragment key={phase}>
                                        {/* Phase header row */}
                                        <tr>
                                            <td colSpan={5} className={cn(
                                                "px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-center border border-border/60",
                                                config.headerBg, config.text
                                            )}>
                                                {config.label}
                                            </td>
                                        </tr>
                                        {/* Activity rows */}
                                        {rows.map((row) => (
                                            <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                                                {/* Proveedor */}
                                                <td className={cellClass}>
                                                    <ul className="space-y-1 list-none m-0 p-0">
                                                        {row.providers.map((p, i) => (
                                                            <li key={i} className="flex items-start gap-1.5">
                                                                <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                                                                <span>{p}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                {/* Insumos */}
                                                <td className={cellClass}>
                                                    <ul className="space-y-1 list-none m-0 p-0">
                                                        {row.inputs.map((inp, i) => (
                                                            <li key={i} className="flex items-start gap-1.5">
                                                                <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                                                                <span>{inp}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                {/* Actividades */}
                                                <td className={cn(cellClass, "text-xs leading-relaxed")}>
                                                    {row.activity}
                                                </td>
                                                {/* Productos */}
                                                <td className={cellClass}>
                                                    <ul className="space-y-1 list-none m-0 p-0">
                                                        {row.outputs.map((out, i) => (
                                                            <li key={i} className="flex items-start gap-1.5">
                                                                <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                                                                <span>{out}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                {/* Cliente */}
                                                <td className={cellClass}>
                                                    <ul className="space-y-1 list-none m-0 p-0">
                                                        {row.clients.map((c, i) => (
                                                            <li key={i} className="flex items-start gap-1.5">
                                                                <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                                                                <span>{c}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* ─── SECTION: INDICADORES DE GESTIÓN ─── */}
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th colSpan={4} className={cn(headerCellClass, "bg-slate-700 text-white")}>
                                    Indicadores de Gestión
                                </th>
                            </tr>
                            <tr>
                                <th className={cn(headerCellClass, "bg-slate-600 text-white w-[25%]")}>Indicador</th>
                                <th className={cn(headerCellClass, "bg-slate-600 text-white")}>Fórmula de Cálculo</th>
                                <th className={cn(headerCellClass, "bg-slate-600 text-white w-[15%]")}>Frecuencia</th>
                                <th className={cn(headerCellClass, "bg-slate-600 text-white w-[12%]")}>Meta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {characterization.indicators.map(ind => (
                                <tr key={ind.id} className="hover:bg-muted/20 transition-colors">
                                    <td className={cn(cellClass, "font-semibold")}>{ind.name}</td>
                                    <td className={cn(cellClass, "font-mono text-[11px] text-muted-foreground")}>{ind.formula}</td>
                                    <td className={cn(cellClass, "text-center")}>
                                        <Badge variant="secondary" className="text-[10px] h-5">{ind.frequency}</Badge>
                                    </td>
                                    <td className={cn(cellClass, "text-center")}>
                                        <Badge className="text-[10px] h-5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{ind.target}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* ─── SECTION: RECURSOS, DOCUMENTOS Y RIESGOS ─── */}
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className={cn(headerCellClass, "bg-slate-700 text-white")}>Recursos</th>
                                <th className={cn(headerCellClass, "bg-slate-700 text-white")}>Documentos Asociados</th>
                                <th className={cn(headerCellClass, "bg-slate-700 text-white")}>Riesgos Identificados</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {/* Resources */}
                                <td className={cn(cellClass, "align-top")}>
                                    <ul className="space-y-1.5 list-none m-0 p-0">
                                        {characterization.resources.map(r => (
                                            <li key={r} className="flex items-start gap-2">
                                                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0 mt-1" />
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                {/* Documents */}
                                <td className={cn(cellClass, "align-top")}>
                                    <ul className="space-y-1.5 list-none m-0 p-0">
                                        {characterization.documents.map(d => {
                                            const parts = d.split(' ');
                                            const code = parts[0];
                                            const name = parts.slice(1).join(' ');
                                            return (
                                                <li key={d} className="flex items-start gap-2">
                                                    <Badge variant="outline" className="text-[8px] h-4 font-mono bg-sky-50 text-sky-700 border-sky-200 shrink-0 mt-0.5">{code}</Badge>
                                                    <span>{name}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </td>
                                {/* Risks */}
                                <td className={cn(cellClass, "align-top")}>
                                    <ul className="space-y-1.5 list-none m-0 p-0">
                                        {characterization.risks.map(r => (
                                            <li key={r} className="flex items-start gap-2">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0 mt-1" />
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            </tr>
                        </tbody>
                    </table>

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

    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const res = await fetch(`/api/procesos?tenantId=${tenant.id}`);
                const data = await res.json();
                if (data && !data.error) {
                    setProcesses(data);
                }
            } catch (error) {
                console.error('Error fetching processes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProcesses();
    }, [tenant.id]);

    const handleCreateProcess = async () => {
        if (!newProcess.name || !newProcess.code) {
            toast.error('Nombre y código son requeridos');
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
                    objective: newProcess.objective,
                    scope: newProcess.scope,
                    responsibleId: currentUser?.id || 'user-1',
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setProcesses([...processes, { ...data, responsibleName: currentUser?.name || '—' }]);
            setShowNewProcess(false);
            setNewProcess({ category: 'MISIONAL' });
            toast.success(`Proceso "${data.name}" guardado exitosamente`);
        } catch (error) {
            toast.error('Error al guardar el proceso');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mapa de Procesos</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Cláusula 8 — Operación · Visualización y gestión de procesos organizacionales
                    </p>
                </div>
                <Button onClick={() => setShowNewProcess(true)} className="shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proceso
                </Button>
            </div>

            {/* ═══════════ VISUAL PROCESS MAP ═══════════ */}
            <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl border-2 border-slate-200/80 overflow-hidden" style={{ minHeight: '720px' }}>
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                {/* ═══ TOP ROW: Estratégicos (left) + Misionales (right) ═══ */}
                <div className="relative grid grid-cols-2 gap-4 px-6 pt-6 pb-2 z-10">
                    {/* Estratégicos panel */}
                    <div className="rounded-xl border-2 border-orange-300 bg-white shadow-lg shadow-orange-100/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">Procesos Estratégicos</h3>
                        </div>
                        <div className="p-3 space-y-1">
                            {processes.filter(p => p.category === 'ESTRATEGICO').map(process => (
                                <button
                                    key={process.id}
                                    onClick={() => { setSelectedProcess(process); setShowCharacterization(true); }}
                                    className="w-full text-left flex items-start gap-2 p-1.5 rounded-lg hover:bg-orange-50 transition-colors group"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                                    <span className="text-xs text-slate-700 group-hover:text-orange-700 transition-colors">{process.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Misionales panel */}
                    <div className="rounded-xl border-2 border-sky-300 bg-white shadow-lg shadow-sky-100/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">Procesos Misionales</h3>
                        </div>
                        <div className="p-3 space-y-1">
                            {processes.filter(p => p.category === 'MISIONAL').map(process => (
                                <button
                                    key={process.id}
                                    onClick={() => { setSelectedProcess(process); setShowCharacterization(true); }}
                                    className="w-full text-left flex items-start gap-2 p-1.5 rounded-lg hover:bg-sky-50 transition-colors group"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                                    <span className="text-xs text-slate-700 group-hover:text-sky-700 transition-colors">{process.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ CENTER ROW: Requisitos → WHEEL → Satisfacción ═══ */}
                <div className="relative flex items-center justify-center px-6 py-2 z-10">
                    {/* Requisitos Arrow (left) */}
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/90 backdrop-blur rounded-xl border-2 border-slate-300 px-4 py-3 shadow-md z-20">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requisitos y</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Necesidades</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400" />
                    </div>

                    {/* Satisfacción Arrow (right) */}
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/90 backdrop-blur rounded-xl border-2 border-emerald-300 px-4 py-3 shadow-md z-20">
                        <ArrowRight className="h-5 w-5 text-emerald-500" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Satisfacción</p>
                    </div>

                    {/* CIRCULAR PHVA WHEEL */}
                    <div className="relative flex items-center justify-center" style={{ width: '380px', height: '380px' }}>
                        {/* Outer ring */}
                        <div className="absolute inset-0 rounded-full border-[3px] border-slate-300/50" style={{ width: '380px', height: '380px' }} />

                        {/* MAPA DE PROCESOS title */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-0.5 z-10">
                            <p className="text-base font-extrabold tracking-tight text-slate-700 text-center">MAPA</p>
                            <p className="text-[9px] font-bold tracking-widest text-slate-500 text-center -mt-0.5">DE PROCESOS</p>
                        </div>

                        {/* Inner wheel SVG — 3 slices of 120° */}
                        <div className="relative" style={{ width: '300px', height: '300px' }}>
                            <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-xl">
                                <defs>
                                    <linearGradient id="grad-est" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#f97316" />
                                        <stop offset="100%" stopColor="#ea580c" />
                                    </linearGradient>
                                    <linearGradient id="grad-mis" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#0ea5e9" />
                                        <stop offset="100%" stopColor="#0284c7" />
                                    </linearGradient>
                                    <linearGradient id="grad-apo" x1="0%" y1="100%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#7c3aed" />
                                    </linearGradient>
                                </defs>

                                {/* 3 equal pie slices (120° each), center=(150,150), r=130 */}
                                {/* Points: top=(150,20), bottom-right=(263,215), bottom-left=(37,215) */}

                                {/* Estratégicos (orange) — top slice: center → top, arc CW to bottom-right, back to center */}
                                <path d="M 150 150 L 150 20 A 130 130 0 0 1 263 215 Z" fill="url(#grad-est)" />
                                {/* Misionales (blue) — bottom-right slice: center → bottom-right, arc CW to bottom-left */}
                                <path d="M 150 150 L 263 215 A 130 130 0 0 1 37 215 Z" fill="url(#grad-mis)" />
                                {/* Apoyo (violet) — bottom-left slice: center → bottom-left, arc CW to top */}
                                <path d="M 150 150 L 37 215 A 130 130 0 0 1 150 20 Z" fill="url(#grad-apo)" />

                                {/* Segment divider lines */}
                                <line x1="150" y1="150" x2="150" y2="20" stroke="white" strokeWidth="3" />
                                <line x1="150" y1="150" x2="263" y2="215" stroke="white" strokeWidth="3" />
                                <line x1="150" y1="150" x2="37" y2="215" stroke="white" strokeWidth="3" />

                                {/* Text labels — centered in each slice */}
                                {/* Estratégicos (top) */}
                                <text x="150" y="82" textAnchor="middle" fill="white" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>PROCESOS</text>
                                <text x="150" y="94" textAnchor="middle" fill="white" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>ESTRATÉGICOS</text>

                                {/* Misionales (bottom-right) */}
                                <text x="215" y="195" textAnchor="middle" fill="white" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>PROCESOS</text>
                                <text x="215" y="207" textAnchor="middle" fill="white" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>MISIONALES</text>

                                {/* Apoyo (bottom-left) */}
                                <text x="85" y="195" textAnchor="middle" fill="white" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>PROCESOS</text>
                                <text x="85" y="207" textAnchor="middle" fill="white" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>DE APOYO</text>

                                {/* Center circle */}
                                <circle cx="150" cy="150" r="52" fill="white" stroke="#e2e8f0" strokeWidth="2" />
                                <text x="150" y="142" textAnchor="middle" fill="#334155" style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.02em' }}>SISTEMA</text>
                                <text x="150" y="158" textAnchor="middle" fill="#334155" style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.02em' }}>DE GESTIÓN</text>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* ═══ BOTTOM ROW: Apoyo ═══ */}
                <div className="relative flex justify-center px-6 pt-2 pb-6 z-10">
                    <div className="w-full max-w-md rounded-xl border-2 border-violet-300 bg-white shadow-lg shadow-violet-100/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-4 py-2">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">Procesos de Apoyo</h3>
                        </div>
                        <div className="p-3 space-y-1">
                            {processes.filter(p => p.category === 'APOYO').map(process => (
                                <button
                                    key={process.id}
                                    onClick={() => { setSelectedProcess(process); setShowCharacterization(true); }}
                                    className="w-full text-left flex items-start gap-2 p-1.5 rounded-lg hover:bg-violet-50 transition-colors group"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                                    <span className="text-xs text-slate-700 group-hover:text-violet-700 transition-colors">{process.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Characterization Dialog */}
            <Dialog open={showCharacterization} onOpenChange={setShowCharacterization}>
                {selectedProcess && (
                    <CharacterizationView
                        process={selectedProcess}
                        characterization={mockCharacterization}
                        onClose={() => setShowCharacterization(false)}
                    />
                )}
            </Dialog>

            {/* New Process Dialog */}
            <Dialog open={showNewProcess} onOpenChange={setShowNewProcess}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Proceso</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Código *</Label>
                                <Input placeholder="Ej: PR-02" value={newProcess.code || ''} onChange={e => setNewProcess({ ...newProcess, code: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Categoría *</Label>
                                <Select value={newProcess.category} onValueChange={v => setNewProcess({ ...newProcess, category: v as ProcessCategory })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ESTRATEGICO">Estratégico</SelectItem>
                                        <SelectItem value="MISIONAL">Misional</SelectItem>
                                        <SelectItem value="APOYO">Apoyo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Nombre del Proceso *</Label>
                            <Input placeholder="Ej: Control de Calidad" value={newProcess.name || ''} onChange={e => setNewProcess({ ...newProcess, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Objetivo</Label>
                            <Textarea placeholder="Describir el objetivo del proceso..." value={newProcess.objective || ''} onChange={e => setNewProcess({ ...newProcess, objective: e.target.value })} rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Alcance</Label>
                            <Input placeholder="Ej: Toda la organización" value={newProcess.scope || ''} onChange={e => setNewProcess({ ...newProcess, scope: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewProcess(false)}>Cancelar</Button>
                        <Button onClick={handleCreateProcess}><Save className="h-4 w-4 mr-2" />Crear Proceso</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
