"use client";

import React from 'react';
import {
    TrendingUp, Rocket, Lightbulb, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';

export default function MejoraContinuaPage() {
    return (
        <ModulePage>
            <ModuleHeader
                clause="10.3"
                title="Mejora continua e innovación"
                description="Proyectos, sugerencias y acciones preventivas para aumentar la capacidad de cumplir requisitos."
                actions={<Button className="gap-2 rounded-xl text-sm font-medium">
                        <Lightbulb className="w-4 h-4" />
                        <span>Proponer Iniciativa</span>
                    </Button>}
            />
            <ModuleContent>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-3 bg-gradient-to-r from-blue-50 via-white to-slate-50 dark:bg-slate-900 min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <CardContent className="flex min-w-0 flex-col items-center gap-6 p-4 sm:p-6 xl:flex-row">
                        <div className="shrink-0 rounded-2xl bg-blue-600 p-4 text-white">
                            <Rocket className="w-12 h-12" />
                        </div>
                        <div className="min-w-0 flex-1 text-center xl:text-left">
                            <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Banco de Proyectos de Mejora</h3>
                            <p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                Fomenta la cultura de innovación corporativa. Registra y centraliza todas las sugerencias,
                                evaluando su impacto y rentabilidad antes de ejecutarlas.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3 xl:justify-start">
                                <Badge variant="outline" className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 rounded-md"><TrendingUp className="w-4 h-4 mr-2 text-emerald-500" /> Optimización de Procesos</Badge>
                                <Badge variant="outline" className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 rounded-md"><Target className="w-4 h-4 mr-2 text-blue-500" /> Reducción de Costes</Badge>
                                <Badge variant="outline" className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 rounded-md"><Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Innovación de Producto</Badge>
                            </div>
                        </div>
                        <div>
                            <Button size="lg" className="w-full md:w-auto rounded-xl text-sm font-medium">
                                Ver Cartera de Proyectos
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            </ModuleContent>
        </ModulePage>
    );
}
