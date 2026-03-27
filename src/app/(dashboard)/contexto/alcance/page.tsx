"use client";

import React, { useState, useEffect } from 'react';
import { 
    Edit, Save, FileText, Download, Target, HelpCircle, Lightbulb, Clock, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { mockSGCScope } from '@/lib/mock-data';
import type { SGCScope } from '@/lib/types';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { useApp } from '@/context/app-context';
import { DocumentHeader } from '@/components/DocumentHeader';
import { domToPng } from 'modern-screenshot';
import { useRef } from 'react';

export default function AlcanceSGCPage() {
    const { tenant } = useApp();
    const [scope, setScope] = useState<SGCScope & { id?: string }>(mockSGCScope);
    const [isEditing, setIsEditing] = useState(false);
    const [editScope, setEditScope] = useState('');
    const [loading, setLoading] = useState(true);
    const [showISOInfo, setShowISOInfo] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const pdfRef = useRef<HTMLDivElement>(null);

    // Document Metadata State (Configurable)
    const [docMetadata, setDocMetadata] = useState({
        code: 'DIR-REG-001',
        version: '01',
        approvalDate: new Date().toISOString().split('T')[0]
    });
    const [showConfig, setShowConfig] = useState(false);

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
        try {
            const doc = new jsPDF('p', 'mm', 'letter');
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;

            const safeTenantName = tenant?.name || "Calidad SGC";
            const safeCode = docMetadata.code || 'SGC-ALC-001';
            const safeVersion = docMetadata.version || '01';
            const safeDate = docMetadata.approvalDate || new Date().toISOString().split('T')[0];

            const headerHeight = 22;
            doc.setDrawColor(30, 41, 59);
            doc.setLineWidth(0.4);
            doc.rect(margin, margin, pageWidth - (margin * 2), headerHeight);
            
            const col1Width = 40;
            const col3Width = 60;
            const col2Width = pageWidth - (margin * 2) - col1Width - col3Width;

            doc.line(margin + col1Width, margin, margin + col1Width, margin + headerHeight);
            doc.line(margin + col1Width + col2Width, margin, margin + col1Width + col2Width, margin + headerHeight);

            // --- 1. LOGO O NOMBRE DE EMPRESA ---
            if (tenant?.logo) {
                try {
                    // El logo en tenant.logo es un base64 (DataURL)
                    doc.addImage(tenant.logo, 'PNG', margin + 2, margin + 2, col1Width - 4, headerHeight - 4, undefined, 'FAST');
                } catch (e) {
                    console.error("Error adding logo to PDF:", e);
                    doc.setFontSize(9).setFont('helvetica', 'bold');
                    doc.text(safeTenantName.toUpperCase(), margin + col1Width/2, margin + headerHeight/2 + 2, { align: 'center', maxWidth: col1Width - 4 });
                }
            } else {
                doc.setFontSize(9).setFont('helvetica', 'bold');
                doc.text(safeTenantName.toUpperCase(), margin + col1Width/2, margin + headerHeight/2 + 2, { align: 'center', maxWidth: col1Width - 4 });
            }

            doc.setFontSize(13).text("Alcance del Sistema de Gestión", margin + col1Width + col2Width/2, margin + 14, { align: 'center' });

            doc.setFontSize(8).setFont('helvetica', 'normal');
            const metaX = margin + col1Width + col2Width + 4;
            // Subimos las posiciones Y unos píxeles (antes 6, 11, 16, 21)
            doc.text(`Código: ${safeCode}`, metaX, margin + 5);
            doc.text(`Versión: ${safeVersion}`, metaX, margin + 9.5);
            doc.text(`Fecha: ${safeDate}`, metaX, margin + 14);
            doc.text(`Página: 1 de 1`, metaX, margin + 18.5);

            let currentY = margin + headerHeight + 10;

            doc.setFontSize(11).setFont('helvetica', 'italic');
            doc.setTextColor(50, 50, 50);
            
            const statement = scope.scopeStatement || 'No se ha definido una declaración de alcance para el sistema de gestión.';
            const splitText = doc.splitTextToSize(`"${statement}"`, pageWidth - (margin * 2));
            doc.text(splitText, margin, currentY);

            // 100% SÍNCRONO: usar doc.save directamente sin esperas, blobs, ni URLs
            doc.save(`Alcance_SGC_${safeTenantName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'documento'}.pdf`);
            toast.success('Documento descargado exitosamente');

        } catch (error: any) {
            console.error('ERROR_PDF:', error);
            toast.error('Error al descargar el documento');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#136dec]"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] -m-6 p-8 font-sans text-slate-900 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
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
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Definición Estratégica</span>
                        
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        
                        {/* UI Document Metadata (Now Dynamic) */}
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setShowConfig(true)}>
                            <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">Código: {docMetadata.code}</span>
                            <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">Versión: {docMetadata.version}</span>
                            <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">Aprobación: {docMetadata.approvalDate}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => {}} 
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-4 rounded-lg transition-all shadow-sm"
                    >
                        <Clock className="w-4 h-4 mr-2" /> Historial
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleDownloadPDF}
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-4 rounded-lg transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4 mr-2 text-red-500" /> PDF
                    </Button>
                    {!isEditing ? (
                        <Button 
                            onClick={() => setIsEditing(true)}
                            className="bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest h-10 px-6 rounded-lg transition-all shadow-lg"
                        >
                            <Edit className="w-4 h-4 mr-2" /> Editar Alcance
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsEditing(false)}
                                className="text-slate-500 font-bold text-xs uppercase tracking-widest h-10 px-4"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleSave}
                                className="bg-[#136dec] hover:bg-[#1156b9] text-white font-bold text-xs uppercase tracking-widest h-10 px-8 rounded-lg shadow-lg shadow-blue-200"
                            >
                                <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Scope Statement Section */}
                <div className="lg:col-span-3 space-y-6">
                    <section className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-4 h-4 text-[#136dec]" />
                                Declaración Oficial de Alcance
                            </h3>
                            <Badge variant="outline" className="bg-blue-50 text-[#136dec] border-[#136dec]/20 text-[10px] font-bold uppercase">REQUISITO 4.3</Badge>
                        </div>

                        <div id="pdf-content" ref={pdfRef} className={cn("bg-white flex-1 flex flex-col p-8", isExporting && "p-12")}>
                            <div className={cn("hidden mb-8", isExporting && "block")}>
                                <DocumentHeader 
                                    title="ALCANCE DEL SISTEMA DE GESTIÓN"
                                    code={docMetadata.code}
                                    version={docMetadata.version}
                                    approvalDate={docMetadata.approvalDate}
                                    logoUrl={tenant?.logo || tenant?.logoUrl || undefined}
                                />
                            </div>

                            <div className="flex-1 flex flex-col mt-4">
                                {isEditing ? (
                                    <div className="space-y-4 flex-1 flex flex-col">
                                        <Textarea
                                            value={editScope}
                                            onChange={e => setEditScope(e.target.value)}
                                            className="flex-1 w-full bg-slate-50/50 border-none rounded-2xl text-xl font-medium italic text-slate-700 p-8 focus-visible:ring-0 resize-none leading-relaxed"
                                            placeholder="Defina aquí los procesos, productos y servicios que abarca su SGC..."
                                        />
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-4">
                                            Consejo: Incluya los límites físicos, productos, servicios y exclusiones justificadas dentro del texto.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-10">
                                        {scope.scopeStatement ? (
                                            <blockquote className="text-4xl font-bold text-slate-800 leading-tight italic text-center max-w-4xl relative">
                                                <span className="text-8xl text-blue-100 absolute -top-16 -left-12 font-serif leading-none select-none">"</span>
                                                {scope.scopeStatement}
                                                <span className="text-8xl text-blue-100 absolute -bottom-20 -right-12 font-serif leading-none select-none">"</span>
                                            </blockquote>
                                        ) : (
                                            <div className="text-center space-y-4">
                                                <FileText className="w-20 h-20 text-slate-100 mx-auto" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Sin declaración de alcance definida</p>
                                                <Button onClick={() => setIsEditing(true)} variant="link" className="text-[#136dec] font-black text-xs uppercase">Redactar ahora</Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Guidance Sidebar */}
                <div className="space-y-6">
                    <section className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-8 space-y-8 h-full">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <Lightbulb className="w-6 h-6 text-[#136dec]" />
                            </div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Guía ISO 9001</h4>
                        </div>
                        
                        <div className="space-y-8">
                            {[
                                { title: 'Productos y Servicios', desc: 'Describa el catálogo de soluciones que ofrece su organización.' },
                                { title: 'Límites Operativos', desc: 'Especifique las sedes físicas o regiones que cubre el sistema.' },
                                { title: 'No Aplicabilidad', desc: 'Si algún requisito no aplica (ej. Diseño), justifíquelo brevemente.' }
                            ].map((guide, idx) => (
                                <div key={idx} className="space-y-2 group">
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 group-hover:scale-150 transition-all" />
                                        {guide.title}
                                    </p>
                                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{guide.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-slate-50 mt-auto">
                            <p className="text-[10px] text-slate-400 italic leading-relaxed text-center">
                                &quot;El alcance debe mantenerse como información documentada y estar disponible para las partes interesadas.&quot;
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            {/* Configuration Dialog */}
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
                <DialogContent className="max-w-md bg-white border-none rounded-3xl shadow-2xl p-0 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
                        <Settings className="w-6 h-6 text-blue-400" />
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-tight italic">Configurar Documento</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Metadatos del Alcance del SGC</p>
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-6 bg-white text-slate-900">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Código del Formato</Label>
                            <Input 
                                value={docMetadata.code}
                                onChange={e => setDocMetadata({...docMetadata, code: e.target.value.toUpperCase()})}
                                className="h-12 border-slate-100 bg-slate-50 font-black text-[#136dec] uppercase"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Versión</Label>
                                <Input 
                                    value={docMetadata.version}
                                    onChange={e => setDocMetadata({...docMetadata, version: e.target.value})}
                                    className="h-12 border-slate-100 bg-slate-50 font-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha de Aprobación</Label>
                                <Input 
                                    type="date"
                                    value={docMetadata.approvalDate}
                                    onChange={e => setDocMetadata({...docMetadata, approvalDate: e.target.value})}
                                    className="h-12 border-slate-100 bg-slate-50 font-bold"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t">
                        <Button onClick={() => setShowConfig(false)} className="bg-slate-900 text-white font-black uppercase text-[10px] px-8 h-12 rounded-xl">Aplicar Configuración</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ISO Info Dialog */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden flex flex-col p-0 gap-0 font-sans">
                    <header className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">4 Contexto de la organización</h1>
                            <h2 className="text-xl font-medium text-[#1e3a8a]">4.3 Determinación del alcance</h2>
                        </div>
                    </header>
                    <div className="px-6 pt-4 pb-8 space-y-6 bg-white overflow-y-auto max-h-[60vh]">
                        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-6 space-y-6">
                            <p className="text-lg text-gray-800 leading-relaxed italic">
                                La organización <strong className="font-black text-gray-900 not-italic">debe</strong> determinar los límites y la aplicabilidad del sistema de gestión de la calidad para establecer su alcance.
                            </p>
                            <div className="space-y-3 md:ml-6">
                                <p className="text-lg text-gray-800 italic">a) las cuestiones externas e internas (4.1)</p>
                                <p className="text-lg text-gray-800 italic">b) los requisitos de las partes interesadas (4.2)</p>
                                <p className="text-lg text-gray-800 italic">c) los productos y servicios de la organización</p>
                            </div>
                        </div>
                    </div>
                    <footer className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <Button onClick={() => setShowISOInfo(false)} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold h-11 px-10 rounded shadow-md uppercase tracking-wider text-[10px]">
                            ENTENDIDO
                        </Button>
                    </footer>
                </DialogContent>
            </Dialog>
        </div>
    );
}
