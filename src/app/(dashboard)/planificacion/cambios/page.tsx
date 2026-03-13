"use client";

import React, { useState } from 'react';
import {
    Activity, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Eye, ShieldAlert, CheckCircle2, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Mock data for changes
const mockChanges = [
    { id: 'CAM-001', title: 'Migración a nuevo ERP Contable', type: 'Tecnología', status: 'En Ejecución', impact: 'Alto', responsible: 'Gerencia TI', date: '15/05/2026' },
    { id: 'CAM-002', title: 'Cambio de Proveedor de Empaques', type: 'Proveedores', status: 'Planificado', impact: 'Medio', responsible: 'Compras', date: '01/06/2026' },
    { id: 'CAM-003', title: 'Actualización Política de Teletrabajo', type: 'Documental', status: 'Completado', impact: 'Bajo', responsible: 'RRHH', date: '20/02/2026' },
    { id: 'CAM-004', title: 'Ampliación Bodega Principal', type: 'Infraestructura', status: 'Evaluación', impact: 'Alto', responsible: 'Operaciones', date: 'TBD' },
];

export default function CambiosPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredChanges = mockChanges.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completado':
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Completado</Badge>;
            case 'En Ejecución':
                return <Badge className="bg-blue-50 text-blue-600 border-blue-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit"><Activity className="w-3 h-3" /> En Ejecución</Badge>;
            case 'Planificado':
                return <Badge className="bg-slate-50 text-slate-500 border-slate-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Planificado</Badge>;
            case 'Evaluación':
                return <Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit"><ShieldAlert className="w-3 h-3" /> Evaluación</Badge>;
            default:
                return <Badge variant="outline" className="rounded-none">{status}</Badge>;
        }
    };

    const getImpactBadge = (impact: string) => {
        switch (impact) {
            case 'Alto': return <Badge className="bg-rose-50 text-rose-600 border-rose-100 rounded-none font-black text-[8px] uppercase tracking-tighter px-1.5 shadow-none italic border-l-2 border-l-rose-500">Impacto Alto</Badge>;
            case 'Medio': return <Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-none font-black text-[8px] uppercase tracking-tighter px-1.5 shadow-none italic border-l-2 border-l-amber-500">Impacto Medio</Badge>;
            case 'Bajo': return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-none font-black text-[8px] uppercase tracking-tighter px-1.5 shadow-none italic border-l-2 border-l-emerald-500">Impacto Bajo</Badge>;
            default: return <Badge variant="outline" className="rounded-none">{impact}</Badge>;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10 bg-slate-50 min-h-screen -m-6 p-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Gestión del <span className="text-blue-600">Cambio</span></h1>
                    <div className="flex items-center gap-3 mt-4">
                        <Badge className="bg-white border-slate-200 text-slate-500 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] px-3 shadow-sm">ISO 9001:2015</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cláusula 6.3 — Planificación de los cambios</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-white rounded-none h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-none">
                        <Activity className="w-4 h-4 mr-2" /> Protocolos de Impacto
                    </Button>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-none px-8 h-12 font-bold uppercase italic tracking-wider transition-all shadow-lg hover:shadow-blue-100">
                        <Plus className="h-4 w-4 mr-2" /> Registrar Solicitud
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="activos" className="space-y-8">
                <TabsList className="bg-white border-b border-slate-200 h-16 w-full justify-start rounded-none p-0 gap-8 shadow-sm px-8">
                    <TabsTrigger value="activos" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-black uppercase text-[11px] tracking-widest transition-all px-0">Cambios en Ejecución</TabsTrigger>
                    <TabsTrigger value="cerrados" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-black uppercase text-[11px] tracking-widest transition-all px-0">Historial de Cierres</TabsTrigger>
                </TabsList>

                <TabsContent value="activos" className="space-y-4 m-0">
                    <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 italic">Registro de Solicitudes y Planes</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Trazabilidad de modificaciones estructurales del SGC</p>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar por título, código, responsable..."
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
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 pl-8 w-[140px]">Código ID</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16">Descripción del Cambio / Responsable</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 text-center">Clasificación</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16">Estado Actual</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 text-right pr-8">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredChanges.map((item) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50 border-b border-slate-50 transition-colors cursor-pointer">
                                            <TableCell className="pl-8 py-6">
                                                <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 border border-blue-100 italic shadow-sm">
                                                    {item.id}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <p className="text-sm font-bold text-slate-900 uppercase italic tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                                                    {item.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{item.responsible}</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Fecha Prevista: {item.date}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.type}</span>
                                                    {getImpactBadge(item.impact)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(item.status)}
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
                                                            <Eye className="h-4 w-4" /> Ver Detalles
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-none">
                                                            <Edit className="h-4 w-4" /> Editar Plan
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
                </TabsContent>

                <TabsContent value="cerrados">
                    <div className="bg-white border border-slate-200 p-20 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="bg-blue-50 h-20 w-20 flex items-center justify-center border border-blue-100 shadow-inner mb-6">
                            <CheckCircle2 className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">Archivo Histórico de Cambios</h3>
                        <p className="text-slate-400 max-w-sm font-bold uppercase text-[10px] tracking-widest leading-relaxed italic">
                            No hay registros cerrados en el periodo actual. Todos los cambios históricos se encuentran disponibles para auditoría técnica.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
