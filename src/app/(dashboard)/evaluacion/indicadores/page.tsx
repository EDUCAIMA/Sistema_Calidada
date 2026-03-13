"use client";

import React from 'react';
import {
    BarChart4, PieChart, LineChart as LineChartIcon, TrendingUp, Download, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

const kpiData = [
    { month: 'Ene', satisfaccion: 88, entregas: 95, ncs: 2.1 },
    { month: 'Feb', satisfaccion: 89, entregas: 96, ncs: 1.8 },
    { month: 'Mar', satisfaccion: 88, entregas: 94, ncs: 2.5 },
    { month: 'Abr', satisfaccion: 90, entregas: 97, ncs: 1.5 },
    { month: 'May', satisfaccion: 91, entregas: 98, ncs: 1.2 },
    { month: 'Jun', satisfaccion: 92, entregas: 98, ncs: 4.2 }, // The spike in NCs
];

export default function IndicadoresPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Indicadores de Desempeño (KPIs)</h2>
                    <p className="text-muted-foreground mt-1">
                        Seguimiento, medición, análisis y evaluación del desempeño del SGC.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select defaultValue="2026">
                        <SelectTrigger className="w-[120px] bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2026">Año 2026</SelectItem>
                            <SelectItem value="2025">Año 2025</SelectItem>
                            <SelectItem value="2024">Año 2024</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2 shadow-sm">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exportar Reporte</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 border-l-4 border-l-primary/60">
                    <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                        <div className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Satisfacción del Cliente
                            <PieChart className="w-4 h-4 text-primary opacity-50" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">92%</div>
                            <p className="text-xs text-emerald-600 flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1" /> +2.5% mes anterior
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500">
                    <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                        <div className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Cumplimiento Entregas
                            <LineChartIcon className="w-4 h-4 text-emerald-500 opacity-50" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">98%</div>
                            <p className="text-xs text-emerald-600 flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1" /> Meta: 95%
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 border-l-4 border-l-destructive">
                    <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                        <div className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Índice de No Conformidades
                            <BarChart4 className="w-4 h-4 text-destructive opacity-50" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">4.2%</div>
                            <p className="text-xs text-destructive flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1 text-destructive" /> +1.2% límite excedido
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 border-l-4 border-l-amber-500">
                    <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                        <div className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Eficacia Capacitación
                            <TrendingUp className="w-4 h-4 text-amber-500 opacity-50" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">85%</div>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                Evaluaciones al 100%
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-medium">Evolución Trimestral</CardTitle>
                            <CardDescription>Comparativa de los principales indicadores del SGC (Año en curso).</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 h-8"><Eye className="w-3.5 h-3.5" /> Ver Listado Tabular</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={kpiData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.90 0.01 260)" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="oklch(0.60 0.02 260)" />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="oklch(0.60 0.02 260)" />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="oklch(0.60 0.02 260)" />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line yAxisId="left" type="monotone" dataKey="satisfaccion" name="Satisfacción %" stroke="oklch(0.55 0.20 260)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line yAxisId="left" type="monotone" dataKey="entregas" name="Entregas %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                                <Line yAxisId="right" type="monotone" dataKey="ncs" name="No Conf. %" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
