"use client";

import { ModuleContent, ModuleHeader, ModulePage, ModuleToolbar } from '@/components/sgc/module-layout';

import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { 
    Edit, Save, FileText, Download, Target, HelpCircle, Lightbulb, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { SGCScope } from '@/lib/types';
import { toast } from 'sonner';
import { downloadStandardPdf } from '@/lib/document-pdf';
import { useApp } from '@/context/app-context';

export default function AlcanceSGCPage() {
    const { tenant } = useApp();
    const [scope, setScope] = useState<SGCScope | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editScope, setEditScope] = useState('');
    const [loading, setLoading] = useState(true);
    const [showISOInfo, setShowISOInfo] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Document Metadata State (Configurable)
    const [docMetadata, setDocMetadata] = useState({
        code: '',
        version: '01',
        approvalDate: ''
    });
    const [showConfig, setShowConfig] = useState(false);

    const [processes, setProcesses] = useState<Array<{ id: string; name: string }>>([]);

    useEffect(() => {
        const fetchScope = async () => {
            setScope(null);
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

        const fetchMetadata = async () => {
            setDocMetadata({ code: '', version: '01', approvalDate: '' });
            try {
                const res = await fetch(`/api/formatos?tenantId=${tenant.id}&moduleKey=4.3`);
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

        fetchScope();
        if (tenant?.id) {
            fetchMetadata();

            const fetchProcesses = async () => {
                try {
                    const res = await fetch(`/api/procesos?tenantId=${tenant.id}`);
                    const data = await res.json();
                    if (data && !data.error) setProcesses(data);
                } catch (e) { console.error(e); }
            };
            fetchProcesses();
        }
    }, [tenant?.id]);

    const handleSave = async () => {
        try {
            const res = await fetch('/api/contexto/alcance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: scope?.id,
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
            toast.error(error instanceof Error ? error.message : 'Error al guardar el alcance');
        }
    };

    const handleDownloadPDF = async () => {
        if (!scope) {
            toast.error('Registre y guarde el alcance antes de descargarlo.');
            return;
        }
        setIsExporting(true);
        try {
            await downloadStandardPdf({
                tenantId: tenant.id,
                moduleKey: '4.3',
                title: 'Alcance del sistema de gestión de calidad',
                filename: 'Alcance_SGC.pdf',
                sections: [
                    { title: 'Declaración de alcance', text: scope.scopeStatement || 'Sin declaración registrada.' },
                    ...(scope.applicableStandards?.length ? [{ title: 'Normas aplicables', text: scope.applicableStandards }] : []),
                    ...(scope.exclusions?.length ? [{
                        title: 'Requisitos no aplicables y justificación',
                        head: ['Numeral', 'Justificación'],
                        rows: scope.exclusions.map(item => [item.clause, item.justification]),
                    }] : []),
                    ...(scope.sites?.length ? [{
                        title: 'Sedes incluidas',
                        head: ['Sede', 'Dirección', 'Actividades'],
                        rows: scope.sites.map(item => [item.name, item.address, item.activities]),
                    }] : []),
                    ...(scope.processes?.length ? [{
                        title: 'Procesos incluidos',
                        text: scope.processes.map(id => processes.find(process => process.id === id)?.name || id),
                    }] : []),
                ],
            });
            toast.success('Documento descargado exitosamente');
        } catch (error) {
            console.error('ERROR_PDF:', error);
            toast.error(error instanceof Error ? error.message : 'Error al descargar el documento');
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#136dec]"></div>
        </div>
    );

    return (
        <ModulePage>
            <ModuleHeader clause="4.3" title="Alcance del SGC" description="Defina los límites y la aplicabilidad del sistema de gestión de la calidad." actions={<>
                <Button variant="outline" onClick={() => setShowISOInfo(true)} aria-label="Ver información normativa ISO 9001:2015"><HelpCircle className="h-4 w-4" />Guía ISO</Button>
                <Button variant="outline" onClick={() => {}}><Clock className="h-4 w-4" />Historial</Button>
                <Button variant="outline" onClick={handleDownloadPDF} disabled={isExporting}><Download className="h-4 w-4 text-red-500" />Descargar PDF</Button>
                {!isEditing ? <Button onClick={() => setIsEditing(true)}><Edit className="h-4 w-4" />Editar alcance</Button> : <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button onClick={handleSave}><Save className="h-4 w-4" />Guardar cambios</Button>
                </>}
            </>} />
            <ModuleToolbar>
                <button type="button" className="flex flex-wrap items-center gap-2 text-left text-xs font-medium text-slate-600 transition-colors hover:text-blue-600" onClick={() => setShowConfig(true)} aria-label="Configurar metadatos del alcance">
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Código: {docMetadata.code || 'Automático según estándar'}</span>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Versión: {docMetadata.version}</span>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">Aprobación: {docMetadata.approvalDate || 'Sin registrar'}</span>
                </button>
            </ModuleToolbar>
            <ModuleContent>
            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Scope Statement Section */}
                <div className="lg:col-span-3 space-y-6">
                    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        <div className="bg-slate-50 px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-600" />
                                Declaración Oficial de Alcance
                            </h3>
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs font-medium">Requisito 4.3</Badge>
                        </div>

                        <div className="bg-white flex-1 flex flex-col p-4 sm:p-6">

                            <div className="flex-1 flex flex-col mt-4">
                                {isEditing ? (
                                    <div className="space-y-4 flex-1 flex flex-col">
                                        <Textarea
                                            value={editScope}
                                            onChange={e => setEditScope(e.target.value)}
                                            className="flex-1 w-full min-h-64 bg-white border-slate-200 rounded-xl text-sm text-slate-700 p-4 resize-y leading-relaxed"
                                            placeholder="Defina aquí los procesos, productos y servicios que abarca su SGC..."
                                        />
                                        <p className="text-sm text-slate-500 mt-4">
                                            Consejo: Incluya los límites físicos, productos, servicios y exclusiones justificadas dentro del texto.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col justify-center py-4">
                                        {scope?.scopeStatement ? (
                                            <blockquote className="whitespace-pre-wrap break-words border-l-4 border-blue-200 pl-5 text-base leading-relaxed text-slate-700">
                                                {scope.scopeStatement}
                                            </blockquote>
                                        ) : (
                                            <div className="text-center space-y-4">
                                                <FileText className="w-20 h-20 text-slate-100 mx-auto" />
                                                <p className="text-slate-400 font-bold text-sm">Sin declaración de alcance definida</p>
                                                <Button onClick={() => setIsEditing(true)} variant="link" className="text-blue-600 font-semibold text-xs">Redactar ahora</Button>
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
                    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6 h-full">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <Lightbulb className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="text-sm font-semibold text-slate-800">Guía ISO 9001</h4>
                        </div>
                        
                        <div className="space-y-8">
                            {[
                                { title: 'Productos y Servicios', desc: 'Describa el catálogo de soluciones que ofrece su organización.' },
                                { title: 'Límites Operativos', desc: 'Especifique las sedes físicas o regiones que cubre el sistema.' },
                                { title: 'No Aplicabilidad', desc: 'Si algún requisito no aplica (ej. Diseño), justifíquelo brevemente.' }
                            ].map((guide, idx) => (
                                <div key={idx} className="space-y-2 group">
                                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 group-hover:scale-150 transition-all" />
                                        {guide.title}
                                    </p>
                                    <p className="text-sm text-slate-500 leading-relaxed">{guide.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-slate-50 mt-auto">
                            <p className="text-xs text-slate-400 leading-relaxed text-center">
                                &quot;El alcance debe mantenerse como información documentada y estar disponible para las partes interesadas.&quot;
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            {/* Configuration Dialog */}
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Estándar documental de la empresa</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-600">El logo, el encabezado, los tipos documentales y los códigos se administran en un único lugar. Las descargas PDF usan siempre esa configuración.</p>
                    <Button asChild><Link href="/apoyo/estandar-documental">Abrir estándar documental</Link></Button>
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
            </ModuleContent>
        </ModulePage>
    );
}
