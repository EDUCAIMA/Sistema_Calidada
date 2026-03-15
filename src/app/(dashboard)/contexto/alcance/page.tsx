"use client";

import React, { useState, useEffect } from 'react';
import { 
    Edit, Save, FileText, Download, Info, Lightbulb, 
    CheckCircle2, ArrowRight, HelpCircle, ShieldCheck, 
    History, Target, MapPin, Box 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { mockSGCScope } from '@/lib/mock-data';
import type { SGCScope } from '@/lib/types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useApp } from '@/context/app-context';

export default function AlcanceSGCPage() {
    const { tenant } = useApp();
    const [scope, setScope] = useState<SGCScope & { id?: string }>(mockSGCScope);
    const [isEditing, setIsEditing] = useState(false);
    const [editScope, setEditScope] = useState('');
    const [loading, setLoading] = useState(true);
    const [showISOInfo, setShowISOInfo] = useState(false);

    useEffect(() => {
        const fetchScope = async () => {
            try {
                const res = await fetch(`/api/contexto/alcance?tenantId=${tenant.id}`);
                const data = await res.json();
                if (data && !data.error) {
                    setScope(data);
                    setEditScope(data.scopeStatement);
                }
            } catch (error) {
                console.error('Error fetching scope:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchScope();
    }, [tenant.id]);

    const handleSave = async () => {
        try {
            const res = await fetch('/api/contexto/alcance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: scope.id,
                    tenantId: tenant.id,
                    scopeStatement: editScope,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setScope(data);
            setIsEditing(false);
            toast.success('Alcance del SGC guardado correctamente');
        } catch (error) {
            toast.error('Error al guardar el alcance');
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const now = new Date().toLocaleDateString();
        doc.setFontSize(22);
        doc.setTextColor(19, 109, 236);
        doc.text('QualityLink QMS', 20, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Alcance del Sistema de Gestión de Calidad', 20, 28);
        doc.text(`Fecha: ${now}`, 150, 28);
        doc.setLineWidth(0.5);
        doc.setDrawColor(19, 109, 236);
        doc.line(20, 32, 190, 32);
        doc.setFontSize(14);
        doc.setTextColor(30);
        doc.text('Declaración de Alcance:', 20, 45);
        doc.setFontSize(11);
        doc.setTextColor(60);
        const splitText = doc.splitTextToSize(scope.scopeStatement || 'Sin definición.', 170);
        doc.text(splitText, 20, 55);
        doc.save(`Alcance-SGC-${tenant.name}.pdf`);
        toast.success('PDF generado con éxito');
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#136dec]"></div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-fade-in font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase">Alcance del SGC</h1>
                        <button 
                            onClick={() => setShowISOInfo(true)}
                            className="p-1.5 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-all active:scale-95"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-[#136dec]/10 text-[#136dec] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Cláusula 4.3</span>
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Información Documentada</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handleDownloadPDF}
                        className="bg-white border-red-100 text-red-600 hover:bg-red-50 font-bold text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4 mr-2" /> PDF
                    </Button>
                    {!isEditing ? (
                        <Button 
                            onClick={() => setIsEditing(true)}
                            className="bg-slate-900 hover:bg-black text-white font-bold text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl transition-all shadow-lg"
                        >
                            <Edit className="w-4 h-4 mr-2" /> Editar
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsEditing(false)}
                                className="text-slate-500 font-bold text-[10px] uppercase tracking-widest h-10 px-4"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleSave}
                                className="bg-[#136dec] hover:bg-[#1156b9] text-white font-bold text-[10px] uppercase tracking-widest h-10 px-8 rounded-xl shadow-lg shadow-blue-200"
                            >
                                <Save className="w-4 h-4 mr-2" /> Guardar
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Scope Statement Section */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                        <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-4 h-4 text-[#136dec]" />
                                Declaración Oficial de Alcance
                            </h3>
                            <Badge variant="outline" className="bg-blue-50 text-[#136dec] border-[#136dec]/20 text-[10px] font-bold">REQUISITO 4.3</Badge>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                            {isEditing ? (
                                <Textarea
                                    value={editScope}
                                    onChange={e => setEditScope(e.target.value)}
                                    className="flex-1 w-full bg-slate-50/50 border-none rounded-2xl text-xl font-medium italic text-slate-700 p-8 focus-visible:ring-0 resize-none leading-relaxed"
                                    placeholder="Defina aquí los procesos, productos y servicios que abarca su SGC..."
                                />
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    {scope.scopeStatement ? (
                                        <p className="text-3xl font-bold text-slate-800 leading-snug italic text-center max-w-2xl">
                                            &quot;{scope.scopeStatement}&quot;
                                        </p>
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <FileText className="w-16 h-16 text-slate-200 mx-auto" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sin declaración de alcance definida</p>
                                            <Button onClick={() => setIsEditing(true)} variant="link" className="text-[#136dec] font-black text-[10px] uppercase">Redactar ahora</Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Guidance & Resources */}
                <div className="space-y-6">
                    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Lightbulb className="w-5 h-5 text-[#136dec]" />
                            </div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Guía de Redacción</h4>
                        </div>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                            El alcance debe ser claro y conciso, definiendo qué hace su organización y dónde lo hace. Asegúrese de incluir:
                        </p>
                        <div className="space-y-4">
                            {[
                                { title: 'Productos y Servicios', desc: 'Descripción de las entregas de valor.' },
                                { title: 'Límites de Ubicación', desc: 'Centros físicos o zonas operativas.' },
                                { title: 'Justificación', desc: 'De cualquier requisito no aplicable.' }
                            ].map((guide, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="h-2 w-2 rounded-full bg-blue-200 mt-2 transition-colors group-hover:bg-blue-600" />
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{guide.title}</p>
                                        <p className="text-[11px] text-slate-500">{guide.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                            <p className="text-[10px] text-slate-400 italic">
                                &quot;Diseño, fabricación y comercialización de productos metálicos en la sede Principal.&quot;
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            {/* ISO 9001:2015 Clause 4.3 Info Dialog */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden flex flex-col p-0 gap-0 font-sans">
                    {/* BEGIN: Header */}
                    <header className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                4 Contexto de la organización
                            </h1>
                            <h2 className="text-xl font-medium text-[#1e3a8a]">
                                4.3 Determinación del alcance del sistema de gestión de la calidad
                            </h2>
                        </div>
                    </header>
                    {/* END: Header */}

                    {/* BEGIN: MainContent */}
                    <div className="px-6 pt-4 pb-8 space-y-6 bg-white overflow-y-auto max-h-[60vh]">
                        {/* BEGIN: NormativeParagraphs Container */}
                        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-5 space-y-4">
                            <section className="space-y-6">
                                <p className="text-lg text-gray-800 leading-relaxed italic">
                                    La organización <strong className="font-black text-gray-900 not-italic">debe</strong> determinar los límites y la aplicabilidad del sistema de gestión de la calidad para establecer su alcance.
                                </p>
                                <p className="text-lg text-gray-800 leading-relaxed italic">
                                    Cuando se determina este alcance, la organización <strong className="font-black text-gray-900 not-italic">debe</strong> considerar:
                                </p>
                                <div className="flex flex-col gap-4 text-lg text-gray-800 leading-relaxed italic md:ml-6 text-left">
                                    <p>a) las cuestiones externas e internas indicadas en el apartado 4.1;</p>
                                    <p>b) los requisitos de las partes interesadas pertinentes indicados en el apartado 4.2;</p>
                                    <p>c) los productos y servicios de la organización.</p>
                                </div>
                                <p className="text-lg text-gray-800 leading-relaxed italic">
                                    La organización <strong className="font-black text-gray-900 not-italic">debe</strong> aplicar todos los requisitos de esta Norma Internacional si son aplicables dentro del alcance determinado de su sistema de gestión de la calidad.
                                </p>
                                <p className="text-lg text-gray-800 leading-relaxed italic">
                                    El alcance del sistema de gestión de la calidad de la organización <strong className="font-black text-gray-900 not-italic">debe</strong> estar disponible y mantenerse como <strong className="font-black text-gray-900 not-italic">información documentada</strong>.
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
