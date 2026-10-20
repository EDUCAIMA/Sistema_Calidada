"use client";

import { ModulePage, ModuleHeader, ModuleContent } from "@/components/sgc/module-layout";

import React, { useState } from 'react';
import { Megaphone, Plus, Repeat, HelpCircle, Download, Share2, Mail, Users, Globe, MessageSquare, Table as TableIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function ComunicacionPage() {
    const [showISOInfo, setShowISOInfo] = useState(false);

    return (
        <ModulePage>
            {/* Page Header */}
            <ModuleHeader
                clause="7.4"
                title="Comunicación"
                description="Organice las comunicaciones internas y externas pertinentes al sistema de gestión. Código: SIG-CM-04."
                actions={<>

                    <Button variant="outline" aria-label="Ver información normativa ISO 9001:2015" title="Ver información normativa ISO 9001:2015" onClick={() => setShowISOInfo(true)}>
                        <HelpCircle className="h-4 w-4" /> Información ISO
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 px-4 py-2 bg-white border-slate-100 text-slate-700 hover:bg-slate-50 transition-all shadow-sm h-11 rounded-xl font-medium text-sm">
                        <Download className="w-4 h-4 text-red-500" /> PDF
                    </Button>
                    <Button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all h-11 rounded-xl font-medium text-sm">
                        <Plus className="w-4 h-4" /> Nueva Comunicación
                    </Button>

                </>}
            />
            <ModuleContent>

            {/* Communication Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Matriz Vigente', value: '100%', icon: <TableIcon className="w-4 h-4"/>, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Interna', value: '12 Items', icon: <Users className="w-4 h-4"/>, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Externa', value: '8 Items', icon: <Globe className="w-4 h-4"/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Canales Activos', value: '6 Canales', icon: <Share2 className="w-4 h-4"/>, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", stat.bg, stat.color)}>{stat.icon}</div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 leading-none mb-1">{stat.label}</p>
                                <p className="text-lg font-semibold text-slate-800">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Tabs defaultValue="matriz" className="space-y-6">
                <TabsList className="p-1.5 border border-slate-100 h-auto flex flex-wrap justify-start rounded-xl shadow-sm w-full gap-2 bg-slate-50">
                    <TabsTrigger value="matriz" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><TableIcon className="w-4 h-4" /> 7.4.a-e Matriz</TabsTrigger>
                    <TabsTrigger value="interna" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><Users className="w-4 h-4" /> Interna</TabsTrigger>
                    <TabsTrigger value="externa" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><Globe className="w-4 h-4" /> Externa</TabsTrigger>
                </TabsList>

                {/* 7.4.a-e MATRIZ DE COMUNICACIÓN */}
                <TabsContent value="matriz" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <Megaphone className="w-5 h-5 text-purple-600" />
                                <h3 className="font-semibold text-slate-800 text-sm">Matriz de Comunicaciones Pertinentes al SGC</h3>
                            </div>
                            <Button variant="ghost" className="h-11 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50">
                                <Repeat className="w-3.5 h-3.5 mr-2" /> Actualizar Matriz
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold border-r border-slate-100 text-sm text-slate-600">¿Qué comunicar?</th>
                                        <th className="px-6 py-4 font-semibold border-r border-slate-100 text-center text-sm text-slate-600">¿Cuándo?</th>
                                        <th className="px-6 py-4 font-semibold border-r border-slate-100 text-center text-sm text-slate-600">¿A quién?</th>
                                        <th className="px-6 py-4 font-semibold border-r border-slate-100 text-center text-sm text-slate-600">¿Cómo?</th>
                                        <th className="px-6 py-4 font-semibold text-center text-sm text-slate-600">¿Quién comunica?</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                                    {[
                                        { what: 'Desempeño del SGC', when: 'Mensual', who: 'Dirección y Personal', how: 'Reunión / Cartelera', source: 'Gerente de Calidad' },
                                        { what: 'Quejas de Clientes', when: 'Inmediato', who: 'Líderes de Proceso', how: 'Correo / ERP', source: 'Gestión Comercial' },
                                        { what: 'Nuevos Requisitos', when: 'Ante cambios', who: 'Procesos Afectados', how: 'Oficio / Intranet', source: 'Dep. Jurídico' },
                                        { what: 'Política de Calidad', when: 'Inducción / Anual', who: 'Todo el Personal', how: 'Capacitación', source: 'Recursos Humanos' },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-5 border-r border-slate-100 font-bold text-slate-900 text-sm">{row.what}</td>
                                            <td className="px-6 py-5 border-r border-slate-100 text-center"><Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-xs">{row.when}</Badge></td>
                                            <td className="px-6 py-5 border-r border-slate-100 text-center text-xs line-clamp-1 max-w-[150px] mx-auto">{row.who}</td>
                                            <td className="px-6 py-5 border-r border-slate-100 text-center text-xs">{row.how}</td>
                                            <td className="px-6 py-5 text-center text-xs font-bold text-purple-700">{row.source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                {/* 7.4 INTERNA Y EXTERNA (STUBS) */}
                <TabsContent value="interna" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { channel: 'Cartelera Digital', items: 12, icon: <TableIcon className="w-5 h-5"/>, color: 'text-blue-600' },
                            { channel: 'Correo Corporativo', items: 450, icon: <Mail className="w-5 h-5"/>, color: 'text-purple-600' },
                            { channel: 'Reuniones SGC', items: 8, icon: <MessageSquare className="w-5 h-5"/>, color: 'text-emerald-600' },
                        ].map((c, i) => (
                            <Card key={i} className="border border-slate-100 rounded-2xl shadow-sm hover:border-purple-200 transition-all cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className={cn("p-2 rounded-xl w-fit mb-4 transition-all group-hover:scale-110", c.color, "bg-slate-50")}>{c.icon}</div>
                                    <h4 className="font-semibold text-slate-800 text-sm mb-1">{c.channel}</h4>
                                    <p className="text-xs font-bold text-slate-400">{c.items} Registros este mes</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="externa" className="space-y-6">
                    <div className="p-12 text-center text-slate-400 bg-white border border-dashed border-slate-100 rounded-2xl">
                        <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-xs font-bold leading-loose">Comunicaciones con Partes Interesadas (4.2)<br/>Módulo de vinculación externa activo</p>
                        <Button variant="link" className="mt-4 h-11 rounded-xl text-sm font-medium text-blue-600">Ir a partes interesadas →</Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ISO Info Dialog */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col p-0 gap-0 font-sans w-[calc(100vw-2rem)] max-h-[90vh] sm:max-w-4xl rounded-3xl">
                    <header className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">7.4 Comunicación</h1>
                        </div>
                    </header>
                    <div className="px-6 pt-4 pb-8 space-y-6 bg-white overflow-y-auto max-h-[60vh]">
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
                            <p className="text-lg text-gray-800 leading-relaxed italic">
                                La organización <strong className="font-black text-gray-900 not-italic uppercase">debe</strong> determinar las comunicaciones internas y externas pertinentes al sistema de gestión de la calidad, que incluyan:
                            </p>
                            <ul className="space-y-4 text-slate-700 mt-6 font-medium">
                                <li className="flex gap-3 items-center"><span className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">a</span> ¿Qué comunicar?</li>
                                <li className="flex gap-3 items-center"><span className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">b</span> ¿Cuándo comunicar?</li>
                                <li className="flex gap-3 items-center"><span className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">c</span> ¿A quién comunicar?</li>
                                <li className="flex gap-3 items-center"><span className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">d</span> ¿Cómo comunicar?</li>
                                <li className="flex gap-3 items-center"><span className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">e</span> ¿Quién comunica?</li>
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
