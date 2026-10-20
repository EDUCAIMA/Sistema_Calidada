/* CommonJS is required by the project's TypeScript test loader. */
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  leadershipCommitmentSchema, responsibilityAssignmentSchema, responsibilityCommunicationSchema,
  responsibilityMatrixApprovalSchema, assignmentContentChanged, evaluateResponsibilityMatrix,
} = require('../src/lib/leadership.ts');

const commitment = { category: 'RECURSOS', title: 'Asignar recursos', description: 'Revisar y aprobar presupuesto para el SGC.', responsibleId: 'persona', dueDate: '2026-12-31', status: 'ABIERTA' };
const assignment = { processId: 'proceso', title: 'Responsable de calidad', department: 'Calidad', assignedToId: 'persona', reportsTo: 'Gerencia', responsibilities: 'Informar los resultados del sistema.', authorities: 'Solicitar acciones a los responsables.', raciRoles: ['RESPONSABLE', 'APRUEBA'], sgcDuties: ['INFORMAR_DESEMPENO'], active: true };

test('el cierre de un compromiso necesita evidencia y evaluación', () => {
  assert.equal(leadershipCommitmentSchema.safeParse(commitment).success, true);
  assert.equal(leadershipCommitmentSchema.safeParse({ ...commitment, status: 'CERRADA' }).success, false);
  assert.equal(leadershipCommitmentSchema.safeParse({ ...commitment, status: 'CERRADA', evidence: 'Acta de aprobación número 15.', result: 'Los recursos aprobados cubren la necesidad identificada.' }).success, true);
});

test('el enfoque al cliente exige requisitos, riesgos y satisfacción', () => {
  assert.equal(leadershipCommitmentSchema.safeParse({ ...commitment, category: 'CLIENTE' }).success, false);
  assert.equal(leadershipCommitmentSchema.safeParse({ ...commitment, category: 'CLIENTE', customerRequirements: 'Requisitos contractuales y legales identificados.', customerRisks: 'Riesgos de entrega e incumplimiento identificados.', customerSatisfaction: 'Encuesta mensual y análisis de reclamaciones.' }).success, true);
});

test('rechaza fechas inexistentes y categorías arbitrarias', () => {
  assert.equal(leadershipCommitmentSchema.safeParse({ ...commitment, dueDate: '2026-02-30' }).success, false);
  assert.equal(leadershipCommitmentSchema.safeParse({ ...commitment, category: 'CUALQUIERA' }).success, false);
});

test('la comunicación de roles exige evidencia y fecha real no futura', () => {
  assert.equal(responsibilityAssignmentSchema.safeParse(assignment).success, true);
  const communication = { tenantId: 'empresa', id: 'fila', expectedUpdatedAt: new Date().toISOString(), action: 'COMMUNICATE', communicatedAt: '2020-05-10', communicationMethod: 'Reunión', communicationAudience: 'Titular del cargo', communicationEvidence: 'Acta de socialización número 3.' };
  assert.equal(responsibilityCommunicationSchema.safeParse(communication).success, true);
  assert.equal(responsibilityCommunicationSchema.safeParse({ ...communication, communicatedAt: '2099-01-01' }).success, false);
  assert.equal(responsibilityCommunicationSchema.safeParse({ ...communication, communicationEvidence: '  ' }).success, false);
});

test('rechaza responsabilidades vacías y evita deberes SGC duplicados', () => {
  assert.equal(responsibilityAssignmentSchema.safeParse({ ...assignment, authorities: '  ' }).success, false);
  assert.deepEqual(responsibilityAssignmentSchema.parse({ ...assignment, sgcDuties: ['CONFORMIDAD', 'CONFORMIDAD'] }).sgcDuties, ['CONFORMIDAD']);
});

test('los cambios de titular o autoridad requieren nueva comunicación y el orden de deberes no altera el contenido', () => {
  const parsed = responsibilityAssignmentSchema.parse(assignment);
  assert.equal(assignmentContentChanged(parsed, { ...parsed, assignedToId: 'otra-persona' }), true);
  assert.equal(assignmentContentChanged(parsed, { ...parsed, authorities: 'Nueva autoridad de aprobación de presupuestos.' }), true);
  assert.equal(assignmentContentChanged({ ...parsed, sgcDuties: ['CONFORMIDAD', 'INFORMAR_DESEMPENO'] }, { ...parsed, sgcDuties: ['INFORMAR_DESEMPENO', 'CONFORMIDAD'] }), false);
});

test('la cobertura exige los cinco deberes y R/A para cada proceso activo', () => {
  const complete = [{
    id: 'fila-1', active: true, processId: 'p1', assignedToId: 'u1', title: 'Responsable de calidad',
    department: 'Calidad', reportsTo: 'Gerencia', responsibilities: 'Asegurar los resultados previstos del proceso.',
    authorities: 'Aprobar controles y solicitar acciones correctivas.', raciRoles: ['RESPONSABLE', 'APRUEBA'],
    sgcDuties: ['CONFORMIDAD', 'SALIDAS_PROCESOS', 'INFORMAR_DESEMPENO', 'ENFOQUE_CLIENTE', 'INTEGRIDAD_CAMBIOS'],
    communicatedAt: null, communicationMethod: null, communicationAudience: null, communicationEvidence: null,
    acknowledgedAt: null, acknowledgedById: null, understandingEvidence: null,
  }];
  const processes = [{ id: 'p1', responsibleId: 'u1' }];
  const draft = evaluateResponsibilityMatrix(complete, processes, ['u1'], 'BORRADOR');
  assert.equal(draft.structuralReady, true);
  assert.equal(draft.implementationStatus, 'BORRADOR');
  const live = evaluateResponsibilityMatrix(complete, processes, ['u1'], 'VIGENTE');
  assert.equal(live.implementationStatus, 'PENDIENTE_COMUNICACION');
  const communication = { communicatedAt: new Date(), communicationMethod: 'Reunión', communicationAudience: 'Titular del cargo', communicationEvidence: 'Acta verificable 01' };
  const communicated = evaluateResponsibilityMatrix([{ ...complete[0], ...communication }], processes, ['u1'], 'VIGENTE');
  assert.equal(communicated.implementationStatus, 'PENDIENTE_COMPRENSION');
  const implemented = evaluateResponsibilityMatrix([{
    ...complete[0], ...communication, acknowledgedAt: new Date(), acknowledgedById: 'u1',
    understandingEvidence: 'Confirmación verificable del titular.',
  }], processes, ['u1'], 'VIGENTE');
  assert.equal(implemented.implementationStatus, 'IMPLEMENTADA');
});

