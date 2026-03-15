"use client";

import React from 'react';
import Link from 'next/link';
import { 
    Users, Building2, MessageSquare, FileText, 
    Wrench, GraduationCap, Megaphone, ShieldCheck,
    ArrowRight, CheckSquare, Settings2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const supportAreas = [
    {
        id: '7.1',
        title: 'Recursos',
        description: '7.1.1 Generalidades, 7.1.2 Personas, 7.1.3 Infraestructura, 7.1.4 Ambiente, 7.1.5 Seguimiento y 7.1.6 Conocimientos.',
        icon: <Building2 className="h-8 w-8 text-blue-500" />,
        href: '/apoyo/recursos',
        color: 'from-blue-500/20 to-blue-600/5',
        stats: '6 Submódulos'
    },
    {
        id: '7.2',
        title: 'Competencia',
        description: 'Asegurar que el personal sea competente basándose en educación, formación y experiencia.',
        icon: <GraduationCap className="h-8 w-8 text-emerald-500" />,
        href: '/apoyo/competencias',
        color: 'from-emerald-500/20 to-emerald-600/5',
        stats: 'Perfiles y Entrenamiento'
    },
    {
        id: '7.3',
        title: 'Toma de conciencia',
        description: 'Asegurar que el personal sea consciente de la política, objetivos y su contribución al SGC.',
        icon: <CheckSquare className="h-8 w-8 text-amber-500" />,
        href: '/apoyo/conciencia',
        color: 'from-amber-500/20 to-amber-600/5',
        stats: 'Concienciación'
    },
    {
        id: '7.4',
        title: 'Comunicación',
        description: 'Determinación de las comunicaciones internas y externas pertinentes al SGC.',
        icon: <Megaphone className="h-8 w-8 text-purple-500" />,
        href: '/apoyo/comunicacion',
        color: 'from-purple-500/20 to-purple-600/5',
        stats: 'Matriz de Comms'
    },
    {
        id: '7.5',
        title: 'Información documentada',
        description: '7.5.1 Generalidades, 7.5.2 Creación y actualización, 7.5.3 Control de la información.',
        icon: <FileText className="h-8 w-8 text-indigo-500" />,
        href: '/apoyo/documentos',
        color: 'from-indigo-500/20 to-indigo-600/5',
        stats: 'Gestor Documental'
    },
];

export default function ApoyoDashboard() {
    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 border-b pb-2 inline-block bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
                    7. Apoyo
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    Gestione los procesos de soporte según la estructura de la norma ISO 9001:2015.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supportAreas.map((area) => (
                    <Link key={area.id} href={area.href}>
                        <Card className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white flex flex-col h-full">
                            <div className={`absolute inset-0 bg-gradient-to-br ${area.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            <CardHeader className="relative z-10 flex flex-row items-center gap-4 pb-2">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    {area.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full w-fit mb-1">
                                        Numeral {area.id}
                                    </span>
                                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
                                        {area.title}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10 flex flex-col flex-1 justify-between mt-2">
                                <CardDescription className="text-sm leading-relaxed text-slate-600 mb-6 line-clamp-3">
                                    {area.description}
                                </CardDescription>
                                <div className="flex items-center text-xs font-bold text-primary group-hover:underline mt-auto">
                                    Abrir módulo
                                    <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Status Section */}
            <div className="mt-8 bg-slate-50/50 rounded-3xl p-8 border border-slate-200/60">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    <h3 className="text-xl font-bold text-slate-800">Estado de Cumplimiento - Numeral 7</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recursos (7.1)</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-slate-900">85%</span>
                            <Badge className="bg-emerald-50 text-emerald-600 border-none mb-1">Óptimo</Badge>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Competencia (7.2)</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-slate-900">92%</span>
                            <Badge className="bg-blue-50 text-blue-600 border-none mb-1">En curso</Badge>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Documentación (7.5)</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-slate-900">100%</span>
                            <Badge className="bg-emerald-50 text-emerald-600 border-none mb-1">Controlado</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
