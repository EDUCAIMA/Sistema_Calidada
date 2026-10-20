"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
    Network, FileText, ShieldAlert, ClipboardCheck,
    AlertTriangle, Clock,
    ArrowUpRight, ArrowDownRight, ListChecks, BookOpen, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { DOCUMENT_CATALOG } from '@/lib/document-catalog';
import { mockDashboardStats, mockRisks, mockAudits, mockDocuments } from '@/lib/mock-data';
import {
    Tooltip as RechartTooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const stats = [
    { title: 'Procesos Activos', value: mockDashboardStats.totalProcesses, icon: Network, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+2', up: true, href: '/contexto/procesos' },
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

const docsByStatus = [
    { status: 'Aprobados', count: mockDocuments.filter(d => d.status === 'APROBADO').length },
    { status: 'En revisión', count: mockDocuments.filter(d => d.status === 'EN_REVISION').length },
    { status: 'Borrador', count: mockDocuments.filter(d => d.status === 'BORRADOR').length },
    { status: 'Obsoletos', count: mockDocuments.filter(d => d.status === 'OBSOLETO').length },
];

export default function DashboardPage() {
    const [documentSearch, setDocumentSearch] = useState('');
    const documentGroups = useMemo(() => {
        const query = documentSearch.trim().toLocaleLowerCase('es');
        const matches = DOCUMENT_CATALOG.filter(document => `${document.title} ${document.clause} ${document.group}`.toLocaleLowerCase('es').includes(query));
        return [...new Set(matches.map(document => document.group))].map(group => ({
            name: group,
            documents: matches.filter(document => document.group === group),
        }));
    }, [documentSearch]);
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Resumen general del Sistema de Gestión de Calidad
                </p>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="h-5 w-5 text-indigo-600" /> Documentos principales del sistema</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">Acceso a los módulos documentales disponibles. Consulte su contenido y estado en cada módulo.</p>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input aria-label="Buscar documento o numeral" className="pl-9" placeholder="Buscar documento o numeral..." value={documentSearch} onChange={event => setDocumentSearch(event.target.value)} />
                    </div>
                </CardHeader>
                <CardContent>
                    <nav aria-label="Documentos principales" className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {documentGroups.map(group => <section key={group.name}>
                            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{group.name}</h2>
                            <ul className="space-y-2">{group.documents.map(document => <li key={document.key}><Link href={document.href} className="group flex items-start gap-3 rounded-lg border border-slate-100 p-3 text-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-800 dark:hover:bg-indigo-950"><span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{document.clause}</span><span className="flex-1 font-medium">{document.title}</span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-600" /></Link></li>)}</ul>
                        </section>)}
                    </nav>
                    {documentGroups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No hay documentos que coincidan con la búsqueda.</p>}
                </CardContent>
            </Card>

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
                {/* Implementation Instructions */}
                <Card className="lg:col-span-2 border-0 shadow-sm flex flex-col max-h-[500px]">
                    <CardHeader className="pb-3 border-b dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <ListChecks className="h-5 w-5" />
                                Guía Detallada de Implementación del SGC
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500 border-slate-200">
                                Orden Recomendado por Expertos
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden flex-1">
                        <ScrollArea className="h-full max-h-[400px]">
                            <div className="p-4 space-y-6">
                                {/* Paso 1 */}
                                <div className="relative pl-8">
                                    <div className="absolute left-0 top-0 h-full w-[2px] bg-slate-100 dark:bg-slate-800" />
                                    <div className="absolute left-[-4px] top-0 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Paso 1: Fundamentos y Estrategia</h4>
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Contexto y Orientación</span>
                                                <Badge variant="secondary" className="text-[9px] font-mono">4.1, 4.2, 5.2</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                                Antes de cualquier trámite, defina el &quot;Por qué&quot; y el &quot;Para qué&quot;. Realice el Análisis DOFA/PESTAL y defina la Política de Calidad que guiará el sistema.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Paso 2 */}
                                <div className="relative pl-8">
                                    <div className="absolute left-0 h-full w-[2px] bg-slate-100 dark:bg-slate-800" />
                                    <div className="absolute left-[-4px] top-0 h-2 w-2 rounded-full bg-indigo-500" />
                                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Paso 2: Gobernanza Humana</h4>
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Roles, Responsabilidades y Autoridades</span>
                                                <Badge variant="secondary" className="text-[9px] font-mono">5.3</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                                Identifique a los líderes y dueños de procesos. Es crítico definir quién rinde cuentas y quién tiene autoridad antes de empezar la estandarización.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Paso 3 */}
                                <div className="relative pl-8">
                                    <div className="absolute left-0 h-full w-[2px] bg-slate-100 dark:bg-slate-800" />
                                    <div className="absolute left-[-4px] top-0 h-2 w-2 rounded-full bg-indigo-500" />
                                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Paso 3: Arquitectura y Codificación</h4>
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900/40 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -z-10" />
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-sm font-black text-indigo-950 dark:text-white uppercase tracking-tighter">EL ESQUELETO DEL SISTEMA</span>
                                                <Badge variant="secondary" className="text-[9px] font-mono">4.3, 4.4, 7.5.2</Badge>
                                            </div>
                                            <div className="space-y-2 mt-2">
                                                <div className="flex items-start gap-2">
                                                    <div className="h-4 w-4 rounded bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-indigo-600 grow-0 shrink-0 mt-0.5">A</div>
                                                    <p className="text-[10px] text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-slate-200">Mapa de Procesos:</span> Definir Macroprocesos y Procesos clave.</p>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="h-4 w-4 rounded bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-indigo-600 grow-0 shrink-0 mt-0.5">B</div>
                                                    <p className="text-[10px] text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-slate-200">Tablas de Retención y Codificación:</span> Definir nomenclatura para procesos y tipos documentales.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Paso 4 */}
                                <div className="relative pl-8">
                                    <div className="absolute left-0 h-full w-[2px] bg-slate-100 dark:bg-slate-800" />
                                    <div className="absolute left-[-4px] top-0 h-2 w-2 rounded-full bg-indigo-500" />
                                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Paso 4: Planificación de Riesgos</h4>
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Riesgos y Oportunidades</span>
                                                <Badge variant="secondary" className="text-[9px] font-mono">6.1</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                                Identificar qué puede afectar el logro de resultados de los procesos definidos en la estructura previa.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Paso 5 */}
                                <div className="relative pl-8">
                                    <div className="absolute left-0 h-full w-[2px] bg-slate-100 dark:bg-slate-800" />
                                    <div className="absolute left-[-4px] top-0 h-2 w-2 rounded-full bg-indigo-500" />
                                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Paso 5: Normalización Detallada</h4>
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Caracterización de Procesos</span>
                                                <Badge variant="secondary" className="text-[9px] font-mono text-emerald-600 border-emerald-100">4.4, 8.1</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                                <span className="font-bold underline">Solo ahora</span> se procede a describir entradas, salidas, recursos y controles operativos. No antes del Paso 3.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Paso 6 */}
                                <div className="relative pl-8">
                                    <div className="absolute left-0 h-full w-[2px] bg-slate-100 dark:bg-slate-800" />
                                    <div className="absolute left-[-4px] top-0 h-2 w-2 rounded-full bg-emerald-500" />
                                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Paso 6: Gestión del Talento</h4>
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Competencia y Conciencia</span>
                                                <Badge variant="secondary" className="text-[9px] font-mono">7.2, 7.3</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                                Asegurar que cada interviniente conoce el sistema y posee las habilidades para ejecutar sus labores.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Paso 7 */}
                                <div className="relative pl-8">
                                    <div className="absolute left-[-4px] top-0 h-2 w-2 rounded-full bg-emerald-500" />
                                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Paso 7: Mejora Continua</h4>
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Evaluación y Mejora</span>
                                                <Badge variant="secondary" className="text-[9px] font-mono">9.2, 9.3, 10.2</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                                Auditorías internas y acciones correctivas para cerrar el ciclo de mejora PHVA.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <div className="p-3 bg-indigo-50/30 dark:bg-indigo-950/10 border-t dark:border-slate-800">
                        <p className="text-[10px] text-center text-indigo-700 dark:text-indigo-400 font-medium">
                            💡 Tip: No avance al Paso 5 sin haber normalizado la codificación en el Paso 3.
                        </p>
                    </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">


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
