import {
    Tenant, User, Process, ProcessCharacterization, Document,
    RiskMatrix, Risk, Audit, Finding, DashboardStats,
    DOFAItem, Stakeholder, SGCScope,
    type Role, type ProcessCategory, type DocumentStatus, type DocumentType,
    type RiskType, type RiskLevel, type AuditStatus, type FindingType, type ActionStatus,
    type DOFACategory, type StakeholderType, type StakeholderInfluence
} from './types';

// ==================== TENANT ====================
export const mockTenant: Tenant = {
    id: 'tenant-0',
    name: 'Nueva Empresa',
    slug: 'nueva-empresa',
    plan: 'PROFESIONAL',
    active: true,
    createdAt: new Date(),
};

// ==================== USERS ====================
export const mockUsers: User[] = [
    { id: 'user-0', tenantId: 'tenant-0', email: 'admin@empresa.com', name: 'Administrador', position: 'Gerente', role: 'ADMIN_EMPRESA', active: true, createdAt: new Date() },
];

export const mockCurrentUser: User = mockUsers[0];

// ==================== PROCESSES ====================
export const mockProcesses: Process[] = [];

export const mockCharacterization: ProcessCharacterization = {
    id: '',
    processId: '',
    version: '01',
    date: new Date().toLocaleDateString(),
    planear: [],
    hacer: [],
    verificar: [],
    actuar: [],
    resources: [],
    indicators: [],
    documents: [],
    risks: [],
};

// ==================== DOCUMENTS ====================
export const mockDocuments: Document[] = [];

// ==================== RISK MATRICES ====================
function getRiskLevel(prob: number, impact: number): RiskLevel {
    const value = prob * impact;
    if (value >= 15) return 'CRITICO';
    if (value >= 9) return 'ALTO';
    if (value >= 4) return 'MEDIO';
    return 'BAJO';
}

export const mockRisks: Risk[] = [];

export const mockRiskMatrices: RiskMatrix[] = [];

// ==================== AUDITS ====================
export const mockAudits: Audit[] = [];

// ==================== DASHBOARD STATS ====================
export const mockDashboardStats: DashboardStats = {
    totalProcesses: 0,
    totalDocuments: 0,
    totalRisks: 0,
    criticalRisks: 0,
    openFindings: 0,
    upcomingAudits: 0,
    documentsPendingApproval: 0,
    overdueActions: 0,
};

// ==================== CONTEXTO ORGANIZACIONAL (Clause 4) ====================
export const mockDOFAItems: DOFAItem[] = [];

export const mockStakeholders: Stakeholder[] = [];

export const mockSGCScope: SGCScope = {
    id: '',
    tenantId: '',
    scopeStatement: '',
    applicableStandards: ['ISO 9001:2015'],
    exclusions: [],
    sites: [],
    processes: [],
    lastReviewDate: new Date(),
    approvedBy: '',
};
