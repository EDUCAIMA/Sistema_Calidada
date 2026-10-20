"use client";

import React from 'react';
import {
    Wrench, CheckCircle2, History, Link2, Plus, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';

export default function AccionesCorrectivasPage() {
    return (
        <ModulePage>
            <ModuleHeader
                clause="10.2"
                title="Acciones correctivas"
                description="Análisis de causas raíz y planes de acción para evitar la recurrencia."
                actions={<Button className="gap-2 rounded-xl text-sm font-medium">
                        <Plus className="w-4 h-4" />
                        <span>Nueva Acción Correctiva</span>
                    </Button>}
            />
            <ModuleContent>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="dark:bg-slate-900/50 transition-all min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 min-w-0">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg">
                                <Wrench className="h-6 w-6" />
                            </div>
                            <Badge className="bg-blue-500/10 text-blue-600 pointer-events-none gap-1 rounded-md">
                                <History className="w-3 h-3" /> En Implementación
                            </Badge>
                        </div>
                        <CardTitle className="text-lg mt-4 flex flex-wrap items-center justify-between gap-2">
                            AC-2026-001
                            <span className="text-sm font-normal text-muted-foreground flex items-center gap-1 cursor-pointer hover:underline text-blue-600"><Link2 className="w-3 h-3" /> NC-2026-001</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-2 break-words h-10">Ajustar parámetros de la máquina inyectora N°4 y capacitar al personal.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 min-w-0">
                        <div>
                            <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="text-slate-500 font-medium">Avance</span>
                                <span className="font-semibold text-slate-700">75%</span>
                            </div>
                            <Progress value={75} className="h-2 [&>div]:bg-blue-500" />
                        </div>
                        <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl text-sm font-medium">
                            Ver Detalles <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-900/50 transition-all min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 min-w-0">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 pointer-events-none gap-1 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> Verificada
                            </Badge>
                        </div>
                        <CardTitle className="text-lg mt-4 flex flex-wrap items-center justify-between gap-2">
                            AC-2025-012
                            <span className="text-sm font-normal text-muted-foreground flex items-center gap-1 cursor-pointer hover:underline text-blue-600"><Link2 className="w-3 h-3" /> NC-2025-015</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-2 break-words h-10">Modificar matriz de evaluación de proveedores de materia prima crítica.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 min-w-0">
                        <div>
                            <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="text-slate-500 font-medium">Efectividad Validada</span>
                                <span className="font-semibold text-emerald-600">Sí</span>
                            </div>
                            <Progress value={100} className="h-2 [&>div]:bg-emerald-500" />
                        </div>
                        <Button variant="ghost" className="w-full rounded-xl text-sm font-medium">
                            Ver Cierre <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
            </ModuleContent>
        </ModulePage>
    );
}
