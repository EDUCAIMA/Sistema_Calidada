"use client";

import React, { useState } from 'react';
import {
    GraduationCap, Plus, Search, Filter, MoreVertical,
    Eye, Award, CheckCircle2, History, ClipboardCheck,
    FileSearch, BookOpen, UserCheck, HelpCircle,
    Settings, Download, Clock, Star, Target,
    Trophy, Users, Briefcase, 
    Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Mock data
const mockProfiles = [
    { code: 'PC-CAL-001', name: 'Gerente de Calidad', education: 'Profesional en Ing. Industrial o similar', experience: '5 años en SGC', status: 'Vigente', compliance: 100 },
    { code: 'PC-OP-002', name: 'Operario de Producción', education: 'Bachiller académico', experience: '1 año en cargos similares', status: 'Vigente', compliance: 85 },
    { code: 'PC-ADM-003', name: 'Asistente Administrativo', education: 'Técnico o Tecnólogo', experience: '2 años', status: 'En Revisión', compliance: 90 },
];

export default function CompetenciasPage() {
    const [showISOInfo, setShowISOInfo] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8fafc] -m-6 p-8 font-sans text-slate-900 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase">Competencia</h1>
                        <button
                            onClick={() => setShowISOInfo(true)}
                            className="p-1.5 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-all active:scale-95"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-[#10b981]/10 text-[#10b981] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Cláusula 7.2</span>
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Gestión del Talento</span>
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase group-hover:border-emerald-400 group-hover:text-emerald-600 transition-colors">Código: SIG-TH-02</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="flex items-center gap-2 px-4 py-2 bg-white border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs transition-all shadow-sm h-10">
                        <Download className="w-4 h-4 text-red-500" /> PDF
                    </Button>
                    <Button className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-black font-bold text-xs shadow-lg transition-all h-10 uppercase tracking-wider">
                        <Plus className="w-4 h-4" /> Nuevo Registro
                    </Button>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Eficacia Global', value: '88%', icon: <Target className="w-5 h-5"/>, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Capacitaciones', value: '14/15', icon: <Trophy className="w-5 h-5"/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Perfiles Al Día', value: '92%', icon: <Briefcase className="w-5 h-5"/>, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Brecha Crítica', value: '4%', icon: <Star className="w-5 h-5"/>, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className={cn("p-2 rounded-xl", stat.bg, stat.color)}>{stat.icon}</div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800">{stat.value}</div>
                    </div>
                ))}
            </div>

            <Tabs defaultValue="perfiles" className="space-y-6">
                <TabsList className="bg-white p-1.5 border border-slate-200 h-auto flex flex-wrap gap-1.5 justify-start rounded-xl shadow-sm">
                    <TabsTrigger value="perfiles" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-[#10b981] data-[state=active]:text-white transition-all rounded-lg"><FileSearch className="w-4 h-4" /> 7.2.a Perfiles</TabsTrigger>
                    <TabsTrigger value="formacion" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-[#10b981] data-[state=active]:text-white transition-all rounded-lg"><BookOpen className="w-4 h-4" /> 7.2.b Formación</TabsTrigger>
                    <TabsTrigger value="eficacia" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-[#10b981] data-[state=active]:text-white transition-all rounded-lg"><UserCheck className="w-4 h-4" /> 7.2.c Eficacia</TabsTrigger>
                </TabsList>

                {/* 7.2.a PERFILES DE CARGO (Competencia Requerida) */}
                <TabsContent value="perfiles" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileSearch className="w-5 h-5 text-[#10b981]" />
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Manual de Perfiles y Competencias</h3>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input placeholder="Buscar cargo..." className="pl-9 h-8 w-48 text-xs bg-white border-slate-200 rounded-lg" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Código</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre del Cargo</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Educación / Formación</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cump.</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Opciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {mockProfiles.map((p) => (
                                        <tr key={p.code} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-black font-mono text-xs text-slate-400 tracking-tighter">{p.code}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800 text-sm">{p.name}</td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="text-xs text-slate-600 font-medium line-clamp-1">{p.education}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{p.experience}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 w-20">
                                                    <span className="text-[10px] font-black text-slate-500 text-right">{p.compliance}%</span>
                                                    <Progress value={p.compliance} className="h-1 bg-slate-100" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                                    p.status === 'Vigente' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                                )}>
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#10b981] hover:bg-emerald-50"><Eye className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                {/* 7.2.b FORMACIÓN Y ENTRENAMIENTO */}
                <TabsContent value="formacion" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-black uppercase tracking-tight">Plan de Capacitación 2026</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest">Acciones para adquirir competencia</CardDescription>
                                </div>
                                <Button size="sm" variant="outline" className="h-8 px-3 text-[10px] font-bold uppercase rounded-lg border-slate-200">Ver Calendario</Button>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {[
                                    { name: 'Interpretación ISO 9001:2015', date: 'Marzo 15', progress: 100, status: 'Completado' },
                                    { name: 'Gestión de Riesgos y Oportunidades', date: 'Abril 10', progress: 45, status: 'En progreso' },
                                    { name: 'Auditoría Interna de Calidad', date: 'Mayo 22', progress: 0, status: 'Programado' },
                                ].map((cap, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-emerald-200 transition-all cursor-pointer group">
                                        <div className="flex gap-4 items-center">
                                            <div className="h-10 w-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#10b981] group-hover:border-emerald-100 transition-all">
                                                <Award className="w-5 h-5"/>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{cap.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{cap.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{cap.progress}%</p>
                                            <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${cap.progress}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-black uppercase tracking-tight">Habilidades por Proceso</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest">Matriz de entrenamiento por áreas</CardDescription>
                                </div>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 rounded-lg"><Filter className="w-4 h-4"/></Button>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {['Operaciones', 'Ventas', 'Administración'].map((process, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <span>{process}</span>
                                                <span>{80 - (idx * 15)}% Competente</span>
                                            </div>
                                            <Progress value={80 - (idx * 15)} className={cn("h-1.5", idx === 0 ? "bg-emerald-100" : "bg-slate-100")} />
                                        </div>
                                    ))}
                                    <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-600">
                                                    U{i}
                                                </div>
                                            ))}
                                            <div className="h-7 w-7 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center text-[9px] font-black text-blue-600">
                                                +8
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">12 Usuarios Verificados</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* 7.2.c EVALUACIÓN DE EFICACIA */}
                <TabsContent value="eficacia" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-2xl mx-auto shadow-sm">
                        <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6 border border-blue-100">
                            <ClipboardCheck className="w-8 h-8"/>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Evaluación de la Eficacia de las Acciones</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                            Numeral 7.2 inciso (c): "cuando sea aplicable, tomar acciones para adquirir la competencia necesaria y evaluar la eficacia de las acciones tomadas". Registre los resultados de las evaluaciones post-capacitación aquí.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Eficacia Promedio</p>
                                <p className="text-2xl font-black text-blue-600">94.5%</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acciones Evaluadas</p>
                                <p className="text-2xl font-black text-slate-800">22 / 24</p>
                            </div>
                        </div>
                        <Button className="mt-8 bg-[#10b981] hover:bg-emerald-700 text-white font-bold uppercase text-xs tracking-widest h-12 px-10 rounded-xl shadow-lg shadow-emerald-600/20">
                            Evaluar Nueva Acción
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ISO Info Dialog */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden flex flex-col p-0 gap-0 font-sans">
                    <header className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">7.2 Competencia</h1>
                            <h2 className="text-lg font-medium text-emerald-600 uppercase tracking-widest">Requisitos Normativos ISO 9001:2015</h2>
                        </div>
                    </header>
                    <div className="px-6 pt-4 pb-8 space-y-6 bg-white overflow-y-auto max-h-[60vh]">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                            <p className="text-lg text-gray-800 leading-relaxed italic">
                                La organización <strong className="font-black text-gray-900 not-italic uppercase">debe</strong>:
                            </p>
                            <ul className="space-y-4 text-slate-700">
                                <li className="flex gap-3"><span className="font-bold text-emerald-600">a)</span> Determinar la competencia necesaria de las personas que realizan, bajo su control, un trabajo que afecta al desempeño y eficacia del SGC.</li>
                                <li className="flex gap-3"><span className="font-bold text-emerald-600">b)</span> Asegurarse de que estas personas sean competentes, basándose en la educación, formación o experiencia adecuadas.</li>
                                <li className="flex gap-3"><span className="font-bold text-emerald-600">c)</span> Cuando sea aplicable, tomar acciones para adquirir la competencia necesaria y evaluar la eficacia de las acciones tomadas.</li>
                                <li className="flex gap-3"><span className="font-bold text-emerald-600">d)</span> Conservar la información documentada apropiada como evidencia de la competencia.</li>
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
