"use client";

import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Save, Eye, Users, Building2, Globe, ShieldAlert, ArrowUpRight, ArrowRight, ArrowDownRight, Clock, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { mockStakeholders } from '@/lib/mock-data';
import type { Stakeholder, StakeholderType, StakeholderInfluence } from '@/lib/types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

const typeConfig: Record<StakeholderType, { label: string; icon: React.ReactNode; color: string; bg: string; softBg: string }> = {
    INTERNO: { label: 'Interno', icon: <Building2 className="h-5 w-5" />, color: 'text-indigo-600', bg: 'bg-indigo-600', softBg: 'bg-indigo-50' },
    EXTERNO: { label: 'Externo', icon: <Globe className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-600', softBg: 'bg-blue-50' },
};

const influenceConfig: Record<StakeholderInfluence, { label: string; icon: React.ReactNode; color: string; bg: string; }> = {
    ALTA: { label: 'Alta', icon: <ArrowUpRight className="h-3.5 w-3.5" />, color: 'text-rose-600', bg: 'bg-rose-50' },
    MEDIA: { label: 'Media', icon: <ArrowRight className="h-3.5 w-3.5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    BAJA: { label: 'Baja', icon: <ArrowDownRight className="h-3.5 w-3.5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export default function PartesInteresadasPage() {
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
    const [showNew, setShowNew] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Stakeholder | null>(null);
    const [newItem, setNewItem] = useState<Partial<Stakeholder>>({ type: 'EXTERNO', influence: 'MEDIA' });

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
        doc.text('Identificación de Partes Interesadas', 20, 45);

        let currentY = 55;

        const types: StakeholderType[] = ['INTERNO', 'EXTERNO'];

        types.forEach((type) => {
            const cfg = typeConfig[type];
            const typeItems = stakeholders.filter(s => s.type === type);

            if (typeItems.length > 0) {
                doc.setFontSize(12);
                const color = type === 'INTERNO' ? [79, 70, 229] : [37, 99, 235];
                
                doc.setTextColor(color[0], color[1], color[2]);
                doc.text(cfg.label.toUpperCase(), 20, currentY);
                
                const tableData = typeItems.map(item => [
                    item.name,
                    item.needs,
                    item.expectations,
                    item.influence,
                    item.strategy
                ]);

                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Interesado', 'Requisitos', 'Expectativas', 'Influencia', 'Estrategia']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { 
                        fillColor: type === 'INTERNO' ? [79, 70, 229] : [37, 99, 235]
                    },
                    margin: { left: 20, right: 20 },
                    styles: { fontSize: 8 }
                });

                currentY = (doc as any).lastAutoTable.finalY + 15;

                if (currentY > 250 && type !== types[types.length - 1]) {
                    doc.addPage();
                    currentY = 20;
                }
            }
        });

        doc.save(`Partes-Interesadas-QualityLink-${now.replace(/\//g, '-')}.pdf`);
        toast.success('PDF de Partes Interesadas descargado');
    };

    const stats = {
        total: stakeholders.length,
        internos: stakeholders.filter(s => s.type === 'INTERNO').length,
        externos: stakeholders.filter(s => s.type === 'EXTERNO').length,
        altaInfluencia: stakeholders.filter(s => s.influence === 'ALTA').length,
    };

    const handleCreate = () => {
        if (!newItem.name) { toast.error('El nombre es requerido'); return; }
        const item: Stakeholder = {
            id: `sh-${Date.now()}`,
            tenantId: 'tenant-1',
            name: newItem.name!,
            type: newItem.type as StakeholderType || 'EXTERNO',
            needs: newItem.needs || '',
            expectations: newItem.expectations || '',
            influence: newItem.influence as StakeholderInfluence || 'MEDIA',
            strategy: newItem.strategy || '',
            contactInfo: newItem.contactInfo,
        };
        if (selectedItem) {
            setStakeholders(stakeholders.map(s => s.id === selectedItem.id ? { ...item, id: s.id } : s));
            toast.success('Parte interesada actualizada');
        } else {
            setStakeholders([...stakeholders, item]);
            toast.success(`Parte interesada "${item.name}" agregada`);
        }
        setShowNew(false);
        setNewItem({ type: 'EXTERNO', influence: 'MEDIA' });
        setSelectedItem(null);
    };

    const handleDelete = (id: string) => {
        setStakeholders(stakeholders.filter(s => s.id !== id));
        toast.success('Parte interesada eliminada');
    };

    return (
        <div className="min-h-screen bg-[#f3f6fa] -m-6 p-10 font-[sans-serif] text-slate-900 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative">
                <div>
                    <h1 className="text-[2.5rem] font-black tracking-tighter uppercase italic leading-none flex gap-3">
                        PARTES <span className="text-blue-600">INTERESADAS</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-3">
                        <Badge className="bg-slate-900 text-white rounded-full font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 shadow-md">
                            ISO 9001:2015
                        </Badge>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
                            CLÁUSULA 4.2
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
                    <Button onClick={() => { setSelectedItem(null); setNewItem({ type: 'EXTERNO', influence: 'MEDIA' }); setShowNew(true); }} className="bg-slate-950 text-white rounded-full h-12 px-8 font-black uppercase text-xs tracking-widest hover:bg-black shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5">
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Registro
                    </Button>
                </div>
                {/* Separator / Progress Line */}
                <div className="absolute -bottom-6 w-full h-px bg-slate-200">
                    <div className="absolute left-0 top-0 h-1 bg-slate-800 w-32 rounded-full -translate-y-1/2" />
                </div>
            </div>

            {/* Dash KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                    { label: 'Total Registros', value: stats.total, icon: <Users className="h-6 w-6" />, bg: 'bg-slate-900' },
                    { label: 'Internos', value: stats.internos, icon: <Building2 className="h-6 w-6" />, bg: 'bg-indigo-600' },
                    { label: 'Externos', value: stats.externos, icon: <Globe className="h-6 w-6" />, bg: 'bg-blue-600' },
                    { label: 'Influencia Alta', value: stats.altaInfluencia, icon: <ShieldAlert className="h-6 w-6" />, bg: 'bg-rose-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                            <p className="text-3xl font-black text-slate-900">{s.value}</p>
                        </div>
                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-sm", s.bg)}>
                            {s.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Unified Data Table - Organizational Style Sync */}
            <div className="bg-white rounded-[2.5rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col pt-10 pb-12 px-10 mt-6">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">
                        Registro Unificado de <span className="text-blue-600">Partes Interesadas</span>
                    </h2>
                    <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-[9px] px-4 py-1.5 rounded-full">
                        {stakeholders.length} Entidades Registradas
                    </Badge>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                    {/* Table Header Row */}
                    <div className="grid grid-cols-[100px_1fr_1.5fr_1.5fr_120px_100px] gap-4 p-4 text-[11px] font-black text-white uppercase tracking-widest bg-slate-900">
                        <div className="text-center">Contexto</div>
                        <div>Parte Interesada</div>
                        <div>Requisitos Técnicos</div>
                        <div>Expectativas Documentadas</div>
                        <div className="text-center">Influencia</div>
                        <div className="text-right pr-4">Opciones</div>
                    </div>

                    {/* Data Rows */}
                    <div className="divide-y divide-slate-50">
                        {stakeholders.length > 0 ? stakeholders.map((item, index) => {
                            const tCfg = typeConfig[item.type];
                            return (
                                <div 
                                    key={item.id} 
                                    className={cn(
                                        "grid grid-cols-[100px_1fr_1.5fr_1.5fr_120px_100px] gap-4 p-5 items-center transition-all group",
                                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                    )}
                                >
                                    {/* Context Column */}
                                    <div className="flex justify-center">
                                        <Badge className={cn("text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md shadow-sm border-none text-white", tCfg.bg)}>
                                            {tCfg.label}
                                        </Badge>
                                    </div>
                                    {/* Parte Interesada */}
                                    <div className="text-[14px] font-black text-slate-800 uppercase italic tracking-tight leading-tight">
                                        {item.name}
                                    </div>
                                    {/* Requisitos */}
                                    <div className="text-[12px] text-slate-600 font-medium leading-relaxed border-l border-slate-100 pl-4">
                                        {item.needs || 'No se han registrado requerimientos específicos'}
                                    </div>
                                    {/* Expectativas */}
                                    <div className="text-[12px] text-slate-800 font-bold italic leading-relaxed border-l border-slate-100 pl-4">
                                        "{item.expectations || 'No se han relevado percepciones'}"
                                    </div>
                                    {/* Influencia */}
                                    <div className="flex justify-center">
                                        <div className={cn("inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg", influenceConfig[item.influence].bg, influenceConfig[item.influence].color)}>
                                            {influenceConfig[item.influence].icon}
                                            <span className="text-[9px] font-black uppercase tracking-widest">{item.influence}</span>
                                        </div>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg" onClick={() => { setSelectedItem(item); setShowDetail(true); }}><Eye className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg" onClick={() => { setSelectedItem(item); setNewItem(item); setShowNew(true); }}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="p-32 text-center bg-slate-50/50">
                                <Users className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                                <p className="text-[14px] text-slate-400 font-black uppercase tracking-[0.4em]">No hay partes interesadas registradas</p>
                                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest mt-3 italic">Haga clic en 'Nuevo Registro' para iniciar la identificación.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Dialog for Create/Edit - CLEAN SHEET */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-2xl bg-white border border-slate-200 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
                    <div className="h-3 w-full bg-slate-900" />
                    <div className="px-10 pt-10 pb-6">
                        <DialogTitle className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">
                            {selectedItem ? 'Modificar Entidad' : 'Registrar Parte Interesada'}
                        </DialogTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                            Cláusula 4.2 — Identificación y expectativas
                        </p>
                    </div>

                    <div className="px-10 space-y-8 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">Parte Interesada (Entidad) *</Label>
                                <Input
                                    className="bg-slate-50 border-none h-14 rounded-xl px-6 focus-visible:ring-1 focus-visible:ring-slate-300 font-black text-[13px] uppercase tracking-tight placeholder:font-bold placeholder:italic shadow-inner"
                                    placeholder="Ej. Clientes VIP, Trabajadores, Entidad..."
                                    value={newItem.name || ''}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">Categoría *</Label>
                                <Select value={newItem.type} onValueChange={v => setNewItem({ ...newItem, type: v as StakeholderType })}>
                                    <SelectTrigger className="bg-slate-50 border-none h-14 rounded-xl px-6 focus:ring-1 focus:ring-slate-300 font-black text-[11px] uppercase tracking-widest shadow-inner">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-100 shadow-xl rounded-2xl">
                                        <SelectItem value="INTERNO" className="font-bold text-[10px] uppercase cursor-pointer py-3 hover:bg-slate-50 rounded-xl">Contexto Interno</SelectItem>
                                        <SelectItem value="EXTERNO" className="font-bold text-[10px] uppercase cursor-pointer py-3 hover:bg-slate-50 rounded-xl">Contexto Externo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">Grado de Influencia *</Label>
                                <Select value={newItem.influence} onValueChange={v => setNewItem({ ...newItem, influence: v as StakeholderInfluence })}>
                                    <SelectTrigger className="bg-slate-50 border-none h-14 rounded-xl px-6 focus:ring-1 focus:ring-slate-300 font-black text-[11px] uppercase tracking-widest shadow-inner">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-100 shadow-xl rounded-2xl">
                                        <SelectItem value="ALTA" className="text-rose-600 font-bold text-[10px] uppercase cursor-pointer py-3 hover:bg-slate-50 rounded-xl">Alta Influencia</SelectItem>
                                        <SelectItem value="MEDIA" className="text-amber-600 font-bold text-[10px] uppercase cursor-pointer py-3 hover:bg-slate-50 rounded-xl">Media Influencia</SelectItem>
                                        <SelectItem value="BAJA" className="text-emerald-600 font-bold text-[10px] uppercase cursor-pointer py-3 hover:bg-slate-50 rounded-xl">Baja Influencia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">Requisitos Formales Identificados</Label>
                                <Textarea
                                    className="resize-none bg-slate-50 border-none h-24 rounded-xl p-4 focus-visible:ring-1 focus-visible:ring-slate-300 text-[12px] font-bold shadow-inner"
                                    placeholder="Requisitos técnicos o legales que exige esta parte..."
                                    value={newItem.needs || ''}
                                    onChange={e => setNewItem({ ...newItem, needs: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">Expectativas (Subjetivas)</Label>
                                <Textarea
                                    className="resize-none bg-slate-50 border-none h-24 rounded-xl p-4 focus-visible:ring-1 focus-visible:ring-slate-300 text-[12px] font-bold italic shadow-inner"
                                    placeholder="Que esperan que se haga, aunque no lo exijan formalmente..."
                                    value={newItem.expectations || ''}
                                    onChange={e => setNewItem({ ...newItem, expectations: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">Estrategia de Abordaje</Label>
                                <Textarea
                                    className="resize-none bg-slate-50 border-none h-24 rounded-xl p-4 focus-visible:ring-1 focus-visible:ring-slate-300 text-[12px] font-black uppercase tracking-tight shadow-inner"
                                    placeholder="Definición de plan de acción para cumplir con esta parte interesada..."
                                    value={newItem.strategy || ''}
                                    onChange={e => setNewItem({ ...newItem, strategy: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-10 py-8 bg-slate-50 flex justify-end gap-4 border-t border-slate-100">
                        <Button variant="ghost" className="hover:bg-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest h-14 px-8 rounded-xl" onClick={() => setShowNew(false)}>Descartar</Button>
                        <Button className="bg-slate-900 hover:bg-black text-white font-black italic uppercase tracking-widest px-10 h-14 rounded-xl shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] transition-all active:scale-95" onClick={handleCreate}>
                            {selectedItem ? 'Actualizar Ficha' : 'Guardar Entidad'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Read-only Detail Dialog - Bento Style */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                {selectedItem && (
                    <DialogContent className="max-w-2xl bg-white border border-slate-200 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
                        <div className={cn("h-4 w-full", typeConfig[selectedItem.type].bg)} />

                        <div className="p-10">
                            <div className="flex items-start gap-6 mb-8">
                                <div className={cn("h-20 w-20 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shrink-0 transform -rotate-3", typeConfig[selectedItem.type].bg)}>
                                    {typeConfig[selectedItem.type].icon}
                                </div>
                                <div className="pt-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Entidad Documentada</p>
                                    <h2 className="text-4xl font-black text-slate-900 leading-none uppercase tracking-tighter italic">{selectedItem.name}</h2>
                                    <div className="flex items-center gap-2 mt-4">
                                        <Badge className="bg-slate-100 text-slate-800 border-none shadow-sm uppercase text-[9px] tracking-widest font-black px-3 py-1">
                                            {typeConfig[selectedItem.type].label}
                                        </Badge>
                                        <Badge className={cn("uppercase text-[9px] tracking-widest font-black px-3 py-1 border-none shadow-sm", influenceConfig[selectedItem.influence].bg, influenceConfig[selectedItem.influence].color)}>
                                            INFL: {selectedItem.influence}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="col-span-2 bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Requisitos Formales Identificados</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedItem.needs || 'No se han registrado requerimientos específicos'}</p>
                                </div>

                                <div className="col-span-2 md:col-span-1 bg-blue-50/50 rounded-2xl p-6 border border-blue-100 shadow-inner">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Expectativas Relevadas</p>
                                    <p className="text-xs font-bold italic text-slate-800 leading-relaxed">"{selectedItem.expectations || 'No se han relevado percepciones'}"</p>
                                </div>
                                <div className="col-span-2 md:col-span-1 bg-slate-900 rounded-2xl p-6 shadow-xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Línea de Acción / Estrategia</p>
                                    <p className="text-sm font-black uppercase tracking-tight text-white leading-tight">
                                        {selectedItem.strategy || 'Pendiente de Definición Técnica'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-6 bg-slate-50 flex justify-end border-t border-slate-100">
                            <Button onClick={() => setShowDetail(false)} variant="ghost" className="font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl bg-white shadow-sm border border-slate-200">
                                Cerrar Reporte
                            </Button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

        </div>
    );
}