test('la cobertura ignora archivados y detecta procesos, deberes o titulares faltantes', () => {
  const result = evaluateResponsibilityMatrix([
    { id: 'archivada', active: false, processId: 'p2', assignedToId: 'u2', raciRoles: ['RESPONSABLE', 'APRUEBA'], sgcDuties: Object.keys(require('../src/lib/leadership.ts').SGC_DUTIES) },
    {
      id: 'activa', active: true, processId: 'p1', assignedToId: 'inactivo', title: 'Responsable del proceso',
      department: 'Calidad', reportsTo: 'Gerencia', responsibilities: 'Asegurar las actividades del proceso.',
      authorities: 'Solicitar acciones y aprobar controles.', raciRoles: ['RESPONSABLE'], sgcDuties: ['CONFORMIDAD'],
    },
  ], [{ id: 'p1', responsibleId: 'inactivo' }, { id: 'p2', responsibleId: 'u2' }], ['u1'], 'VIGENTE');
  assert.equal(result.structuralReady, false);
  assert.deepEqual(result.missingAccountableProcessIds.sort(), ['p1', 'p2']);
  assert.deepEqual(result.missingResponsibleProcessIds.sort(), ['p1', 'p2']);
  assert.deepEqual(result.inactiveAssigneeIds, ['inactivo']);
  assert.ok(result.missingDuties.includes('ENFOQUE_CLIENTE'));
  assert.equal(result.implementationStatus, 'REQUIERE_REVISION');
});

test('los deberes 5.3 solo cuentan cuando la fila tiene responsabilidad o autoridad', () => {
  const informed = {
    id: 'fila-informada', active: true, processId: 'p1', assignedToId: 'u1', title: 'Analista informado',
    department: 'Calidad', reportsTo: 'Gerencia', responsibilities: 'Recibir y conservar la información del sistema.',
    authorities: 'Solicitar aclaraciones sobre la información recibida.', raciRoles: ['CONSULTADO', 'INFORMADO'],
    sgcDuties: ['CONFORMIDAD', 'SALIDAS_PROCESOS', 'INFORMAR_DESEMPENO', 'ENFOQUE_CLIENTE', 'INTEGRIDAD_CAMBIOS'],
  };
  const result = evaluateResponsibilityMatrix([informed], [{ id: 'p1', responsibleId: 'u1' }], ['u1']);
  assert.equal(result.structuralReady, false);
  assert.equal(result.missingDuties.length, 5);
  assert.deepEqual(result.missingResponsibleProcessIds, ['p1']);
  assert.deepEqual(result.missingAccountableProcessIds, ['p1']);
});

test('la cobertura detecta un R desactualizado, procesos inválidos y contenido incompleto', () => {
  const base = {
    active: true, assignedToId: 'u1', title: 'Responsable de calidad', department: 'Calidad', reportsTo: 'Gerencia',
    responsibilities: 'Asegurar las actividades y resultados previstos.', authorities: 'Aprobar controles y solicitar acciones.',
    raciRoles: ['RESPONSABLE', 'APRUEBA'], sgcDuties: ['CONFORMIDAD'],
  };
  const result = evaluateResponsibilityMatrix([
    { ...base, id: 'r-obsoleto', processId: 'p1' },
    { ...base, id: 'sin-proceso', processId: null },
    { ...base, id: 'incompleta', processId: 'p1', authorities: '  ' },
  ], [{ id: 'p1', responsibleId: 'u2' }], ['u1', 'u2']);
  assert.equal(result.structuralReady, false);
  assert.deepEqual(result.invalidProcessAssignmentIds, ['sin-proceso']);
  assert.deepEqual(result.incompleteAssignmentIds, ['incompleta']);
  assert.deepEqual(result.staleResponsibleAssignmentIds.sort(), ['incompleta', 'r-obsoleto']);
  assert.deepEqual(result.missingResponsibleProcessIds, ['p1']);
});

test('la aprobación exige fundamento y una revisión futura', () => {
  const future = new Date(); future.setFullYear(future.getFullYear() + 1);
  const input = { tenantId: 'empresa', matrixId: 'matriz', expectedUpdatedAt: new Date().toISOString(), action: 'APPROVE_MATRIX', approvalNote: 'La alta dirección verificó la cobertura completa.', nextReviewAt: future.toISOString().slice(0, 10) };
  assert.equal(responsibilityMatrixApprovalSchema.safeParse(input).success, true);
  assert.equal(responsibilityMatrixApprovalSchema.safeParse({ ...input, approvalNote: 'breve' }).success, false);
  assert.equal(responsibilityMatrixApprovalSchema.safeParse({ ...input, nextReviewAt: '2020-01-01' }).success, false);
});
