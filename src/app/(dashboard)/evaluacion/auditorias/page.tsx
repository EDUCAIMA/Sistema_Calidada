"use client";

import React, { useState } from 'react';
import { Plus, Calendar, ClipboardCheck, AlertTriangle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { mockAudits } from '@/lib/mock-data';
import type { Audit, AuditStatus, FindingType, ActionStatus } from '@/lib/types';
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';

const auditStatusConfig: Record<AuditStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PROGRAMADA: { label: 'Programada', color: 'text-blue-700', bg: 'bg-blue-50', icon: <Calendar className="h-3 w-3" /> },
    EN_PROGRESO: { label: 'En Progreso', color: 'text-amber-700', bg: 'bg-amber-50', icon: <Clock className="h-3 w-3" /> },
    COMPLETADA: { label: 'Completada', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <CheckCircle2 className="h-3 w-3" /> },
    CANCELADA: { label: 'Cancelada', color: 'text-red-600', bg: 'bg-red-50', icon: <AlertTriangle className="h-3 w-3" /> },
};

const findingTypeConfig: Record<FindingType, { label: string; color: string; bg: string }> = {
    NC_MAYOR: { label: 'NC Mayor', color: 'text-red-700', bg: 'bg-red-100' },
    NC_MENOR: { label: 'NC Menor', color: 'text-orange-700', bg: 'bg-orange-100' },
    OBSERVACION: { label: 'Observación', color: 'text-amber-700', bg: 'bg-amber-100' },
    OPORTUNIDAD_MEJORA: { label: 'Oportunidad de Mejora', color: 'text-blue-700', bg: 'bg-blue-100' },
};

const actionStatusConfig: Record<ActionStatus, { label: string; color: string }> = {
    ABIERTA: { label: 'Abierta', color: 'text-blue-600' },
    EN_PROGRESO: { label: 'En Progreso', color: 'text-amber-600' },
    CERRADA: { label: 'Cerrada', color: 'text-emerald-600' },
    VENCIDA: { label: 'Vencida', color: 'text-red-600' },
};

