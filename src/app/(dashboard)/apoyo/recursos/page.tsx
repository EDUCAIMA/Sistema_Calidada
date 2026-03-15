"use client";

import React, { useState } from 'react';
import {
    Building2, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Eye, Wrench, CheckCircle2, AlertCircle,
    Users as UsersIcon, Thermometer, Ruler, PenTool, BookOpen,
    Info, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

// Mock data for infrastructure
const mockInfra = [
    { id: 'INF-001', name: 'Servidor Principal ERP', type: 'Tecnología', status: 'Operativo', maintenanceDate: '15/05/2026', responsible: 'Área TI' },
    { id: 'INF-002', name: 'Planta Eléctrica de Respaldo', type: 'Equipos', status: 'Mantenimiento Pendiente', maintenanceDate: '01/03/2026', responsible: 'Mantenimiento' },
    { id: 'INF-003', name: 'Vehículo de Reparto 01', type: 'Transporte', status: 'Operativo', maintenanceDate: '20/04/2026', responsible: 'Logística' },
];

// Mock data for measurement
const mockMeasurement = [
    { id: 'CAL-001', name: 'Balanza Electrónica', brand: 'Mettler Toledo', nextCal: '12/10/2025', status: 'Certificado' },
    { id: 'CAL-002', name: 'Calibrador Vernier', brand: 'Mitutoyo', nextCal: '05/06/2025', status: 'Vencido' },
];

export default function RecursosPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Operativo':
            case 'Certificado':
                return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> {status}</Badge>;
            case 'Mantenimiento Pendiente':
                return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><AlertCircle className="w-3 h-3" /> Pendiente</Badge>;
            case 'Vencido':
                return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1"><AlertCircle className="w-3 h-3" /> Vencido</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">7.1 Recursos</h1>
                    <p className="text-muted-foreground mt-1">
                        Determinación y provisión de los recursos necesarios para el SGC.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="generalidades" className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1 border h-auto flex flex-wrap gap-1 justify-start">
                    <TabsTrigger value="generalidades" className="gap-2 px-3 py-2 text-xs"><Info className="w-3.5 h-3.5" /> 7.1.1 Generalidades</TabsTrigger>
                    <TabsTrigger value="personas" className="gap-2 px-3 py-2 text-xs"><UsersIcon className="w-3.5 h-3.5" /> 7.1.2 Personas</TabsTrigger>
                    <TabsTrigger value="infraestructura" className="gap-2 px-3 py-2 text-xs"><Building2 className="w-3.5 h-3.5" /> 7.1.3 Infraestructura</TabsTrigger>
                    <TabsTrigger value="ambiente" className="gap-2 px-3 py-2 text-xs"><Thermometer className="w-3.5 h-3.5" /> 7.1.4 Ambiente</TabsTrigger>
                    <TabsTrigger value="medicion" className="gap-2 px-3 py-2 text-xs"><Ruler className="w-3.5 h-3.5" /> 7.1.5 Seguimiento y Medición</TabsTrigger>
                    <TabsTrigger value="conocimientos" className="gap-2 px-3 py-2 text-xs"><BookOpen className="w-3.5 h-3.5" /> 7.1.6 Conocimientos</TabsTrigger>
                </TabsList>

                {/* 7.1.1 GENERALIDADES */}
                <TabsContent value="generalidades" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white/60">
                        <CardHeader>
                            <CardTitle className="text-lg">7.1.1 Generalidades de los Recursos</CardTitle>
                            <CardDescription>Resumen de la capacidad y limitaciones de los recursos existentes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 border rounded-xl">
                                    <h4 className="font-bold text-sm mb-2 text-slate-700">Capacidades Internas</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Análisis de lo que se puede obtener internamente vs lo que se necesita de proveedores externos.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 border rounded-xl">
                                    <h4 className="font-bold text-sm mb-2 text-slate-700">Estado de Recursos Externos</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Monitoreo de la provisión de recursos por parte de terceros para asegurar la continuidad.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 7.1.2 PERSONAS */}
                <TabsContent value="personas" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white/60">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">7.1.2 Plantilla de Personal</CardTitle>
                            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Agregar Personal</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="text-left p-4">Nombre</th>
                                            <th className="text-left p-4">Cargo</th>
                                            <th className="text-left p-4">Proceso</th>
                                            <th className="text-left p-4">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="p-4 font-medium">Juan Perez</td>
                                            <td className="p-4">Gerente de Calidad</td>
                                            <td className="p-4">Estratégico</td>
                                            <td className="p-4"><Badge className="bg-emerald-50 text-emerald-600 border-none">Activo</Badge></td>
                                        </tr>
                                        <tr>
                                            <td className="p-4 font-medium">Maria Garcia</td>
                                            <td className="p-4">Analista de Laboratorio</td>
                                            <td className="p-4">Misional</td>
                                            <td className="p-4"><Badge className="bg-emerald-50 text-emerald-600 border-none">Activo</Badge></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 7.1.3 INFRAESTRUCTURA */}
                <TabsContent value="infraestructura" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white/60">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">7.1.3 Inventario de Infraestructura</CardTitle>
                            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Nuevo Activo</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="p-4">Código</th>
                                            <th className="p-4">Nombre</th>
                                            <th className="p-4">Tipo</th>
                                            <th className="p-4">Estado</th>
                                            <th className="p-4">Mantenimiento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {mockInfra.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-500">{item.id}</td>
                                                <td className="p-4 font-medium">{item.name}</td>
                                                <td className="p-4">{item.type}</td>
                                                <td className="p-4">{getStatusBadge(item.status)}</td>
                                                <td className="p-4 font-medium text-slate-600">{item.maintenanceDate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 7.1.4 AMBIENTE */}
                <TabsContent value="ambiente" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white/60">
                        <CardHeader>
                            <CardTitle className="text-lg">7.1.4 Ambiente para la operación de los procesos</CardTitle>
                            <CardDescription>Factores sociales, psicológicos y físicos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-blue-600 uppercase">Físico: Iluminación</p>
                                            <p className="text-2xl font-black text-blue-900">450 Lux</p>
                                        </div>
                                        <CheckCircle2 className="text-blue-500 h-8 w-8" />
                                    </div>
                                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-amber-600 uppercase">Físico: Ruido</p>
                                            <p className="text-2xl font-black text-amber-900">65 dB</p>
                                        </div>
                                        <AlertCircle className="text-amber-500 h-8 w-8" />
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 border rounded-xl">
                                    <h4 className="font-bold text-sm mb-2 text-slate-700">Factores Humanos</h4>
                                    <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4 italic">
                                        <li>Social: Ambiente no discriminatorio, tranquilo, libre de conflictos.</li>
                                        <li>Psicológico: Reducción de estrés, prevención del agotamiento emocional.</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 7.1.5 SEGUIMIENTO Y MEDICIÓN */}
                <TabsContent value="medicion" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white/60">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">7.1.5 Recursos de seguimiento y medición</CardTitle>
                            <Button size="sm" variant="outline" className="gap-2"><Ruler className="w-4 h-4" /> Plan de Calibración</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="p-4">ID Equipo</th>
                                            <th className="p-4">Instrumento</th>
                                            <th className="p-4">Marca/Modelo</th>
                                            <th className="p-4">Próx. Calibración</th>
                                            <th className="p-4">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {mockMeasurement.map((eq) => (
                                            <tr key={eq.id}>
                                                <td className="p-4 font-bold text-slate-500">{eq.id}</td>
                                                <td className="p-4 font-medium">{eq.name}</td>
                                                <td className="p-4">{eq.brand}</td>
                                                <td className="p-4 font-medium">{eq.nextCal}</td>
                                                <td className="p-4">{getStatusBadge(eq.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 7.1.6 CONOCIMIENTOS */}
                <TabsContent value="conocimientos" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white/60">
                        <CardHeader>
                            <CardTitle className="text-lg">7.1.6 Conocimientos de la organización</CardTitle>
                            <CardDescription>Gestión del capital intelectual y lecciones aprendidas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 border rounded-2xl bg-indigo-50/30 flex items-start gap-4">
                                    <div className="p-3 bg-indigo-100 rounded-xl"><BookOpen className="h-6 w-6 text-indigo-600" /></div>
                                    <div>
                                        <h4 className="font-bold text-indigo-900">Lecciones Aprendidas</h4>
                                        <p className="text-xs text-indigo-700 mt-1">Base de datos de experiencias de proyectos y fallos anteriores.</p>
                                    </div>
                                </div>
                                <div className="p-5 border rounded-2xl bg-blue-50/30 flex items-start gap-4">
                                    <div className="p-3 bg-blue-100 rounded-xl"><LayoutGrid className="h-6 w-6 text-blue-600" /></div>
                                    <div>
                                        <h4 className="font-bold text-blue-900">Propiedad Intelectual</h4>
                                        <p className="text-xs text-blue-700 mt-1">Patentes, derechos de autor y software desarrollado.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
