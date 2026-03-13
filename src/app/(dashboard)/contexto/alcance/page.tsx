"use client";

import React, { useState } from 'react';
import { Edit, Save, FileText, Download, Info, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { mockSGCScope } from '@/lib/mock-data';
import type { SGCScope } from '@/lib/types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function AlcanceSGCPage() {
    const [scope, setScope] = useState<SGCScope>(mockSGCScope);
    const [isEditing, setIsEditing] = useState(false);
    const [editScope, setEditScope] = useState(scope.scopeStatement);

    const handleSave = () => {
        setScope({ ...scope, scopeStatement: editScope, lastReviewDate: new Date() });
        setIsEditing(false);
        toast.success('Alcance del SGC actualizado exitosamente');
    };

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
        doc.text('Declaración de Alcance del SGC', 20, 45);

        doc.setFontSize(12);
        doc.setTextColor(60);
        const splitText = doc.splitTextToSize(scope.scopeStatement || 'Sin declaración definida.', 170);
        doc.text(splitText, 20, 60);

        doc.save(`Alcance-SGC-${now.replace(/\//g, '-')}.pdf`);
        toast.success('Documento de Alcance descargado');
    };

    return (
        <div className="min-h-screen bg-white -m-6 p-12 font-[sans-serif] text-slate-900 pb-20">
            {/* Minimalist Header */}
            <div className="max-w-5xl mx-auto mb-12 border-b border-slate-100 pb-8 flex justify-between items-end">
                <div>
                    <Badge variant="outline" className="mb-4 border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">
                        Estratégico / Cláusula 4.3
                    </Badge>
                    <h1 className="text-5xl font-black tracking-tighter uppercase italic text-slate-900">
                        Alcance <span className="text-blue-600">SGC</span>
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button 
                        onClick={handleDownloadPDF}
                        variant="ghost" 
                        className="text-slate-400 hover:text-blue-600 font-bold uppercase text-[10px] tracking-widest"
                    >
                        <Download className="w-4 h-4 mr-2" /> Exportar PDF
                    </Button>
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} variant="ghost" className="text-slate-400 hover:text-blue-600 font-bold uppercase text-[10px] tracking-widest">
                            <Edit className="w-4 h-4 mr-2" /> Editar Alcance
                        </Button>
                    ) : (
                        <div className="flex gap-4">
                            <Button variant="ghost" className="text-slate-400 font-bold uppercase text-[10px]" onClick={() => setIsEditing(false)}>Descartar</Button>
                            <Button onClick={handleSave} className="bg-slate-900 text-white rounded-full px-8 font-black uppercase text-xs tracking-widest">Guardar</Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto space-y-12">
                {/* 0. Instructions / Guide */}
                <section className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Lightbulb className="w-24 h-24 text-blue-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                                <Info className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-blue-900">¿Cómo redactar el Alcance?</h2>
                        </div>
                        <p className="text-sm text-blue-800/80 mb-6 font-medium leading-relaxed max-w-3xl">
                            El alcance determina los límites y la aplicabilidad del SGC. Según la norma ISO 9001:2015, debe estar disponible como información documentada y considerar:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px]">
                            <div className="flex gap-3">
                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                    <span className="font-black text-blue-900 uppercase block mb-1">Productos y Servicios</span>
                                    Identifique claramente qué entrega su organización.
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                    <span className="font-black text-blue-900 uppercase block mb-1">Límites Físicos</span>
                                    Mencione las sedes o unidades geográficas incluidas.
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                    <span className="font-black text-blue-900 uppercase block mb-1">Cuestiones Internas/Ext</span>
                                    Considere los factores analizados en el DOFA.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 1. The Scope Statement - The Core Entity */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 flex items-center gap-3">
                        <span className="w-8 h-px bg-slate-200" /> Declaración Oficial de Alcance
                    </h2>
                    
                    {isEditing ? (
                        <div className="space-y-4">
                            <Textarea
                                value={editScope}
                                onChange={e => setEditScope(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-3xl min-h-[220px] text-2xl font-black italic text-slate-900 p-10 focus-visible:ring-0 shadow-inner resize-none"
                                placeholder="Redacte el alcance aquí siguiendo las instrucciones anteriores..."
                            />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-4">
                                <ArrowRight className="inline w-3 h-3 mr-1" /> Ejemplo: "Diseño, fabricación y comercialización de productos metálicos en la sede Bogotá..."
                            </p>
                        </div>
                    ) : (
                        <div className="relative group">
                            {scope.scopeStatement ? (
                                <p className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tighter uppercase italic">
                                    "{scope.scopeStatement}"
                                </p>
                            ) : (
                                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Sin declaración de alcance</p>
                                    <Button onClick={() => setIsEditing(true)} variant="link" className="text-blue-500 font-bold uppercase text-[10px] mt-2">Redactar ahora</Button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
