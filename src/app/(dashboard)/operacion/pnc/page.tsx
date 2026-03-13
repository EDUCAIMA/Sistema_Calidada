"use client";

import React, { useState } from 'react';
import {
    AlertOctagon, Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye,
    Ban, Recycle, CheckCircle2, Factory, PackageX
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
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Mock data for NC Outputs (PNC)
const mockPNC = [
    {
        id: 'PNC-001',
        product: 'Lote Empaques Ref 405',
        process: 'Producción - Línea 2',
        defect: 'Fallo de sellado térmico',
        disposition: 'Reproceso',
        status: 'Aislado',
        date: '25/05/2026'
    },
    {
        id: 'PNC-002',
        product: 'Servicio Mantenimiento Equipo X',
        process: 'Soporte Técnico',
        defect: 'Técnico no llegó a la hora acordada',
        disposition: 'Concesión (Descuento Comercial)',
        status: 'Cerrado',
        date: '10/06/2026'
    },
    {
        id: 'PNC-003',
        product: 'Materia Prima Lote Y',
        process: 'Recepción Proveedores',
        defect: 'Humedad fuera de límite tolerado',
        disposition: 'Devolución al Proveedor',
        status: 'En Trámite',
        date: '18/06/2026'
    },
    {
        id: 'PNC-004',
        product: 'Piezas P-44',
        process: 'Inyección',
        defect: 'Fisuras estructurales',
        disposition: 'Desecho / Destrucción',
        status: 'Cerrado',
        date: '02/05/2026'
    },
];

export default function PNCPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPNC = mockPNC.filter(item =>
        item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.defect.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Aislado':
                return <Badge className="bg-rose-50 text-rose-600 border-rose-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit">Aislado</Badge>;
            case 'En Trámite':
                return <Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit">En Trámite</Badge>;
            case 'Cerrado':
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 shadow-none flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Cerrado</Badge>;
            default:
                return <Badge variant="outline" className="rounded-none">{status}</Badge>;
        }
    };

    const getDispositionIcon = (disposition: string) => {
        if (disposition.includes('Reproceso')) return <Recycle className="w-3 h-3 text-blue-600" />;
        if (disposition.includes('Desecho')) return <Ban className="w-3 h-3 text-rose-600" />;
        return <AlertOctagon className="w-3 h-3 text-amber-600" />;
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10 bg-slate-50 min-h-screen -m-6 p-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Salidas <span className="text-blue-600">No Conformes</span></h1>
                    <div className="flex items-center gap-3 mt-4">
                        <Badge className="bg-white border-slate-200 text-slate-500 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] px-3 shadow-sm">ISO 9001:2015</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cláusula 8.7 — Control de las salidas no conformes</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-white rounded-none h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-none">
                        <Ban className="w-4 h-4 mr-2" /> Protocolos de Rechazo
                    </Button>
                    <Button className="bg-rose-600 text-white hover:bg-rose-700 rounded-none px-8 h-12 font-bold uppercase italic tracking-wider transition-all shadow-lg hover:shadow-rose-100">
                        <PackageX className="h-4 w-4 mr-2" /> Reportar Hallazgo
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="registro" className="space-y-8">
                <TabsList className="bg-white border-b border-slate-200 h-16 w-full justify-start rounded-none p-0 gap-8 shadow-sm px-8">
                    <TabsTrigger value="registro" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-black uppercase text-[11px] tracking-widest transition-all px-0">Bandeja de Contención</TabsTrigger>
                    <TabsTrigger value="analisis" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-black uppercase text-[11px] tracking-widest transition-all px-0">Análisis y Causa Raíz</TabsTrigger>
                </TabsList>

                <TabsContent value="registro" className="space-y-4 m-0">
                    <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 italic">Libro de Control de Productos / Servicios No Conformes</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Trazabilidad de desviaciones y acciones de disposición</p>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar Producto, Defecto, Lote..."
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
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16">Item Afectado / Proceso Origen</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16">Descripción de la Falla</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16">Disposición Técnica</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 text-center">Estatus</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-16 text-right pr-8">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPNC.map((item) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50 border-b border-slate-50 transition-colors">
                                            <TableCell className="pl-8 py-6">
                                                <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-1 border border-rose-100 italic shadow-sm">
                                                    {item.id}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <p className="text-sm font-bold text-slate-900 uppercase italic tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                                                    {item.product}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5 align-middle">
                                                        <Factory className="h-3 w-3" /> {item.process}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5"><Recycle className="h-3 w-3" /> Reportado: {item.date}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-[11px] text-slate-600 font-bold uppercase italic tracking-tight">{item.defect}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                        {getDispositionIcon(item.disposition)}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest italic leading-tight">{item.disposition}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
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
                                                            <Eye className="h-4 w-4" /> Detalle Hallazgo
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-none">
                                                            <Recycle className="h-4 w-4" /> Ejecutar Disposición
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-none">
                                                            <Edit className="h-4 w-4" /> Editar Registro
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-100" />
                                                        <DropdownMenuItem className="gap-3 py-3 font-bold uppercase text-[9px] tracking-widest cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600 rounded-none">
                                                            <Trash2 className="h-4 w-4" /> Anular PNC
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

                <TabsContent value="analisis">
                    <div className="bg-white border border-slate-200 p-20 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="bg-blue-50 h-20 w-20 flex items-center justify-center border border-blue-100 shadow-inner mb-6 text-blue-600">
                            <Search className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">Investigación de Causa Raíz</h3>
                        <p className="text-slate-400 max-w-sm font-bold uppercase text-[10px] tracking-widest leading-relaxed italic">
                            Vincule sus salidas no conformes con Diagramas de Ishikawa o los 5 por qués para activar acciones correctivas automáticas.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
