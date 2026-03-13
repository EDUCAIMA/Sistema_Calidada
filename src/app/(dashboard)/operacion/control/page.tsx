"use client";

import React, { useState } from 'react';
import {
    SlidersHorizontal, CheckSquare, Settings, Activity, Clock,
    Plus, Search, Filter, ShieldCheck, AlertCircle,
    ChevronRight, MoreVertical, Edit, Trash2, Zap, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Mock data for Operational Controls
const mockControls = [
    {
        id: "CTRL-001",
        name: "Inspección de Materia Prima",
        category: "ENTRADA",
        method: "Muestreo AQL",
        frequency: "Cada Lote",
        status: "ACTIVO",
        criticallity: "ALTA",
        responsible: "Control de Calidad",
        lastCheck: "2024-03-20"
    },
    {
        id: "CTRL-002",
        name: "Monitoreo de Temperatura Proceso A",
        category: "PRODUCCIÓN",
        method: "Sensor Digital Real-Time",
        frequency: "Continuo",
        status: "ACTIVO",
        criticallity: "CRÍTICA",
        responsible: "Operador de Planta",
        lastCheck: "2024-03-21"
    },
    {
        id: "CTRL-003",
        name: "Verificación de Empaque y Sellado",
        category: "SALIDA",
        method: "Inspección Visual 100%",
        frequency: "Al terminar turno",
        status: "REQUIERE REVISIÓN",
        criticallity: "MEDIA",
        responsible: "Logística",
        lastCheck: "2024-03-19"
    },
    {
        id: "CTRL-004",
        name: "Calibración de Instrumentos Medición",
        category: "SOPORTE",
        method: "Patrón Certificado",
        frequency: "Semestral",
        status: "ACTIVO",
        criticallity: "ALTA",
        responsible: "Metrología",
        lastCheck: "2023-10-15"
    }
];

export default function ControlOperacionalPage() {
    return (
        <div className="space-y-8 animate-fade-in pb-10 bg-slate-50 min-h-screen -m-6 p-10">
            {/* Header Section */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Control <span className="text-blue-600">Operacional</span></h1>
                    <div className="flex items-center gap-3 mt-4">
                        <Badge className="bg-white border-slate-200 text-slate-500 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] px-3 shadow-sm">ISO 9001:2015</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cláusula 8.1 — Planificación y Control</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-white rounded-none h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-none">
                        <Activity className="w-4 h-4 mr-2" /> Reporte de Eficacia
                    </Button>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-none px-8 h-12 font-bold uppercase italic tracking-wider transition-all shadow-lg hover:shadow-blue-100">
                        <Plus className="h-4 w-4 mr-2" /> Nuevo Punto de Control
                    </Button>
                </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-4 gap-6">
                {[
                    { label: 'Total Controles', value: '24', icon: Target, color: 'text-slate-600', bg: 'bg-white shadow-sm' },
                    { label: 'Críticos / Riesgo', value: '03', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
                    { label: 'Bajo Vigilancia', value: '18', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                    { label: 'Eficacia Global', value: '94%', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                ].map((stat, i) => (
                    <div key={i} className={cn("p-6 border flex items-center justify-between group hover:shadow-lg transition-all", stat.bg)}>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className={cn("text-3xl font-black italic text-slate-900")}>{stat.value}</p>
                        </div>
                        <div className={cn("h-14 w-14 flex items-center justify-center border border-slate-100 shadow-inner bg-white", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 p-2 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 flex-1 max-w-md ml-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre, código o responsable..."
                        className="border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-300 h-10"
                    />
                </div>
                <div className="flex items-center gap-4 px-4 border-l border-slate-100">
                    <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 rounded-none h-10">
                        <Filter className="h-3.5 w-3.5 mr-2" /> Filtrar por Etapa
                    </Button>
                    <div className="h-4 w-px bg-slate-100" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        Mostrando 04 Controles de 24
                    </span>
                </div>
            </div>

            {/* Datasheet Table */}
            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px] text-[10px] font-black uppercase text-slate-400 px-6 h-12">Folio ID</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-400 h-12">Punto de Control / Método de Validación</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-400 h-12 text-center">Criticidad</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-400 h-12">Responsable / Area</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-400 h-12 text-center">Frecuencia</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-400 h-12 text-center">Estatus</TableHead>
                            <TableHead className="w-[80px] text-right font-black uppercase text-slate-400 px-6 h-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockControls.map((ctrl) => (
                            <TableRow key={ctrl.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer">
                                <TableCell className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                                    {ctrl.id}
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter">
                                            {ctrl.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[8px] font-black bg-slate-50 text-slate-400 border-slate-200 rounded-none h-4">
                                                {ctrl.category}
                                            </Badge>
                                            <p className="text-[10px] text-slate-400 font-bold italic truncate max-w-[200px]">
                                                {ctrl.method}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <div className="flex flex-col items-center">
                                        <Badge
                                            className={cn(
                                                "rounded-none font-bold text-[9px] uppercase tracking-widest shadow-none px-2 h-5",
                                                ctrl.criticallity === 'CRÍTICA' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                    ctrl.criticallity === 'ALTA' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        'bg-blue-100 text-blue-700 border-blue-200'
                                            )}
                                        >
                                            {ctrl.criticallity}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            <Settings className="h-4 w-4 text-slate-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{ctrl.responsible}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight italic">Última rev: {ctrl.lastCheck}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <div className="flex flex-col items-center">
                                        <Clock className="w-4 h-4 text-slate-300 mb-1" />
                                        <span className="text-[10px] font-black text-slate-900 italic tracking-tighter">{ctrl.frequency}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <div className="flex justify-center">
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 font-bold italic text-[9px] tracking-tight whitespace-nowrap",
                                            ctrl.status === 'ACTIVO' ? 'text-emerald-600 border-emerald-100' : 'text-amber-600 border-amber-100'
                                        )}>
                                            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", ctrl.status === 'ACTIVO' ? 'bg-emerald-500' : 'bg-amber-500')} />
                                            {ctrl.status}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-white rounded-none border border-transparent hover:border-slate-100 transition-all">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-none border-slate-200 shadow-xl p-0 min-w-[180px]">
                                            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Acciones de Control</p>
                                            </div>
                                            <div className="p-1">
                                                <DropdownMenuItem className="text-[11px] font-bold uppercase tracking-tight py-2.5 cursor-pointer rounded-none hover:bg-slate-50 hover:text-blue-600 gap-2">
                                                    <Activity className="h-3.5 w-3.5" /> Ver Historial / Logs
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-[11px] font-bold uppercase tracking-tight py-2.5 cursor-pointer rounded-none hover:bg-slate-50 hover:text-slate-900 gap-2">
                                                    <Edit className="h-3.5 w-3.5" /> Editar Parámetros
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-[11px] font-bold uppercase tracking-tight py-2.5 cursor-pointer rounded-none hover:bg-slate-50 hover:text-rose-600 gap-2">
                                                    <Trash2 className="h-3.5 w-3.5" /> Desactivar Control
                                                </DropdownMenuItem>
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Visual Footer (Formal) */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualizando reporte técnico de puntos críticos de control operativo</span>
                    </div>
                    <div className="flex gap-1 text-[10px] font-bold italic text-slate-400">
                        PÁGINA <span className="text-slate-900">1</span> DE <span className="text-slate-900">3</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
