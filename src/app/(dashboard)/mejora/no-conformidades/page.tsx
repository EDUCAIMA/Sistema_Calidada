"use client";
import { AuditFollowUp } from '@/components/audits/AuditFollowUp';
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';
export default function NoConformidadesPage() {
  return <ModulePage><ModuleHeader clause="10.2" title="No conformidades" description="No conformidades registradas en las auditorías de la empresa, vinculadas a sus evidencias y actividades de mejoramiento." /><ModuleContent><AuditFollowUp mode="findings" /></ModuleContent></ModulePage>;
}
