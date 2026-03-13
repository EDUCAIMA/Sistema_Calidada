"use client";

import React, { useState } from 'react';
import {
    Users, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Eye, GitMerge, CheckCircle2, Building
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
import { cn } from '@/lib/utils';

// Mock data for roles
const mockRoles = [
    {
        id: 'ROL-001',
        title: 'Gerente General',
        department: 'Gerencia',
        reportsTo: 'Directorio',
        level: 'Directivo',
        occupants: 1,
    },
    {
        id: 'ROL-002',
        title: 'Director de Calidad',
        department: 'Gestión de Calidad',
        reportsTo: 'Gerente General',
        level: 'Directivo',
        occupants: 1,
    },
    {
        id: 'ROL-003',
        title: 'Auditor Interno SGC',
        department: 'Gestión de Calidad',
        reportsTo: 'Director de Calidad',
        level: 'Profesional',
        occupants: 3,
    },
    {
        id: 'ROL-004',
        title: 'Coordinador de Operaciones',
        department: 'Operaciones',
        reportsTo: 'Gerente de Operaciones',
        level: 'Mando Medio',
        occupants: 2,
    },
    {
        id: 'ROL-005',
        title: 'Especialista en Soporte Técnico',
        department: 'TI',
        reportsTo: 'Jefe de TI',
        level: 'Técnico',
        occupants: 5,
    }
];

export default function RolesPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRoles = mockRoles.filter(role =>
        role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10 bg-slate-50 min-h-screen -m-6 p-10">
            <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Roles y <span className="text-blue-600">Autoridades</span></h1>
                    <div className="flex items-center gap-3 mt-4">
                        <Badge className="bg-white border-slate-200 text-slate-500 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] px-3 shadow-sm">ISO 9001:2015</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cláusula 5.3 — Roles, Responsabilidades y Autoridades</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-white rounded-none h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-none">
                        <GitMerge className="w-4 h-4 mr-2" /> Organigrama
                    </Button>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-none px-8 h-12 font-bold uppercase italic tracking-wider transition-all shadow-lg hover:shadow-blue-100">
                        <Plus className="h-4 w-4 mr-2" /> Nuevo Registro
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="listado" className="space-y-8">
                <TabsList className="bg-transparent p-0 h-auto gap-8 border-b border-slate-200 w-full justify-start rounded-none">
                    <TabsTrigger value="listado" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-0 pb-4 font-bold uppercase text-[10px] tracking-[0.2em] text-slate-400 data-[state=active]:text-blue-600 transition-all italic">
                        Listado de Roles
                    </TabsTrigger>
                    <TabsTrigger value="matrices" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-0 pb-4 font-bold uppercase text-[10px] tracking-[0.2em] text-slate-400 data-[state=active]:text-blue-600 transition-all italic">
                        Matriz de Responsabilidades
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="listado" className="space-y-8 outline-none">
                    {/* Filters */}
                    <div className="bg-white border border-slate-200 p-6 flex items-center gap-6 shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por cargo, departamento, nivel..."
                                className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-none text-slate-900 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-14 w-14 border-slate-200 text-slate-400 hover:bg-slate-50 rounded-none shrink-0 shadow-none">
                            <Filter className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Roles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRoles.map((role) => (
                            <div key={role.id} className="group bg-white border border-slate-200 overflow-hidden relative transition-all hover:shadow-xl hover:border-slate-300">
                                <div className="h-1.5 w-full bg-blue-600" />
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 border border-blue-100 mb-2 inline-block">
                                                {role.id}
                                            </span>
                                            <h3 className="text-lg font-black text-slate-900 italic uppercase tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                                                {role.title}
                                            </h3>
                                        </div>
                                        <Badge className="bg-slate-50 text-slate-400 border-slate-100 rounded-none font-bold text-[9px] uppercase shadow-none">
                                            {role.level}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                <Building className="h-4 w-4 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Departamento</p>
                                                <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">{role.department}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                <GitMerge className="h-4 w-4 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Reporta a</p>
                                                <p className="text-xs font-bold text-slate-600 uppercase">{role.reportsTo}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <span className="text-[10px] font-bold text-slate-300 uppercase italic tracking-tighter">
                                            <Users className="h-3 w-3 inline mr-1" /> {role.occupants} Cargo(s)
                                        </span>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-none shadow-none border-0">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-none shadow-none border-0">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="matrices" className="space-y-8 outline-none">
                    <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <GitMerge className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 italic uppercase tracking-tighter">Matriz RACI - Procesos Clave</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Interacción de cargos y responsabilidades</p>
                                </div>
                            </div>
                            <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-white rounded-none h-10 px-6 font-bold uppercase text-[10px] tracking-widest shadow-none">
                                <Edit className="w-3.5 h-3.5 mr-2" /> Editar Matriz
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="p-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 min-w-[300px]">Proceso / Actividad del SGC</th>
                                        {['Gerencia', 'Calidad', 'Operaciones', 'Auditoría'].map(header => (
                                            <th key={header} className="p-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-l border-slate-100">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { act: 'Revisión por la Dirección', tags: ['A', 'R', 'I', 'I'] },
                                        { act: 'Aprobación de Políticas', tags: ['AR', 'C', 'I', '-'] },
                                        { act: 'Auditorías Internas', tags: ['I', 'A', 'I', 'R'] },
                                        { act: 'Tratamiento de No Conformidades', tags: ['I', 'C', 'R', 'I'] }
                                    ].map((row, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                            <td className="p-6">
                                                <span className="text-sm font-bold text-slate-700 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors">
                                                    {row.act}
                                                </span>
                                            </td>
                                            {row.tags.map((tag, tIdx) => (
                                                <td key={tIdx} className="p-6 text-center border-l border-slate-50">
                                                    <span className={cn(
                                                        "inline-flex items-center justify-center h-8 w-12 text-[11px] font-black italic",
                                                        tag === 'A' || tag === 'AR' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                                            tag === 'R' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                                tag === 'C' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                                    tag === 'I' ? "bg-slate-50 text-slate-400 border border-slate-100" : "text-slate-200"
                                                    )}>
                                                        {tag}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-8 bg-slate-50 flex items-center gap-10 justify-center">
                            {[
                                { l: 'R', d: 'Responsable', c: 'text-emerald-600' },
                                { l: 'A', d: 'Aprobador', c: 'text-blue-600' },
                                { l: 'C', d: 'Consultado', c: 'text-amber-600' },
                                { l: 'I', d: 'Informado', c: 'text-slate-400' }
                            ].map(leg => (
                                <div key={leg.l} className="flex items-center gap-2">
                                    <span className={cn("text-[11px] font-black italic", leg.c)}>{leg.l}:</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{leg.d}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
