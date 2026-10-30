"use client";
import { AuditFollowUp } from '@/components/audits/AuditFollowUp';
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';
export default function AccionesPage() {
  return <ModulePage><ModuleHeader clause="10.2" title="Acciones correctivas" description="Seguimiento de las actividades del plan de mejoramiento F8, con responsables, plazos y verificación de eficacia." /><ModuleContent><AuditFollowUp mode="actions" /></ModuleContent></ModulePage>;
}
