"use client";

import React, { useState } from 'react';
import {
    AlertOctagon, Search, Filter, MoreVertical, Edit, Trash2, Eye,
    Ban, Recycle, CheckCircle2, Factory, PackageX
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
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';

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
                return <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-semibold text-xs px-2 py-0.5 shadow-none flex items-center gap-1 w-fit rounded-md">Aislado</Badge>;
            case 'En Trámite':
                return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-semibold text-xs px-2 py-0.5 shadow-none flex items-center gap-1 w-fit rounded-md">En Trámite</Badge>;
            case 'Cerrado':
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-semibold text-xs px-2 py-0.5 shadow-none flex items-center gap-1 w-fit rounded-md"><CheckCircle2 className="w-3 h-3" /> Cerrado</Badge>;
            default:
                return <Badge variant="outline" className="rounded-md">{status}</Badge>;
        }
    };

    const getDispositionIcon = (disposition: string) => {
        if (disposition.includes('Reproceso')) return <Recycle className="w-3 h-3 text-blue-600" />;
        if (disposition.includes('Desecho')) return <Ban className="w-3 h-3 text-rose-600" />;
        return <AlertOctagon className="w-3 h-3 text-amber-600" />;
    };

    return (
        <ModulePage>
            <ModuleHeader
                clause="8.7"
                title="Salidas no conformes"
                description="Controle la identificación, contención y disposición de productos y servicios no conformes."
                actions={<>
                    <Button variant="outline">
                        <Ban className="w-4 h-4 mr-2" /> Protocolos de Rechazo
                    </Button>
                    <Button>
                        <PackageX className="h-4 w-4 mr-2" /> Reportar Hallazgo
                    </Button>
                </>}
            />
            <ModuleContent>

            <Tabs defaultValue="registro" className="space-y-8">
                <TabsList className="flex h-auto min-h-11 w-full flex-wrap justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                    <TabsTrigger value="registro" className="min-h-10 flex-none rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Bandeja de Contención</TabsTrigger>
                    <TabsTrigger value="analisis" className="min-h-10 flex-none rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Análisis y Causa Raíz</TabsTrigger>
                </TabsList>

                <TabsContent value="registro" className="space-y-4 m-0">
                    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 px-4 py-5 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-slate-900">Libro de Control de Productos / Servicios No Conformes</h3>
                                <p className="mt-1 text-sm text-slate-500">Trazabilidad de desviaciones y acciones de disposición</p>
                            </div>
                            <div className="flex w-full min-w-0 items-center gap-3 xl:max-w-md">
                                <div className="relative min-w-0 flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Buscar Producto, Defecto, Lote..."
                                        className="pl-12 bg-white border-slate-200 rounded-xl text-slate-900 focus:ring-blue-500 placeholder:text-slate-400 placeholder:text-sm placeholder:font-normal h-11 text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button aria-label="Filtrar salidas no conformes" variant="outline" className="h-11 w-11 border-slate-200 text-slate-500 hover:bg-white rounded-xl shrink-0 shadow-none text-sm font-medium">
                                    <Filter className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                                        <TableHead className="font-semibold text-slate-500 pl-8 w-[120px] h-12 text-sm">Folio ID</TableHead>
                                        <TableHead className="font-semibold text-slate-500 h-12 text-sm">Item Afectado / Proceso Origen</TableHead>
                                        <TableHead className="font-semibold text-slate-500 h-12 text-sm">Descripción de la Falla</TableHead>
                                        <TableHead className="font-semibold text-slate-500 h-12 text-sm">Disposición Técnica</TableHead>
                                        <TableHead className="font-semibold text-slate-500 text-center h-12 text-sm">Estatus</TableHead>
                                        <TableHead className="font-semibold text-slate-500 text-right pr-8 h-12 text-sm">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPNC.map((item) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50 border-b border-slate-50 transition-colors">
                                            <TableCell className="pl-8 py-6">
                                                <span className="text-sm font-semibold text-rose-600 bg-rose-50 px-2 py-1 border border-rose-100 shadow-sm">
                                                    {item.id}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <p className="text-sm font-semibold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                                    {item.product}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 align-middle">
                                                        <Factory className="h-3 w-3" /> {item.process}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Recycle className="h-3 w-3" /> Reportado: {item.date}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-slate-600 font-semibold">{item.defect}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                        {getDispositionIcon(item.disposition)}
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-700 leading-tight">{item.disposition}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-label={`Acciones de ${item.id}`} variant="ghost" className="h-11 w-11 p-0 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 text-sm font-medium">
                                                            <MoreVertical className="h-5 w-5 text-slate-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-slate-200 min-w-[180px] shadow-xl">
                                                        <DropdownMenuItem className="gap-3 py-3 cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-xl text-sm font-medium min-h-10">
                                                            <Eye className="h-4 w-4" /> Detalle Hallazgo
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-3 py-3 cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-xl text-sm font-medium min-h-10">
                                                            <Recycle className="h-4 w-4" /> Ejecutar Disposición
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-3 py-3 cursor-pointer focus:bg-blue-50 focus:text-blue-600 rounded-xl text-sm font-medium min-h-10">
                                                            <Edit className="h-4 w-4" /> Editar Registro
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-100" />
                                                        <DropdownMenuItem className="gap-3 py-3 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600 rounded-xl text-sm font-medium min-h-10">
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
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-4 py-12 text-center shadow-sm sm:px-8 sm:py-16">
                        <div className="bg-blue-50 h-20 w-20 rounded-2xl flex items-center justify-center border border-blue-100 mb-6 text-blue-600">
                            <Search className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-4">Investigación de Causa Raíz</h3>
                        <p className="max-w-sm text-sm leading-relaxed text-slate-500">
                            Vincule sus salidas no conformes con Diagramas de Ishikawa o los 5 por qués para activar acciones correctivas automáticas.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
            </ModuleContent>
        </ModulePage>
    );
}
