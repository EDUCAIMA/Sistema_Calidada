"use client";

import React, { useState } from 'react';
import {
    GraduationCap, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Eye, Award, CheckCircle2, History
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

// Mock data
const mockPersonal = [
    { id: 'EMP-001', name: 'Ana Gómez', position: 'Auditor Interno SGC', department: 'Calidad', compliance: 100, status: 'Competente', lastEval: '20/01/2026' },
    { id: 'EMP-002', name: 'Carlos Ruiz', position: 'Coordinador de Operaciones', department: 'Operaciones', compliance: 85, status: 'En Formación', lastEval: '15/11/2025' },
    { id: 'EMP-003', name: 'Elena Torres', position: 'Especialista Soporte', department: 'TI', compliance: 90, status: 'Competente', lastEval: '05/02/2026' },
    { id: 'EMP-004', name: 'Miguel Rojas', position: 'Analista Ciberseguridad', department: 'TI', compliance: 60, status: 'Brecha Detectada', lastEval: '10/12/2025' },
];

export default function CompetenciasPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = mockPersonal.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Competente':
                return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 pointer-events-none gap-1"><CheckCircle2 className="w-3 h-3" /> Competente</Badge>;
            case 'En Formación':
                return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20 pointer-events-none gap-1"><History className="w-3 h-3" /> En Formación</Badge>;
            case 'Brecha Detectada':
                return <Badge variant="destructive" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 pointer-events-none">Brecha Detectada</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 90) return 'bg-emerald-500';
        if (progress >= 70) return 'bg-blue-500';
        return 'bg-amber-500';
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Competencia y Toma de Conciencia</h2>
                    <p className="text-muted-foreground mt-1">
                        Evaluación de competencias, planes de capacitación y concienciación del personal.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 shadow-sm">
                        <Award className="w-4 h-4" />
                        <span className="hidden sm:inline">Plan de Capacitación</span>
                    </Button>
                    <Button className="gap-2 shadow-md">
                        <Plus className="w-4 h-4" />
                        <span>Evaluar Personal</span>
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-primary" />
                            Estado de Competencias por Personal
                        </CardTitle>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Buscar empleado o cargo..."
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
                            <div className="col-span-3">Personal</div>
                            <div className="col-span-3">Cargo / Área</div>
                            <div className="col-span-2">Cumplimiento Perfil</div>
                            <div className="col-span-2">Estado</div>
                            <div className="col-span-1">Última Eval.</div>
                            <div className="col-span-1 text-right">Acciones</div>
                        </div>

                        <div className="divide-y">
                            {filtered.length > 0 ? (
                                filtered.map((item) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/30 transition-colors">
                                        <div className="col-span-3 font-medium">
                                            {item.name}
                                            <div className="text-xs text-muted-foreground font-normal mt-0.5">
                                                {item.id}
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{item.position}</span>
                                            <div className="text-xs text-muted-foreground font-normal mt-0.5">
                                                {item.department}
                                            </div>
                                        </div>
                                        <div className="col-span-2 pr-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span>{item.compliance}%</span>
                                                </div>
                                                <Progress
                                                    value={item.compliance}
                                                    className={`h-2 bg-slate-100 dark:bg-slate-800 [&>div]:${getProgressColor(item.compliance)}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            {getStatusBadge(item.status)}
                                        </div>
                                        <div className="col-span-1 text-slate-500 text-xs">
                                            {item.lastEval}
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
                                                        <Eye className="h-4 w-4" /> Ver Expediente
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                                                        <Award className="h-4 w-4" /> Registrar Curso
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
                                    <GraduationCap className="h-10 w-10 text-slate-300 mb-3" />
                                    <p>No se encontraron registros que coincidan con la búsqueda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
