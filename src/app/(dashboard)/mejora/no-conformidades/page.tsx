"use client";

import React, { useState } from 'react';
import {
    AlertTriangle, Plus, Search, Filter, MoreVertical,
    Edit, Eye, CheckCircle2, History,
    Zap, Target, FileText
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

// Mock data
const mockNCs = [
    { id: 'NC-2026-001', date: '2026-02-05', source: 'Auditoría Interna', process: 'PRODUCCIÓN', severity: 'MAYOR', status: 'ABIERTA' },
    { id: 'NC-2026-002', date: '2026-02-12', source: 'Queja Cliente', process: 'DESPACHO', severity: 'MENOR', status: 'ANÁLISIS' },
    { id: 'NC-2025-015', date: '2025-12-20', source: 'Control Calidad', process: 'COMPRAS', severity: 'MAYOR', status: 'CERRADA' },
    { id: 'NC-2025-014', date: '2025-11-15', source: 'Revisión Dirección', process: 'PLANEACIÓN', severity: 'MENOR', status: 'CERRADA' },
];

export default function NoConformidadesPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = mockNCs.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.process.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ModulePage>
            <ModuleHeader
                clause="10.2"
                title="No conformidades"
                description="Registre y consulte las no conformidades y el seguimiento de su tratamiento."
                actions={<>
                    <Button variant="outline">
                        <FileText className="w-4 h-4 mr-2" /> Reporte Anual
                    </Button>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" /> Levantar Reporte NC
                    </Button>
                </>}
            />
            <ModuleContent>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: 'Abiertas / Vigentes', value: '04', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
                    { label: 'En Análisis Causa', value: '02', icon: History, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                    { label: 'Cerradas Eficazmente', value: '15', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                    { label: 'Tiempo Prom. Cierre', value: '12d', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                ].map((stat, i) => (
                    <div key={i} className={cn("min-w-0 rounded-2xl border border-slate-100 p-6 flex items-center justify-between gap-4 shadow-sm bg-white", stat.bg)}>
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
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:max-w-md">
                    <Search className="h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Buscar folio, fuente o proceso..."
                        className="border-none shadow-none focus-visible:ring-0 font-medium placeholder:text-slate-400 h-11 rounded-xl text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline">
                        <Filter className="h-3.5 w-3.5 mr-2" /> Filtrar por Proceso
                    </Button>
                </div>
            </div>

            {/* Datasheet Table */}
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[120px] font-semibold text-slate-500 px-6 h-12 text-sm">Folio ID</TableHead>
                            <TableHead className="font-semibold text-slate-500 h-12 text-sm">Detección / Fuente de Hallazgo</TableHead>
                            <TableHead className="font-semibold text-slate-500 h-12 text-center text-sm">Severidad</TableHead>
                            <TableHead className="font-semibold text-slate-500 h-12 text-sm">Proceso / Area</TableHead>
                            <TableHead className="font-semibold text-slate-500 h-12 text-center text-sm">Estado</TableHead>
                            <TableHead className="w-[80px] text-right font-semibold text-slate-500 px-6 h-12 text-sm"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((nc) => (
                            <TableRow key={nc.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer">
                                <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-slate-500 group-hover:text-rose-600 transition-colors">
                                    {nc.id}
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-900 group-hover:text-rose-600 transition-colors leading-tight">
                                            {nc.source}
                                        </p>
                                        <p className="text-xs text-slate-500 font-semibold">Registrado el {nc.date}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <div className="flex flex-col items-center">
                                        <Badge
                                            className={cn(
                                                "font-semibold text-xs shadow-none px-2 rounded-md",
                                                nc.severity === 'MAYOR' ? 'bg-rose-100 text-rose-700 border-rose-200 rounded-md' : 'bg-amber-100 text-amber-700 border-amber-200 rounded-md'
                                            )}
                                        >
                                            {nc.severity}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            <Target className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-700">{nc.process}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <div className="flex justify-center">
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-1 bg-white border font-semibold text-xs whitespace-nowrap rounded-2xl",
                                            nc.status === 'ABIERTA' ? 'text-rose-600 border-rose-100' :
                                                nc.status === 'ANÁLISIS' ? 'text-amber-600 border-amber-100' :
                                                    'text-emerald-600 border-emerald-100'
                                        )}>
                                            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse",
                                                nc.status === 'ABIERTA' ? 'bg-rose-500' :
                                                    nc.status === 'ANÁLISIS' ? 'bg-amber-500' : 'bg-emerald-500')}
                                            />
                                            {nc.status}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-label={`Acciones de ${nc.id}`} variant="ghost" size="icon" className="h-11 w-11 text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all text-sm font-medium">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl p-0 min-w-[200px]">
                                            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                                <p className="text-xs font-semibold text-slate-500">Tratamiento de Mejora</p>
                                            </div>
                                            <div className="p-1">
                                                <DropdownMenuItem className="text-sm py-2.5 cursor-pointer rounded-xl hover:bg-slate-50 hover:text-rose-600 gap-2 font-medium min-h-10">
                                                    <Eye className="h-3.5 w-3.5" /> Ver Informe Técnico
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-sm py-2.5 cursor-pointer rounded-xl hover:bg-slate-50 hover:text-slate-900 gap-2 font-medium min-h-10">
                                                    <Edit className="h-3.5 w-3.5" /> Plan de Acción
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-sm py-2.5 cursor-pointer rounded-xl hover:bg-slate-50 hover:text-emerald-600 gap-2 font-medium min-h-10">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Cerrar No Conformidad
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
                        <div className="h-2 w-2 rounded-full bg-rose-600" />
                        <span className="text-xs font-semibold text-slate-500">Bandeja de gestión técnica conformada para auditoría de cumplimiento ISO</span>
                    </div>
                </div>
            </div>
            </ModuleContent>
        </ModulePage>
    );
}
