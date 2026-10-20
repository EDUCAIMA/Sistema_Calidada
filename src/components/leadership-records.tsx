"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface LeadershipUser { id: string; name: string; position: string | null }
export interface LeadershipEvent {
  id: string; recordId: string; action: string; userName: string; createdAt: string;
  snapshot: Record<string, unknown>;
}
interface RecordsResponse<T> { records: T[]; users: LeadershipUser[]; events: LeadershipEvent[] }

export function useLeadershipRecords<T>(endpoint: string, tenantId: string) {
  const [state, setState] = useState<RecordsResponse<T> & { tenantId: string }>({ records: [], users: [], events: [], tenantId: '' });
  const [error, setError] = useState('');
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!tenantId) return;
    try {
      const response = await fetch(`${endpoint}?tenantId=${encodeURIComponent(tenantId)}`, { signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo cargar la información.');
      setState({ ...result, tenantId });
      setError('');
    } catch (err) {
      if (signal?.aborted) return;
      const message = err instanceof Error ? err.message : 'No se pudo cargar la información.';
      setError(message);
      toast.error(message);
    }
  }, [endpoint, tenantId]);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  const visible = state.tenantId === tenantId;
  return { records: visible ? state.records : [], users: visible ? state.users : [], events: visible ? state.events : [], loading: !tenantId || (!visible && !error), error, refresh };
}

const eventLabels: Record<string, string> = {
  CREADO: 'Creación', ACTUALIZADO: 'Actualización', CERRADO: 'Cierre con evaluación',
  REABIERTO: 'Reapertura', ASIGNADO: 'Asignación', ARCHIVADO: 'Archivo', COMPRENSION_CONFIRMADA: 'Comprensión confirmada por el titular',
  MATRIZ_CREADA: 'Matriz creada', REVISION_CREADA: 'Nueva revisión creada', ENVIADA_REVISION: 'Enviada a revisión',
  AJUSTES_SOLICITADOS: 'Ajustes solicitados', MATRIZ_APROBADA: 'Aprobada por la alta dirección', MATRIZ_OBSOLETA: 'Versión sustituida',
  COMUNICADO: 'Asignación comunicada',
};
const fieldLabels: Record<string, string> = {
  title: 'Título', description: 'Compromiso / actividad', category: 'Tema', responsibleName: 'Responsable',
  dueDate: 'Fecha objetivo', status: 'Estado', evidence: 'Evidencia', result: 'Resultado',
  customerRequirements: 'Requisitos del cliente', customerRisks: 'Riesgos y oportunidades', customerSatisfaction: 'Satisfacción del cliente',
  department: 'Área', assignedToName: 'Persona asignada', reportsTo: 'Reporta a', responsibilities: 'Responsabilidades', authorities: 'Autoridades',
  processName: 'Proceso', raciRoles: 'Funciones RACI', sgcDuties: 'Responsabilidades del SGC', communicatedAt: 'Fecha de comunicación',
  communicationMethod: 'Método de comunicación', communicationAudience: 'Destinatarios', communicationEvidence: 'Evidencia de comunicación',
  acknowledgedAt: 'Confirmación de comprensión', understandingEvidence: 'Evidencia de comprensión', active: 'Activo',
  code: 'Código', version: 'Versión', scope: 'Alcance', approvedByName: 'Aprobó', approvedAt: 'Fecha de aprobación',
  approvalNote: 'Fundamento de aprobación', effectiveAt: 'Entrada en vigor', nextReviewAt: 'Próxima revisión', note: 'Observación',
};

export function LeadershipHistory({ events }: { events: LeadershipEvent[] }) {
  if (!events.length) return <p className="text-sm text-slate-500">Sin eventos registrados.</p>;
  return <div className="space-y-3">{events.map(event => <details key={event.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm">
    <summary className="cursor-pointer">{eventLabels[event.action] || event.action} · {event.userName} · {new Date(event.createdAt).toLocaleString('es-CO')}</summary>
    <dl className="mt-3 grid gap-2">{Object.entries(event.snapshot).filter(([key, value]) => fieldLabels[key] && value !== null && value !== '').map(([key, value]) => <div key={key}>
      <dt className="font-medium text-slate-600">{fieldLabels[key]}</dt>
      <dd className="whitespace-pre-wrap break-words">{Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? value ? 'Sí' : 'No' : String(value)}</dd>
    </div>)}</dl>
  </details>)}</div>;
}

export const leadershipSelectClass = 'flex h-11 min-w-0 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 dark:bg-slate-900';
