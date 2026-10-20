"use client";

import React, { useState } from 'react';
import {
    Truck, Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye,
    Star, AlertTriangle, CheckCircle2, Phone
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
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';

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
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-semibold text-xs px-2 py-0.5 shadow-none flex items-center gap-1 w-fit rounded-md"><CheckCircle2 className="w-3 h-3" /> Aprobado</Badge>;
            case 'Condicionado':
                return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-semibold text-xs px-2 py-0.5 shadow-none flex items-center gap-1 w-fit rounded-md"><AlertTriangle className="w-3 h-3" /> Condicionado</Badge>;
            case 'No Aprobado':
                return <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-semibold text-xs px-2 py-0.5 shadow-none flex items-center gap-1 w-fit rounded-md">No Aprobado</Badge>;
            default:
                return <Badge variant="outline" className="rounded-md">{status}</Badge>;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "bg-emerald-500";
        if (score >= 70) return "bg-amber-500";
        return "bg-rose-500";
    };

    return (
        <ModulePage>
            <ModuleHeader
                clause="8.4"
                title="Control de proveedores"
                description="Consulte y evalúe el desempeño de los proveedores y suministros externos."
                actions={<>
                    <Button variant="outline">
                        <Truck className="w-4 h-4 mr-2" /> Programar Auditoría
                    </Button>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" /> Nuevo Proveedor
                    </Button>
                </>}
            />
            <ModuleContent>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: 'Total Cartera', value: stats.total, icon: Truck, color: 'text-slate-600', bg: 'bg-slate-50' },
                    { label: 'Estatus: Aprobado', value: stats.aprobados, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Estatus: Condicionado', value: stats.condicionados, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Riesgo / Críticos', value: stats.criticos, icon: Star, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((s) => (
                    <div key={s.label} className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                            <p className={cn("text-3xl font-semibold text-slate-900")}>{s.value.toString().padStart(2, '0')}</p>
                        </div>
                        <div className={cn("h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center border border-slate-100", s.bg, s.color)}>
                            <s.icon className="h-7 w-7 transition-transform group-hover:scale-110" />
                        </div>
                    </div>
                ))}
            </div>

            <Tabs defaultValue="directorio" className="space-y-8">
                <TabsList className="flex h-auto min-h-11 w-full flex-wrap justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                    <TabsTrigger value="directorio" className="min-h-10 flex-none rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Libro de Proveedores</TabsTrigger>
                    <TabsTrigger value="criterios" className="min-h-10 flex-none rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Matriz de Calificación</TabsTrigger>
                </TabsList>

                <TabsContent value="directorio" className="space-y-4 m-0">
                    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 px-4 py-5 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-slate-900">Directorio Técnico de Proveedores Externos</h3>
                                <p className="mt-1 text-sm text-slate-500">Seguimiento de desempeño y requisitos de calidad</p>
                            </div>
                            <div className="flex w-full min-w-0 items-center gap-3 xl:max-w-md">
                                <div className="relative min-w-0 flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Buscar Razón Social, Categoría, ID..."
                                        className="pl-12 bg-white border-slate-200 rounded-xl text-slate-900 focus:ring-blue-500 placeholder:text-slate-400 placeholder:text-sm placeholder:font-normal h-11 text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button aria-label="Filtrar proveedores" variant="outline" className="h-11 w-11 border-slate-200 text-slate-500 hover:bg-white rounded-xl shrink-0 shadow-none text-sm font-medium">
                                    <Filter className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                                        <TableHead className="font-semibold text-slate-500 pl-8 w-[120px] h-12 text-sm">Folio ID</TableHead>
                                        <TableHead className="font-semibold text-slate-500 h-12 text-sm">Razón Social / Contacto Directo</TableHead>
                                        <TableHead className="font-semibold text-slate-500 text-center h-12 text-sm">Categoría</TableHead>
                                        <TableHead className="font-semibold text-slate-500 w-[200px] h-12 text-sm">Desempeño Técnico</TableHead>
                                        <TableHead className="font-semibold text-slate-500 text-center h-12 text-sm">Estatus</TableHead>
                                        <TableHead className="font-semibold text-slate-500 text-right pr-8 h-12 text-sm">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProviders.map((item) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50 border-b border-slate-50 transition-colors">
                                            <TableCell className="pl-8 py-6">
                                                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 border border-blue-100 shadow-sm">
                                                    {item.id}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <p className="text-sm font-semibold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                                    {item.name}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 align-middle">
                                                        <Phone className="h-3 w-3" /> {item.contact}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 leading-none align-middle"><Star className="h-3 w-3" /> Última Eval: {item.lastEval}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className="bg-white border-slate-200 text-slate-500 font-semibold text-xs px-2 py-0.5 shadow-none border rounded-md">
                                                    {item.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-sm font-semibold text-slate-900">{item.score}/100</span>
                                                        <span className={cn("text-xs font-semibold px-1", item.score >= 90 ? "text-emerald-600" : item.score >= 70 ? "text-amber-600" : "text-rose-600")}>
                                                            {item.score >= 90 ? 'Sobresaliente' : item.score >= 70 ? 'Regular' : 'En Riesgo'}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
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
                                                        <Button aria-label={`Acciones de ${item.name}`} variant="ghost" className="h-11 w-11 p-0 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 text-sm font-medium">
                                                            <MoreVertical className="h-5 w-5 text-slate-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-slate-200 min-w-[180px] shadow-xl">
                                                        <DropdownMenuItem className="gap-3 py-3 cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-xl text-sm font-medium min-h-10">
                                                            <Eye className="h-4 w-4" /> Perfil y Documentos
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-3 py-3 cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-xl text-sm font-medium min-h-10">
                                                            <Star className="h-4 w-4" /> Ejecutar Evaluación
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-3 py-3 cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-xl text-sm font-medium min-h-10">
                                                            <Edit className="h-4 w-4" /> Editar Datos
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-100" />
                                                        <DropdownMenuItem className="gap-3 py-3 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600 rounded-xl text-sm font-medium min-h-10">
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
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-4 py-12 text-center shadow-sm sm:px-8 sm:py-16">
                        <div className="bg-blue-50 h-20 w-20 rounded-2xl flex items-center justify-center border border-blue-100 mb-6 text-blue-600">
                            <Star className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-4">Configuración de Criterios ISO 8.4</h3>
                        <p className="max-w-sm text-sm leading-relaxed text-slate-500">
                            Ajuste las métricas de Calidad, Cumpleaños de Entrega y Soporte para el cálculo automatizado del score de desempeño.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
            </ModuleContent>
        </ModulePage>
    );
}
