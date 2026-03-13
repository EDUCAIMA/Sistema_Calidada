"use client";

import React from 'react';
import {
    TrendingUp, Rocket, Lightbulb, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MejoraContinuaPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Mejora Continua e Innovación</h2>
                    <p className="text-muted-foreground mt-1">
                        Proyectos, sugerencias y acciones preventivas para aumentar la capacidad de cumplir requisitos.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="gap-2 shadow-md bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Lightbulb className="w-4 h-4" />
                        <span>Proponer Iniciativa</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-3 border-none shadow-md bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent dark:bg-slate-900 hover:shadow-lg transition-all">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl">
                            <Rocket className="w-12 h-12" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Banco de Proyectos de Mejora</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-lg">
                                Fomenta la cultura de innovación corporativa. Registra y centraliza todas las sugerencias,
                                evaluando su impacto y rentabilidad antes de ejecutarlas.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                                <Badge variant="outline" className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800"><TrendingUp className="w-4 h-4 mr-2 text-emerald-500" /> Optimización de Procesos</Badge>
                                <Badge variant="outline" className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800"><Target className="w-4 h-4 mr-2 text-blue-500" /> Reducción de Costes</Badge>
                                <Badge variant="outline" className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800"><Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Innovación de Producto</Badge>
                            </div>
                        </div>
                        <div>
                            <Button size="lg" className="w-full md:w-auto shadow-md">
                                Ver Cartera de Proyectos
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
