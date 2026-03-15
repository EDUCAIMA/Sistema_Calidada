"use client";

import React from 'react';
import {
    Megaphone, Plus, Repeat
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ComunicacionPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">7.4 Comunicación</h1>
                    <p className="text-muted-foreground mt-1">
                        Determinación de las comunicaciones internas y externas pertinentes al SGC.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white/60">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Matriz de Comunicaciones</CardTitle>
                        <CardDescription>Definición de qué, cuándo, a quién, cómo y quién comunica.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2"><Repeat className="h-4 w-4" /> Actualizar Matriz</Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="p-4 italic">¿Qué comunica?</th>
                                    <th className="p-4">¿A quién?</th>
                                    <th className="p-4">¿Cómo?</th>
                                    <th className="p-4">Periodo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="p-4 font-bold">Desempeño del SGC</td>
                                    <td className="p-4 font-medium text-slate-600">Dirección y Personal</td>
                                    <td className="p-4">Reunión / Cartelera</td>
                                    <td className="p-4"><Badge variant="outline">Mensual</Badge></td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-bold">Quejas de Clientes</td>
                                    <td className="p-4 font-medium text-slate-600">Líderes de Proceso</td>
                                    <td className="p-4">Correo / ERP</td>
                                    <td className="p-4"><Badge variant="outline">Inmediato</Badge></td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-bold">Nuevos Requisitos Legales</td>
                                    <td className="p-4 font-medium text-slate-600">Autoridades / SG</td>
                                    <td className="p-4">Oficio / Web</td>
                                    <td className="p-4"><Badge variant="outline">Evento</Badge></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
