"use client";

import React, { useState } from 'react';
import {
    Lightbulb, Plus, Search, Filter, MoreVertical, Trash2,
    FileText, Tag, Calendar, User, Eye, Download, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for lessons learned
const mockKnowledge = [
    {
        id: 'LA-001',
        title: 'Fuga de memoria en producción',
        category: 'Técnico',
        tags: ['Backend', 'NodeJS', 'Rendimiento'],
        author: 'Ana Martínez',
        date: '10/05/2026',
        summary: 'Identificamos un problema con listeners no destruidos en WebSockets que colapsaron el servidor. Implementamos un purgado automático.'
    },
    {
        id: 'LA-002',
        title: 'Retraso en importación aduanera',
        category: 'Operaciones',
        tags: ['Logística', 'Aduanas', 'Proveedores'],
        author: 'Carlos Ruiz',
        date: '02/06/2026',
        summary: 'La declaración del HS Code 8544.42 generó inspección física de 5 días. De ahora en adelante usar la subpartida específica.'
    },
    {
        id: 'LA-003',
        title: 'Exitosa migración a NextJS 15',
        category: 'Técnico',
        tags: ['Frontend', 'React', 'Arquitectura'],
        author: 'David Gómez',
        date: '15/05/2026',
        summary: 'Documentación paso a paso de cómo resolvimos los conflictos con el App Router y el caché. Tiempo de carga reducido en 45%.'
    },
    {
        id: 'LA-004',
        title: 'Manejo de cliente iracundo',
        category: 'Comercial',
        tags: ['Ventas', 'Soft Skills', 'Atención'],
        author: 'Laura Sánchez',
        date: '28/04/2026',
        summary: 'Aplicación del método HEART para calmar y retener un cliente VIP luego de una caída del servicio. Plantilla de disculpas adjunta.'
    },
];

export default function ConocimientoPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredKnowledge = mockKnowledge.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Conocimiento Organizacional</h2>
                    <p className="text-muted-foreground mt-1">
                        Repositorio de lecciones aprendidas y mejores prácticas del Sistema de Gestión (ISO 9001: 7.1.6).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 shadow-sm">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exportar Base</span>
                    </Button>
                    <Button className="gap-2 shadow-md">
                        <Plus className="w-4 h-4" />
                        <span>Nueva Lección</span>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="wiki" className="space-y-6">
                <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 border shadow-sm">
                    <TabsTrigger value="wiki" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Wiki y Lecciones (Grid)</TabsTrigger>
                    <TabsTrigger value="lista" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Vista de Lista</TabsTrigger>
                </TabsList>

                <TabsContent value="wiki" className="space-y-4 m-0">
                    <div className="flex items-center gap-2 mb-6 w-full sm:w-80">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar por título, tag o contenido..."
                                className="pl-9 bg-white dark:bg-slate-950 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="shrink-0 bg-white dark:bg-slate-950 shadow-sm">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>

                    {filteredKnowledge.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredKnowledge.map((item) => (
                                <Card key={item.id} className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 hover:shadow-lg transition-all flex flex-col h-full group">
                                    <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-[10px] font-semibold">
                                                {item.category}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[140px]">
                                                    <DropdownMenuItem className="gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                                                        <Eye className="h-4 w-4" /> Leer
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50">
                                                        <Trash2 className="h-4 w-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardTitle className="text-base mt-3 leading-tight group-hover:text-primary transition-colors cursor-pointer">
                                            {item.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 flex-grow text-sm text-slate-600 dark:text-slate-400">
                                        <p className="line-clamp-3">{item.summary}</p>
                                    </CardContent>
                                    <CardFooter className="flex flex-col items-start gap-4 pt-4 border-t border-border/50 text-xs text-muted-foreground pb-4">
                                        <div className="flex flex-wrap gap-1.5 w-full">
                                            {item.tags.map((tag, idx) => (
                                                <span key={idx} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm">
                                                    <Tag className="w-3 h-3 opacity-50" /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                            <span className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 opacity-70" /> {item.author.split(' ')[0]}
                                            </span>
                                            <span className="flex items-center gap-1.5 shrink-0">
                                                <Calendar className="w-3.5 h-3.5 opacity-70" /> {item.date}
                                            </span>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 py-12">
                            <div className="text-center text-muted-foreground flex flex-col items-center justify-center">
                                <Lightbulb className="h-10 w-10 text-slate-300 mb-3" />
                                <p>No se encontraron lecciones que coincidan con la búsqueda.</p>
                            </div>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="lista" className="m-0">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 h-[400px] flex items-center justify-center">
                        <div className="text-center space-y-3">
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-primary">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">Vista de Lista Completa</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                La vista tabular tradicional con filtros avanzados para bases de conocimiento muy grandes estará habilitada próximamente.
                            </p>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
