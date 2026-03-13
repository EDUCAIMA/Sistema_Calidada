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
    id: 'tenant-1',
    name: 'Empresa Demo S.A.S.',
    slug: 'empresa-demo',
    plan: 'PROFESIONAL',
    active: true,
    createdAt: new Date('2026-01-01'),
};

// ==================== USERS ====================
export const mockUsers: User[] = [
    { id: 'user-1', tenantId: 'tenant-1', email: 'admin@empresademo.com', name: 'Carlos Administrador', position: 'Director de Calidad', role: 'ADMIN_EMPRESA', active: true, createdAt: new Date('2026-01-01') },
    { id: 'user-2', tenantId: 'tenant-1', email: 'maria@empresademo.com', name: 'María López', position: 'Coordinadora SST', role: 'USUARIO', active: true, createdAt: new Date('2026-01-15') },
    { id: 'user-3', tenantId: 'tenant-1', email: 'juan@empresademo.com', name: 'Juan Pérez', position: 'Líder de Producción', role: 'USUARIO', active: true, createdAt: new Date('2026-01-15') },
    { id: 'user-4', tenantId: 'tenant-1', email: 'ana@empresademo.com', name: 'Ana Rodríguez', position: 'Auditora Interna', role: 'AUDITOR_INTERNO', active: true, createdAt: new Date('2026-02-01') },
    { id: 'user-5', tenantId: 'tenant-1', email: 'pedro@externo.com', name: 'Pedro Externo', position: 'Auditor Externo', role: 'AUDITOR_EXTERNO', active: true, createdAt: new Date('2026-02-15') },
];

export const mockCurrentUser: User = mockUsers[0];

// ==================== PROCESSES ====================
export const mockProcesses: Process[] = [
    // Estratégicos
    { id: 'proc-1', tenantId: 'tenant-1', name: 'Planeación Estratégica', code: 'PE-01', category: 'ESTRATEGICO', objective: 'Definir el direccionamiento estratégico de la organización', scope: 'Toda la organización', responsibleId: 'user-1', responsibleName: 'Carlos Administrador', order: 1, active: true },
    { id: 'proc-2', tenantId: 'tenant-1', name: 'Gestión de Calidad', code: 'GC-01', category: 'ESTRATEGICO', objective: 'Asegurar la implementación y mejora del SGC', scope: 'Sistema de gestión de calidad', responsibleId: 'user-1', responsibleName: 'Carlos Administrador', order: 2, active: true },
    { id: 'proc-3', tenantId: 'tenant-1', name: 'Revisión por la Dirección', code: 'RD-01', category: 'ESTRATEGICO', objective: 'Evaluar la eficacia del SGC', scope: 'Alta dirección', responsibleId: 'user-1', responsibleName: 'Carlos Administrador', order: 3, active: true },
    // Misionales
    { id: 'proc-4', tenantId: 'tenant-1', name: 'Producción', code: 'PR-01', category: 'MISIONAL', objective: 'Fabricar productos conforme a especificaciones', scope: 'Planta de producción', responsibleId: 'user-3', responsibleName: 'Juan Pérez', order: 1, active: true },
    { id: 'proc-5', tenantId: 'tenant-1', name: 'Comercialización', code: 'CO-01', category: 'MISIONAL', objective: 'Gestionar la relación con clientes y ventas', scope: 'Área comercial', responsibleId: 'user-3', responsibleName: 'Juan Pérez', order: 2, active: true },
    { id: 'proc-6', tenantId: 'tenant-1', name: 'Logística', code: 'LO-01', category: 'MISIONAL', objective: 'Gestionar la cadena de suministro y distribución', scope: 'Almacén y distribución', responsibleId: 'user-3', responsibleName: 'Juan Pérez', order: 3, active: true },
    // Apoyo
    { id: 'proc-7', tenantId: 'tenant-1', name: 'Gestión Humana', code: 'GH-01', category: 'APOYO', objective: 'Gestionar el talento humano', scope: 'Recursos humanos', responsibleId: 'user-2', responsibleName: 'María López', order: 1, active: true },
    { id: 'proc-8', tenantId: 'tenant-1', name: 'Gestión SST', code: 'SST-01', category: 'APOYO', objective: 'Prevenir incidentes y enfermedades laborales', scope: 'Seguridad y salud en el trabajo', responsibleId: 'user-2', responsibleName: 'María López', order: 2, active: true },
    { id: 'proc-9', tenantId: 'tenant-1', name: 'Gestión Financiera', code: 'GF-01', category: 'APOYO', objective: 'Administrar los recursos financieros', scope: 'Área financiera', responsibleId: 'user-1', responsibleName: 'Carlos Administrador', order: 3, active: true },
];

