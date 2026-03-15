"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { Plus, Search, Edit, Trash2, Save, Eye, Users, Building2, Globe, ShieldAlert, ArrowUpRight, ArrowRight, ArrowDownRight, Clock, Box, HelpCircle } from 'lucide-react';
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
    const { tenant } = useApp();
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Stakeholder | null>(null);
    const [showISOInfo, setShowISOInfo] = useState(false);
    const [newItem, setNewItem] = useState<Partial<Stakeholder>>({ type: 'EXTERNO', influence: 'MEDIA' });

    useEffect(() => {
        const fetchStakeholders = async () => {
            try {
                const res = await fetch(`/api/contexto/partes-interesadas?tenantId=${tenant.id}`);
                const data = await res.json();
                if (data && !data.error) {
                    setStakeholders(data);
                }
            } catch (error) {
                console.error('Error fetching stakeholders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStakeholders();
    }, [tenant.id]);

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

    const handleCreate = async () => {
        if (!newItem.name) { toast.error('El nombre es requerido'); return; }
        
        try {
            const res = await fetch('/api/contexto/partes-interesadas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedItem?.id,
                    tenantId: tenant.id,
                    name: newItem.name,
                    type: newItem.type,
                    needs: newItem.needs,
                    expectations: newItem.expectations,
                    influence: newItem.influence,
                    strategy: newItem.strategy,
                    contactInfo: newItem.contactInfo,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (selectedItem) {
                setStakeholders(stakeholders.map(s => s.id === data.id ? data : s));
                toast.success('Parte interesada actualizada en DB');
            } else {
                setStakeholders([data, ...stakeholders]);
                toast.success(`Parte interesada "${data.name}" guardada en DB`);
            }
            
            setShowNew(false);
            setNewItem({ type: 'EXTERNO', influence: 'MEDIA' });
            setSelectedItem(null);
        } catch (error) {
            toast.error('Error al guardar la parte interesada');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/contexto/partes-interesadas?id=${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setStakeholders(stakeholders.filter(s => s.id !== id));
            toast.success('Elemento eliminado de la base de datos');
        } catch (error) {
            toast.error('Error al eliminar la parte interesada');
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
                        <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase">Partes Interesadas</h1>
                        <button
                            onClick={() => setShowISOInfo(true)}
                            className="p-1.5 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-all active:scale-95"
                            title="Ver información normativa ISO 9001:2015"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-[#136dec]/10 text-[#136dec] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Cláusula 4.2</span>
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Requisitos y Expectativas</span>
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
                        onClick={() => { setSelectedItem(null); setNewItem({ type: 'EXTERNO', influence: 'MEDIA' }); setShowNew(true); }}
                        className="flex items-center gap-2 px-5 py-2 bg-[#136dec] text-white rounded-lg hover:bg-blue-600 font-bold text-xs shadow-lg shadow-blue-600/20 transition-all h-10 uppercase tracking-wider"
                    >
                        <Plus className="w-4 h-4" />
                        NUEVO REGISTRO
                    </Button>
                </div>
            </div>

            {/* Dash KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Entidades', value: stats.total, icon: <Users className="h-5 w-5" />, bg: 'bg-slate-100', color: 'text-slate-700' },
                    { label: 'Contexto Interno', value: stats.internos, icon: <Building2 className="h-5 w-5" />, bg: 'bg-indigo-100', color: 'text-indigo-700' },
                    { label: 'Contexto Externo', value: stats.externos, icon: <Globe className="h-5 w-5" />, bg: 'bg-blue-100', color: 'text-blue-700' },
                    { label: 'Influencia Crítica', value: stats.altaInfluencia, icon: <ShieldAlert className="h-5 w-5" />, bg: 'bg-rose-100', color: 'text-rose-700' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tight">{s.value}</p>
                        </div>
                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-inner", s.bg, s.color)}>
                            {s.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Stakeholder Sections Grid */}
            <div className="space-y-12">
                {(['INTERNO', 'EXTERNO'] as StakeholderType[]).map(type => {
                    const cfg = typeConfig[type];
                    const typeItems = stakeholders.filter(s => s.type === type);
                    
                    const sectionStyles: Record<StakeholderType, { headerBg: string, iconBg: string, iconColor: string, badgeBg: string, badgeText: string }> = {
                        INTERNO: { headerBg: 'bg-indigo-100/80', iconBg: 'bg-indigo-200', iconColor: 'text-indigo-700', badgeBg: 'bg-indigo-200', badgeText: 'text-indigo-800' },
                        EXTERNO: { headerBg: 'bg-blue-100/80', iconBg: 'bg-blue-200', iconColor: 'text-blue-700', badgeBg: 'bg-blue-200', badgeText: 'text-blue-800' },
                    };

                    const style = sectionStyles[type];

                    return (
                        <section key={type} className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                            <div className={cn("px-6 py-4 border-b-2 border-slate-100 flex items-center justify-between", style.headerBg)}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", style.iconBg, style.iconColor)}>
                                        {cfg.icon}
                                    </div>
                                    <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Partes Interesadas - {cfg.label}as</h3>
                                </div>
                                <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full border border-current/20", style.badgeBg, style.badgeText)}>
                                    {typeItems.length} Registros
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Interesado</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Requisitos Técnicos</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Expectativas</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-center">Influencia</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">Opciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {typeItems.length > 0 ? typeItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                                                <td className="px-6 py-5 text-sm font-black text-slate-800 uppercase italic tracking-tight italic">
                                                    {item.name}
                                                </td>
                                                <td className="px-6 py-5 text-[12px] text-slate-600 font-medium leading-relaxed max-w-sm">
                                                    {item.needs || 'No registrados'}
                                                </td>
                                                <td className="px-6 py-5 text-[12px] text-slate-800 font-bold italic leading-relaxed max-w-sm">
                                                    &quot;{item.expectations || 'Sin definir'}&quot;
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        <div className={cn("inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border", influenceConfig[item.influence].bg, influenceConfig[item.influence].color, "border-current/10")}>
                                                            {influenceConfig[item.influence].icon}
                                                            <span className="text-[9px] font-black uppercase tracking-widest">{item.influence}</span>
                                                        </div>
                                                    </div>
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
                                                            className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
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
                                                    No hay {cfg.label.toLowerCase()}s registrados aún
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

            {stakeholders.length === 0 && (
                <div className="mt-12 p-20 text-center bg-white rounded-xl border-2 border-dashed border-slate-200 shadow-sm">
                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No hay partes interesadas registradas</p>
                    <p className="text-xs text-slate-300 font-medium mt-2 italic tracking-wide">Inicie la identificación para dar cumplimiento a la cláusula 4.2.</p>
                </div>
            )}

            {/* Form Dialog for Create/Edit */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border-none p-0 overflow-hidden rounded-3xl shadow-2xl font-sans">
                    <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#136dec] p-1.5 rounded-md shadow-lg shadow-blue-600/20">
                                <Plus className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-extrabold text-[#1e293b] tracking-tight uppercase leading-none">
                                    {selectedItem ? 'MODIFICAR INTERESADO' : 'REGISTRAR INTERESADO'}
                                </DialogTitle>
                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                                    ISO 9001:2015 — Identificación de Partes Interesadas
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-6 py-8 space-y-8 overflow-y-auto max-h-[75vh] bg-[#fcfdfe]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-900 border-none">
                            {/* Basics */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Nombre de la Entidad / Persona *</Label>
                                    <Input 
                                        className="h-12 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl font-bold transition-all shadow-sm"
                                        placeholder="Ej: Proveedores de Materia Prima"
                                        value={newItem.name || ''}
                                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Categoría de Contexto *</Label>
                                    <Select value={newItem.type} onValueChange={(v: StakeholderType) => setNewItem({...newItem, type: v})}>
                                        <SelectTrigger className="h-12 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl font-bold transition-all shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INTERNO" className="font-bold">CONJUNTO INTERNO (Empleados, Socios)</SelectItem>
                                            <SelectItem value="EXTERNO" className="font-bold">CONJUNTO EXTERNO (Clientes, Estado)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Nivel de Influencia *</Label>
                                    <Select value={newItem.influence} onValueChange={(v: StakeholderInfluence) => setNewItem({...newItem, influence: v})}>
                                        <SelectTrigger className="h-12 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl font-bold transition-all shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALTA" className="font-bold text-rose-600 uppercase italic">Influencia Crítica / Alta</SelectItem>
                                            <SelectItem value="MEDIA" className="font-bold text-amber-600 uppercase italic">Influencia Estándar / Media</SelectItem>
                                            <SelectItem value="BAJA" className="font-bold text-emerald-600 uppercase italic">Influencia Referencial / Baja</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Requirements */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Requisitos del Interesado (Necesidades)</Label>
                                    <Textarea 
                                        className="min-h-[100px] bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl font-medium transition-all shadow-sm resize-none"
                                        placeholder="¿Qué requiere esta parte del sistema?"
                                        value={newItem.needs || ''}
                                        onChange={e => setNewItem({...newItem, needs: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Expectativas Futuras</Label>
                                    <Textarea 
                                        className="min-h-[100px] bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl font-medium transition-all shadow-sm resize-none"
                                        placeholder="¿Qué espera de la organización?"
                                        value={newItem.expectations || ''}
                                        onChange={e => setNewItem({...newItem, expectations: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Estrategia de Gestión / Acciones</Label>
                            <Input 
                                className="h-14 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl font-bold transition-all shadow-sm text-blue-600 placeholder:text-blue-200"
                                placeholder="Estrategia principal para abordar este interesado..."
                                value={newItem.strategy || ''}
                                onChange={e => setNewItem({...newItem, strategy: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="px-6 py-3 border-t border-slate-100 flex justify-end gap-3 bg-white">
                        <Button variant="ghost" onClick={() => setShowNew(false)} className="font-bold uppercase text-xs tracking-widest h-12 px-6">Cancelar</Button>
                        <Button onClick={handleCreate} className="bg-[#136dec] hover:bg-blue-600 text-white font-black uppercase text-xs tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                            Guardar Información
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Detail View Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border-none p-0 overflow-hidden rounded-3xl shadow-2xl font-sans">
                    {selectedItem && (
                        <>
                            <div className={cn("px-6 py-8 text-white relative", typeConfig[selectedItem.type].bg)}>
                                <div className="absolute right-6 top-6 opacity-20"><Box className="h-24 w-24" /></div>
                                <Badge className="bg-white/20 text-white border-none rounded-full px-4 py-1 font-black text-[9px] uppercase tracking-[0.2em] mb-4">
                                    {selectedItem.type} / ISO 4.2
                                </Badge>
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-tight">{selectedItem.name}</h2>
                            </div>
                            <div className="p-6 space-y-8 bg-white">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requisitos Técnicos</p>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-2 border-slate-100 pl-4">
                                            {selectedItem.needs || 'No se han documentado requisitos específicos'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expectativas</p>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-2 border-slate-100 pl-4">
                                            &quot;{selectedItem.expectations || 'Sin expectativas relevadas'}&quot;
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 shadow-inner">
                                    <p className="text-[10px] font-black text-[#136dec] uppercase tracking-widest mb-3">Estrategia Organizacional</p>
                                    <p className="text-lg font-black text-slate-800 uppercase italic tracking-tight italic">
                                        {selectedItem.strategy || 'Estrategia pendiente de definición'}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("px-4 py-1.5 rounded-lg border flex items-center gap-2", influenceConfig[selectedItem.influence].bg, influenceConfig[selectedItem.influence].color, "border-current/10")}>
                                            {influenceConfig[selectedItem.influence].icon}
                                            <span className="text-[10px] font-black uppercase tracking-widest">Influencia {selectedItem.influence}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" onClick={() => setShowDetail(false)} className="text-slate-400 font-bold uppercase text-[10px]">Cerrar Detalle</Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            {/* ISO 9001:2015 Clause 4.2 Info Dialog */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden flex flex-col p-0 gap-0 font-sans">
                    {/* BEGIN: Header */}
                    <header className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                4 Contexto de la organización
                            </h1>
                            <h2 className="text-xl font-medium text-[#1e3a8a]">
                                4.2 Comprensión de las necesidades y expectativas de las partes interesadas
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
                                    Debido a su efecto o efecto potencial en la capacidad de la organización de proporcionar regularmente productos y servicios que satisfagan los requisitos del cliente y los legales y reglamentarios aplicables, la organización <strong className="font-black text-gray-900 not-italic">debe</strong> determinar:
                                </p>
                                <div className="flex flex-col gap-4 text-lg text-gray-800 leading-relaxed italic md:ml-6 text-left">
                                    <p>a) las partes interesadas que son pertinentes al sistema de gestión de la calidad;</p>
                                    <p>b) los requisitos pertinentes de estas partes interesadas para el sistema de gestión de la calidad.</p>
                                </div>
                                <p className="text-lg text-gray-800 leading-relaxed italic">
                                    La organización <strong className="font-black text-gray-900 not-italic">debe</strong> realizar el seguimiento y la revisión de la información sobre estas partes interesadas y sus requisitos pertinentes.
                                </p>
                            </section>
                        </div>
                    </div>

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
                </DialogContent>
            </Dialog>
        </div>
    );
}
