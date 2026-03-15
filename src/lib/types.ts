// ==================== ENUMS ====================
export type Role = 'SUPER_ADMIN' | 'ADMIN_EMPRESA' | 'USUARIO' | 'AUDITOR_INTERNO' | 'AUDITOR_EXTERNO';
export type DocumentStatus = 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'OBSOLETO';
export type DocumentType = 'MANUAL' | 'PROCEDIMIENTO' | 'INSTRUCTIVO' | 'FORMATO' | 'POLITICA' | 'GUIA' | 'REGISTRO' | 'OTRO';
export type ProcessCategory = 'ESTRATEGICO' | 'MISIONAL' | 'APOYO' | 'EVALUACION';
export type RiskType = 'OPERACIONAL' | 'CALIDAD' | 'SST' | 'AMBIENTAL' | 'OTRO';
export type RiskLevel = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type AuditStatus = 'PROGRAMADA' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';
export type FindingType = 'NC_MAYOR' | 'NC_MENOR' | 'OBSERVACION' | 'OPORTUNIDAD_MEJORA';
export type ActionStatus = 'ABIERTA' | 'EN_PROGRESO' | 'CERRADA' | 'VENCIDA';

// ==================== TENANT ====================
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  plan: 'BASICO' | 'PROFESIONAL' | 'ENTERPRISE';
  active: boolean;
  createdAt: Date;
}

// ==================== USER ====================
export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  position?: string;
  role: Role;
  avatar?: string;
  active: boolean;
  createdAt: Date;
}

// ==================== PROCESS ====================
export interface Process {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  category: ProcessCategory;
  objective: string;
  scope: string;
  responsibleId: string;
  responsibleName?: string;
  order: number;
  active: boolean;
}

export interface ProcessCharacterization {
  id: string;
  processId: string;
  version: string;
  date: string;
  // PHVA rows (document-style)
  planear: PHVARow[];
  hacer: PHVARow[];
  verificar: PHVARow[];
  actuar: PHVARow[];
  // Resources
  resources: string[];
  indicators: ProcessIndicator[];
  documents: string[];
  risks: string[];
}

export interface PHVARow {
  id: string;
  providers: string[];
  inputs: string[];
  activity: string;
  outputs: string[];
  clients: string[];
}

export interface ProcessIndicator {
  id: string;
  name: string;
  formula: string;
  frequency: string;
  target: string;
}

// ==================== DOCUMENT ====================
export interface Document {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  processId?: string;
  processName?: string;
  currentVersion: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdBy: string;
  createdByName?: string;
  approvedBy?: string;
  approvedDate?: Date;
  nextReviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  changeDescription: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: Date;
}

// ==================== RISK ====================
export interface Risk {
  id: string;
  tenantId: string;
  matrixId: string;
  processId?: string;
  processName?: string;
  description: string;
  type: RiskType;
  cause: string;
  consequence: string;
  probability: number; // 1-5
  impact: number; // 1-5
  level: RiskLevel;
  riskValue: number;
  existingControls: string;
  treatmentPlan: string;
  responsible: string;
  dueDate?: Date;
  status: ActionStatus;
  residualProbability?: number;
  residualImpact?: number;
  residualLevel?: RiskLevel;
}

export interface RiskMatrix {
  id: string;
  tenantId: string;
  name: string;
  type: RiskType;
  description: string;
  risks: Risk[];
  createdAt: Date;
}

// ==================== AUDIT ====================
export interface Audit {
  id: string;
  tenantId: string;
  name: string;
  type: 'INTERNA' | 'EXTERNA';
  status: AuditStatus;
  leadAuditor: string;
  leadAuditorName?: string;
  processes: string[];
  scheduledDate: Date;
  completionDate?: Date;
  findings: Finding[];
}

export interface Finding {
  id: string;
  auditId: string;
  type: FindingType;
  clause: string;
  processId?: string;
  description: string;
  evidence: string;
  correctiveAction?: CorrectiveAction;
}

export interface CorrectiveAction {
  id: string;
  findingId: string;
  description: string;
  responsible: string;
  dueDate: Date;
  status: ActionStatus;
  evidence?: string;
  closedDate?: Date;
}

// ==================== DASHBOARD ====================
export interface DashboardStats {
  totalProcesses: number;
  totalDocuments: number;
  totalRisks: number;
  criticalRisks: number;
  openFindings: number;
  upcomingAudits: number;
  documentsPendingApproval: number;
  overdueActions: number;
}

// ==================== CONTEXTO ORGANIZACIONAL (Clause 4) ====================
export type DOFACategory = 'DEBILIDAD' | 'OPORTUNIDAD' | 'FORTALEZA' | 'AMENAZA';
export type StakeholderType = 'INTERNO' | 'EXTERNO';
export type StakeholderInfluence = 'ALTA' | 'MEDIA' | 'BAJA';

export interface DOFAItem {
  id: string;
  tenantId: string;
  category: DOFACategory;
  description: string;
  impact: string;
  actions: string;
  responsible: string;
  createdAt: Date;
}

export interface Stakeholder {
  id: string;
  tenantId: string;
  name: string;
  type: StakeholderType;
  needs: string;
  expectations: string;
  influence: StakeholderInfluence;
  strategy: string;
  contactInfo?: string;
}

export interface SGCScope {
  id: string;
  tenantId: string;
  scopeStatement: string;
  applicableStandards: string[];
  exclusions: { clause: string; justification: string }[];
  sites: { name: string; address: string; activities: string }[];
  processes: string[]; // process IDs included
  lastReviewDate: Date;
  approvedBy: string;
}

// ==================== NAV ====================
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  clause?: string;
  children?: NavItem[];
  roles?: Role[];
}