export const mockCharacterization: ProcessCharacterization = {
    id: 'char-1',
    processId: 'proc-4',
    version: '03',
    date: '15/01/2026',
    planear: [
        {
            id: 'pa-1',
            providers: ['Comercialización', 'Alta Dirección'],
            inputs: ['Pronóstico de ventas', 'Plan estratégico', 'Presupuesto aprobado'],
            activity: 'Definir plan de producción mensual según demanda proyectada y capacidad disponible.',
            outputs: ['Plan de producción mensual', 'Cronograma de trabajo'],
            clients: ['Producción', 'Logística'],
        },
        {
            id: 'pa-2',
            providers: ['Proveedores externos', 'Almacén'],
            inputs: ['Inventario de materias primas', 'Órdenes de compra'],
            activity: 'Verificar disponibilidad de materias primas y gestionar abastecimiento.',
            outputs: ['Reporte de disponibilidad', 'Solicitud de compras'],
            clients: ['Compras', 'Almacén'],
        },
        {
            id: 'pa-3',
            providers: ['Mantenimiento', 'Ingeniería'],
            inputs: ['Estado de maquinaria', 'Ficha técnica de equipos'],
            activity: 'Programar capacidad de planta y disponibilidad de equipos.',
            outputs: ['Programa de capacidad', 'Calendario de mantenimiento preventivo'],
            clients: ['Producción', 'Mantenimiento'],
        },
    ],
    hacer: [
        {
            id: 'ha-1',
            providers: ['Planificación', 'Almacén'],
            inputs: ['Orden de producción', 'Materias primas', 'Especificaciones técnicas'],
            activity: 'Ejecutar la orden de producción conforme a las especificaciones del producto y los estándares de calidad.',
            outputs: ['Producto en proceso', 'Registros de producción'],
            clients: ['Control de Calidad', 'Logística'],
        },
        {
            id: 'ha-2',
            providers: ['Gestión de Calidad'],
            inputs: ['Parámetros de proceso', 'Procedimientos operativos estándar'],
            activity: 'Controlar parámetros del proceso (temperatura, presión, tiempos) y registrar variables críticas.',
            outputs: ['Registros de control de proceso', 'Reportes de variables'],
            clients: ['Gestión de Calidad', 'Mejora Continua'],
        },
        {
            id: 'ha-3',
            providers: ['Producción'],
            inputs: ['Datos de proceso', 'Formatos de registro'],
            activity: 'Registrar datos de producción, tiempos, cantidades producidas y novedades del turno.',
            outputs: ['Reporte diario de producción', 'Registro de novedades'],
            clients: ['Gerencia de Producción', 'Gestión de Calidad'],
        },
    ],
    verificar: [
        {
            id: 'va-1',
            providers: ['Producción', 'Gestión de Calidad'],
            inputs: ['Producto en proceso', 'Criterios de aceptación', 'Plan de inspección'],
            activity: 'Realizar inspección de calidad en proceso y producto terminado según plan de muestreo.',
            outputs: ['Informe de inspección', 'Producto conforme/no conforme'],
            clients: ['Logística', 'Gestión de Calidad'],
        },
        {
            id: 'va-2',
            providers: ['Planificación', 'Producción'],
            inputs: ['Plan de producción', 'Reporte de producción real'],
            activity: 'Verificar cumplimiento del plan de producción y analizar desviaciones.',
            outputs: ['Informe de cumplimiento', 'Análisis de desviaciones'],
            clients: ['Alta Dirección', 'Mejora Continua'],
        },
    ],
    actuar: [
        {
            id: 'aa-1',
            providers: ['Gestión de Calidad', 'Producción'],
            inputs: ['Informes de no conformidades', 'Análisis de causa raíz', 'Quejas de clientes'],
            activity: 'Implementar acciones correctivas para eliminar las causas de las no conformidades detectadas.',
            outputs: ['Plan de acciones correctivas', 'Registro de tratamiento de no conformidades'],
            clients: ['Todos los procesos de la organización'],
        },
        {
            id: 'aa-2',
            providers: ['Mejora Continua', 'Auditoría Interna'],
            inputs: ['Hallazgos de auditoría', 'Resultados de indicadores', 'Lecciones aprendidas'],
            activity: 'Actualizar procedimientos, instructivos y documentos según hallazgos y oportunidades de mejora.',
            outputs: ['Procedimientos actualizados', 'Plan de mejora continua'],
            clients: ['Gestión Documental', 'Todos los procesos'],
        },
    ],
    resources: ['Personal operativo', 'Maquinaria y equipos', 'Materias primas e insumos', 'Software ERP', 'Herramientas de medición'],
    indicators: [
        { id: 'ind-1', name: 'Eficiencia de producción', formula: '(Unidades producidas / Unidades planeadas) × 100', frequency: 'Mensual', target: '≥ 95%' },
        { id: 'ind-2', name: 'Tasa de defectos', formula: '(Unidades defectuosas / Unidades producidas) × 100', frequency: 'Semanal', target: '≤ 2%' },
        { id: 'ind-3', name: 'Cumplimiento del programa', formula: '(Órdenes completadas a tiempo / Total órdenes) × 100', frequency: 'Mensual', target: '≥ 90%' },
    ],
    documents: ['PR-01-P01 Procedimiento de Producción', 'PR-01-F01 Formato Orden de Producción', 'PR-01-I01 Instructivo de Operación de Maquinaria', 'PR-01-F02 Formato Reporte Diario'],
    risks: ['Falla de maquinaria principal', 'Materia prima defectuosa', 'Accidente laboral en planta', 'Incumplimiento de entregas'],
};

