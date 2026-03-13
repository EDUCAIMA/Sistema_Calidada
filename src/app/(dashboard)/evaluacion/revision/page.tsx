"use client";

import React from 'react';
import {
    ClipboardList, Plus, History, FileText, CheckCircle2, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function RevisionDireccionPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Revisión por la Dirección</h2>
                    <p className="text-muted-foreground mt-1">
                        Evaluación integral del SGC por parte de la alta dirección.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 shadow-sm">
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline">Historial</span>
                    </Button>
                    <Button className="gap-2 shadow-md">
                        <Plus className="w-4 h-4" />
                        <span>Programar Revisión</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 hover:shadow-lg transition-all">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 pointer-events-none gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Aprobada
                            </Badge>
                        </div>
                        <CardTitle className="text-lg mt-4">Acta de Revisión N° 004</CardTitle>
                        <CardDescription>Revisión Anual del Desempeño 2025.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="text-sm">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Fecha de Reunión:</p>
                            <p className="text-slate-500">10 Diciembre 2025</p>
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Entradas Analizadas:</p>
                            <p className="text-slate-500">Auditorías, Obj. Calidad, Retroalimentación Ctes.</p>
                        </div>
                        <Button variant="outline" className="w-full gap-2 mt-2"><FileText className="w-4 h-4" /> Ver Documento Completo</Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 hover:shadow-lg transition-all opacity-80">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-slate-500/10 text-slate-600 rounded-lg">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="gap-1 bg-slate-100">
                                <UserCheck className="w-3 h-3" /> Cerrada
                            </Badge>
                        </div>
                        <CardTitle className="text-lg mt-4">Acta de Revisión N° 003</CardTitle>
                        <CardDescription>Revisión Semestral del Desempeño 2025.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="text-sm">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Fecha de Reunión:</p>
                            <p className="text-slate-500">15 Junio 2025</p>
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Entradas Analizadas:</p>
                            <p className="text-slate-500">Desempeño Proveedores, Conformidad de Prods.</p>
                        </div>
                        <Button variant="outline" className="w-full gap-2 mt-2"><FileText className="w-4 h-4" /> Consultar Archivo</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
