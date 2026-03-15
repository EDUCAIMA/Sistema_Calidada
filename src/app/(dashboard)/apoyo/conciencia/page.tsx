"use client";

import React from 'react';
import {
    Users, Plus, CheckSquare, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ConcienciaPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">7.3 Toma de Conciencia</h1>
                    <p className="text-muted-foreground mt-1">
                        Asegure que el personal sea consciente de la política, objetivos y su contribución al SGC.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-white/60">
                    <CardHeader>
                        <CardTitle className="text-lg">Registro de Inducciones y Re-inducciones</CardTitle>
                        <CardDescription>Evidencia de que el personal conoce la política y objetivos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="font-bold text-sm">Personal Inducido</p>
                                        <p className="text-xs text-muted-foreground">Último trimestre</p>
                                    </div>
                                </div>
                                <span className="text-xl font-black">98%</span>
                            </div>
                            <Button className="w-full gap-2"><Plus className="h-4 w-4" /> Registrar Nueva Inducción</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white/60">
                    <CardHeader>
                        <CardTitle className="text-lg">Temas Críticos de Conciencia</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-emerald-900 line-clamp-1">Política de Calidad</p>
                                <p className="text-xs text-emerald-700">Conocida y comprendida por el personal.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-900 line-clamp-1">Contribución a la Eficacia</p>
                                <p className="text-xs text-amber-700">Mejorar el reporte de no conformidades.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
