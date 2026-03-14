"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import {
    Plus, Edit, Trash2, Save, Lightbulb, ShieldCheck,
    AlertTriangle, TrendingUp as ChartLine, Eye,
    ShieldAlert, User, Clock, CheckCircle, Info,
    Download, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { DOFAItem, DOFACategory } from '@/lib/types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
        fetchItems();
    }, [tenant.id]);

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const now = new Date().toLocaleDateString();

        doc.setFontSize(22);
        doc.setTextColor(0, 113, 197);
        doc.text('QualityLink QMS', 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Sistema de Gestión de Calidad - ISO 9001:2015', 20, 28);
        doc.text(`Fecha de exportación: ${now}`, 150, 28);

        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 113, 197);
        doc.line(20, 32, 190, 32);

        doc.setFontSize(16);
        doc.setTextColor(30);
        doc.text('Análisis de Contexto (Matriz DOFA)', 20, 45);

        let currentY = 55;

        categories.forEach((cat) => {
            const cfg = categoryConfig[cat];
            const catItems = items.filter(i => i.category === cat);

            if (catItems.length > 0) {
                doc.setFontSize(12);
                const color = cfg.color.includes('emerald') ? [5, 150, 105] :
                    cfg.color.includes('blue') ? [37, 99, 235] :
                        cfg.color.includes('amber') ? [217, 119, 6] : [225, 29, 72];

                doc.setTextColor(color[0], color[1], color[2]);
                doc.text(cfg.plural.toUpperCase(), 20, currentY);

                const tableData = catItems.map(item => [
                    item.description,
                    item.impact,
                    item.actions,
                    item.responsible
                ]);

                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Descripción', 'Impacto', 'Estrategia', 'Responsable']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: {
                        fillColor: cfg.color.includes('emerald') ? [5, 150, 105] :
                            cfg.color.includes('blue') ? [37, 99, 235] :
                                cfg.color.includes('amber') ? [217, 119, 6] : [225, 29, 72]
                    },
                    margin: { left: 20, right: 20 },
                    styles: { fontSize: 9 }
                });

                currentY = (doc as any).lastAutoTable.finalY + 15;

                if (currentY > 250 && cat !== categories[categories.length - 1]) {
                    doc.addPage();
                    currentY = 20;
                }
            }
        });

        doc.save(`Analisis-DOFA-QualityLink-${now.replace(/\//g, '-')}.pdf`);
        toast.success('PDF descargado exitosamente');
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
            toast.error('Error al guardar el factor DOFA');
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
            toast.error('Error al eliminar el elemento');
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
        <div className="min-h-screen bg-[#f8fafc] -m-6 p-8 font-sans text-slate-900 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase">Análisis de Contexto</h1>
                        <button 
                            onClick={() => setShowISOInfo(true)}
                            className="p-1.5 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-all active:scale-95"
                            title="Ver información normativa ISO 9001:2015"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-[#136dec]/10 text-[#136dec] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Cláusula 4.1</span>
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Metodología DOFA</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        className="flex items-center gap-2 px-4 py-2 bg-white border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs transition-all shadow-sm h-10"
                    >
                        <Clock className="w-4 h-4" />
                        HISTORIAL
                    </Button>
                    <Button 
                        onClick={handleDownloadPDF}
                        variant="outline" 
                        className="flex items-center gap-2 px-4 py-2 bg-white border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs transition-all shadow-sm h-10"
                    >
                        <Download className="w-4 h-4 text-red-500" />
                        PDF
                    </Button>
                    <Button 
                        onClick={() => { setSelectedItem(null); setNewItem({ category: 'FORTALEZA' }); setShowNew(true); }}
                        className="flex items-center gap-2 px-5 py-2 bg-[#136dec] text-white rounded-lg hover:bg-blue-600 font-bold text-xs shadow-lg shadow-blue-600/20 transition-all h-10 uppercase tracking-wider"
                    >
                        <Plus className="w-4 h-4" />
                        AGREGAR FACTOR
                    </Button>
                </div>
            </div>

            {/* DOFA Sections Grid */}
            <div className="space-y-12">
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
                        <section key={cat} className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                            <div className={cn("px-6 py-4 border-b-2 border-slate-100 flex items-center justify-between", style.headerBg)}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", style.iconBg, style.iconColor)}>
                                        {cfg.icon}
                                    </div>
                                    <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">{cfg.plural} Identificadas</h3>
                                </div>
                                <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full border border-current/20", style.badgeBg, style.badgeText)}>
                                    {catItems.length} Factores
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Descripción</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Impacto</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Estrategia</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Responsable</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">Opciones</th>
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
                                                        "px-2 py-1 text-[10px] font-bold rounded uppercase border",
                                                        item.category === 'FORTALEZA' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                        item.category === 'OPORTUNIDAD' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                        item.category === 'DEBILIDAD' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                        'bg-rose-100 text-rose-800 border-rose-200'
                                                    )}>
                                                        {item.impact || 'Nivel Medio'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-[13px] text-slate-600 font-medium max-w-sm italic leading-relaxed">
                                                    "{item.actions}"
                                                </td>
                                                <td className="px-6 py-5 text-xs text-slate-500 font-bold uppercase">
                                                    {item.responsible}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-slate-400 hover:text-[#136dec] hover:bg-blue-50 rounded-lg transition-all"
                                                            onClick={() => { setSelectedItem(item); setNewItem(item); setShowNew(true); }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs font-medium uppercase tracking-widest italic">
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
                <div className="mt-12 p-20 text-center bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
                    <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No hay factores registrados en el contexto</p>
                    <p className="text-xs text-slate-300 font-medium mt-2">Inicie su análisis haciendo clic en el botón 'Agregar Factor'.</p>
                </div>
            )}

            {/* Creation / Edit Form Dialog */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-4xl bg-white border-none p-0 overflow-hidden rounded-xl shadow-2xl font-sans">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#136dec] p-1.5 rounded-md shadow-lg shadow-blue-600/20">
                                <Plus className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-extrabold text-[#1e293b] tracking-tight uppercase leading-none">
                                    {selectedItem ? 'MODIFICAR FACTOR' : 'REGISTRAR NUEVO FACTOR'}
                                </DialogTitle>
                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                                    ISO 9001:2015 — CLÁUSULA 4.1 ANÁLISIS CONTEXTUAL
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-8 py-8 space-y-10 overflow-y-auto max-h-[70vh] bg-[#fcfdfe]">
                        {/* Cuadrante Selection */}
                        <div className="space-y-4">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                                SELECCIÓN DE CUADRANTE DOFA *
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
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{cfg.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                                DESCRIPCIÓN DEL FACTOR *
                            </Label>
                            <Textarea
                                className="resize-none bg-white border-slate-200 rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-[#136dec] font-medium text-slate-700 min-h-[100px]"
                                placeholder="Especifique el hallazgo de forma clara..."
                                value={newItem.description || ''}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>

                        {/* Impact & Strategy */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                                    IMPACTO
                                </Label>
                                <Textarea
                                    className="resize-none bg-white border-slate-200 rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-[#136dec] text-xs h-32"
                                    placeholder="Consecuencias potenciales..."
                                    value={newItem.impact || ''}
                                    onChange={e => setNewItem({ ...newItem, impact: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">4</span>
                                    ESTRATEGIA / ACCIÓN
                                </Label>
                                <Textarea
                                    className="resize-none bg-white border-slate-200 rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-[#136dec] text-xs h-32 italic"
                                    placeholder="Plan táctico para abordar el factor..."
                                    value={newItem.actions || ''}
                                    onChange={e => setNewItem({ ...newItem, actions: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Responsible */}
                        <div className="space-y-3 pb-4">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">5</span>
                                RESPONSABLE
                            </Label>
                            <Input
                                className="bg-white border-slate-200 h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-[#136dec] text-xs font-bold uppercase"
                                placeholder="EJ. GERENCIA GENERAL, COMITÉ QMS..."
                                value={newItem.responsible || ''}
                                onChange={e => setNewItem({ ...newItem, responsible: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="px-8 py-6 bg-slate-50 flex justify-end items-center gap-3">
                        <Button variant="ghost" className="text-slate-500 font-bold uppercase text-[10px] tracking-widest h-11 px-8" onClick={() => setShowNew(false)}>Descartar</Button>
                        <Button className="bg-[#136dec] hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest h-11 px-10 shadow-lg shadow-blue-600/20" onClick={handleCreate}>
                            <Save className="h-4 w-4 mr-2" />
                            {selectedItem ? 'Actualizar Factor' : 'Guardar Factor'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Read-only Detail Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-3xl bg-white border-none p-0 overflow-hidden rounded-2xl shadow-2xl">
                    {selectedItem && (
                        <>
                            <div className={cn("h-1.5 w-full", categoryConfig[selectedItem.category].bg)} />
                            <div className="p-10">
                                <div className="flex items-start gap-6 mb-8">
                                    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg", categoryConfig[selectedItem.category].bg)}>
                                        {categoryConfig[selectedItem.category].icon}
                                    </div>
                                    <div className="flex-1">
                                        <Badge className={cn("mb-2 border-none uppercase text-[9px] tracking-widest font-black px-3 py-1", categoryConfig[selectedItem.category].bg)}>
                                            {categoryConfig[selectedItem.category].label}
                                        </Badge>
                                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedItem.description}</h2>
                                    </div>
                                </div>
                                
                                <div className="space-y-8">
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Análisis de Impacto</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed italic">{selectedItem.impact || 'Sin análisis registrado.'}</p>
                                    </div>
                                    <div className="bg-[#136dec]/5 rounded-2xl p-6 border border-blue-100/50">
                                        <p className="text-[10px] font-black text-[#136dec] uppercase tracking-widest mb-3">Estrategia / Acción</p>
                                        <p className="text-lg font-black text-slate-800 uppercase leading-snug tracking-tight italic">"{selectedItem.actions || 'Pendiente de definición.'}"</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsable</p>
                                            <p className="text-sm font-bold text-slate-700 uppercase">{selectedItem.responsible}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registro</p>
                                            <p className="text-sm font-bold text-slate-500">{new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 flex justify-end">
                                    <Button onClick={() => setShowDetail(false)} className="bg-slate-900 hover:bg-black text-white px-8 h-12 font-bold uppercase text-[10px] tracking-widest rounded-xl">Cerrar Ficha</Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            {/* ISO 9001:2015 Clause 4.1 Info Dialog - Professional Redesign */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="max-w-5xl bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden flex flex-col p-0 gap-0 font-sans">
                    {/* BEGIN: Header */}
                    <header className="px-12 py-12 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                                4 Contexto de la organización
                            </h1>
                            <h2 className="text-2xl font-medium text-[#1e3a8a]">
                                4.1 Conocimiento de la organización y de su contexto
                            </h2>
                        </div>
                    </header>
                    {/* END: Header */}

                    {/* BEGIN: MainContent */}
                    <div className="px-12 md:px-24 py-16 space-y-10 bg-white overflow-y-auto max-h-[60vh]">
                        {/* BEGIN: NormativeParagraphs */}
                        <section className="space-y-6">
                            <p className="text-xl text-gray-800 leading-relaxed italic">
                                La organización debe determinar las cuestiones externas e internas que son pertinentes para su propósito y su dirección estratégica y que afectan a su capacidad para lograr los resultados previstos de su sistema de gestión de la calidad.
                            </p>
                            <p className="text-xl text-gray-800 leading-relaxed italic">
                                La organización debe realizar el seguimiento y la revisión de la información sobre estas cuestiones externas e internas.
                            </p>
                        </section>
                        {/* END: NormativeParagraphs */}

                        {/* BEGIN: Notes */}
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
                        {/* END: Notes */}
                    </div>
                    {/* END: MainContent */}

                    {/* BEGIN: FooterActions */}
                    <footer className="px-12 py-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
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
        </div>
    );
}
