"use client";

import React, { useState } from 'react';
import {
    Target, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Eye, LineChart, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Mock data for objectives
const mockObjectives = [
    {
        id: 'OBJ-001',
        description: 'Aumentar la satisfacción del cliente en un 15% para el cierre del año.',
        process: 'Comercial / Atención al Cliente',
        target: '95%',
        actual: '82%',
        progress: 86,
        status: 'En Progreso',
        deadline: '31/12/2026',
    },
    {
        id: 'OBJ-002',
        description: 'Reducir el tiempo de respuesta en soporte técnico a menos de 4 horas.',
        process: 'Soporte Técnico',
        target: '< 4h',
        actual: '4.5h',
        progress: 75,
        status: 'En Riesgo',
        deadline: '30/06/2026',
    },
    {
        id: 'OBJ-003',
        description: 'Completar el 100% de la formación de auditores internos.',
        process: 'Recursos Humanos',
        target: '100%',
        actual: '100%',
        progress: 100,
        status: 'Completado',
        deadline: '15/02/2026',
    },
    {
        id: 'OBJ-004',
        description: 'Reducir las no conformidades en producción en un 20%.',
        process: 'Producción',
        target: '-20%',
        actual: '-10%',
        progress: 50,
        status: 'En Progreso',
        deadline: '30/09/2026',
    }
];

export default function ObjetivosPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredObjectives = mockObjectives.filter(obj =>
        obj.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completado':
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Completado</Badge>;
            case 'En Progreso':
                return <Badge className="bg-blue-50 text-blue-600 border-blue-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit">En Progreso</Badge>;
            case 'En Riesgo':
                return <Badge className="bg-rose-50 text-rose-600 border-rose-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> En Riesgo</Badge>;
            default:
                return <Badge variant="outline" className="rounded-none">{status}</Badge>;
        }
    };

    const getProgressColor = (status: string) => {
        if (status === 'Completado') return 'bg-emerald-500';
        if (status === 'En Riesgo') return 'bg-rose-500';
        return 'bg-blue-600';
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10 bg-slate-50 min-h-screen -m-6 p-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Objetivos de <span className="text-blue-600">Calidad</span></h1>
                    <div className="flex items-center gap-3 mt-4">
                        <Badge className="bg-white border-slate-200 text-slate-500 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] px-3 shadow-sm">ISO 9001:2015</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cláusula 6.2 — Objetivos de la calidad y planificación</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-white rounded-none h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-none text-blue-600">
                        <LineChart className="w-4 h-4 mr-2" /> Métricas Globales
                    </Button>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-none px-8 h-12 font-bold uppercase italic tracking-wider transition-all shadow-lg hover:shadow-blue-100">
                        <Plus className="h-4 w-4 mr-2" /> Nuevo Objetivo
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-6">
                {[
                    { label: 'Total Objetivos', value: mockObjectives.length, icon: Target, color: 'text-slate-600', bg: 'bg-slate-50' },
                    { label: 'Completados', value: mockObjectives.filter(o => o.status === 'Completado').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'En Progreso', value: mockObjectives.filter(o => o.status === 'En Progreso').length, icon: LineChart, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'En Riesgo', value: mockObjectives.filter(o => o.status === 'En Riesgo').length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((s) => (
                    <div key={s.label} className="bg-white border border-slate-200 p-6 flex items-center justify-between group hover:shadow-lg transition-all shadow-sm">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className={cn("text-3xl font-black italic", s.color)}>{s.value}</p>
                        </div>
                        <div className={cn("h-14 w-14 flex items-center justify-center border border-slate-100 shadow-inner", s.bg, s.color)}>
                            <s.icon className="h-7 w-7 transition-transform group-hover:scale-110" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Card */}
            <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 italic">Matriz de Planificación y Seguimiento</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Control de cumplimiento de metas institucionales</p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por descripción, proceso..."
                                className="pl-12 h-12 bg-white border-slate-200 rounded-none text-slate-900 focus:ring-blue-500 placeholder:text-slate-300 placeholder:uppercase placeholder:text-[9px] placeholder:font-bold placeholder:tracking-widest"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-12 w-12 border-slate-200 text-slate-400 hover:bg-white rounded-none shrink-0 shadow-none">
                            <Filter className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                                <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 pl-8 w-[120px]">Código</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16">Descripción / Proceso</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 text-center">Meta vs Actual</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 w-[200px]">Progreso de Cumplimiento</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 text-right pr-8">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredObjectives.map((obj) => (
                                <TableRow key={obj.id} className="group hover:bg-slate-50 border-b border-slate-50 transition-colors">
                                    <TableCell className="pl-8 py-6">
                                        <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 border border-blue-100 italic shadow-sm">
                                            {obj.id}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <p className="text-sm font-bold text-slate-900 uppercase italic tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                                            {obj.description}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{obj.process}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Vence: {obj.deadline}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-black italic text-slate-700">{obj.target}</span>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Actual: {obj.actual}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[11px] font-black italic text-slate-900">{obj.progress}%</span>
                                                {getStatusBadge(obj.status)}
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-none overflow-hidden border border-slate-200 shadow-inner">
                                                <div
                                                    className={cn("h-full transition-all duration-1000", getProgressColor(obj.status))}
                                                    style={{ width: `${obj.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-10 w-10 p-0 hover:bg-slate-100 rounded-none border border-transparent hover:border-slate-200">
                                                    <MoreVertical className="h-5 w-5 text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-none border-slate-200 min-w-[180px] shadow-xl">
                                                <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-none">
                                                    <Eye className="h-4 w-4" /> Detalle y Planes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-none">
                                                    <LineChart className="h-4 w-4" /> Actualizar Medición
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-none">
                                                    <Edit className="h-4 w-4" /> Editar Objetivo
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-slate-100" />
                                                <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600 rounded-none">
                                                    <Trash2 className="h-4 w-4" /> Eliminar Registro
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
        </div>
    );
}
