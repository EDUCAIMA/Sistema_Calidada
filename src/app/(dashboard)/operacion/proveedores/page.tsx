"use client";

import React, { useState } from 'react';
import {
    Truck, Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye,
    Star, AlertTriangle, CheckCircle2, Building, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Mock data for providers
const mockProviders = [
    {
        id: 'PRV-001',
        name: 'Insumos Industriales S.A.',
        category: 'Materias Primas',
        contact: 'Carlos Méndez',
        score: 95,
        status: 'Aprobado',
        lastEval: '10/01/2026'
    },
    {
        id: 'PRV-002',
        name: 'Transportes Express Rápido',
        category: 'Logística',
        contact: 'Lucía Vargas',
        score: 72,
        status: 'Condicionado',
        lastEval: '15/03/2026'
    },
    {
        id: 'PRV-003',
        name: 'TechCloud Solutions',
        category: 'Software / TI',
        contact: 'Admin Sistemas',
        score: 98,
        status: 'Aprobado',
        lastEval: '01/02/2026'
    },
    {
        id: 'PRV-004',
        name: 'Papelería La Central',
        category: 'Suministros Oficina',
        contact: 'Ventas',
        score: 45,
        status: 'No Aprobado',
        lastEval: '28/04/2026'
    },
];

export default function ProveedoresPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProviders = mockProviders.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: mockProviders.length,
        aprobados: mockProviders.filter(p => p.status === 'Aprobado').length,
        condicionados: mockProviders.filter(p => p.status === 'Condicionado').length,
        criticos: mockProviders.filter(p => p.score < 70).length,
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Aprobado':
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Aprobado</Badge>;
            case 'Condicionado':
                return <Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" /> Condicionado</Badge>;
            case 'No Aprobado':
                return <Badge className="bg-rose-50 text-rose-600 border-rose-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit">No Aprobado</Badge>;
            default:
                return <Badge variant="outline" className="rounded-none">{status}</Badge>;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "bg-emerald-500";
        if (score >= 70) return "bg-amber-500";
        return "bg-rose-500";
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10 bg-slate-50 min-h-screen -m-6 p-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Control de <span className="text-blue-600">Proveedores</span></h1>
                    <div className="flex items-center gap-3 mt-4">
                        <Badge className="bg-white border-slate-200 text-slate-500 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] px-3 shadow-sm">ISO 9001:2015</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cláusula 8.4 — Suministros Externos</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-white rounded-none h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-none">
                        <Truck className="w-4 h-4 mr-2" /> Programar Auditoría
                    </Button>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-none px-8 h-12 font-bold uppercase italic tracking-wider transition-all shadow-lg hover:shadow-blue-100">
                        <Plus className="h-4 w-4 mr-2" /> Nuevo Proveedor
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-6">
                {[
                    { label: 'Total Cartera', value: stats.total, icon: Truck, color: 'text-slate-600', bg: 'bg-slate-50' },
                    { label: 'Estatus: Aprobado', value: stats.aprobados, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Estatus: Condicionado', value: stats.condicionados, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Riesgo / Críticos', value: stats.criticos, icon: Star, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((s) => (
                    <div key={s.label} className="bg-white border border-slate-200 p-6 flex items-center justify-between group hover:shadow-lg transition-all shadow-sm">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className={cn("text-3xl font-black italic text-slate-900")}>{s.value.toString().padStart(2, '0')}</p>
                        </div>
                        <div className={cn("h-14 w-14 flex items-center justify-center border border-slate-100 shadow-inner", s.bg, s.color)}>
                            <s.icon className="h-7 w-7 transition-transform group-hover:scale-110" />
                        </div>
                    </div>
                ))}
            </div>

            <Tabs defaultValue="directorio" className="space-y-8">
                <TabsList className="bg-white border-b border-slate-200 h-16 w-full justify-start rounded-none p-0 gap-8 shadow-sm px-8">
                    <TabsTrigger value="directorio" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-black uppercase text-[11px] tracking-widest transition-all px-0">Libro de Proveedores</TabsTrigger>
                    <TabsTrigger value="criterios" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-black uppercase text-[11px] tracking-widest transition-all px-0">Matriz de Calificación</TabsTrigger>
                </TabsList>

                <TabsContent value="directorio" className="space-y-4 m-0">
                    <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 italic">Directorio Técnico de Proveedores Externos</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Seguimiento de desempeño y requisitos de calidad</p>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar Razón Social, Categoría, ID..."
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
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 pl-8 w-[120px]">Folio ID</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16">Razón Social / Contacto Directo</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 text-center">Categoría</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 w-[200px]">Desempeño Técnico</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 text-center">Estatus</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 text-right pr-8">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProviders.map((item) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50 border-b border-slate-50 transition-colors">
                                            <TableCell className="pl-8 py-6">
                                                <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 border border-blue-100 italic shadow-sm">
                                                    {item.id}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <p className="text-sm font-bold text-slate-900 uppercase italic tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                                                    {item.name}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5 align-middle">
                                                        <Phone className="h-3 w-3" /> {item.contact}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5 leading-none align-middle"><Star className="h-3 w-3" /> Última Eval: {item.lastEval}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className="bg-white border-slate-200 text-slate-500 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none border">
                                                    {item.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[11px] font-black italic text-slate-900">{item.score}/100</span>
                                                        <span className={cn("text-[8px] font-black uppercase italic tracking-tighter px-1", item.score >= 90 ? "text-emerald-600" : item.score >= 70 ? "text-amber-600" : "text-rose-600")}>
                                                            {item.score >= 90 ? 'Sobresaliente' : item.score >= 70 ? 'Regular' : 'En Riesgo'}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-none overflow-hidden border border-slate-200 shadow-inner">
                                                        <div
                                                            className={cn("h-full transition-all duration-1000", getScoreColor(item.score))}
                                                            style={{ width: `${item.score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    {getStatusBadge(item.status)}
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
                                                            <Eye className="h-4 w-4" /> Perfil y Documentos
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-none">
                                                            <Star className="h-4 w-4" /> Ejecutar Evaluación
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-none">
                                                            <Edit className="h-4 w-4" /> Editar Datos
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-100" />
                                                        <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600 rounded-none">
                                                            <Trash2 className="h-4 w-4" /> Bloquear Proveedor
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

                <TabsContent value="criterios">
                    <div className="bg-white border border-slate-200 p-24 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="bg-blue-50 h-20 w-20 flex items-center justify-center border border-blue-100 shadow-inner mb-6 text-blue-600">
                            <Star className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">Configuración de Criterios ISO 8.4</h3>
                        <p className="text-slate-400 max-w-sm font-bold uppercase text-[10px] tracking-widest leading-relaxed italic">
                            Ajuste las métricas de Calidad, Cumpleaños de Entrega y Soporte para el cálculo automatizado del score de desempeño.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