// ==================== DOCUMENTS ====================
export const mockDocuments: Document[] = [
    { id: 'doc-1', tenantId: 'tenant-1', code: 'MC-01', name: 'Manual de Calidad', type: 'MANUAL', status: 'APROBADO', currentVersion: 3, createdBy: 'user-1', createdByName: 'Carlos Administrador', createdAt: new Date('2026-01-10'), updatedAt: new Date('2026-02-01'), fileName: 'manual-de-calidad-v3.pdf', fileSize: 2048000 },
    { id: 'doc-2', tenantId: 'tenant-1', code: 'PO-01', name: 'Política de Calidad', type: 'POLITICA', status: 'APROBADO', currentVersion: 2, createdBy: 'user-1', createdByName: 'Carlos Administrador', createdAt: new Date('2026-01-10'), updatedAt: new Date('2026-01-20'), fileName: 'politica-calidad-v2.pdf', fileSize: 512000 },
    { id: 'doc-3', tenantId: 'tenant-1', code: 'PR-01-P01', name: 'Procedimiento de Producción', type: 'PROCEDIMIENTO', status: 'APROBADO', processId: 'proc-4', processName: 'Producción', currentVersion: 4, createdBy: 'user-3', createdByName: 'Juan Pérez', createdAt: new Date('2026-01-15'), updatedAt: new Date('2026-02-10'), fileName: 'proc-produccion-v4.pdf', fileSize: 1024000 },
    { id: 'doc-4', tenantId: 'tenant-1', code: 'SST-01-P01', name: 'Procedimiento de Identificación de Peligros', type: 'PROCEDIMIENTO', status: 'EN_REVISION', processId: 'proc-8', processName: 'Gestión SST', currentVersion: 1, createdBy: 'user-2', createdByName: 'María López', createdAt: new Date('2026-02-01'), updatedAt: new Date('2026-02-15'), fileName: 'ident-peligros-v1.docx', fileSize: 768000 },
    { id: 'doc-5', tenantId: 'tenant-1', code: 'GC-01-F01', name: 'Formato Acta de Revisión por la Dirección', type: 'FORMATO', status: 'APROBADO', processId: 'proc-3', processName: 'Revisión por la Dirección', currentVersion: 1, createdBy: 'user-1', createdByName: 'Carlos Administrador', createdAt: new Date('2026-01-20'), updatedAt: new Date('2026-01-20'), fileName: 'acta-revision-direccion.xlsx', fileSize: 256000 },
    { id: 'doc-6', tenantId: 'tenant-1', code: 'PR-01-I01', name: 'Instructivo de Operación de Maquinaria', type: 'INSTRUCTIVO', status: 'BORRADOR', processId: 'proc-4', processName: 'Producción', currentVersion: 1, createdBy: 'user-3', createdByName: 'Juan Pérez', createdAt: new Date('2026-02-20'), updatedAt: new Date('2026-02-20'), fileName: 'instructivo-maquinaria-v1.pdf', fileSize: 1536000 },
    { id: 'doc-7', tenantId: 'tenant-1', code: 'GH-01-P01', name: 'Procedimiento de Selección de Personal', type: 'PROCEDIMIENTO', status: 'APROBADO', processId: 'proc-7', processName: 'Gestión Humana', currentVersion: 2, createdBy: 'user-2', createdByName: 'María López', createdAt: new Date('2026-01-25'), updatedAt: new Date('2026-02-05'), fileName: 'seleccion-personal-v2.pdf', fileSize: 890000 },
    { id: 'doc-8', tenantId: 'tenant-1', code: 'PE-01-R01', name: 'Registro de Objetivos Estratégicos', type: 'REGISTRO', status: 'APROBADO', processId: 'proc-1', processName: 'Planeación Estratégica', currentVersion: 1, createdBy: 'user-1', createdByName: 'Carlos Administrador', createdAt: new Date('2026-01-12'), updatedAt: new Date('2026-01-12'), fileName: 'objetivos-estrategicos.xlsx', fileSize: 340000 },
];

