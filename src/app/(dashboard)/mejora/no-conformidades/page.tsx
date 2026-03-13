"use client";

import React, { useState } from 'react';
import {
    AlertTriangle, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Eye, ClipboardX, CheckCircle2, History,
    ShieldAlert, Zap, Target, FileText
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
        <div className="space-y-8 animate-fade-in pb-10 bg-slate-50 min-h-screen -m-6 p-10">
            {/* Header Section */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">No <span className="text-rose-600">Conformidades</span></h1>
                    <div className="flex items-center gap-3 mt-4">
                        <Badge className="bg-white border-slate-200 text-slate-500 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] px-3 shadow-sm">ISO 9001:2015</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cláusula 10.2 — Mejora Continua</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-white rounded-none h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-none">
                        <FileText className="w-4 h-4 mr-2" /> Reporte Anual
                    </Button>
                    <Button className="bg-rose-600 text-white hover:bg-rose-700 rounded-none px-8 h-12 font-bold uppercase italic tracking-wider transition-all shadow-lg hover:shadow-rose-100">
                        <Plus className="h-4 w-4 mr-2" /> Levantar Reporte NC
                    </Button>
                </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-4 gap-6">
                {[
                    { label: 'Abiertas / Vigentes', value: '04', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
                    { label: 'En Análisis Causa', value: '02', icon: History, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                    { label: 'Cerradas Eficazmente', value: '15', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                    { label: 'Tiempo Prom. Cierre', value: '12d', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                ].map((stat, i) => (
                    <div key={i} className={cn("p-6 border flex items-center justify-between group hover:shadow-lg transition-all shadow-sm bg-white", stat.bg)}>
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
                        placeholder="Buscar folio, fuente o proceso..."
                        className="border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-300 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 px-4 border-l border-slate-100">
                    <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 rounded-none h-10">
                        <Filter className="h-3.5 w-3.5 mr-2" /> Filtrar por Proceso
                    </Button>
                </div>
            </div>

            {/* Datasheet Table */}
            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden text-slate-900">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[120px] text-[10px] font-black uppercase text-slate-400 px-6 h-12">Folio ID</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-400 h-12">Detección / Fuente de Hallazgo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-400 h-12 text-center">Severidad</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-400 h-12">Proceso / Area</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-400 h-12 text-center">Estado</TableHead>
                            <TableHead className="w-[80px] text-right font-black uppercase text-slate-400 px-6 h-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((nc) => (
                            <TableRow key={nc.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer">
                                <TableCell className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400 group-hover:text-rose-600 transition-colors">
                                    {nc.id}
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors uppercase italic tracking-tighter leading-tight">
                                            {nc.source}
                                        </p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Registrado el {nc.date}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <div className="flex flex-col items-center">
                                        <Badge
                                            className={cn(
                                                "rounded-none font-bold text-[9px] uppercase tracking-widest shadow-none px-2 h-5",
                                                nc.severity === 'MAYOR' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                                            )}
                                        >
                                            {nc.severity}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            <Target className="h-4 w-4 text-slate-300" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 uppercase italic tracking-tighter">{nc.process}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <div className="flex justify-center">
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-1 bg-white border font-bold italic text-[9px] tracking-tight whitespace-nowrap",
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-white rounded-none border border-transparent hover:border-slate-100 transition-all">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-none border-slate-200 shadow-xl p-0 min-w-[200px]">
                                            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Tratamiento de Mejora</p>
                                            </div>
                                            <div className="p-1">
                                                <DropdownMenuItem className="text-[11px] font-bold uppercase tracking-tight py-2.5 cursor-pointer rounded-none hover:bg-slate-50 hover:text-rose-600 gap-2">
                                                    <Eye className="h-3.5 w-3.5" /> Ver Informe Técnico
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-[11px] font-bold uppercase tracking-tight py-2.5 cursor-pointer rounded-none hover:bg-slate-50 hover:text-slate-900 gap-2">
                                                    <Edit className="h-3.5 w-3.5" /> Plan de Acción
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-[11px] font-bold uppercase tracking-tight py-2.5 cursor-pointer rounded-none hover:bg-slate-50 hover:text-emerald-600 gap-2">
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
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-rose-600" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bandeja de gestión técnica conformada para auditoría de cumplimiento ISO</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
