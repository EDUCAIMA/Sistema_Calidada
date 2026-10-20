"use client";

import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import {
    Plus, Edit, Trash2, Save, Lightbulb, ShieldCheck,
    AlertTriangle, Eye,
    ShieldAlert, Clock, Info,
    Download, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { DOFAItem, DOFACategory } from '@/lib/types';
import { toast } from 'sonner';
import { downloadStandardPdf } from '@/lib/document-pdf';
import { ModuleContent, ModuleHeader, ModulePage, ModuleToolbar } from '@/components/sgc/module-layout';

// Elegant Bento/DOFA Palette
const categoryConfig: Record<DOFACategory, {
    label: string; plural: string; icon: React.ReactNode;
    color: string; bg: string; softBg: string; border: string;
    description: string;
}> = {
    FORTALEZA: {
        label: 'Fortaleza', plural: 'Fortalezas',
        icon: <ShieldCheck className="h-5 w-5" />,
        color: 'text-emerald-600', bg: 'bg-emerald-600', softBg: 'bg-emerald-50', border: 'border-emerald-200',
        description: 'Puntos fuertes internos de la organización',
    },
    OPORTUNIDAD: {
        label: 'Oportunidad', plural: 'Oportunidades',
        icon: <Lightbulb className="h-5 w-5" />,
        color: 'text-blue-600', bg: 'bg-blue-600', softBg: 'bg-blue-50', border: 'border-blue-200',
        description: 'Factores externos que se pueden aprovechar',
    },
    DEBILIDAD: {
        label: 'Debilidad', plural: 'Debilidades',
        icon: <AlertTriangle className="h-5 w-5" />,
        color: 'text-amber-600', bg: 'bg-amber-500', softBg: 'bg-amber-50', border: 'border-amber-200',
        description: 'Aspectos internos que requieren mejora',
    },
    AMENAZA: {
        label: 'Amenaza', plural: 'Amenazas',
        icon: <ShieldAlert className="h-5 w-5" />,
        color: 'text-rose-600', bg: 'bg-rose-600', softBg: 'bg-rose-50', border: 'border-rose-200',
        description: 'Riesgos externos que pueden afectar el logro',
    },
};

const categories: DOFACategory[] = ['FORTALEZA', 'DEBILIDAD', 'OPORTUNIDAD', 'AMENAZA'];

export default function ContextoOrganizacionalPage() {
    const { tenant } = useApp();
    const [items, setItems] = useState<DOFAItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DOFAItem | null>(null);
    const [showISOInfo, setShowISOInfo] = useState(false);
    const [newItem, setNewItem] = useState<Partial<DOFAItem>>({ category: 'FORTALEZA' });
    const [isExporting, setIsExporting] = useState(false);
    
    // Document Metadata State (Configurable)
    const [docMetadata, setDocMetadata] = useState({
        code: '',
        version: '01',
        approvalDate: ''
    });
    const [showConfig, setShowConfig] = useState(false);
    
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch(`/api/contexto/dofa?tenantId=${tenant.id}`);
                const data = await res.json();
                if (data && !data.error) {
                    setItems(data);
                }
            } catch (error) {
                console.error('Error fetching DOFA items:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchMetadata = async () => {
            setDocMetadata({ code: '', version: '01', approvalDate: '' });
            try {
                const res = await fetch(`/api/formatos?tenantId=${tenant.id}&moduleKey=4.1`);
                const data = await res.json();
                if (data && !data.error) {
                    setDocMetadata({
                        code: data.code,
                        version: data.version,
                        approvalDate: data.approvalDate
                    });
                }
            } catch (error) {
                console.error('Error fetching metadata:', error);
            }
        };

        fetchItems();
        if (tenant?.id) {
            fetchMetadata();
            
        }
    }, [tenant?.id]);

    const handleDownloadPDF = async () => {
        setIsExporting(true);
        try {
            await downloadStandardPdf({
                tenantId: tenant.id,
                moduleKey: '4.1',
                title: 'Análisis de contexto — Matriz DOFA',
                filename: 'Analisis_DOFA.pdf',
                sections: categories.map(category => ({
                    title: categoryConfig[category].plural,
                    head: ['Descripción', 'Impacto', 'Estrategia de acción', 'Responsable'],
                    rows: items.filter(item => item.category === category).map(item => [
                        item.description || '—', item.impact || 'Sin definir',
                        item.actions || '—', item.responsible || '—',
                    ]),
                })),
            });
            toast.success('Documento descargado exitosamente');
        } catch (error) {
            console.error('ERROR_PDF:', error);
            toast.error(error instanceof Error ? error.message : 'Error al descargar el PDF');
        } finally {
            setIsExporting(false);
        }
    };





    const handleCreate = async () => {
        if (!newItem.description) { toast.error('La descripción es requerida'); return; }

        try {
            const res = await fetch('/api/contexto/dofa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedItem?.id,
                    tenantId: tenant.id,
                    category: newItem.category,
                    description: newItem.description,
                    impact: newItem.impact,
                    actions: newItem.actions,
                    responsible: newItem.responsible,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (selectedItem) {
                setItems(items.map(i => i.id === data.id ? data : i));
            } else {
                setItems([data, ...items]);
            }

            setShowNew(false);
            setNewItem({ category: 'FORTALEZA' });
            setSelectedItem(null);
            toast.success('Factor DOFA guardado exitosamente');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al guardar el factor DOFA');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/contexto/dofa?id=${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setItems(items.filter(i => i.id !== id));
            toast.success('Elemento eliminado de la base de datos');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al eliminar el elemento');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <ModulePage>
            <ModuleHeader clause="4.1" title="Análisis de contexto" description="Identifique factores internos y externos mediante la metodología DOFA." actions={<>
                <Button variant="outline" onClick={() => setShowISOInfo(true)} aria-label="Ver información normativa ISO 9001:2015"><HelpCircle className="h-4 w-4" />Guía ISO</Button>
                <Button variant="outline"><Clock className="h-4 w-4" />Historial</Button>
                <Button variant="outline" onClick={handleDownloadPDF} disabled={isExporting}><Download className="h-4 w-4 text-red-500" />Descargar PDF</Button>
                <Button onClick={() => { setSelectedItem(null); setNewItem({ category: 'FORTALEZA' }); setShowNew(true); }}><Plus className="h-4 w-4" />Agregar factor</Button>
            </>} />
            <ModuleToolbar>
                <button type="button" className="flex flex-wrap items-center gap-2 text-left text-xs font-medium text-slate-600 transition-colors hover:text-blue-600" onClick={() => setShowConfig(true)} aria-label="Configurar metadatos del análisis de contexto">
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Código: {docMetadata.code || 'Automático según estándar'}</span>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Versión: {docMetadata.version}</span>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Aprobación: {docMetadata.approvalDate || 'Sin registrar'}</span>
                </button>
            </ModuleToolbar>
            <ModuleContent>
            {/* DOFA Sections Grid */}
            <div>

                <div className="space-y-6">
                {categories.map(cat => {
                    const cfg = categoryConfig[cat];
                    const catItems = items.filter(i => i.category === cat);

                    const sectionStyles: Record<DOFACategory, { headerBg: string, iconBg: string, iconColor: string, badgeBg: string, badgeText: string }> = {
                        FORTALEZA: { headerBg: 'bg-emerald-100/80', iconBg: 'bg-emerald-200', iconColor: 'text-emerald-700', badgeBg: 'bg-emerald-200', badgeText: 'text-emerald-800' },
                        OPORTUNIDAD: { headerBg: 'bg-blue-100/80', iconBg: 'bg-blue-200', iconColor: 'text-blue-700', badgeBg: 'bg-blue-200', badgeText: 'text-blue-800' },
                        DEBILIDAD: { headerBg: 'bg-amber-100/80', iconBg: 'bg-amber-200', iconColor: 'text-amber-700', badgeBg: 'bg-amber-200', badgeText: 'text-amber-800' },
                        AMENAZA: { headerBg: 'bg-rose-100/80', iconBg: 'bg-rose-200', iconColor: 'text-rose-700', badgeBg: 'bg-rose-200', badgeText: 'text-rose-800' },
                    };

                    const style = sectionStyles[cat];

                    return (
                        <section key={cat} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm transition-all hover:shadow-md">
                            <div className={cn("px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3", style.headerBg)}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", style.iconBg, style.iconColor)}>
                                        {cfg.icon}
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">{cfg.plural} Identificadas</h3>
                                </div>
                                <span className={cn("text-xs font-bold px-3 py-1 rounded-full border border-current/20", style.badgeBg, style.badgeText)}>
                                    {catItems.length} Factores
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-sm font-medium text-slate-500 border-b border-slate-100">Descripción</th>
                                            <th className="px-6 py-4 text-sm font-medium text-slate-500 border-b border-slate-100">Impacto</th>
                                            <th className="px-6 py-4 text-sm font-medium text-slate-500 border-b border-slate-100">Estrategia</th>
                                            <th className="px-6 py-4 text-sm font-medium text-slate-500 border-b border-slate-100">Responsable</th>
                                            <th className="px-6 py-4 text-sm font-medium text-slate-500 border-b border-slate-100 text-right">Opciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {catItems.length > 0 ? catItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                                                <td className="px-6 py-5 text-sm font-medium text-slate-700 max-w-md">
                                                    {item.description}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs font-bold rounded border",
                                                        item.category === 'FORTALEZA' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                            item.category === 'OPORTUNIDAD' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                                item.category === 'DEBILIDAD' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                                    'bg-rose-100 text-rose-800 border-rose-200'
                                                    )}>
                                                        {item.impact || 'Nivel Medio'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-600 font-medium max-w-sm leading-relaxed">
                                                    &quot;{item.actions}&quot;
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                                                    {item.responsible}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            aria-label={`Ver factor: ${item.description}`}
                                                            onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            aria-label={`Editar factor: ${item.description}`}
                                                            onClick={() => { setSelectedItem(item); setNewItem(item); setShowNew(true); }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            aria-label={`Eliminar factor: ${item.description}`}
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs font-medium">
                                                    No se han identificado {cfg.plural.toLowerCase()} aún
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    );
                })}
            </div>

            {items.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 font-medium">No hay factores registrados en el contexto</p>
                    <p className="text-sm text-slate-500 mt-2">Inicie su análisis haciendo clic en el botón &quot;Agregar factor&quot;.</p>
                </div>
            )}
            </div>

            {/* Creation / Edit Form Dialog */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[94vh] sm:max-w-4xl bg-white border-0 p-0 gap-0 overflow-y-auto rounded-3xl shadow-2xl">
                    <div className="px-4 py-5 pr-12 sm:px-7 sm:pr-14 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-1.5 rounded-md shadow-lg shadow-blue-600/20">
                                <Plus className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-extrabold text-[#1e293b] tracking-tight leading-none">
                                    {selectedItem ? 'Modificar factor' : 'Registrar nuevo factor'}
                                </DialogTitle>
                                <p className="text-sm text-slate-500 mt-2">
                                    ISO 9001:2015 · 4.1 Análisis contextual
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-4 py-6 sm:px-7 space-y-6">
                        {/* Cuadrante Selection */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                                Selección de cuadrante DOFA *
                            </Label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {categories.map(cat => {
                                    const cfg = categoryConfig[cat];
                                    const isSelected = newItem.category === cat;
                                    const activeColors: Record<string, string> = {
                                        FORTALEZA: 'border-emerald-500 bg-emerald-50 text-emerald-600',
                                        DEBILIDAD: 'border-rose-500 bg-rose-50 text-rose-600',
                                        OPORTUNIDAD: 'border-blue-500 bg-blue-50 text-blue-600',
                                        AMENAZA: 'border-amber-500 bg-amber-50 text-amber-600'
                                    };
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setNewItem({ ...newItem, category: cat })}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-6 rounded-xl border transition-all h-24",
                                                isSelected ? activeColors[cat] : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 text-slate-400"
                                            )}
                                        >
                                            <div className="mb-2">{cfg.icon}</div>
                                            <span className="text-xs font-medium">{cfg.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                                Descripción del factor *
                            </Label>
                            <Textarea
                                className="resize-none bg-white border-slate-200 rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-blue-600 font-medium text-slate-700 min-h-[100px]"
                                placeholder="Especifique el hallazgo de forma clara..."
                                value={newItem.description || ''}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>

                        {/* Impact & Strategy */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</span>
                                    Impacto
                                </Label>
                                <Textarea
                                    className="resize-none bg-white border-slate-200 rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-blue-600 text-sm h-32"
                                    placeholder="Consecuencias potenciales..."
                                    value={newItem.impact || ''}
                                    onChange={e => setNewItem({ ...newItem, impact: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">4</span>
                                    Estrategia / acción
                                </Label>
                                <Textarea
                                    className="resize-none bg-white border-slate-200 rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-blue-600 text-sm h-32"
                                    placeholder="Plan táctico para abordar el factor..."
                                    value={newItem.actions || ''}
                                    onChange={e => setNewItem({ ...newItem, actions: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Responsible */}
                        <div className="space-y-3 pb-4">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">5</span>
                                Responsable
                            </Label>
                            <Input
                                className="bg-white border-slate-200 h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-600 text-sm font-medium"
                                placeholder="Ej. Gerencia general, comité de calidad..."
                                value={newItem.responsible || ''}
                                onChange={e => setNewItem({ ...newItem, responsible: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="px-4 py-4 sm:px-7 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-end items-center gap-3">
                        <Button variant="ghost" className="text-slate-500 font-medium text-sm h-11 rounded-xl px-6" onClick={() => setShowNew(false)}>Descartar</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm h-11 rounded-xl px-6" onClick={handleCreate}>
                            <Save className="h-4 w-4 mr-2" />
                            {selectedItem ? 'Actualizar Factor' : 'Guardar Factor'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Read-only Detail Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[94vh] sm:max-w-4xl bg-white border-0 p-0 gap-0 overflow-y-auto rounded-3xl shadow-2xl">
                    {selectedItem && (
                        <>
                            <div className={cn("h-1.5 w-full", categoryConfig[selectedItem.category].bg)} />
                            <div className="p-6">
                                <div className="flex items-start gap-6 mb-8">
                                    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg", categoryConfig[selectedItem.category].bg)}>
                                        {categoryConfig[selectedItem.category].icon}
                                    </div>
                                    <div className="flex-1">
                                        <Badge className={cn("mb-2 border-none text-xs font-semibold px-3 py-1", categoryConfig[selectedItem.category].bg)}>
                                            {categoryConfig[selectedItem.category].label}
                                        </Badge>
                                        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">{selectedItem.description}</h2>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/50">
                                        <p className="text-xs font-semibold text-slate-400 mb-3">Análisis de Impacto</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed">{selectedItem.impact || 'Sin análisis registrado.'}</p>
                                    </div>
                                    <div className="bg-blue-600/5 rounded-2xl p-6 border border-blue-100/50">
                                        <p className="text-xs font-semibold text-blue-600 mb-3">Estrategia / Acción</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">&quot;{selectedItem.actions || 'Pendiente de definición.'}&quot;</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 mb-1">Responsable</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedItem.responsible}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold text-slate-400 mb-1">Registro</p>
                                            <p className="text-sm font-bold text-slate-500">{new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 flex justify-end">
                                    <Button onClick={() => setShowDetail(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 font-medium text-sm rounded-xl">Cerrar Ficha</Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            {/* ISO 9001:2015 Clause 4.1 Info Dialog - Professional Redesign */}
            {/* Configuration Dialog */}
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Estándar documental de la empresa</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-600">El logo, el encabezado, los tipos documentales y los códigos se administran en un único lugar. Las descargas PDF usan siempre esa configuración.</p>
                    <Button asChild><Link href="/apoyo/estandar-documental">Abrir estándar documental</Link></Button>
                </DialogContent>
            </Dialog>

            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden flex flex-col p-0 gap-0 font-sans">
                    {/* BEGIN: Header */}
                    <header className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                4 Contexto de la organización
                            </h1>
                            <h2 className="text-xl font-medium text-[#1e3a8a]">
                                4.1 Conocimiento de la organización y de su contexto
                            </h2>
                        </div>
                    </header>
                    {/* END: Header */}

                    {/* BEGIN: MainContent */}
                    <div className="px-6 pt-4 pb-8 space-y-8 bg-white overflow-y-auto max-h-[60vh]">
                        {/* BEGIN: NormativeParagraphs Container */}
                        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-5 space-y-4">
                            <section className="space-y-6">
                                <p className="text-lg text-gray-800 leading-relaxed italic">
                                    La organización <strong className="font-black text-gray-900 not-italic">debe</strong> determinar las cuestiones externas e internas que son pertinentes para su propósito y su dirección estratégica y que afectan a su capacidad para lograr los resultados previstos de su sistema de gestión de la calidad.
                                </p>
                                <p className="text-lg text-gray-800 leading-relaxed italic">
                                    La organización <strong className="font-black text-gray-900 not-italic">debe</strong> realizar el seguimiento y la revisión de la información sobre estas cuestiones externas e internas.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <div className="flex flex-col gap-6 text-gray-600 text-sm md:text-lg leading-relaxed">
                                    <p className="italic md:ml-12">
                                        <span className="font-bold text-gray-900">NOTA 1</span> Las cuestiones pueden incluir factores positivos y negativos o condiciones para su consideración.
                                    </p>
                                    <p className="italic md:ml-12">
                                        <span className="font-bold text-gray-900">NOTA 2</span> La comprensión del contexto externo puede verse facilitado al considerar cuestiones que surgen de los entornos legal, tecnológico, competitivo, de mercado, cultural, social y económico, ya sea internacional, nacional, regional o local.
                                    </p>
                                    <p className="italic md:ml-12">
                                        <span className="font-bold text-gray-900">NOTA 3</span> La comprensión del contexto interno puede verse facilitada al considerar cuestiones relativas a los valores, la cultura, los conocimientos y el desempeño de la organización.
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                    {/* END: MainContent */}

                    {/* BEGIN: FooterActions */}
                    <footer className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-xs text-gray-400 font-bold tracking-tight uppercase">
                            SISTEMA DE GESTIÓN DE LA CALIDAD (SGC)
                        </div>
                        <Button
                            onClick={() => setShowISOInfo(false)}
                            className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold py-3 px-10 rounded shadow-md transition-all duration-200 ease-in-out active:scale-95 h-auto uppercase tracking-wider"
                        >
                            ENTENDIDO
                        </Button>
                    </footer>
                    {/* END: FooterActions */}
                </DialogContent>
            </Dialog>
            </ModuleContent>
        </ModulePage>
    );
}