// ==================== RISK MATRICES ====================
function getRiskLevel(prob: number, impact: number): RiskLevel {
    const value = prob * impact;
    if (value >= 15) return 'CRITICO';
    if (value >= 9) return 'ALTO';
    if (value >= 4) return 'MEDIO';
    return 'BAJO';
}

export const mockRisks: Risk[] = [
    { id: 'risk-1', tenantId: 'tenant-1', matrixId: 'matrix-1', processId: 'proc-4', processName: 'Producción', description: 'Falla de maquinaria principal', type: 'OPERACIONAL', cause: 'Falta de mantenimiento preventivo', consequence: 'Parada de producción y retrasos en entregas', probability: 3, impact: 5, level: 'CRITICO', riskValue: 15, existingControls: 'Plan de mantenimiento mensual', treatmentPlan: 'Implementar mantenimiento predictivo con sensores IoT', responsible: 'Juan Pérez', dueDate: new Date('2026-06-01'), status: 'EN_PROGRESO' },
    { id: 'risk-2', tenantId: 'tenant-1', matrixId: 'matrix-1', processId: 'proc-5', processName: 'Comercialización', description: 'Pérdida de clientes clave', type: 'OPERACIONAL', cause: 'Servicio al cliente deficiente', consequence: 'Reducción de ingresos en más del 30%', probability: 2, impact: 5, level: 'ALTO', riskValue: 10, existingControls: 'Encuestas de satisfacción trimestrales', treatmentPlan: 'Implementar CRM y programa de fidelización', responsible: 'Juan Pérez', dueDate: new Date('2026-04-01'), status: 'ABIERTA' },
    { id: 'risk-3', tenantId: 'tenant-1', matrixId: 'matrix-2', processId: 'proc-4', processName: 'Producción', description: 'Producto no conforme entregado al cliente', type: 'CALIDAD', cause: 'Inspección de calidad insuficiente', consequence: 'Reclamos y devoluciones', probability: 3, impact: 4, level: 'ALTO', riskValue: 12, existingControls: 'Inspección en proceso', treatmentPlan: 'Implementar control estadístico de procesos', responsible: 'Carlos Administrador', dueDate: new Date('2026-05-01'), status: 'EN_PROGRESO' },
    { id: 'risk-4', tenantId: 'tenant-1', matrixId: 'matrix-2', processId: 'proc-6', processName: 'Logística', description: 'Materia prima fuera de especificación', type: 'CALIDAD', cause: 'Proveedor no calificado', consequence: 'Producto final defectuoso', probability: 2, impact: 4, level: 'ALTO', riskValue: 8, existingControls: 'Inspección de recepción', treatmentPlan: 'Programa de calificación y auditoría a proveedores', responsible: 'Juan Pérez', status: 'ABIERTA' },
    { id: 'risk-5', tenantId: 'tenant-1', matrixId: 'matrix-3', processId: 'proc-4', processName: 'Producción', description: 'Accidente por atrapamiento en maquinaria', type: 'SST', cause: 'Guardas de seguridad en mal estado', consequence: 'Lesión grave del trabajador', probability: 2, impact: 5, level: 'ALTO', riskValue: 10, existingControls: 'EPP obligatorio, señalización', treatmentPlan: 'Reemplazo de guardas y capacitación', responsible: 'María López', dueDate: new Date('2026-03-15'), status: 'EN_PROGRESO' },
    { id: 'risk-6', tenantId: 'tenant-1', matrixId: 'matrix-3', processId: 'proc-7', processName: 'Gestión Humana', description: 'Enfermedad laboral por exposición a ruido', type: 'SST', cause: 'Niveles de ruido superiores a 85 dB', consequence: 'Hipoacusia profesional', probability: 3, impact: 3, level: 'ALTO', riskValue: 9, existingControls: 'Protectores auditivos', treatmentPlan: 'Programa de vigilancia epidemiológica auditiva', responsible: 'María López', dueDate: new Date('2026-04-01'), status: 'ABIERTA' },
    { id: 'risk-7', tenantId: 'tenant-1', matrixId: 'matrix-1', processId: 'proc-9', processName: 'Gestión Financiera', description: 'Fraude interno', type: 'OPERACIONAL', cause: 'Controles financieros débiles', consequence: 'Pérdida económica significativa', probability: 1, impact: 5, level: 'MEDIO', riskValue: 5, existingControls: 'Doble autorización en pagos', treatmentPlan: 'Auditoría interna financiera trimestral', responsible: 'Carlos Administrador', status: 'ABIERTA' },
    { id: 'risk-8', tenantId: 'tenant-1', matrixId: 'matrix-2', processId: 'proc-2', processName: 'Gestión de Calidad', description: 'Documentos desactualizados en uso', type: 'CALIDAD', cause: 'Falta de control de documentos', consequence: 'Uso de procedimientos obsoletos', probability: 2, impact: 3, level: 'MEDIO', riskValue: 6, existingControls: 'Listado maestro de documentos', treatmentPlan: 'Implementar control digital de documentos', responsible: 'Carlos Administrador', status: 'CERRADA' },
];

