"use client";

import React, { useState } from 'react';
import {
    Plus, Edit, Trash2, Save, Lightbulb, ShieldCheck,
    AlertTriangle, TrendingUp as ChartLine, Eye,
    ShieldAlert, User, Clock, CheckCircle, Info,
    Download
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

            {/* Creation / Edit Form Dialog - CLEAN SHEET style */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-3xl bg-white border border-slate-200 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
                    <div className="h-3 w-full bg-slate-900" />
                    <div className="px-10 pt-10 pb-6">
                        <DialogTitle className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">
                            {selectedItem ? 'Modificar Registro' : 'Registrar Nuevo Factor'}
                        </DialogTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                            ISO 9001:2015 — Cláusula 4.1 Análisis Contextual
                        </p>
                    </div>

                    <div className="px-10 space-y-8 pb-6 overflow-y-auto max-h-[70vh]">
                        <div>
                            <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 block ml-1">1. Selección de Cuadrante DOFA *</Label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setNewItem({ ...newItem, category: cat })}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all transform hover:scale-[1.02]",
                                            newItem.category === cat
                                                ? cn("border-transparent shadow-xl", categoryConfig[cat].softBg, categoryConfig[cat].color)
                                                : "border-slate-50 bg-slate-50/50 hover:border-slate-200 text-slate-400"
                                        )}
                                    >
                                        <div className={cn("mb-3 p-2 rounded-lg", newItem.category === cat ? "bg-white/50" : "")}>{categoryConfig[cat].icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{categoryConfig[cat].label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">2. Descripción del Factor Identificado *</Label>
                            <Textarea
                                className="resize-none bg-slate-50 border-none rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-slate-300 font-bold text-[14px] shadow-inner min-h-[100px]"
                                placeholder="Especifique el hallazgo de forma clara y procesable..."
                                value={newItem.description || ''}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">3. Análisis de Impacto</Label>
                                <Textarea
                                    className="resize-none bg-slate-50 border-none rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-slate-300 font-bold text-[12px] shadow-inner h-32"
                                    placeholder="Consecuencias potenciales para el sistema..."
                                    value={newItem.impact || ''}
                                    onChange={e => setNewItem({ ...newItem, impact: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">4. Estrategia Técnica / Acción</Label>
                                <Textarea
                                    className="resize-none bg-slate-50 border-none rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-slate-300 font-black italic uppercase tracking-tighter text-[12px] shadow-inner h-32"
                                    placeholder="Plan táctico para abordar el factor..."
                                    value={newItem.actions || ''}
                                    onChange={e => setNewItem({ ...newItem, actions: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">5. Responsable de Gestión</Label>
                            <Input
                                className="bg-slate-50 border-none h-14 rounded-xl px-6 focus-visible:ring-1 focus-visible:ring-slate-300 font-black text-[13px] uppercase tracking-tight shadow-inner"
                                placeholder="Ej. Dirección Estratégica, Comité de Calidad..."
                                value={newItem.responsible || ''}
                                onChange={e => setNewItem({ ...newItem, responsible: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="px-10 py-8 bg-slate-50 flex justify-end gap-4 border-t border-slate-100">
                        <Button variant="ghost" className="hover:bg-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest h-14 px-8 rounded-xl" onClick={() => setShowNew(false)}>Descartar</Button>
                        <Button className="bg-slate-900 hover:bg-black text-white font-black italic uppercase tracking-widest px-10 h-14 rounded-xl shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] transition-all active:scale-95" onClick={handleCreate}>
                            {selectedItem ? 'Actualizar Ficha' : 'Guardar Hallazgo'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Read-only Detail Dialog - Bento Style */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                {selectedItem && (
                    <DialogContent className="max-w-2xl bg-white border border-slate-200 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
                        <div className={cn("h-4 w-full", categoryConfig[selectedItem.category].bg)} />

                        <div className="p-10">
                            <div className="flex items-start gap-6 mb-8">
                                <div className={cn("h-20 w-20 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shrink-0 transform -rotate-3", categoryConfig[selectedItem.category].bg)}>
                                    {categoryConfig[selectedItem.category].icon}
                                </div>
                                <div className="pt-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Hallazgo Documentado</p>
                                    <h2 className="text-4xl font-black text-slate-900 leading-none uppercase tracking-tighter italic">{selectedItem.description}</h2>
                                    <div className="flex items-center gap-2 mt-4">
                                        <Badge className="bg-slate-900 text-white border-none shadow-sm uppercase text-[9px] tracking-widest font-black px-4 py-1.5 rounded-full">
                                            {categoryConfig[selectedItem.category].label}
                                        </Badge>
                                        <Badge variant="outline" className="uppercase text-[9px] tracking-widest font-black px-4 py-1.5 rounded-full border-slate-200 text-slate-500">
                                            ID: {selectedItem.id.split('-')[1] || '---'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="col-span-2 bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Análisis detallado de impacto</p>
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{selectedItem.impact || 'Sin análisis de impacto registrado.'}"</p>
                                </div>

                                <div className="col-span-2 bg-blue-50/50 rounded-2xl p-8 border border-blue-100 shadow-inner">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 italic">Estrategia técnica definida</p>
                                    <p className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-tight">
                                        {selectedItem.actions || 'Pendiente de definición táctica.'}
                                    </p>
                                </div>

                                <div className="col-span-2 flex items-center gap-4 py-4 px-2 border-t border-slate-100">
                                    <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Gestor Responsable</p>
                                        <p className="text-xs font-black text-slate-700 uppercase tracking-tight mt-1">{selectedItem.responsible}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-6 bg-slate-50 flex justify-end border-t border-slate-100">
                            <Button onClick={() => setShowDetail(false)} variant="ghost" className="font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-[1rem] bg-white shadow-sm border border-slate-200">
                                Cerrar Ficha Téchnica
                            </Button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

        </div>
    );
}
