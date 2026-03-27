"use client";

import React, { useState } from 'react';
import {
    Users, Plus, CheckSquare, CheckCircle2, AlertCircle, HelpCircle,
    Download, Clock, Lightbulb, ShieldAlert, Award, Search,
    Flame, BookCheck, ClipboardList, Target, MessageSquareMore
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function ConcienciaPage() {
    const [showISOInfo, setShowISOInfo] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8fafc] -m-6 p-8 font-sans text-slate-900 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase">Toma de Conciencia</h1>
                        <button
                            onClick={() => setShowISOInfo(true)}
                            className="p-1.5 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-all active:scale-95"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Cláusula 7.3</span>
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Compromiso Organizacional</span>
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase group-hover:border-amber-400 group-hover:text-amber-600 transition-colors">Código: SIG-TH-03</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="flex items-center gap-2 px-4 py-2 bg-white border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs transition-all shadow-sm h-10">
                        <Download className="w-4 h-4 text-red-500" /> PDF
                    </Button>
                    <Button className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-black font-bold text-xs shadow-lg transition-all h-10 uppercase tracking-wider">
                        <Plus className="w-4 h-4" /> Registrar Inducción
                    </Button>
                </div>
            </div>

            {/* Dashboard Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Users className="w-6 h-6"/></div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px]">ALTO</Badge>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Personal Concientizado</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800">98.2%</span>
                        <span className="text-xs text-emerald-500 font-bold">+2.1%</span>
                    </div>
                    <Progress value={98} className="h-1.5 mt-4 bg-slate-100" />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Lightbulb className="w-16 h-16 text-amber-500"/>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Próxima Reinducción</p>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Área Operativa</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1 italic tracking-tight">15 de Abril 2026 — 09:00 AM</p>
                        <Button variant="link" className="px-0 h-auto text-amber-600 font-black text-[10px] uppercase tracking-widest mt-4">Ver Detalles →</Button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Temas Entregados</p>
                    <div className="flex flex-wrap gap-2">
                        {['Política', 'Objetivos', 'Contribución'].map(t => (
                            <Badge key={t} className="bg-slate-100 text-slate-600 border-none font-bold text-[9px] uppercase tracking-widest py-1.5 px-3">{t}</Badge>
                        ))}
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <p className="text-[10px] font-black text-slate-600 uppercase italic">Campaña de No Conformidades Activa</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="seguimiento" className="space-y-6">
                <TabsList className="bg-white p-1.5 border border-slate-200 h-auto flex flex-wrap gap-1.5 justify-start rounded-xl shadow-sm">
                    <TabsTrigger value="seguimiento" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all rounded-lg"><ClipboardList className="w-4 h-4" /> 7.3.1 Seguimiento</TabsTrigger>
                    <TabsTrigger value="mensajes" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all rounded-lg"><MessageSquareMore className="w-4 h-4" /> 7.3.2 Mensajes Clave</TabsTrigger>
                    <TabsTrigger value="evaluacion" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all rounded-lg"><BookCheck className="w-4 h-4" /> 7.3.3 Evaluación</TabsTrigger>
                </TabsList>

                {/* 7.3.1 SEGUIMIENTO DE INDUCCIONES */}
                <TabsContent value="seguimiento" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-amber-500" />
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Registro de Sesiones de Conciencia</h3>
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Colaborador</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Temas Tratados</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidencia</th>
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
                                                <span className="text-xs font-black text-slate-700">{reg.topics} / 4</span>
                                                <div className="w-16 h-1 bg-slate-100 rounded-full"><div className="bg-amber-400 h-full" style={{ width: `${(reg.topics/4)*100}%` }}></div></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500 font-mono">{reg.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            {reg.status === 'Verificado' ? 
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase"><CheckCircle2 className="w-3 h-3 mr-1"/> OK</Badge> :
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:bg-amber-50"><Clock className="w-4 h-4" /></Button>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                            <Card key={i} className="border border-slate-200 rounded-2xl shadow-sm hover:border-amber-200 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                                    <div className={cn("p-2 rounded-xl", m.bg, m.color)}>{m.icon}</div>
                                    <div>
                                        <CardTitle className="text-sm font-black uppercase tracking-tight">{m.title}</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest leading-none">Pilar Normativo</CardDescription>
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
                    <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col items-center text-center">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,#f59e0b11,transparent)] pointer-events-none"></div>
                        <div className="h-14 w-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 mb-6 border border-amber-500/30">
                            <BookCheck className="w-8 h-8"/>
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Midiendo la Toma de Conciencia</h3>
                        <p className="text-slate-400 font-medium mb-8 max-w-xl text-sm leading-relaxed">
                            No basta con informar; la ISO 9001:2015 requiere que el personal sea "consciente". Realice evaluaciones periódicas para verificar el nivel de interiorización del SGC.
                        </p>
                        <div className="flex gap-4">
                            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-black uppercase text-xs tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-amber-500/20">
                                Lanzar Test de Conciencia
                            </Button>
                            <Button variant="outline" className="border-slate-700 text-white hover:bg-white/5 font-black uppercase text-xs tracking-widest h-12 px-8 rounded-xl">
                                Ver Historial
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ISO Info Dialog */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden flex flex-col p-0 gap-0 font-sans">
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
                        <Button onClick={() => setShowISOInfo(false)} className="bg-slate-900 hover:bg-black text-white font-black py-3 px-10 rounded shadow-md h-auto uppercase tracking-wider text-xs">Entendido</Button>
                    </footer>
                </DialogContent>
            </Dialog>
        </div>
    );
}
