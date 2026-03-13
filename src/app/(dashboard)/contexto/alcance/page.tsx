"use client";

import React, { useState } from 'react';
import { Edit, Save, MapPin, BookOpen, AlertCircle, Network, CheckCircle2, Building2, Calendar, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { mockSGCScope, mockProcesses } from '@/lib/mock-data';
import type { SGCScope } from '@/lib/types';
import { toast } from 'sonner';

export default function AlcanceSGCPage() {
    const [scope, setScope] = useState<SGCScope>({
        id: '',
        tenantId: '',
        scopeStatement: 'Describa aquí el alcance de su sistema de gestión...',
        exclusions: [],
        sites: [],
        applicableStandards: ['ISO 9001:2015'],
        processes: [],
        lastReviewDate: new Date(),
        approvedBy: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editScope, setEditScope] = useState(scope.scopeStatement);

    const handleSave = () => {
        setScope({ ...scope, scopeStatement: editScope, lastReviewDate: new Date() });
        setIsEditing(false);
        toast.success('Alcance del SGC actualizado exitosamente');
    };

    return (
        <div className="min-h-screen bg-white -m-6 p-12 font-[sans-serif] text-slate-900 pb-20">
            {/* Minimalist Header */}
            <div className="max-w-5xl mx-auto mb-16 border-b border-slate-100 pb-8 flex justify-between items-end">
                <div>
                    <Badge variant="outline" className="mb-4 border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">
                        Socio-Estratégico / ISO 9001:2015
                    </Badge>
                    <h1 className="text-5xl font-black tracking-tighter uppercase italic text-slate-900">
                        Alcance <span className="text-blue-600">SGC</span>
                    </h1>
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="ghost" className="text-slate-400 hover:text-blue-600 font-bold uppercase text-[10px] tracking-widest">
                        <Edit className="w-4 h-4 mr-2" /> Editar Documento
                    </Button>
                ) : (
                    <div className="flex gap-4">
                        <Button variant="ghost" className="text-slate-400 font-bold uppercase text-[10px]" onClick={() => setIsEditing(false)}>Descartar</Button>
                        <Button onClick={handleSave} className="bg-slate-900 text-white rounded-full px-8 font-black uppercase text-xs tracking-widest">Guardar</Button>
                    </div>
                )}
            </div>

            <div className="max-w-5xl mx-auto space-y-20">
                {/* 1. The Scope Statement - The Core Entity */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 flex items-center gap-3">
                        <span className="w-8 h-px bg-slate-200" /> Declaración Oficial de Alcance
                    </h2>
                    
                    {isEditing ? (
                        <Textarea
                            value={editScope}
                            onChange={e => setEditScope(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-3xl min-h-[180px] text-2xl font-black italic text-slate-900 p-10 focus-visible:ring-0 shadow-inner resize-none"
                        />
                    ) : (
                        <div className="relative">
                            <p className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tighter uppercase italic">
                                "{scope.scopeStatement}"
                            </p>
                        </div>
                    )}
                </section>

                {/* 2. Simplified Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-10 border-t border-slate-50">
                    {/* Exclusions */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6">Exclusiones (Cláusula 4.3)</h3>
                        <div className="space-y-6">
                            {scope.exclusions.length > 0 ? scope.exclusions.map((exc, idx) => (
                                <div key={idx} className="group border-l-2 border-slate-100 pl-6 py-1 hover:border-blue-600 transition-colors">
                                    <div className="text-[11px] font-black text-blue-600 uppercase mb-2">Apartado {exc.clause}</div>
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed italic">"{exc.justification}"</p>
                                </div>
                            )) : (
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">No se registran exclusiones operativas.</p>
                            )}
                        </div>
                    </div>

                    {/* Sites */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6">Sedes y Límites Físicos</h3>
                        <div className="space-y-6">
                            {scope.sites.map((site, idx) => (
                                <div key={idx} className="group border-l-2 border-slate-100 pl-6 py-1 hover:border-blue-600 transition-colors">
                                    <div className="text-[11px] font-black text-slate-800 uppercase mb-1 italic">{site.name}</div>
                                    <p className="text-[11px] font-bold text-slate-400 mb-2">{site.address}</p>
                                    <Badge variant="secondary" className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-tighter border-none px-2">
                                        {site.activities}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Footer / Approval */}
                <div className="pt-16 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-8">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Última Revisión</p>
                            <p className="text-sm font-black text-slate-900 italic uppercase tracking-tighter">{scope.lastReviewDate.toLocaleDateString()}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Autoridad de Gestión</p>
                            <p className="text-sm font-black text-slate-900 italic uppercase tracking-tighter">{scope.approvedBy}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <div className="h-2 w-2 rounded-full bg-blue-600" />
                         <div className="h-2 w-2 rounded-full bg-slate-200" />
                         <div className="h-2 w-2 rounded-full bg-slate-100" />
                    </div>
                </div>
            </div>
        </div>
    );
}
