"use client";

import React from 'react';
import {
    ClipboardList, Plus, History, FileText, CheckCircle2, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';

export default function RevisionDireccionPage() {
    return (
        <ModulePage>
            <ModuleHeader
                clause="9.3"
                title="Revisión por la dirección"
                description="Evaluación integral del SGC por parte de la alta dirección."
                actions={<>
                    <Button variant="outline" className="gap-2 rounded-xl text-sm font-medium">
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline">Historial</span>
                    </Button>
                    <Button className="gap-2 rounded-xl text-sm font-medium">
                        <Plus className="w-4 h-4" />
                        <span>Programar Revisión</span>
                    </Button>
                </>}
            />
            <ModuleContent>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="dark:bg-slate-900/50 transition-all min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 min-w-0">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 pointer-events-none gap-1 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> Aprobada
                            </Badge>
                        </div>
                        <CardTitle className="text-lg mt-4">Acta de Revisión N° 004</CardTitle>
                        <CardDescription>Revisión Anual del Desempeño 2025.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 min-w-0">
                        <div className="text-sm">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Fecha de Reunión:</p>
                            <p className="text-slate-500">10 Diciembre 2025</p>
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Entradas Analizadas:</p>
                            <p className="text-slate-500">Auditorías, Obj. Calidad, Retroalimentación Ctes.</p>
                        </div>
                        <Button variant="outline" className="w-full gap-2 mt-2 rounded-xl text-sm font-medium"><FileText className="w-4 h-4" /> Ver Documento Completo</Button>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-900/50 transition-all min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 min-w-0">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-slate-500/10 text-slate-600 rounded-lg">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="gap-1 bg-slate-100 rounded-md">
                                <UserCheck className="w-3 h-3" /> Cerrada
                            </Badge>
                        </div>
                        <CardTitle className="text-lg mt-4">Acta de Revisión N° 003</CardTitle>
                        <CardDescription>Revisión Semestral del Desempeño 2025.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 min-w-0">
                        <div className="text-sm">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Fecha de Reunión:</p>
                            <p className="text-slate-500">15 Junio 2025</p>
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Entradas Analizadas:</p>
                            <p className="text-slate-500">Desempeño Proveedores, Conformidad de Prods.</p>
                        </div>
                        <Button variant="outline" className="w-full gap-2 mt-2 rounded-xl text-sm font-medium"><FileText className="w-4 h-4" /> Consultar Archivo</Button>
                    </CardContent>
                </Card>
            </div>
            </ModuleContent>
        </ModulePage>
    );
}
