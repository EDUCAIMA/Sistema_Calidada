"use client";

import { ModuleContent, ModuleHeader, ModulePage, ModuleToolbar } from '@/components/sgc/module-layout';

import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { 
    Plus, Edit, Trash2, Eye, Users, Building2,
    Globe, ShieldAlert, ArrowUpRight, ArrowRight, ArrowDownRight, 
    Clock, Box, HelpCircle, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Stakeholder, StakeholderType, StakeholderInfluence } from '@/lib/types';
import { toast } from 'sonner';
import { downloadStandardPdf } from '@/lib/document-pdf';

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
    const [isExporting, setIsExporting] = useState(false);

    // Document Metadata State (Configurable)
    const [docMetadata, setDocMetadata] = useState({
        code: '',
        version: '01',
        approvalDate: ''
    });
    const [showConfig, setShowConfig] = useState(false);

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

        const fetchMetadata = async () => {
            setDocMetadata({ code: '', version: '01', approvalDate: '' });
            try {
                const res = await fetch(`/api/formatos?tenantId=${tenant.id}&moduleKey=4.2`);
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

        fetchStakeholders();
        if (tenant?.id) {
            fetchMetadata();

        }
    }, [tenant?.id]);

    const handleDownloadPDF = async () => {
        setIsExporting(true);
        try {
            await downloadStandardPdf({
                tenantId: tenant.id,
                moduleKey: '4.2',
                title: 'Matriz de partes interesadas',
                filename: 'Matriz_Partes_Interesadas.pdf',
                orientation: 'landscape',
                sections: [{
                    head: ['Tipo', 'Parte interesada', 'Requisitos / necesidades', 'Expectativas', 'Influencia', 'Estrategia', 'Contacto'],
                    rows: stakeholders.map(item => [
                        typeConfig[item.type].label, item.name, item.needs || '—',
                        item.expectations || '—', influenceConfig[item.influence].label,
                        item.strategy || '—', item.contactInfo || '—',
                    ]),
                }],
            });
            toast.success('Documento descargado exitosamente');
        } catch (error) {
            console.error('Error generando PDF:', error);
            toast.error(error instanceof Error ? error.message : 'Error al generar el PDF');
        } finally {
            setIsExporting(false);
        }
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
            toast.error(error instanceof Error ? error.message : 'Error al guardar la parte interesada');
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
            toast.error(error instanceof Error ? error.message : 'Error al eliminar la parte interesada');
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
            <ModuleHeader clause="4.2" title="Partes interesadas" description="Identifique las partes interesadas y dé seguimiento a sus requisitos y expectativas." actions={<>
                <Button variant="outline" onClick={() => setShowISOInfo(true)} aria-label="Ver información normativa ISO 9001:2015"><HelpCircle className="h-4 w-4" />Guía ISO</Button>
                <Button variant="outline"><Clock className="h-4 w-4" />Historial</Button>
                <Button variant="outline" onClick={handleDownloadPDF} disabled={isExporting}><Download className="h-4 w-4 text-red-500" />Descargar PDF</Button>
                <Button onClick={() => { setSelectedItem(null); setNewItem({ type: 'EXTERNO', influence: 'MEDIA' }); setShowNew(true); }}><Plus className="h-4 w-4" />Nuevo registro</Button>
            </>} />
            <ModuleToolbar>
                <button type="button" className="flex flex-wrap items-center gap-2 text-left text-xs font-medium text-slate-600 transition-colors hover:text-blue-600" onClick={() => setShowConfig(true)} aria-label="Configurar metadatos de partes interesadas">
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Código: {docMetadata.code || 'Automático según estándar'}</span>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Versión: {docMetadata.version}</span>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Aprobación: {docMetadata.approvalDate || 'Sin registrar'}</span>
                </button>
            </ModuleToolbar>
            <ModuleContent>
            <div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Entidades', value: stats.total, icon: <Users className="h-5 w-5" />, bg: 'bg-slate-100', color: 'text-slate-700' },
                    { label: 'Contexto Interno', value: stats.internos, icon: <Building2 className="h-5 w-5" />, bg: 'bg-indigo-100', color: 'text-indigo-700' },
                    { label: 'Contexto Externo', value: stats.externos, icon: <Globe className="h-5 w-5" />, bg: 'bg-blue-100', color: 'text-blue-700' },
                    { label: 'Influencia Crítica', value: stats.altaInfluencia, icon: <ShieldAlert className="h-5 w-5" />, bg: 'bg-rose-100', color: 'text-rose-700' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{s.label}</p>
                            <p className="text-xl sm:text-2xl font-semibold text-slate-900">{s.value}</p>
                        </div>
                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-inner", s.bg, s.color)}>
                            {s.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Stakeholder Sections Grid */}
            <div className="space-y-6">
                {(['INTERNO', 'EXTERNO'] as StakeholderType[]).map(type => {
                    const cfg = typeConfig[type];
                    const typeItems = stakeholders.filter(s => s.type === type);
                    
                    const sectionStyles: Record<StakeholderType, { headerBg: string, iconBg: string, iconColor: string, badgeBg: string, badgeText: string }> = {
                        INTERNO: { headerBg: 'bg-indigo-100/80', iconBg: 'bg-indigo-200', iconColor: 'text-indigo-700', badgeBg: 'bg-indigo-200', badgeText: 'text-indigo-800' },
                        EXTERNO: { headerBg: 'bg-blue-100/80', iconBg: 'bg-blue-200', iconColor: 'text-blue-700', badgeBg: 'bg-blue-200', badgeText: 'text-blue-800' },
                    };

                    const style = sectionStyles[type];

                    return (
                        <section key={type} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm transition-all hover:shadow-md">
                            <div className={cn("px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3", style.headerBg)}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", style.iconBg, style.iconColor)}>
                                        {cfg.icon}
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Partes Interesadas - {cfg.label}as</h3>
                                </div>
                                <span className={cn("text-xs font-bold px-3 py-1 rounded-full border border-current/20", style.badgeBg, style.badgeText)}>
                                    {typeItems.length} Registros
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-sm font-medium text-slate-500 border-b border-slate-100">Interesado</th>
                                            <th className="px-6 py-4 text-sm font-medium text-slate-500 border-b border-slate-100">Requisitos Técnicos</th>
                                            <th className="px-6 py-4 text-sm font-medium text-slate-500 border-b border-slate-100">Expectativas</th>
                                            <th className="px-6 py-4 text-sm font-medium text-slate-500 border-b border-slate-100 text-center">Influencia</th>
                                            <th className="px-6 py-4 text-sm font-medium text-slate-500 border-b border-slate-100 text-right">Opciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {typeItems.length > 0 ? typeItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                                                <td className="px-6 py-5 text-sm font-semibold text-slate-800 tracking-tight">
                                                    {item.name}
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-600 font-medium leading-relaxed max-w-sm">
                                                    {item.needs || 'No registrados'}
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-800 font-bold leading-relaxed max-w-sm">
                                                    &quot;{item.expectations || 'Sin definir'}&quot;
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        <div className={cn("inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border", influenceConfig[item.influence].bg, influenceConfig[item.influence].color, "border-current/10")}>
                                                            {influenceConfig[item.influence].icon}
                                                            <span className="text-xs font-semibold">{item.influence}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            aria-label={`Ver parte interesada: ${item.name}`}
                                                            onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                            aria-label={`Editar parte interesada: ${item.name}`}
                                                            onClick={() => { setSelectedItem(item); setNewItem(item); setShowNew(true); }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            aria-label={`Eliminar parte interesada: ${item.name}`}
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
                    <p className="text-sm text-slate-400 font-medium">No hay partes interesadas registradas</p>
                    <p className="text-xs text-slate-300 font-medium mt-2">Inicie la identificación para dar cumplimiento a la cláusula 4.2.</p>
                </div>
            )}
            </div>

            {/* Form Dialog for Create/Edit */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[94vh] sm:max-w-4xl bg-white border-0 p-0 gap-0 overflow-y-auto rounded-3xl shadow-2xl">
                    <div className="px-4 py-5 pr-12 sm:px-7 sm:pr-14 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-1.5 rounded-md shadow-lg shadow-blue-600/20">
                                <Plus className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-extrabold text-[#1e293b] tracking-tight leading-none">
                                    {selectedItem ? 'Modificar interesado' : 'Registrar interesado'}
                                </DialogTitle>
                                <p className="text-sm text-slate-500 mt-2">
                                    ISO 9001:2015 — Identificación de Partes Interesadas
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-4 py-6 sm:px-7 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900 border-none">
                            {/* Basics */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700">Nombre de la Entidad / Persona *</Label>
                                    <Input 
                                        className="h-11 bg-white border border-slate-100 focus:border-blue-500 rounded-xl font-bold transition-all shadow-sm"
                                        placeholder="Ej: Proveedores de Materia Prima"
                                        value={newItem.name || ''}
                                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700">Categoría de Contexto *</Label>
                                    <Select value={newItem.type} onValueChange={(v: StakeholderType) => setNewItem({...newItem, type: v})}>
                                        <SelectTrigger className="h-11 bg-white border border-slate-100 focus:border-blue-500 rounded-xl font-bold transition-all shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INTERNO">Interno (empleados, socios)</SelectItem>
                                            <SelectItem value="EXTERNO">Externo (clientes, Estado)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700">Nivel de Influencia *</Label>
                                    <Select value={newItem.influence} onValueChange={(v: StakeholderInfluence) => setNewItem({...newItem, influence: v})}>
                                        <SelectTrigger className="h-11 bg-white border border-slate-100 focus:border-blue-500 rounded-xl font-bold transition-all shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALTA" className="font-bold text-rose-600">Influencia Crítica / Alta</SelectItem>
                                            <SelectItem value="MEDIA" className="font-bold text-amber-600">Influencia Estándar / Media</SelectItem>
                                            <SelectItem value="BAJA" className="font-bold text-emerald-600">Influencia Referencial / Baja</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Requirements */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700">Requisitos del Interesado (Necesidades)</Label>
                                    <Textarea 
                                        className="min-h-[100px] bg-white border border-slate-100 focus:border-blue-500 rounded-xl font-medium transition-all shadow-sm resize-none"
                                        placeholder="¿Qué requiere esta parte del sistema?"
                                        value={newItem.needs || ''}
                                        onChange={e => setNewItem({...newItem, needs: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700">Expectativas Futuras</Label>
                                    <Textarea 
                                        className="min-h-[100px] bg-white border border-slate-100 focus:border-blue-500 rounded-xl font-medium transition-all shadow-sm resize-none"
                                        placeholder="¿Qué espera de la organización?"
                                        value={newItem.expectations || ''}
                                        onChange={e => setNewItem({...newItem, expectations: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700">Estrategia de Gestión / Acciones</Label>
                            <Input 
                                className="h-11 bg-white border border-slate-100 focus:border-blue-500 rounded-xl font-bold transition-all shadow-sm text-blue-600 placeholder:text-blue-200"
                                placeholder="Estrategia principal para abordar este interesado..."
                                value={newItem.strategy || ''}
                                onChange={e => setNewItem({...newItem, strategy: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="px-6 py-3 border-t border-slate-100 flex justify-end gap-3 bg-white">
                        <Button variant="ghost" onClick={() => setShowNew(false)} className="font-medium text-sm h-11 rounded-xl px-6">Cancelar</Button>
                        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-600 text-white font-semibold text-xs h-12 px-8 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                            Guardar Información
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Detail View Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[94vh] sm:max-w-4xl bg-white border-0 p-0 gap-0 overflow-y-auto rounded-3xl shadow-2xl">
                    {selectedItem && (
                        <>
                            <div className={cn("px-6 py-8 text-white relative", typeConfig[selectedItem.type].bg)}>
                                <div className="absolute right-6 top-6 opacity-20"><Box className="h-24 w-24" /></div>
                                <Badge className="bg-white/20 text-white border-none rounded-full px-4 py-1 font-semibold text-xs mb-4">
                                    {selectedItem.type} / ISO 4.2
                                </Badge>
                                <h2 className="text-3xl font-semibold leading-tight">{selectedItem.name}</h2>
                            </div>
                            <div className="p-6 space-y-8 bg-white">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-400">Requisitos Técnicos</p>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed border-l-2 border-slate-100 pl-4">
                                            {selectedItem.needs || 'No se han documentado requisitos específicos'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-400">Expectativas</p>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed border-l-2 border-slate-100 pl-4">
                                            &quot;{selectedItem.expectations || 'Sin expectativas relevadas'}&quot;
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                                    <p className="text-xs font-semibold text-blue-600 mb-3">Estrategia Organizacional</p>
                                    <p className="text-lg font-semibold text-slate-800 tracking-tight">
                                        {selectedItem.strategy || 'Estrategia pendiente de definición'}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("px-4 py-1.5 rounded-lg border flex items-center gap-2", influenceConfig[selectedItem.influence].bg, influenceConfig[selectedItem.influence].color, "border-current/10")}>
                                            {influenceConfig[selectedItem.influence].icon}
                                            <span className="text-xs font-semibold">Influencia {selectedItem.influence}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" onClick={() => setShowDetail(false)} className="text-slate-400 font-bold text-xs">Cerrar Detalle</Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            {/* Configuration Dialog */}
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Estándar documental de la empresa</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-600">El logo, el encabezado, los tipos documentales y los códigos se administran en un único lugar. Las descargas PDF usan siempre esa configuración.</p>
                    <Button asChild><Link href="/apoyo/estandar-documental">Abrir estándar documental</Link></Button>
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
            </ModuleContent>
        </ModulePage>
    );
}