export const mockRiskMatrices: RiskMatrix[] = [
    { id: 'matrix-1', tenantId: 'tenant-1', name: 'Matriz de Riesgos Operacionales', type: 'OPERACIONAL', description: 'Evaluación de riesgos operacionales por proceso', risks: mockRisks.filter(r => r.type === 'OPERACIONAL'), createdAt: new Date('2026-01-15') },
    { id: 'matrix-2', tenantId: 'tenant-1', name: 'Matriz de Riesgos de Calidad', type: 'CALIDAD', description: 'Evaluación de riesgos de calidad del producto/servicio', risks: mockRisks.filter(r => r.type === 'CALIDAD'), createdAt: new Date('2026-01-15') },
    { id: 'matrix-3', tenantId: 'tenant-1', name: 'Matriz de Riesgos SST', type: 'SST', description: 'Evaluación de riesgos de seguridad y salud en el trabajo', risks: mockRisks.filter(r => r.type === 'SST'), createdAt: new Date('2026-01-15') },
];

// ==================== AUDITS ====================
export const mockAudits: Audit[] = [
    {
        id: 'audit-1', tenantId: 'tenant-1', name: 'Auditoría Interna Q1 2026', type: 'INTERNA', status: 'COMPLETADA',
        leadAuditor: 'user-4', leadAuditorName: 'Ana Rodríguez', processes: ['proc-4', 'proc-5', 'proc-7'],
        scheduledDate: new Date('2026-02-01'), completionDate: new Date('2026-02-05'),
        findings: [
            { id: 'find-1', auditId: 'audit-1', type: 'NC_MENOR', clause: '7.5', processId: 'proc-4', description: 'No se encontró evidencia de control de documentos externos', evidence: 'Se verificaron 5 documentos externos sin registro de recepción', correctiveAction: { id: 'ca-1', findingId: 'find-1', description: 'Crear registro de documentos externos', responsible: 'Juan Pérez', dueDate: new Date('2026-03-01'), status: 'CERRADA', closedDate: new Date('2026-02-20') } },
            { id: 'find-2', auditId: 'audit-1', type: 'OBSERVACION', clause: '8.1', processId: 'proc-5', description: 'Oportunidad de mejorar la trazabilidad de pedidos', evidence: 'Sistema actual no permite seguimiento en tiempo real', correctiveAction: undefined },
            { id: 'find-3', auditId: 'audit-1', type: 'OPORTUNIDAD_MEJORA', clause: '9.1', processId: 'proc-7', description: 'Implementar evaluación de desempeño por competencias', evidence: 'Evaluaciones actuales son genéricas', correctiveAction: { id: 'ca-2', findingId: 'find-3', description: 'Diseñar formato de evaluación por competencias', responsible: 'María López', dueDate: new Date('2026-04-01'), status: 'EN_PROGRESO' } },
        ]
    },
    {
        id: 'audit-2', tenantId: 'tenant-1', name: 'Auditoría Interna Q2 2026', type: 'INTERNA', status: 'PROGRAMADA',
        leadAuditor: 'user-4', leadAuditorName: 'Ana Rodríguez', processes: ['proc-1', 'proc-2', 'proc-8', 'proc-9'],
        scheduledDate: new Date('2026-05-01'), findings: []
    },
    {
        id: 'audit-3', tenantId: 'tenant-1', name: 'Auditoría Externa de Certificación', type: 'EXTERNA', status: 'PROGRAMADA',
        leadAuditor: 'user-5', leadAuditorName: 'Pedro Externo', processes: ['proc-1', 'proc-2', 'proc-3', 'proc-4', 'proc-5', 'proc-6', 'proc-7', 'proc-8', 'proc-9'],
        scheduledDate: new Date('2026-07-15'), findings: []
    },
];

