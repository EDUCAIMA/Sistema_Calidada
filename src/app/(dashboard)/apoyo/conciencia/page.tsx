"use client";

import { ModulePage, ModuleHeader, ModuleContent } from "@/components/sgc/module-layout";

import React, { useState } from 'react';
import { Users, Plus, CheckCircle2, HelpCircle, Download, Clock, Lightbulb, ShieldAlert, Award, BookCheck, ClipboardList, Target, MessageSquareMore } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function ConcienciaPage() {
    const [showISOInfo, setShowISOInfo] = useState(false);

    return (
        <ModulePage>
            {/* Page Header */}
            <ModuleHeader
                clause="7.3"
                title="Toma de conciencia"
                description="Realice seguimiento a la inducción y a la contribución de las personas al sistema de gestión. Código: SIG-TH-03."
                actions={<>

                    <Button variant="outline" aria-label="Ver información normativa ISO 9001:2015" title="Ver información normativa ISO 9001:2015" onClick={() => setShowISOInfo(true)}>
                        <HelpCircle className="h-4 w-4" /> Información ISO
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 px-4 py-2 bg-white border-slate-100 text-slate-700 hover:bg-slate-50 transition-all shadow-sm h-11 rounded-xl font-medium text-sm">
                        <Download className="w-4 h-4 text-red-500" /> PDF
                    </Button>
                    <Button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all h-11 rounded-xl font-medium text-sm">
                        <Plus className="w-4 h-4" /> Registrar Inducción
                    </Button>

                </>}
            />
            <ModuleContent>

            {/* Dashboard Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Users className="w-6 h-6"/></div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-semibold text-xs">Alto</Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Personal Concientizado</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-semibold text-slate-800">98.2%</span>
                        <span className="text-xs text-emerald-500 font-bold">+2.1%</span>
                    </div>
                    <Progress value={98} className="h-1.5 mt-4 bg-slate-100" />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Lightbulb className="w-16 h-16 text-amber-500"/>
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-semibold text-slate-400 mb-2">Próxima Reinducción</p>
                        <h3 className="text-lg font-semibold text-slate-800">Área Operativa</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">15 de Abril 2026 — 09:00 AM</p>
                        <Button variant="link" className="mt-4 h-auto px-0 text-sm font-medium text-blue-600">Ver detalles →</Button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 mb-4">Temas Entregados</p>
                    <div className="flex flex-wrap gap-2">
                        {['Política', 'Objetivos', 'Contribución'].map(t => (
                            <Badge key={t} className="bg-slate-100 text-slate-600 border-none font-bold text-xs py-1.5 px-3">{t}</Badge>
                        ))}
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <p className="text-xs font-semibold text-slate-600">Campaña de No Conformidades Activa</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="seguimiento" className="space-y-6">
                <TabsList className="p-1.5 border border-slate-100 h-auto flex flex-wrap justify-start rounded-xl shadow-sm w-full gap-2 bg-slate-50">
                    <TabsTrigger value="seguimiento" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><ClipboardList className="w-4 h-4" /> 7.3.1 Seguimiento</TabsTrigger>
                    <TabsTrigger value="mensajes" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><MessageSquareMore className="w-4 h-4" /> 7.3.2 Mensajes Clave</TabsTrigger>
                    <TabsTrigger value="evaluacion" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><BookCheck className="w-4 h-4" /> 7.3.3 Evaluación</TabsTrigger>
                </TabsList>

                {/* 7.3.1 SEGUIMIENTO DE INDUCCIONES */}
                <TabsContent value="seguimiento" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-amber-500" />
                                <h3 className="font-semibold text-slate-800 text-sm">Registro de Sesiones de Conciencia</h3>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="bg-white border-b border-slate-100">
                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Colaborador</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Tipo</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Temas Tratados</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Fecha</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Evidencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[
                                    { name: 'Ricardo Alarcon', type: 'Inducción Inicial', topics: 4, date: '12/03/2026', status: 'Verificado' },
                                    { name: 'Diana Moreno', type: 'Re-inducción Anual', topics: 3, date: '05/03/2026', status: 'Verificado' },
                                    { name: 'Samuel Ruiz', type: 'Inducción Inicial', topics: 4, date: '01/03/2026', status: 'Pendiente' },
                                ].map((reg, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{reg.name}</td>
                                        <td className="px-6 py-4"><span className="text-xs font-semibold text-slate-500">{reg.type}</span></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-slate-700">{reg.topics} / 4</span>
                                                <div className="w-16 h-1 bg-slate-100 rounded-full"><div className="bg-amber-400 h-full" style={{ width: `${(reg.topics/4)*100}%` }}></div></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500 font-mono">{reg.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            {reg.status === 'Verificado' ?
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-semibold text-xs"><CheckCircle2 className="w-3 h-3 mr-1"/> OK</Badge> :
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:bg-amber-50 font-medium text-sm"><Clock className="w-4 h-4" /></Button>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </TabsContent>

                {/* 7.3.2 MENSAJES CLAVE */}
                <TabsContent value="mensajes" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { title: 'Política de Calidad', items: ['Enfoque al cliente', 'Mejora continua'], icon: <Award className="w-6 h-6"/>, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { title: 'Objetivos del SGC', items: ['Meta Específica 2026', 'Impacto por área'], icon: <Target className="w-6 h-6"/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { title: 'Contribución Individual', items: ['Eficacia del proceso', 'Logro de resultados'], icon: <Users className="w-6 h-6"/>, color: 'text-purple-600', bg: 'bg-purple-50' },
                            { title: 'No Conformidad', items: ['Implicaciones críticas', 'Riesgos de incumplimiento'], icon: <ShieldAlert className="w-6 h-6"/>, color: 'text-rose-600', bg: 'bg-rose-50' },
                        ].map((m, i) => (
                            <Card key={i} className="border border-slate-100 rounded-2xl shadow-sm hover:border-amber-200 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                                    <div className={cn("p-2 rounded-xl", m.bg, m.color)}>{m.icon}</div>
                                    <div>
                                        <CardTitle className="text-sm font-semibold">{m.title}</CardTitle>
                                        <CardDescription className="text-xs font-bold leading-none">Pilar Normativo</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {m.items.map((it, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {it}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* 7.3.3 EVALUACIÓN */}
                <TabsContent value="evaluacion" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-center text-slate-900 sm:p-8">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,#f59e0b11,transparent)] pointer-events-none"></div>
                        <div className="h-14 w-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 mb-6 border border-amber-500/30">
                            <BookCheck className="w-8 h-8"/>
                        </div>
                        <h3 className="text-2xl font-semibold mb-4">Midiendo la Toma de Conciencia</h3>
                        <p className="text-slate-400 font-medium mb-8 max-w-xl text-sm leading-relaxed">
                            No basta con informar; la ISO 9001:2015 requiere que el personal sea &quot;consciente&quot;. Realice evaluaciones periódicas para verificar el nivel de interiorización del SGC.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Button className="h-11 rounded-xl bg-blue-600 px-6 font-medium text-white hover:bg-blue-700 text-sm">
                                Lanzar Test de Conciencia
                            </Button>
                            <Button variant="outline" className="h-11 rounded-xl px-6 font-medium text-sm">
                                Ver Historial
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ISO Info Dialog */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col p-0 gap-0 font-sans w-[calc(100vw-2rem)] max-h-[90vh] sm:max-w-4xl rounded-3xl">
                    <header className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">7.3 Toma de Conciencia</h1>
                        </div>
                    </header>
                    <div className="px-6 pt-4 pb-8 space-y-6 bg-white overflow-y-auto max-h-[60vh]">
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                            <p className="text-lg text-gray-800 leading-relaxed italic">
                                La organización <strong className="font-black text-gray-900 not-italic uppercase">debe</strong> asegurarse de que las personas que realizan el trabajo bajo el control de la organización sean conscientes de:
                            </p>
                            <ul className="space-y-4 text-slate-700 mt-6">
                                <li className="flex gap-3 items-start"><span className="font-black text-amber-600">a)</span> la política de la calidad.</li>
                                <li className="flex gap-3 items-start"><span className="font-black text-amber-600">b)</span> los objetivos de la calidad pertinentes.</li>
                                <li className="flex gap-3 items-start"><span className="font-black text-amber-600">c)</span> su contribución a la eficacia del SGC, incluidos los beneficios de una mejora del desempeño.</li>
                                <li className="flex gap-3 items-start"><span className="font-black text-amber-600">d)</span> las implicaciones de no cumplir los requisitos del SGC.</li>
                            </ul>
                        </div>
                    </div>
                    <footer className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end items-center">
                        <Button onClick={() => setShowISOInfo(false)} className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-10 shadow-sm h-11 rounded-xl font-medium text-sm">Entendido</Button>
                    </footer>
                </DialogContent>
            </Dialog>
        </ModuleContent>
        </ModulePage>
    );
}
