"use client";

import React, { useState } from 'react';
import {
    Plus, Edit, Trash2, Save, Lightbulb, ShieldCheck,
    AlertTriangle, TrendingUp as ChartLine, Eye,
    ShieldAlert, User, Clock, CheckCircle, Info,
    Download, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { mockDOFAItems } from '@/lib/mock-data';
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

const categories: DOFACategory[] = ['FORTALEZA', 'DEBILIDAD', 'OPORTUNIDAD', 'AMENAZA']; // Ordered for 2x2 (Top: Internal, Bottom: External)

export default function ContextoOrganizacionalPage() {
    const [items, setItems] = useState<DOFAItem[]>(mockDOFAItems);
    const [showNew, setShowNew] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DOFAItem | null>(null);
    const [newItem, setNewItem] = useState<Partial<DOFAItem>>({ category: 'FORTALEZA' });

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const now = new Date().toLocaleDateString();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(0, 113, 197); // Intel Blue
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

                // Add new page if needed
                if (currentY > 250 && cat !== categories[categories.length - 1]) {
                    doc.addPage();
                    currentY = 20;
                }
            }
        });

        doc.save(`Analisis-DOFA-QualityLink-${now.replace(/\//g, '-')}.pdf`);
        toast.success('PDF descargado exitosamente');
    };

    const handleCreate = () => {
        if (!newItem.description) { toast.error('La descripción es requerida'); return; }
        const item: DOFAItem = {
            id: `dofa-${Date.now()}`,
            tenantId: 'tenant-1',
            category: newItem.category as DOFACategory,
            description: newItem.description,
            impact: newItem.impact || '',
            actions: newItem.actions || '',
            responsible: newItem.responsible || '',
            createdAt: new Date(),
        };
        setItems([...items, item]);
        setShowNew(false);
        setNewItem({ category: 'FORTALEZA' });
        toast.success(`${categoryConfig[item.category].label} agregada exitosamente`);
    };

    const handleDelete = (id: string) => {
        setItems(items.filter(i => i.id !== id));
        toast.success('Elemento eliminado');
    };

    return (
        <div className="min-h-screen bg-[#f3f6fa] -m-6 p-10 font-[sans-serif] text-slate-900 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative">
                <div>
                    <h1 className="text-[2.5rem] font-black tracking-tighter uppercase italic leading-none flex gap-3">
                        ANÁLISIS DE <span className="text-blue-600">CONTEXTO</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-3">
                        <Badge className="bg-slate-900 text-white rounded-full font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 shadow-md">
                            ISO 9001:2015
                        </Badge>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
                            DOFA | CLÁUSULA 4.1
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleDownloadPDF}
                        variant="outline"
                        className="bg-white border-transparent text-slate-500 text-xs font-bold uppercase tracking-widest rounded-full h-12 px-6 shadow-[0_4px_15px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-50"
                    >
                        <Download className="w-4 h-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" className="bg-white border-transparent text-slate-500 text-xs font-bold uppercase tracking-widest rounded-full h-12 px-6 shadow-[0_4px_15px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-50">
                        <Clock className="w-4 h-4 mr-2" /> Historial
                    </Button>
                    <Button onClick={() => { setSelectedItem(null); setNewItem({ category: 'FORTALEZA' }); setShowNew(true); }} className="bg-slate-950 text-white rounded-full h-12 px-8 font-black uppercase text-xs tracking-widest hover:bg-black shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-0.5 active:scale-95">
                        <Plus className="w-4 h-4 mr-2" /> Agregar Factor
                    </Button>
                </div>
                {/* Separator / Progress Line */}
                <div className="absolute -bottom-6 w-full h-px bg-slate-200">
                    <div className="absolute left-0 top-0 h-1 bg-slate-800 w-32 rounded-full -translate-y-1/2" />
                </div>
            </div>

            {/* Data Tables Grouped by Category - Image Reference Style */}
            <div className="bg-white rounded-[2.5rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col pt-10 pb-12 px-10 mt-6 space-y-12">
                {categories.map(cat => {
                    const cfg = categoryConfig[cat];
                    const catItems = items.filter(i => i.category === cat);

                    if (catItems.length === 0) return null;

                    return (
                        <div key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Category Title */}
                            <h2 className={cn("text-3xl font-black uppercase tracking-tighter mb-4 ml-1", cfg.color)}>
                                {cfg.plural}
                            </h2>

                            <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                                {/* Table Header Row */}
                                <div className={cn("grid grid-cols-[1fr_1.5fr_1.5fr_150px_100px] gap-4 p-4 text-[11px] font-black text-white uppercase tracking-widest", cfg.bg)}>
                                    <div>Descripción</div>
                                    <div>Impacto</div>
                                    <div>Estrategia</div>
                                    <div>Responsable</div>
                                    <div className="text-right pr-4">Opciones</div>
                                </div>

                                {/* Data Rows */}
                                <div className="divide-y divide-slate-50">
                                    {catItems.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "grid grid-cols-[1fr_1.5fr_1.5fr_150px_100px] gap-4 p-5 items-center transition-all group",
                                                index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                            )}
                                        >
                                            {/* Description */}
                                            <div className="text-[13px] font-bold text-slate-700 leading-snug">
                                                {item.description}
                                            </div>
                                            {/* Impact */}
                                            <div className="text-[12px] text-slate-500 font-medium leading-relaxed italic">
                                                {item.impact}
                                            </div>
                                            {/* Actions/Strategy */}
                                            <div className="text-[12px] text-slate-700 font-bold italic border-l border-slate-100 pl-4">
                                                "{item.actions}"
                                            </div>
                                            {/* Responsible */}
                                            <div className="text-[11px] font-black text-slate-500 uppercase tracking-tight">
                                                {item.responsible}
                                            </div>
                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg" onClick={() => { setSelectedItem(item); setShowDetail(true); }}><Eye className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg" onClick={() => { setSelectedItem(item); setNewItem(item); setShowNew(true); }}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {items.length === 0 && (
                    <div className="p-32 text-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                        <Info className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                        <p className="text-[14px] text-slate-400 font-black uppercase tracking-[0.4em]">No hay factores registrados en el contexto</p>
                        <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest mt-3 italic">Haga clic en 'Agregar Factor' para iniciar el análisis organizacional.</p>
                    </div>
                )}
            </div>

            {/* Creation / Edit Form Dialog - PREMIUM DARK GLASS style */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-3xl bg-[#0b1120]/95 backdrop-blur-2xl border border-white/10 p-0 overflow-hidden rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] text-slate-100">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[80px] rounded-full" />
                        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[80px] rounded-full" />
                    </div>

                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />
                    
                    <div className="px-10 pt-10 pb-6 relative z-10">
                        <DialogTitle className="text-[2.2rem] font-black text-white italic uppercase tracking-tighter leading-none">
                            {selectedItem ? 'Modificar Registro' : 'Registrar Nuevo Factor'}
                        </DialogTitle>
                        <div className="flex items-center gap-3 mt-3">
                            <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold text-[9px] uppercase tracking-widest px-3 py-1">
                                ISO 9001:2015
                            </Badge>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                Cláusula 4.1 Análisis Contextual
                            </span>
                        </div>
                    </div>

                    <div className="px-10 space-y-8 pb-8 overflow-y-auto max-h-[70vh] relative z-10 scrollbar-hide">
                        <div>
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block ml-1 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                1. Selección de Cuadrante DOFA
                            </Label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {categories.map(cat => {
                                    const cfg = categoryConfig[cat];
                                    const isSelected = newItem.category === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setNewItem({ ...newItem, category: cat })}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                                                isSelected
                                                    ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]"
                                                    : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                            )}
                                        >
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                                            )}
                                            <div className={cn(
                                                "mb-3 p-3 rounded-xl transition-all duration-300",
                                                isSelected 
                                                    ? "bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                                                    : "bg-slate-800/50 text-slate-500 group-hover:text-slate-300"
                                            )}>
                                                {cfg.icon}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest transition-colors",
                                                isSelected ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                                            )}>
                                                {cfg.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                2. Descripción del Factor Identificado
                            </Label>
                            <Textarea
                                className="resize-none bg-white/5 border-white/5 rounded-2xl p-6 focus-visible:ring-1 focus-visible:ring-blue-500/50 font-bold text-[14px] text-white shadow-inner min-h-[120px] transition-all placeholder:text-slate-600 focus:bg-white/[0.08]"
                                placeholder="Especifique el hallazgo de forma clara y procesable..."
                                value={newItem.description || ''}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                    3. Análisis de Impacto
                                </Label>
                                <Textarea
                                    className="resize-none bg-white/5 border-white/5 rounded-2xl p-6 focus-visible:ring-1 focus-visible:ring-blue-500/50 font-medium text-[12px] text-slate-300 shadow-inner h-36 transition-all placeholder:text-slate-600 focus:bg-white/[0.08]"
                                    placeholder="Consecuencias potenciales para el sistema..."
                                    value={newItem.impact || ''}
                                    onChange={e => setNewItem({ ...newItem, impact: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                    4. Estrategia Técnica / Acción
                                </Label>
                                <Textarea
                                    className="resize-none bg-white/5 border-white/5 rounded-2xl p-6 focus-visible:ring-1 focus-visible:ring-blue-500/50 font-black italic uppercase tracking-tighter text-[12px] text-blue-400 shadow-inner h-36 border-l-2 border-l-blue-500/30 transition-all placeholder:text-slate-700/50 focus:bg-white/[0.08]"
                                    placeholder="PLAN TÁCTICO PARA ABORDAR EL FACTOR..."
                                    value={newItem.actions || ''}
                                    onChange={e => setNewItem({ ...newItem, actions: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                5. Responsable de Gestión
                            </Label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <Input
                                    className="bg-white/5 border-white/5 h-14 rounded-2xl pl-12 pr-6 focus-visible:ring-1 focus-visible:ring-blue-500/50 font-black text-[13px] uppercase tracking-tight shadow-inner text-white transition-all placeholder:text-slate-600 focus:bg-white/[0.08]"
                                    placeholder="EJ. DIRECCIÓN ESTRATÉGICA, COMITÉ DE CALIDAD..."
                                    value={newItem.responsible || ''}
                                    onChange={e => setNewItem({ ...newItem, responsible: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-10 py-8 bg-white/[0.02] flex justify-end gap-5 border-t border-white/5 relative z-10">
                        <Button 
                            variant="ghost" 
                            className="hover:bg-white/5 text-slate-500 hover:text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em] h-14 px-8 rounded-2xl transition-all" 
                            onClick={() => setShowNew(false)}
                        >
                            Descartar
                        </Button>
                        <Button 
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black italic uppercase tracking-[0.15em] px-12 h-14 rounded-2xl shadow-[0_8px_25px_-5px_rgba(37,99,235,0.4)] transition-all hover:shadow-[0_12px_30px_-5px_rgba(37,99,235,0.5)] active:scale-95 group" 
                            onClick={handleCreate}
                        >
                            {selectedItem ? 'Actualizar Ficha' : 'Guardar Hallazgo'}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Read-only Detail Dialog - Bento Style Glass */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                {selectedItem && (
                    <DialogContent className="max-w-2xl bg-[#0b1120]/95 backdrop-blur-2xl border border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl text-slate-100">
                        <div className={cn("h-2 w-full", categoryConfig[selectedItem.category].bg)} />

                        <div className="p-10 relative">
                            {/* Ambient background light based on category */}
                            <div className={cn(
                                "absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full opacity-20 pointer-events-none",
                                categoryConfig[selectedItem.category].bg
                            )} />

                            <div className="flex items-start gap-8 mb-10 relative z-10">
                                <div className={cn(
                                    "h-24 w-24 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shrink-0 transform -rotate-3 transition-transform hover:rotate-0 duration-500",
                                    categoryConfig[selectedItem.category].bg
                                )}>
                                    <div className="scale-[2]">
                                        {categoryConfig[selectedItem.category].icon}
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge className={cn("border-none shadow-lg uppercase text-[9px] tracking-[0.3em] font-black px-4 py-1.5 rounded-full", categoryConfig[selectedItem.category].bg)}>
                                            {categoryConfig[selectedItem.category].label}
                                        </Badge>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            Ficha Técnica ID: {selectedItem.id.split('-')[1] || '---'}
                                        </span>
                                    </div>
                                    <h2 className="text-[2.8rem] leading-[0.95] font-black text-white uppercase tracking-tighter italic">
                                        {selectedItem.description}
                                    </h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
                                <div className="col-span-2 bg-white/5 rounded-3xl p-8 border border-white/5 backdrop-blur-sm group hover:bg-white/[0.08] transition-colors">
                                    <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-[0.3em] mb-4">Impacto Organizacional</p>
                                    <p className="text-base font-medium text-slate-300 leading-relaxed italic border-l-2 border-blue-500/20 pl-6">
                                        {selectedItem.impact || 'Sin análisis de impacto registrado.'}
                                    </p>
                                </div>

                                <div className="col-span-2 bg-white/5 rounded-3xl p-8 border border-white/5 shadow-inner group hover:bg-white/[0.08] transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Estrategia técnica / Acción de mejora</p>
                                        <div className="h-1.5 w-12 rounded-full bg-blue-500/30" />
                                    </div>
                                    <p className="text-2xl font-black uppercase tracking-tighter text-white leading-tight">
                                        {selectedItem.actions || 'Pendiente de definición táctica.'}
                                    </p>
                                </div>

                                <div className="col-span-2 flex items-center justify-between py-6 px-1 border-t border-white/5 mt-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-[1rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-lg">
                                            <User className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Responsable de Gestión</p>
                                            <p className="text-sm font-black text-white uppercase tracking-tight">{selectedItem.responsible}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Fecha Registro</p>
                                        <p className="text-sm font-bold text-slate-400 tracking-tight">
                                            {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-8 bg-black/20 flex justify-end border-t border-white/5">
                            <Button 
                                onClick={() => setShowDetail(false)} 
                                variant="outline" 
                                className="font-black uppercase text-[10px] tracking-[0.3em] h-14 px-10 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all active:scale-95"
                            >
                                Cerrar Ficha Téchnica
                            </Button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

        </div>
    );
}
