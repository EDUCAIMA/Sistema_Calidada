"use client";

import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Eye, Edit, Save, AlertTriangle, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { mockRiskMatrices, mockRisks, mockProcesses } from '@/lib/mock-data';
import type { Risk, RiskType, RiskLevel, ActionStatus } from '@/lib/types';
import { toast } from 'sonner';

const riskTypeLabels: Record<RiskType, string> = {
    OPERACIONAL: 'Operacional', CALIDAD: 'Calidad', SST: 'SST', AMBIENTAL: 'Ambiental', OTRO: 'Otro',
};
const riskTypeIcons: Record<RiskType, { icon: React.ReactNode; color: string; bg: string; accent: string }> = {
    OPERACIONAL: { icon: <Save className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-50', accent: 'bg-blue-500' },
    CALIDAD: { icon: <ShieldCheck className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'bg-emerald-500' },
    SST: { icon: <ShieldAlert className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-50', accent: 'bg-amber-500' },
    AMBIENTAL: { icon: <ShieldX className="h-4 w-4" />, color: 'text-green-600', bg: 'bg-green-50', accent: 'bg-green-500' },
    OTRO: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-slate-600', bg: 'bg-slate-50', accent: 'bg-slate-500' },
};
const levelConfig: Record<RiskLevel, { label: string; color: string; bg: string; accent: string }> = {
    BAJO: { label: 'Bajo', color: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'bg-emerald-500' },
    MEDIO: { label: 'Medio', color: 'text-amber-600', bg: 'bg-amber-50', accent: 'bg-amber-500' },
    ALTO: { label: 'Alto', color: 'text-orange-600', bg: 'bg-orange-50', accent: 'bg-orange-500' },
    CRITICO: { label: 'Crítico', color: 'text-rose-600', bg: 'bg-rose-50', accent: 'bg-rose-500' },
};
const statusLabels: Record<ActionStatus, string> = {
    ABIERTA: 'Abierta', EN_PROGRESO: 'En Progreso', CERRADA: 'Cerrada', VENCIDA: 'Vencida',
};

function HeatMap({ risks }: { risks: Risk[] }) {
    const matrix: (Risk[])[][] = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => []));
    risks.forEach(r => {
        if (r.probability >= 1 && r.probability <= 5 && r.impact >= 1 && r.impact <= 5) {
            matrix[5 - r.probability][r.impact - 1].push(r);
        }
    });

    const getCellColor = (prob: number, impact: number) => {
        const val = prob * impact;
        if (val >= 15) return 'bg-rose-500/90 hover:bg-rose-600';
        if (val >= 9) return 'bg-orange-400/90 hover:bg-orange-500';
        if (val >= 4) return 'bg-amber-400/80 hover:bg-amber-500';
        return 'bg-emerald-400/80 hover:bg-emerald-500';
    };

    return (
        <div className="p-8 bg-white border border-slate-200">
            <div className="flex gap-4">
                {/* Y-axis label */}
                <div className="flex flex-col items-center justify-center w-12 border-r border-slate-100 pr-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                        Probabilidad
                    </span>
                </div>
                <div className="flex-1">
                    {/* Y-axis values */}
                    <div className="flex">
                        <div className="w-8 flex flex-col justify-between py-4 pr-3">
                            {[5, 4, 3, 2, 1].map(p => (
                                <div key={p} className="h-16 flex items-center justify-end text-[10px] font-bold text-slate-300">{p}</div>
                            ))}
                        </div>
                        {/* Grid */}
                        <div className="flex-1 grid grid-rows-5 gap-1.5 p-1.5 bg-slate-50 border border-slate-100">
                            {matrix.map((row, rowIdx) => (
                                <div key={rowIdx} className="grid grid-cols-5 gap-1.5">
                                    {row.map((cell, colIdx) => {
                                        const prob = 5 - rowIdx;
                                        const impact = colIdx + 1;
                                        return (
                                            <div
                                                key={colIdx}
                                                className={cn(
                                                    "h-16 flex flex-col items-center justify-center transition-all cursor-pointer relative group/cell shadow-sm",
                                                    getCellColor(prob, impact)
                                                )}
                                            >
                                                <span className="text-[11px] font-black text-white/40 group-hover/cell:text-white/100 transition-colors uppercase italic">{prob * impact}</span>
                                                {cell.length > 0 && (
                                                    <div className="absolute top-1 right-1 h-5 min-w-5 px-1 bg-white flex items-center justify-center rounded-none border border-slate-200 shadow-sm">
                                                        <span className="text-[10px] font-black text-slate-900">{cell.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* X-axis */}
                    <div className="flex ml-8 mt-1.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex-1 text-center text-[10px] font-bold text-slate-300">{i}</div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center mt-4 border-t border-slate-100 pt-4 ml-8">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impacto</span>
                    </div>
                </div>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-10 mt-8 pt-8 border-t border-slate-50">
                {[
                    { label: 'Bajo', range: '1-3', color: 'bg-emerald-400' },
                    { label: 'Medio', range: '4-8', color: 'bg-amber-400' },
                    { label: 'Alto', range: '9-14', color: 'bg-orange-400' },
                    { label: 'Crítico', range: '15-25', color: 'bg-rose-500' },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-3">
                        <div className={cn("h-4 w-4 shadow-sm", l.color)} />
                        <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase italic leading-none">{l.label}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1">{l.range}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function RiskMatrixPage() {
    const [risks, setRisks] = useState<Risk[]>(mockRisks);
    const [activeTab, setActiveTab] = useState<string>('ALL');
    const [showNew, setShowNew] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
    const [newRisk, setNewRisk] = useState<Partial<Risk>>({ type: 'OPERACIONAL', probability: 3, impact: 3 });

    const filtered = useMemo(() => {
        if (activeTab === 'ALL') return risks;
        return risks.filter(r => r.type === activeTab);
    }, [risks, activeTab]);

    const statsByLevel = {
        bajo: risks.filter(r => r.level === 'BAJO').length,
        medio: risks.filter(r => r.level === 'MEDIO').length,
        alto: risks.filter(r => r.level === 'ALTO').length,
        critico: risks.filter(r => r.level === 'CRITICO').length,
    };

    function getRiskLevel(prob: number, imp: number): RiskLevel {
        const v = prob * imp;
        if (v >= 15) return 'CRITICO';
        if (v >= 9) return 'ALTO';
        if (v >= 4) return 'MEDIO';
        return 'BAJO';
    }

    const handleCreate = () => {
        if (!newRisk.description) { toast.error('La descripción es requerida'); return; }
        const prob = newRisk.probability || 3;
        const imp = newRisk.impact || 3;
        const risk: Risk = {
            id: `risk-${Date.now()}`,
            tenantId: 'tenant-1',
            matrixId: `matrix-${newRisk.type}`,
            processId: newRisk.processId,
            processName: mockProcesses.find(p => p.id === newRisk.processId)?.name,
            description: newRisk.description!,
            type: (newRisk.type as RiskType) || 'OPERACIONAL',
            cause: newRisk.cause || '',
            consequence: newRisk.consequence || '',
            probability: prob,
            impact: imp,
            level: getRiskLevel(prob, imp),
            riskValue: prob * imp,
            existingControls: newRisk.existingControls || '',
            treatmentPlan: newRisk.treatmentPlan || '',
            responsible: newRisk.responsible || '',
            status: 'ABIERTA',
        };
        setRisks([risk, ...risks]);
        setShowNew(false);
        setNewRisk({ type: 'OPERACIONAL', probability: 3, impact: 3 });
        toast.success('Riesgo creado exitosamente');
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10 bg-slate-50 min-h-screen -m-6 p-10">
            <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Matriz de <span className="text-blue-600">Riesgos</span></h1>
                    <div className="flex items-center gap-3 mt-4">
                        <Badge className="bg-white border-slate-200 text-slate-500 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] px-3 shadow-sm">ISO 9001:2015</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cláusula 6.1 — Acciones para abordar riesgos y oportunidades</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-white rounded-none h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-none">
                        <Save className="w-4 h-4 mr-2" /> Exportar Registro
                    </Button>
                    <Button onClick={() => setShowNew(true)} className="bg-blue-600 text-white hover:bg-blue-700 rounded-none px-8 h-12 font-bold uppercase italic tracking-wider transition-all shadow-lg hover:shadow-blue-100">
                        <Plus className="h-4 w-4 mr-2" /> Nuevo Registro
                    </Button>
                </div>
            </div>

            {/* Risk Level Summary */}
            <div className="grid grid-cols-4 gap-6">
                {[
                    { value: statsByLevel.bajo, icon: ShieldCheck, ...levelConfig.BAJO },
                    { value: statsByLevel.medio, icon: ShieldAlert, ...levelConfig.MEDIO },
                    { value: statsByLevel.alto, icon: ShieldX, ...levelConfig.ALTO },
                    { value: statsByLevel.critico, icon: AlertTriangle, ...levelConfig.CRITICO },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-slate-200 p-6 flex items-center justify-between group hover:shadow-lg transition-all shadow-sm">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className={cn("text-3xl font-black italic", s.color)}>{s.value}</p>
                        </div>
                        <div className={cn("h-14 w-14 flex items-center justify-center bg-slate-50 border border-slate-100 shadow-inner", s.color)}>
                            <s.icon className="h-7 w-7" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left: HeatMap & Stats */}
                <div className="col-span-12 lg:col-span-5 space-y-8">
                    <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 italic">Análisis Visual de Riesgos</h3>
                        </div>
                        <HeatMap risks={filtered} />
                    </div>

                    <div className="bg-white border border-slate-200 p-8 space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 italic">Filtros Avanzados</h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input placeholder="Buscar por descripción..." className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none text-slate-900 focus:ring-blue-500" />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setActiveTab('ALL')}
                                    variant={activeTab === 'ALL' ? 'default' : 'outline'}
                                    className={cn(
                                        "flex-1 h-12 rounded-none font-bold uppercase text-[10px] tracking-widest",
                                        activeTab === 'ALL' ? "bg-blue-600 text-white" : "border-slate-200 text-slate-400"
                                    )}
                                >
                                    Todos
                                </Button>
                                {['OPERACIONAL', 'CALIDAD'].map(t => (
                                    <Button
                                        key={t}
                                        onClick={() => setActiveTab(t)}
                                        variant={activeTab === t ? 'default' : 'outline'}
                                        className={cn(
                                            "flex-1 h-12 rounded-none font-bold uppercase text-[10px] tracking-widest",
                                            activeTab === t ? "bg-blue-600 text-white" : "border-slate-200 text-slate-400"
                                        )}
                                    >
                                        {riskTypeLabels[t as RiskType]}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Risk Table */}
                <div className="col-span-12 lg:col-span-7">
                    <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 italic">Listado de Riesgos Identificados</h3>
                            <Badge className="bg-white border-slate-200 text-slate-400 rounded-none font-bold text-[10px] uppercase px-3 shadow-none">{filtered.length} Registros</Badge>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 pl-8">Riesgo / Proceso</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 text-center">Severidad</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16">Nivel</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 pr-8 text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(risk => {
                                        const level = levelConfig[risk.level];
                                        const type = riskTypeIcons[risk.type];
                                        return (
                                            <TableRow key={risk.id} className="group hover:bg-slate-50 border-b border-slate-50 transition-colors cursor-pointer" onClick={() => { setSelectedRisk(risk); setShowDetail(true); }}>
                                                <TableCell className="pl-8 py-6">
                                                    <div className="flex gap-4">
                                                        <div className={cn("h-10 w-10 flex items-center justify-center shrink-0 border border-slate-200 bg-white shadow-sm transition-transform group-hover:scale-110", type.color)}>
                                                            {type.icon}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 uppercase italic tracking-tighter leading-tight line-clamp-1">{risk.description}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{risk.processName}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-lg font-black italic text-slate-700">{risk.riskValue}</span>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">P{risk.probability} × I{risk.impact}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase italic px-3 py-1 border shadow-sm",
                                                        level.bg, level.color, `border-${level.color.split('-')[1]}-200`
                                                    )}>
                                                        {level.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="pr-8 text-right">
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-200 hover:text-blue-600 hover:bg-blue-50 rounded-none border-0">
                                                        <Eye className="h-5 w-5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Detail Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                {selectedRisk && (
                    <DialogContent className="max-w-3xl bg-white border border-slate-200 p-0 overflow-hidden rounded-none shadow-2xl">
                        <div className={cn("h-2 w-full", levelConfig[selectedRisk.level].accent)} />
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <Badge className={cn("rounded-none font-bold text-[10px] uppercase px-3 shadow-none border", levelConfig[selectedRisk.level].bg, levelConfig[selectedRisk.level].color)}>
                                            {levelConfig[selectedRisk.level].label}
                                        </Badge>
                                        <Badge className="rounded-none font-bold text-[10px] uppercase px-3 shadow-none bg-slate-50 text-slate-400 border border-slate-200">
                                            {riskTypeLabels[selectedRisk.type]}
                                        </Badge>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-tight">{selectedRisk.description}</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{selectedRisk.processName}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-6 text-center min-w-[120px]">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nivel P×I</p>
                                    <p className={cn("text-4xl font-black italic", levelConfig[selectedRisk.level].color)}>{selectedRisk.riskValue}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-px bg-slate-100 border border-slate-100 mb-10 shadow-sm">
                                {[
                                    { l: 'Causa Raíz', v: selectedRisk.cause },
                                    { l: 'Consecuencia', v: selectedRisk.consequence },
                                    { l: 'Controles Existentes', v: selectedRisk.existingControls },
                                    { l: 'Plan de Tratamiento', v: selectedRisk.treatmentPlan },
                                ].map(item => (
                                    <div key={item.l} className="bg-white p-6">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">{item.l}</p>
                                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{item.v || 'No especificado'}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-slate-50 rounded-none px-8 font-bold uppercase text-[10px] tracking-widest shadow-none" onClick={() => setShowDetail(false)}>Cerrar</Button>
                                <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-none px-8 font-bold uppercase italic tracking-widest transition-all shadow-lg hover:shadow-blue-100">Imprimir Ficha</Button>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {/* New Risk Dialog */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-2xl bg-white border border-slate-200 p-0 overflow-hidden rounded-none shadow-2xl">
                    <div className="h-2 w-full bg-blue-600" />
                    <ScrollArea className="max-h-[85vh]">
                        <div className="p-10">
                            <DialogHeader className="mb-8">
                                <DialogTitle className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Identificación de <span className="text-blue-600">Nuevo Riesgo</span></DialogTitle>
                            </DialogHeader>

                            <div className="grid gap-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="grid gap-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipo de Riesgo *</Label>
                                        <Select value={newRisk.type} onValueChange={v => setNewRisk({ ...newRisk, type: v as RiskType })}>
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-none focus:ring-blue-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-slate-200">
                                                {Object.entries(riskTypeLabels).map(([k, v]) => (
                                                    <SelectItem key={k} value={k} className="focus:bg-blue-50 focus:text-blue-600 rounded-none">{v}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Proceso Asociado *</Label>
                                        <Select value={newRisk.processId || ''} onValueChange={v => setNewRisk({ ...newRisk, processId: v })}>
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-none focus:ring-blue-500">
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-slate-200">
                                                {mockProcesses.map(p => (
                                                    <SelectItem key={p.id} value={p.id} className="focus:bg-blue-50 focus:text-blue-600 rounded-none">{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descripción del Riesgo *</Label>
                                    <Textarea placeholder="..." className="bg-slate-50 border-slate-200 rounded-none min-h-[100px] text-slate-900 focus:ring-blue-500" value={newRisk.description || ''} onChange={e => setNewRisk({ ...newRisk, description: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="grid gap-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Probabilidad (1-5)</Label>
                                        <Select value={String(newRisk.probability)} onValueChange={v => setNewRisk({ ...newRisk, probability: Number(v) })}>
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-none">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none">
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <SelectItem key={v} value={String(v)}>{v} - {['Raro', 'Improbable', 'Posible', 'Probable', 'Muy Probable'][v - 1]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Impacto (1-5)</Label>
                                        <Select value={String(newRisk.impact)} onValueChange={v => setNewRisk({ ...newRisk, impact: Number(v) })}>
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-none">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none">
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <SelectItem key={v} value={String(v)}>{v} - {['Mínimo', 'Menor', 'Moderado', 'Mayor', 'Catastrófico'][v - 1]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan de Mitigación / Tratamiento</Label>
                                    <Textarea placeholder="..." className="bg-slate-50 border-slate-200 rounded-none min-h-[80px] text-slate-900 focus:ring-blue-500" value={newRisk.treatmentPlan || ''} onChange={e => setNewRisk({ ...newRisk, treatmentPlan: e.target.value })} />
                                </div>
                            </div>

                            <DialogFooter className="mt-12 flex gap-4">
                                <Button variant="ghost" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-none px-8 font-bold uppercase text-[10px] tracking-widest shadow-none border-0" onClick={() => setShowNew(false)}>Descartar</Button>
                                <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-none px-12 h-14 font-black uppercase italic tracking-wider transition-all shadow-lg" onClick={handleCreate}><Save className="h-5 w-5 mr-3" />Confirmar Registro</Button>
                            </DialogFooter>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
