"use client";

import React from 'react';
import {
    Wrench, CheckCircle2, History, Link2, Plus, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function AccionesCorrectivasPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Acciones Correctivas (AC)</h2>
                    <p className="text-muted-foreground mt-1">
                        Análisis de causas raíz y planes de acción para evitar la recurrencia.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="gap-2 shadow-md">
                        <Plus className="w-4 h-4" />
                        <span>Nueva Acción Correctiva</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 hover:shadow-lg transition-all">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg">
                                <Wrench className="h-6 w-6" />
                            </div>
                            <Badge className="bg-blue-500/10 text-blue-600 pointer-events-none gap-1">
                                <History className="w-3 h-3" /> En Implementación
                            </Badge>
                        </div>
                        <CardTitle className="text-lg mt-4 flex items-center justify-between">
                            AC-2026-001
                            <span className="text-sm font-normal text-muted-foreground flex items-center gap-1 cursor-pointer hover:underline text-blue-600"><Link2 className="w-3 h-3" /> NC-2026-001</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-2 break-words h-10">Ajustar parámetros de la máquina inyectora N°4 y capacitar al personal.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div>
                            <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="text-slate-500 font-medium">Avance</span>
                                <span className="font-bold text-slate-700">75%</span>
                            </div>
                            <Progress value={75} className="h-2 [&>div]:bg-blue-500" />
                        </div>
                        <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950">
                            Ver Detalles <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 hover:shadow-lg transition-all opacity-80">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 pointer-events-none gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Verificada
                            </Badge>
                        </div>
                        <CardTitle className="text-lg mt-4 flex items-center justify-between">
                            AC-2025-012
                            <span className="text-sm font-normal text-muted-foreground flex items-center gap-1 cursor-pointer hover:underline text-blue-600"><Link2 className="w-3 h-3" /> NC-2025-015</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-2 break-words h-10">Modificar matriz de evaluación de proveedores de materia prima crítica.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div>
                            <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="text-slate-500 font-medium">Efectividad Validada</span>
                                <span className="font-bold text-emerald-600">Sí</span>
                            </div>
                            <Progress value={100} className="h-2 [&>div]:bg-emerald-500" />
                        </div>
                        <Button variant="ghost" className="w-full">
                            Ver Cierre <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
