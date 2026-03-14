"use client";

import Link from 'next/link';
import {
    Network, FileText, ShieldAlert, ClipboardCheck,
    AlertTriangle, Clock, FileCheck, TrendingUp,
    ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockDashboardStats, mockRisks, mockAudits, mockDocuments } from '@/lib/mock-data';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';

const stats = [
    { title: 'Procesos Activos', value: mockDashboardStats.totalProcesses, icon: Network, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+2', up: true, href: '/operacion/procesos' },
    { title: 'Documentos', value: mockDashboardStats.totalDocuments, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+3', up: true, href: '/apoyo/documentos' },
    { title: 'Riesgos Identificados', value: mockDashboardStats.totalRisks, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-1', up: false, href: '/planificacion/riesgos' },
    { title: 'Riesgos Críticos', value: mockDashboardStats.criticalRisks, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', trend: '0', up: false, href: '/planificacion/riesgos' },
    { title: 'Hallazgos Abiertos', value: mockDashboardStats.openFindings, icon: ClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-50', trend: '-2', up: false, href: '/mejora/no-conformidades' },
    { title: 'Auditorías Programadas', value: mockDashboardStats.upcomingAudits, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+1', up: true, href: '/evaluacion/auditorias' },
];

const riskByLevel = [
    { name: 'Bajo', value: mockRisks.filter(r => r.level === 'BAJO').length, color: '#4ade80' },
    { name: 'Medio', value: mockRisks.filter(r => r.level === 'MEDIO').length, color: '#fbbf24' },
    { name: 'Alto', value: mockRisks.filter(r => r.level === 'ALTO').length, color: '#fb923c' },
    { name: 'Crítico', value: mockRisks.filter(r => r.level === 'CRITICO').length, color: '#ef4444' },
];

const riskByType = [
    { type: 'Operacional', count: mockRisks.filter(r => r.type === 'OPERACIONAL').length },
    { type: 'Calidad', count: mockRisks.filter(r => r.type === 'CALIDAD').length },
    { type: 'SST', count: mockRisks.filter(r => r.type === 'SST').length },
];

const docsByStatus = [
    { status: 'Aprobados', count: mockDocuments.filter(d => d.status === 'APROBADO').length },
    { status: 'En revisión', count: mockDocuments.filter(d => d.status === 'EN_REVISION').length },
    { status: 'Borrador', count: mockDocuments.filter(d => d.status === 'BORRADOR').length },
    { status: 'Obsoletos', count: mockDocuments.filter(d => d.status === 'OBSOLETO').length },
];

const monthlyData = [
    { month: 'Sep', riesgos: 12, documentos: 15, hallazgos: 5 },
    { month: 'Oct', riesgos: 14, documentos: 18, hallazgos: 4 },
    { month: 'Nov', riesgos: 11, documentos: 20, hallazgos: 6 },
    { month: 'Dic', riesgos: 10, documentos: 22, hallazgos: 3 },
    { month: 'Ene', riesgos: 9, documentos: 25, hallazgos: 4 },
    { month: 'Feb', riesgos: 8, documentos: 28, hallazgos: 2 },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Resumen general del Sistema de Gestión de Calidad
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {stats.map((stat, i) => (
                    <Link href={stat.href} key={stat.title} className="block group h-full">
                        <Card className="relative border-0 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 h-full bg-white backdrop-blur-md dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden" style={{ animationDelay: `${i * 50}ms` }}>
                            {/* Reflection Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                            
                            <CardContent className="p-3.5 relative z-10 flex flex-col justify-between h-full">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                    <div className={`flex items-center gap-0.5 text-[10px] font-bold ${stat.up ? 'text-emerald-500' : stat.trend === '0' ? 'text-slate-400' : 'text-rose-500'}`}>
                                        {stat.trend}
                                        {stat.up ? <ArrowUpRight className="h-2.5 w-2.5" /> : stat.trend !== '0' ? <ArrowDownRight className="h-2.5 w-2.5" /> : null}
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none mb-1">
                                        {stat.value}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider line-clamp-1">
                                        {stat.title}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Trend Chart */}
                <Card className="lg:col-span-2 border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Tendencias del SGC
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="oklch(0.55 0.20 260)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="oklch(0.55 0.20 260)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRisks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="oklch(0.72 0.16 60)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="oklch(0.72 0.16 60)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 260)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="oklch(0.60 0.02 260)" />
                                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.60 0.02 260)" />
                                <RechartTooltip
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                                />
                                <Area type="monotone" dataKey="documentos" stroke="oklch(0.55 0.20 260)" fill="url(#colorDocs)" strokeWidth={2} name="Documentos" />
                                <Area type="monotone" dataKey="riesgos" stroke="oklch(0.72 0.16 60)" fill="url(#colorRisks)" strokeWidth={2} name="Riesgos" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Risk Distribution Pie */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-amber-600" />
                            Riesgos por Nivel
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={riskByLevel}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {riskByLevel.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-2">
                            {riskByLevel.map(item => (
                                <div key={item.name} className="flex items-center gap-1.5">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-[10px] text-muted-foreground font-medium">{item.name} ({item.value})</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Risk by Type */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Riesgos por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={riskByType}>
                                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 260)" />
                                <XAxis dataKey="type" tick={{ fontSize: 11 }} stroke="oklch(0.60 0.02 260)" />
                                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.60 0.02 260)" />
                                <RechartTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
                                <Bar dataKey="count" fill="oklch(0.55 0.20 260)" radius={[6, 6, 0, 0]} name="Cantidad" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Document Status */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Estado de Documentos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {docsByStatus.map(doc => (
                            <div key={doc.status} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium">{doc.status}</span>
                                    <span className="text-muted-foreground">{doc.count}</span>
                                </div>
                                <Progress value={(doc.count / mockDocuments.length) * 100} className="h-2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Upcoming Audits */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Próximas Auditorías</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {mockAudits.filter(a => a.status === 'PROGRAMADA').map(audit => (
                            <div key={audit.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold">{audit.name}</span>
                                    <Badge variant="secondary" className="text-[10px] h-5">
                                        {audit.type === 'INTERNA' ? '🔍 Interna' : '📋 Externa'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                    <span>📅 {audit.scheduledDate.toLocaleDateString('es-CO')}</span>
                                    <span>👤 {audit.leadAuditorName}</span>
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                    <span className="text-[10px] text-muted-foreground">{audit.processes.length} procesos</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