// ==================== DASHBOARD STATS ====================
export const mockDashboardStats: DashboardStats = {
    totalProcesses: mockProcesses.length,
    totalDocuments: mockDocuments.length,
    totalRisks: mockRisks.length,
    criticalRisks: mockRisks.filter(r => r.level === 'CRITICO').length,
    openFindings: mockAudits.flatMap(a => a.findings).filter(f => !f.correctiveAction || f.correctiveAction.status !== 'CERRADA').length,
    upcomingAudits: mockAudits.filter(a => a.status === 'PROGRAMADA').length,
    documentsPendingApproval: mockDocuments.filter(d => d.status === 'EN_REVISION').length,
    overdueActions: 0,
};

// ==================== CONTEXTO ORGANIZACIONAL (Clause 4) ====================
export const mockDOFAItems: DOFAItem[] = [
    // Fortalezas
    { id: 'dofa-1', tenantId: 'tenant-1', category: 'FORTALEZA', description: 'Personal altamente capacitado con experiencia en el sector', impact: 'Permite ejecutar proyectos complejos y mantener estándares de calidad', actions: 'Mantener programa de formación continua', responsible: 'María López', createdAt: new Date('2026-01-15') },
    { id: 'dofa-2', tenantId: 'tenant-1', category: 'FORTALEZA', description: 'Infraestructura tecnológica moderna y actualizada', impact: 'Mejora productividad y capacidad de respuesta', actions: 'Plan de renovación tecnológica anual', responsible: 'Carlos Administrador', createdAt: new Date('2026-01-15') },
    { id: 'dofa-3', tenantId: 'tenant-1', category: 'FORTALEZA', description: 'Reconocimiento de marca en el mercado local', impact: 'Facilita la captación de nuevos clientes', actions: 'Fortalecer presencia digital', responsible: 'Juan Pérez', createdAt: new Date('2026-01-15') },
    // Oportunidades
    { id: 'dofa-4', tenantId: 'tenant-1', category: 'OPORTUNIDAD', description: 'Crecimiento del mercado de productos certificados ISO', impact: 'Posibilidad de expandir la base de clientes un 40%', actions: 'Obtener certificación ISO 9001:2015', responsible: 'Carlos Administrador', createdAt: new Date('2026-01-15') },
    { id: 'dofa-5', tenantId: 'tenant-1', category: 'OPORTUNIDAD', description: 'Alianzas estratégicas con proveedores internacionales', impact: 'Acceso a materias primas de mejor calidad y precio', actions: 'Participar en ferias internacionales', responsible: 'Juan Pérez', createdAt: new Date('2026-01-15') },
    { id: 'dofa-6', tenantId: 'tenant-1', category: 'OPORTUNIDAD', description: 'Digitalización de procesos operativos', impact: 'Reducción de costos operativos hasta en un 25%', actions: 'Implementar ERP y automatización', responsible: 'Carlos Administrador', createdAt: new Date('2026-01-15') },
    // Debilidades
    { id: 'dofa-7', tenantId: 'tenant-1', category: 'DEBILIDAD', description: 'Sistema de gestión documental manual e ineficiente', impact: 'Riesgo de uso de documentos obsoletos, ineficiencia operativa', actions: 'Implementar SGC digital (este sistema)', responsible: 'Carlos Administrador', createdAt: new Date('2026-01-15') },
    { id: 'dofa-8', tenantId: 'tenant-1', category: 'DEBILIDAD', description: 'Alta rotación de personal operativo', impact: 'Pérdida de conocimiento y aumento en costos de capacitación', actions: 'Mejorar programa de bienestar y compensación', responsible: 'María López', createdAt: new Date('2026-01-15') },
    { id: 'dofa-9', tenantId: 'tenant-1', category: 'DEBILIDAD', description: 'Falta de indicadores de gestión formalizados', impact: 'Dificultad para medir el desempeño y tomar decisiones basadas en datos', actions: 'Definir KPIs por proceso', responsible: 'Carlos Administrador', createdAt: new Date('2026-01-15') },
    // Amenazas
    { id: 'dofa-10', tenantId: 'tenant-1', category: 'AMENAZA', description: 'Incremento en la competencia con empresas certificadas', impact: 'Pérdida de market share y reducción de márgenes', actions: 'Diferenciación por calidad y servicio', responsible: 'Juan Pérez', createdAt: new Date('2026-01-15') },
    { id: 'dofa-11', tenantId: 'tenant-1', category: 'AMENAZA', description: 'Cambios regulatorios frecuentes en normatividad ambiental', impact: 'Necesidad de inversión en adecuaciones y posibles sanciones', actions: 'Monitoreo continuo de cambios normativos', responsible: 'María López', createdAt: new Date('2026-01-15') },
    { id: 'dofa-12', tenantId: 'tenant-1', category: 'AMENAZA', description: 'Volatilidad en precios de materias primas importadas', impact: 'Afectación de márgenes y costos de producción', actions: 'Diversificar proveedores y contratos a largo plazo', responsible: 'Carlos Administrador', createdAt: new Date('2026-01-15') },
];

