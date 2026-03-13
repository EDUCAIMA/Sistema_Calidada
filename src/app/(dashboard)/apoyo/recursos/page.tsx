"use client";

import React, { useState } from 'react';
import {
    Building2, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Eye, Wrench, CheckCircle2, AlertCircle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for resources
const mockInfra = [
    { id: 'INF-001', name: 'Servidor Principal ERP', type: 'Tecnología', status: 'Operativo', maintenanceDate: '15/05/2026', responsible: 'Área TI' },
    { id: 'INF-002', name: 'Planta Eléctrica de Respaldo', type: 'Equipos', status: 'Mantenimiento Pendiente', maintenanceDate: '01/03/2026', responsible: 'Mantenimiento' },
    { id: 'INF-003', name: 'Vehículo de Reparto 01', type: 'Transporte', status: 'Operativo', maintenanceDate: '20/04/2026', responsible: 'Logística' },
    { id: 'INF-004', name: 'Sistema de Refrigeración S1', type: 'Instalaciones', status: 'Fuera de Servicio', maintenanceDate: '10/02/2026', responsible: 'Mantenimiento' },
];

export default function RecursosPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInfra = mockInfra.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Operativo':
                return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 pointer-events-none gap-1"><CheckCircle2 className="w-3 h-3" /> Operativo</Badge>;
            case 'Mantenimiento Pendiente':
                return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 pointer-events-none gap-1"><AlertCircle className="w-3 h-3" /> Pendiente</Badge>;
            case 'Fuera de Servicio':
                return <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20 pointer-events-none gap-1"><AlertCircle className="w-3 h-3" /> Fuera de Servicio</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Recursos e Infraestructura</h2>
                    <p className="text-muted-foreground mt-1">
                        Gestión de instalaciones, equipos, tecnología y ambiente de trabajo.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 shadow-sm">
                        <Wrench className="w-4 h-4" />
                        <span className="hidden sm:inline">Plan de Mantenimiento</span>
                    </Button>
                    <Button className="gap-2 shadow-md">
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Recurso</span>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="infraestructura" className="space-y-6">
                <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 border shadow-sm">
                    <TabsTrigger value="infraestructura" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Infraestructura y Equipos</TabsTrigger>
                    <TabsTrigger value="ambiente" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Ambiente de Operación</TabsTrigger>
                    <TabsTrigger value="seguimiento" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Recursos de Medición</TabsTrigger>
                </TabsList>

                <TabsContent value="infraestructura" className="space-y-4 m-0">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-primary" />
                                    Inventario de Infraestructura
                                </CardTitle>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Buscar equipo o recurso..."
                                            className="pl-9 bg-white dark:bg-slate-950"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" className="shrink-0">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border bg-white dark:bg-slate-950/50 overflow-hidden">
                                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 text-sm font-medium text-muted-foreground">
                                    <div className="col-span-2">Código</div>
                                    <div className="col-span-3">Nombre del Recurso</div>
                                    <div className="col-span-2">Tipo</div>
                                    <div className="col-span-2">Estado</div>
                                    <div className="col-span-2">Próx. Mantenimiento</div>
                                    <div className="col-span-1 text-right">Acciones</div>
                                </div>

                                <div className="divide-y">
                                    {filteredInfra.length > 0 ? (
                                        filteredInfra.map((item) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/30 transition-colors">
                                                <div className="col-span-2 font-medium text-slate-700 dark:text-slate-300">
                                                    {item.id}
                                                </div>
                                                <div className="col-span-3 font-medium">
                                                    {item.name}
                                                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                                                        Responsable: {item.responsible}
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <Badge variant="outline" className="font-normal">{item.type}</Badge>
                                                </div>
                                                <div className="col-span-2">
                                                    {getStatusBadge(item.status)}
                                                </div>
                                                <div className="col-span-2 text-slate-500">
                                                    {item.maintenanceDate}
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreVertical className="h-4 w-4 text-slate-500" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[160px]">
                                                            <DropdownMenuItem className="gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                                                                <Eye className="h-4 w-4" /> Ficha Técnica
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                                                                <Wrench className="h-4 w-4" /> Reg. Mantenimiento
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                                                                <Edit className="h-4 w-4" /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50">
                                                                <Trash2 className="h-4 w-4" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                                            <Building2 className="h-10 w-10 text-slate-300 mb-3" />
                                            <p>No se encontraron recursos que coincidan con la búsqueda.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                {/* Placeholder tabs for other content */}
                <TabsContent value="ambiente"></TabsContent>
                <TabsContent value="seguimiento"></TabsContent>
            </Tabs>
        </div>
    );
}
