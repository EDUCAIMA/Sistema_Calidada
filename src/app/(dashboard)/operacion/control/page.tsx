"use client";

import React from 'react';
import {
    Settings, Activity, Clock,
    Plus, Search, Filter, ShieldCheck, AlertCircle,
    MoreVertical, Edit, Trash2, Zap, Target
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
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';

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
        <ModulePage>
            <ModuleHeader
                clause="8.1"
                title="Control operacional"
                description="Planificación y seguimiento de los controles operacionales del sistema de calidad."
                actions={<>
                    <Button variant="outline">
                        <Activity className="w-4 h-4 mr-2" /> Reporte de Eficacia
                    </Button>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" /> Nuevo Punto de Control
                    </Button>
                </>}
            />
            <ModuleContent>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: 'Total Controles', value: '24', icon: Target, color: 'text-slate-600', bg: 'bg-white shadow-sm' },
                    { label: 'Críticos / Riesgo', value: '03', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
                    { label: 'Bajo Vigilancia', value: '18', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                    { label: 'Eficacia Global', value: '94%', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                ].map((stat, i) => (
                    <div key={i} className={cn("min-w-0 rounded-2xl border border-slate-100 p-6 flex items-center justify-between gap-4 shadow-sm", stat.bg)}>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                            <p className={cn("text-3xl font-semibold text-slate-900")}>{stat.value}</p>
                        </div>
                        <div className={cn("h-14 w-14 flex items-center justify-center border border-slate-100 bg-white rounded-2xl", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 lg:max-w-md">
                    <Search className="h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Buscar por nombre, código o responsable..."
                        className="border-none shadow-none focus-visible:ring-0 font-medium placeholder:text-slate-400 h-11 rounded-xl text-sm"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline">
                        <Filter className="h-3.5 w-3.5 mr-2" /> Filtrar por Etapa
                    </Button>
                    <span className="text-xs text-slate-500">
                        Mostrando 04 Controles de 24
                    </span>
                </div>
            </div>

            {/* Datasheet Table */}
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px] font-semibold text-slate-500 px-6 h-12 text-sm">Folio ID</TableHead>
                            <TableHead className="font-semibold text-slate-500 h-12 text-sm">Punto de Control / Método de Validación</TableHead>
                            <TableHead className="font-semibold text-slate-500 h-12 text-center text-sm">Criticidad</TableHead>
                            <TableHead className="font-semibold text-slate-500 h-12 text-sm">Responsable / Area</TableHead>
                            <TableHead className="font-semibold text-slate-500 h-12 text-center text-sm">Frecuencia</TableHead>
                            <TableHead className="font-semibold text-slate-500 h-12 text-center text-sm">Estatus</TableHead>
                            <TableHead className="w-[80px] text-right font-semibold text-slate-500 px-6 h-12 text-sm"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockControls.map((ctrl) => (
                            <TableRow key={ctrl.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer">
                                <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-slate-500 group-hover:text-blue-600 transition-colors">
                                    {ctrl.id}
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {ctrl.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs font-semibold bg-slate-50 text-slate-500 border-slate-200 rounded-md">
                                                {ctrl.category}
                                            </Badge>
                                            <p className="text-xs text-slate-500 font-semibold truncate max-w-[200px]">
                                                {ctrl.method}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <div className="flex flex-col items-center">
                                        <Badge
                                            className={cn(
                                                "font-semibold text-xs shadow-none px-2 rounded-md",
                                                ctrl.criticallity === 'CRÍTICA' ? 'bg-rose-100 text-rose-700 border-rose-200 rounded-md' :
                                                    ctrl.criticallity === 'ALTA' ? 'bg-amber-100 text-amber-700 border-amber-200 rounded-md' :
                                                        'bg-blue-100 text-blue-700 border-blue-200 rounded-md'
                                            )}
                                        >
                                            {ctrl.criticallity}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            <Settings className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-700">{ctrl.responsible}</p>
                                            <p className="text-xs font-semibold text-slate-500">Última rev: {ctrl.lastCheck}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <div className="flex flex-col items-center">
                                        <Clock className="w-4 h-4 text-slate-400 mb-1" />
                                        <span className="text-xs font-semibold text-slate-900">{ctrl.frequency}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <div className="flex justify-center">
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 font-semibold text-xs whitespace-nowrap rounded-2xl",
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
                                            <Button aria-label={`Acciones de ${ctrl.name}`} variant="ghost" size="icon" className="h-11 w-11 text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all text-sm font-medium">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl p-0 min-w-[180px]">
                                            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                                <p className="text-xs font-semibold text-slate-500">Acciones de Control</p>
                                            </div>
                                            <div className="p-1">
                                                <DropdownMenuItem className="text-sm py-2.5 cursor-pointer rounded-xl hover:bg-slate-50 hover:text-blue-600 gap-2 font-medium min-h-10">
                                                    <Activity className="h-3.5 w-3.5" /> Ver Historial / Logs
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-sm py-2.5 cursor-pointer rounded-xl hover:bg-slate-50 hover:text-slate-900 gap-2 font-medium min-h-10">
                                                    <Edit className="h-3.5 w-3.5" /> Editar Parámetros
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-sm py-2.5 cursor-pointer rounded-xl hover:bg-slate-50 hover:text-rose-600 gap-2 font-medium min-h-10">
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
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                        <span className="text-xs font-semibold text-slate-500">Visualizando reporte técnico de puntos críticos de control operativo</span>
                    </div>
                    <div className="flex gap-1 text-xs font-semibold text-slate-500">
                        PÁGINA <span className="text-slate-900">1</span> DE <span className="text-slate-900">3</span>
                    </div>
                </div>
            </div>
            </ModuleContent>
        </ModulePage>
    );
}