export default function AuditoriasPage() {
    const [audits] = useState<Audit[]>(mockAudits);
    const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    const stats = {
        total: audits.length,
        programadas: audits.filter(a => a.status === 'PROGRAMADA').length,
        completadas: audits.filter(a => a.status === 'COMPLETADA').length,
        hallazgos: audits.flatMap(a => a.findings).length,
    };

    return (
        <ModulePage>
            <ModuleHeader
                clause="9.2"
                title="Programa de auditorías"
                description="Planifique y consulte las auditorías internas y externas y sus hallazgos."
                actions={<Button>
                    <Plus className="h-4 w-4 mr-2" />Nueva Auditoría
                </Button>}
            />
            <ModuleContent>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: 'Total Auditorías', value: stats.total, icon: ClipboardCheck, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Programadas', value: stats.programadas, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Completadas', value: stats.completadas, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Hallazgos', value: stats.hallazgos, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(s => (
                    <Card key={s.label} className="shadow-sm min-w-0 rounded-2xl border border-slate-100 bg-white">
                        <CardContent className="p-4 flex items-center gap-3 min-w-0">
                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", s.bg)}>
                                <s.icon className={cn("h-5 w-5", s.color)} />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{s.value}</p>
                                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Audit Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {audits.map(audit => {
                    const statusCfg = auditStatusConfig[audit.status];
                    return (
                        <Card key={audit.id} role="button" tabIndex={0} aria-label={`Ver auditoría ${audit.name}`} className="shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow cursor-pointer group min-w-0 rounded-2xl border border-slate-100 bg-white"
                            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedAudit(audit); setShowDetail(true); } }}
                            onClick={() => { setSelectedAudit(audit); setShowDetail(true); }}>
                            <CardContent className="p-5 min-w-0">
                                <div className="flex items-start justify-between mb-3">
                                    <Badge variant="outline" className={cn("text-xs gap-1 rounded-md", statusCfg.bg, statusCfg.color, "border-current/20 rounded-md")}>
                                        {statusCfg.icon}{statusCfg.label}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs rounded-md">
                                        {audit.type === 'INTERNA' ? '🔍 Interna' : '📋 Externa'}
                                    </Badge>
                                </div>
                                <h3 className="text-sm font-semibold mb-2">{audit.name}</h3>
                                <div className="space-y-1.5 text-sm text-muted-foreground">
                                    <p>📅 {audit.scheduledDate.toLocaleDateString('es-CO')}</p>
                                    <p>👤 {audit.leadAuditorName}</p>
                                    <p>📦 {audit.processes.length} procesos</p>
                                </div>
                                {audit.findings.length > 0 && (
                                    <>
                                        <Separator className="my-3" />
                                        <div className="flex gap-2 flex-wrap">
                                            {Object.entries(findingTypeConfig).map(([type, config]) => {
                                                const count = audit.findings.filter(f => f.type === type).length;
                                                if (count === 0) return null;
                                                return (
                                                    <Badge key={type} variant="outline" className={cn("text-xs rounded-md", config.bg, config.color, "border-current/20 rounded-md")}>
                                                        {config.label}: {count}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                                <div className="flex items-center justify-end mt-3 text-blue-600">
                                    <span className="text-xs font-medium">Ver detalle</span>
                                    <ChevronRight className="h-3 w-3 ml-1" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Detail Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                {selectedAudit && (
                    <DialogContent className="max-h-[94vh] overflow-hidden rounded-3xl p-0 sm:max-w-3xl">
                        <DialogHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-4 py-5 pr-12 sm:px-6 sm:pr-14">
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="outline" className={cn("gap-1 rounded-md", auditStatusConfig[selectedAudit.status].bg, auditStatusConfig[selectedAudit.status].color)}>
                                    {auditStatusConfig[selectedAudit.status].icon}{auditStatusConfig[selectedAudit.status].label}
                                </Badge>
                                <Badge variant="secondary">{selectedAudit.type === 'INTERNA' ? 'Interna' : 'Externa'}</Badge>
                            </div>
                            <DialogTitle className="mt-2 break-words text-xl font-extrabold text-slate-900">{selectedAudit.name}</DialogTitle>
                            <DialogDescription>Consulte los procesos evaluados, los hallazgos y las acciones correctivas de esta auditoría.</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[65vh]">
                            <div className="min-w-0 space-y-6 p-4 sm:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-3 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground font-semibold">Fecha Programada</p>
                                        <p className="text-sm mt-1">{selectedAudit.scheduledDate.toLocaleDateString('es-CO')}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground font-semibold">Auditor Líder</p>
                                        <p className="text-sm mt-1">{selectedAudit.leadAuditorName}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground font-semibold">Procesos Auditados</p>
                                        <p className="text-sm mt-1">{selectedAudit.processes.length}</p>
                                    </div>
                                </div>

                                {selectedAudit.findings.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold mb-3">Hallazgos ({selectedAudit.findings.length})</h3>
                                        <div className="space-y-3">
                                            {selectedAudit.findings.map(finding => {
                                                const fConfig = findingTypeConfig[finding.type];
                                                return (
                                                    <div key={finding.id} className="p-4 rounded-lg border bg-card">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant="outline" className={cn("text-xs rounded-md", fConfig.bg, fConfig.color, "border-current/20 rounded-md")}>
                                                                {fConfig.label}
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-xs rounded-md">Cláusula {finding.clause}</Badge>
                                                        </div>
                                                        <p className="text-sm mb-1">{finding.description}</p>
                                                        <p className="text-sm text-muted-foreground">📋 {finding.evidence}</p>
                                                        {finding.correctiveAction && (
                                                            <div className="mt-3 p-3 rounded-md bg-muted/50">
                                                                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                                                    <p className="text-xs font-semibold text-muted-foreground">Acción Correctiva</p>
                                                                    <Badge variant="outline" className={cn("text-xs rounded-md", actionStatusConfig[finding.correctiveAction.status].color)}>
                                                                        {actionStatusConfig[finding.correctiveAction.status].label}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs">{finding.correctiveAction.description}</p>
                                                                <div className="flex flex-wrap gap-4 mt-1 text-xs text-muted-foreground">
                                                                    <span>👤 {finding.correctiveAction.responsible}</span>
                                                                    <span>📅 {finding.correctiveAction.dueDate.toLocaleDateString('es-CO')}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {selectedAudit.findings.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">Auditoría pendiente de ejecución</p>
                                        <p className="text-xs mt-1">Los hallazgos se registrarán durante la auditoría</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                )}
            </Dialog>
            </ModuleContent>
        </ModulePage>
    );
}
