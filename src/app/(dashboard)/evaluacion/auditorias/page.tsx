"use client";

import { useApp } from '@/context/app-context';
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';
import { AuditWorkspace } from '@/components/audits/AuditWorkspace';

export default function AuditoriasPage() {
  const { tenant } = useApp();
  return <ModulePage>
    <ModuleHeader clause="9.2" title="Gestión de auditorías" description="Programe, ejecute y documente sus auditorías. Diligencie los ocho formatos y descargue sus registros con el estándar documental de la empresa." />
    <ModuleContent><AuditWorkspace key={tenant.id} tenantId={tenant.id} /></ModuleContent>
  </ModulePage>;
}
