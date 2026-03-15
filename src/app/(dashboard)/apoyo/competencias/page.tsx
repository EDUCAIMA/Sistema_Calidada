"use client";

import React, { useState } from 'react';
import {
    GraduationCap, Plus, Search, Filter, MoreVertical,
    Eye, Award, CheckCircle2, History, ClipboardCheck,
    FileSearch, BookOpen, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for roles
const mockProfiles = [
    { code: 'PC-CAL-001', name: 'Gerente de Calidad', education: 'Profesional', experience: '5 años', status: 'Vigente' },
    { code: 'PC-OP-002', name: 'Operario de Producción', education: 'Bachiller', experience: '1 año', status: 'Vigente' },
];

export default function CompetenciasPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">7.2 Competencia</h1>
                    <p className="text-muted-foreground mt-1">
                        Asegure que las personas que realizan el trabajo bajo el control de la organización son competentes.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="perfiles" className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1 border h-auto flex flex-wrap gap-1">
                    <TabsTrigger value="perfiles" className="gap-2 px-4 py-2"><FileSearch className="w-4 h-4" /> Perfil de Cargo</TabsTrigger>
                    <TabsTrigger value="entrenamiento" className="gap-2 px-4 py-2"><BookOpen className="w-4 h-4" /> Matriz de Entrenamiento</TabsTrigger>
                    <TabsTrigger value="eficacia" className="gap-2 px-4 py-2"><UserCheck className="w-4 h-4" /> Evaluación de Eficacia</TabsTrigger>
                </TabsList>

                {/* 7.2.1 PERFIL DE CARGO */}
                <TabsContent value="perfiles" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white/60">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Manual de Perfiles y Funciones</CardTitle>
                            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Nuevo Perfil</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="p-4">Código</th>
                                            <th className="p-4">Nombre del Cargo</th>
                                            <th className="p-4">Educación Mínima</th>
                                            <th className="p-4">Exp. Requerida</th>
                                            <th className="p-4">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {mockProfiles.map((role) => (
                                            <tr key={role.code}>
                                                <td className="p-4 font-bold text-slate-500">{role.code}</td>
                                                <td className="p-4 font-medium">{role.name}</td>
                                                <td className="p-4 font-semibold text-slate-600">{role.education}</td>
                                                <td className="p-4 font-semibold text-slate-600">{role.experience}</td>
                                                <td className="p-4"><Badge className="bg-emerald-50 text-emerald-600 border-none">{role.status}</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 7.2.2 MATRIZ DE ENTRENAMIENTO */}
                <TabsContent value="entrenamiento" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white/60">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Plan Nacional de Formación y Entrenamiento</CardTitle>
                            <Button size="sm" variant="outline" className="gap-2"><Award className="w-4 h-4" /> Plan de Capacitación</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="p-4 min-w-[200px]">Colaborador</th>
                                            <th className="p-4">Formación ISO 9001</th>
                                            <th className="p-4">Seguridad Salud</th>
                                            <th className="p-4">Manejo de Equipos</th>
                                            <th className="p-4">Promedio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 italic text-slate-500">
                                        <tr>
                                            <td className="p-4 font-bold text-slate-900 not-italic">Juan Perez</td>
                                            <td className="p-4 text-emerald-600 font-bold">100%</td>
                                            <td className="p-4 text-emerald-600 font-bold">100%</td>
                                            <td className="p-4 text-amber-600 font-bold">50%</td>
                                            <td className="p-4 font-black text-slate-900">83%</td>
                                        </tr>
                                        <tr>
                                            <td className="p-4 font-bold text-slate-900 not-italic">Maria Garcia</td>
                                            <td className="p-4 text-emerald-600 font-bold">100%</td>
                                            <td className="p-4 text-amber-600 font-bold">25%</td>
                                            <td className="p-4 text-red-600 font-bold">0%</td>
                                            <td className="p-4 font-black text-slate-900">41%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 7.2.3 EVALUACIÓN DE EFICACIA */}
                <TabsContent value="eficacia" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-none shadow-sm bg-white/60 p-6 text-center">
                            <ClipboardCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-800">Evaluaciones Realizadas</h3>
                            <p className="text-3xl font-black mt-2">12</p>
                        </Card>
                        <Card className="border-none shadow-sm bg-white/60 p-6 text-center">
                            <Award className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-800">Eficacia Promedio</h3>
                            <p className="text-3xl font-black mt-2 text-blue-600">88%</p>
                        </Card>
                        <Card className="border-none shadow-sm bg-white/60 p-6 text-center">
                            <History className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-800">Pendientes de Evaluar</h3>
                            <p className="text-3xl font-black mt-2 text-amber-600">3</p>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