export const mockStakeholders: Stakeholder[] = [
    { id: 'sh-1', tenantId: 'tenant-1', name: 'Clientes', type: 'EXTERNO', needs: 'Productos que cumplan especificaciones técnicas', expectations: 'Entregas oportunas, precios competitivos, atención posventa', influence: 'ALTA', strategy: 'Encuestas de satisfacción, gestión de quejas y reclamos', contactInfo: 'Área Comercial' },
    { id: 'sh-2', tenantId: 'tenant-1', name: 'Empleados', type: 'INTERNO', needs: 'Condiciones laborales seguras y adecuadas', expectations: 'Estabilidad laboral, desarrollo profesional, buen clima organizacional', influence: 'ALTA', strategy: 'Programa de bienestar, plan de carrera, evaluaciones de desempeño' },
    { id: 'sh-3', tenantId: 'tenant-1', name: 'Proveedores', type: 'EXTERNO', needs: 'Relaciones comerciales a largo plazo', expectations: 'Pagos oportunos, volúmenes estables, comunicación clara', influence: 'MEDIA', strategy: 'Evaluación y desarrollo de proveedores, contratos marco', contactInfo: 'Área de Compras' },
    { id: 'sh-4', tenantId: 'tenant-1', name: 'Accionistas / Socios', type: 'INTERNO', needs: 'Rentabilidad y crecimiento sostenible', expectations: 'Retorno de inversión, transparencia en gestión, cumplimiento legal', influence: 'ALTA', strategy: 'Informes financieros mensuales, comité directivo trimestral' },
    { id: 'sh-5', tenantId: 'tenant-1', name: 'Entidades Reguladoras', type: 'EXTERNO', needs: 'Cumplimiento normativo', expectations: 'Documentación actualizada, reportes oportunos, conformidad legal', influence: 'ALTA', strategy: 'Matriz de requisitos legales, auditorías de cumplimiento', contactInfo: 'SIC, MinTrabajo, DIAN' },
    { id: 'sh-6', tenantId: 'tenant-1', name: 'Comunidad Local', type: 'EXTERNO', needs: 'Gestión responsable del impacto ambiental y social', expectations: 'Empleo local, responsabilidad ambiental, apoyo comunitario', influence: 'BAJA', strategy: 'Programas de RSE, gestión ambiental' },
    { id: 'sh-7', tenantId: 'tenant-1', name: 'Ente Certificador', type: 'EXTERNO', needs: 'Cumplimiento de requisitos ISO 9001:2015', expectations: 'Evidencia objetiva de conformidad, mejora continua', influence: 'MEDIA', strategy: 'Auditorías internas, revisión por la dirección', contactInfo: 'ICONTEC / Bureau Veritas' },
    { id: 'sh-8', tenantId: 'tenant-1', name: 'Alta Dirección', type: 'INTERNO', needs: 'Información para toma de decisiones', expectations: 'Indicadores confiables, sistema de gestión eficaz', influence: 'ALTA', strategy: 'Tableros de control, revisión por la dirección' },
];

