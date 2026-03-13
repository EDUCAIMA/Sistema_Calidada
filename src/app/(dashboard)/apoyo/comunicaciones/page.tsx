"use client";

import React, { useState } from 'react';
import {
    MessageSquare, Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye,
    Users, Calendar, Mail, Megaphone, Smartphone
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

// Mock data for communications
const mockComms = [
    {
        id: 'COM-001',
        subject: 'Cambios en la Política de Calidad',
        receptor: 'Todo el Personal',
        emisor: 'Alta Dirección',
        method: 'Correo / Intranet',
        frequency: 'Cuando ocurra el cambio',
        status: 'Activa'
    },
    {
        id: 'COM-002',
        subject: 'Resultados de Auditorías',
        receptor: 'Comité de Calidad',
        emisor: 'Líder de Calidad',
        method: 'Reunión Presencial',
        frequency: 'Semestral',
        status: 'Activa'
    },
    {
        id: 'COM-003',
        subject: 'Nuevos Proveedores Aprobados',
        receptor: 'Logística / Almacén',
        emisor: 'Compras',
        method: 'ERP / Correo',
        frequency: 'Mensual',
        status: 'Activa'
    },
    {
        id: 'COM-004',
        subject: 'Encuestas de Satisfacción',
        receptor: 'Clientes Activos',
        emisor: 'Atención al Cliente',
        method: 'Formulario Web / WhatsApp',
        frequency: 'Post-Servicio',
        status: 'En Revisión'
    },
];

export default function ComunicacionesPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredComms = mockComms.filter(item =>
        item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.receptor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.emisor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Activa':
                return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">Activa</Badge>;
            case 'En Revisión':
                return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">En Revisión</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getMethodIcon = (method: string) => {
        if (method.includes('Correo')) return <Mail className="w-3.5 h-3.5 text-blue-500" />;
        if (method.includes('Reunión')) return <Users className="w-3.5 h-3.5 text-emerald-500" />;
        if (method.includes('WhatsApp')) return <Smartphone className="w-3.5 h-3.5 text-green-500" />;
        return <Megaphone className="w-3.5 h-3.5 text-amber-500" />;
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Matriz de Comunicaciones</h2>
                    <p className="text-muted-foreground mt-1">
                        Control de las comunicaciones internas y externas pertinentes al SGC (ISO 9001: 7.4).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="gap-2 shadow-md">
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Canal de Comunicación</span>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="matriz" className="space-y-6">
                <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 border shadow-sm">
                    <TabsTrigger value="matriz" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Matriz Estándar (Qué, Quién, Cómo)</TabsTrigger>
                    <TabsTrigger value="campañas" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Campañas y Eventos</TabsTrigger>
                </TabsList>

                <TabsContent value="matriz" className="space-y-4 m-0">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                    Esquema de Comunicación Organizacional
                                </CardTitle>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Buscar tema, emisor, receptor..."
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
                                    <div className="col-span-3">¿Qué Comunicar? (Tema)</div>
                                    <div className="col-span-2">A Quién (Receptor)</div>
                                    <div className="col-span-2">Quién Comunica (Emisor)</div>
                                    <div className="col-span-2">Cómo (Medio)</div>
                                    <div className="col-span-2">Cuándo (Frecuencia)</div>
                                    <div className="col-span-1 text-right">Acciones</div>
                                </div>

                                <div className="divide-y">
                                    {filteredComms.length > 0 ? (
                                        filteredComms.map((item) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/30 transition-colors">
                                                <div className="col-span-3 font-medium text-slate-700 dark:text-slate-300">
                                                    {item.subject}
                                                    <div className="mt-1">{getStatusBadge(item.status)}</div>
                                                </div>
                                                <div className="col-span-2 text-slate-600 dark:text-slate-400">
                                                    {item.receptor}
                                                </div>
                                                <div className="col-span-2 font-medium">
                                                    {item.emisor}
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    {getMethodIcon(item.method)}
                                                    <span className="truncate">{item.method}</span>
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2 text-slate-500">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {item.frequency}
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
                                                                <Eye className="h-4 w-4" /> Ver Ficha
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                                                                <Edit className="h-4 w-4" /> Editar Matriz
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
                                            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
                                            <p>No se encontraron registros de comunicación en la matriz.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="campañas" className="m-0">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 h-[400px] flex items-center justify-center">
                        <div className="text-center space-y-3">
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-primary">
                                <Megaphone className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">Campañas de Comunicación</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                Herramienta para gestionar envíos masivos y recordatorios de eventos del Sistema de Gestión.
                            </p>
                            <Button className="mt-4" disabled>Módulo en Desarrollo</Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