export const mockSGCScope: SGCScope = {
    id: 'scope-1',
    tenantId: 'tenant-1',
    scopeStatement: 'El Sistema de Gestión de Calidad de Empresa Demo S.A.S. aplica a los procesos de diseño, producción, comercialización y distribución de productos manufacturados, abarcando desde la recepción de materias primas hasta la entrega al cliente final, incluyendo el servicio posventa.',
    applicableStandards: [
        'ISO 9001:2015 — Sistemas de gestión de la calidad',
        'ISO 14001:2015 — Sistemas de gestión ambiental',
        'ISO 45001:2018 — Seguridad y salud en el trabajo',
    ],
    exclusions: [
        { clause: '8.3', justification: 'No se realizan actividades de diseño y desarrollo propias. Los productos se fabrican según especificaciones del cliente o diseños proporcionados por terceros.' },
    ],
    sites: [
        { name: 'Sede Principal', address: 'Calle 80 #45-30, Bogotá D.C.', activities: 'Administración, comercialización, dirección estratégica' },
        { name: 'Planta de Producción', address: 'Km 5 Vía Siberia, Cota, Cundinamarca', activities: 'Producción, almacenamiento, control de calidad, logística' },
    ],
    processes: ['proc-1', 'proc-2', 'proc-3', 'proc-4', 'proc-5', 'proc-6', 'proc-7', 'proc-8', 'proc-9'],
    lastReviewDate: new Date('2026-01-30'),
    approvedBy: 'Carlos Administrador',
};
