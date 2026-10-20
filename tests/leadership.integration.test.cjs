/* CommonJS is required by the project's TypeScript test loader. */
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { configured, prisma, fixture, invoke } = require('./integration-fixture.cjs');
const commitments = require('../src/app/api/liderazgo/compromisos/route.ts');
const roles = require('../src/app/api/liderazgo/roles/route.ts');

after(async () => { await prisma.$disconnect(); });
const options = { skip: !configured };
const commitmentBody = f => ({ tenantId: f.tenant.id, category: 'RECURSOS', title: 'Recursos del sistema', description: 'Aprobar recursos para la ejecución del sistema de calidad.', responsibleId: f.member.id, dueDate: '2027-12-31', status: 'ABIERTA', evidence: '', result: '' });
const roleBody = f => ({ tenantId: f.tenant.id, processId: f.process.id, title: 'Responsable de calidad', department: 'Calidad', assignedToId: f.member.id, reportsTo: 'Gerencia', responsibilities: 'Informar los resultados del sistema de gestión.', authorities: 'Solicitar planes de acción y aprobar controles del proceso.', raciRoles: ['RESPONSABLE', 'APRUEBA'], sgcDuties: ['CONFORMIDAD', 'SALIDAS_PROCESOS', 'INFORMAR_DESEMPENO', 'ENFOQUE_CLIENTE', 'INTEGRIDAD_CAMBIOS'], active: true });
const futureDate = () => { const date = new Date(); date.setFullYear(date.getFullYear() + 1); return date.toISOString().slice(0, 10); };

test('liderazgo: sesión, empresa y perfiles son verificados en el servidor', options, async () => {
  const f = await fixture('leadership-access');
  for (const route of [commitments, roles]) {
    assert.equal((await invoke(route, 'GET', { query: { tenantId: f.tenant.id } })).status, 401);
    assert.equal((await invoke(route, 'GET', { actor: f.outsider, query: { tenantId: f.tenant.id } })).status, 403);
    assert.equal((await invoke(route, 'GET', { actor: f.auditor, query: { tenantId: f.tenant.id } })).status, 200);
    assert.equal((await invoke(route, 'POST', { actor: f.admin, body: null })).status, 400);
  }
  assert.equal((await invoke(roles, 'POST', { actor: f.member, body: roleBody(f) })).status, 403);
  assert.equal((await invoke(roles, 'POST', { actor: f.auditor, body: roleBody(f) })).status, 403);
  assert.equal((await invoke(commitments, 'POST', { actor: f.auditor, body: commitmentBody(f) })).status, 403);
  assert.equal((await invoke(commitments, 'POST', { actor: f.outsider, body: commitmentBody(f) })).status, 403);
  await prisma.tenant.update({ where: { id: f.tenant.id }, data: { active: false } });
  assert.equal((await invoke(commitments, 'GET', { actor: f.member, query: { tenantId: f.tenant.id } })).status, 401);
});

test('liderazgo: no permite asignar responsables ajenos o inactivos', options, async () => {
  const f = await fixture('leadership-assignees');
  assert.equal((await invoke(commitments, 'POST', { actor: f.admin, body: { ...commitmentBody(f), responsibleId: f.outsider.id } })).status, 400);
  assert.equal((await invoke(roles, 'POST', { actor: f.admin, body: { ...roleBody(f), assignedToId: f.outsider.id } })).status, 400);
  await prisma.user.update({ where: { id: f.member.id }, data: { active: false } });
  assert.equal((await invoke(commitments, 'POST', { actor: f.admin, body: commitmentBody(f) })).status, 400);
  assert.equal((await invoke(roles, 'POST', { actor: f.admin, body: roleBody(f) })).status, 400);
});

test('roles: versión, aprobación, comunicación y comprensión conservan la trazabilidad', options, async () => {
  const f = await fixture('leadership-role-cycle');
  const input = roleBody(f);
  const created = await invoke(roles, 'POST', { actor: f.admin, body: { ...input, createdById: f.outsider.id, assignedToName: 'Identidad falsa' } });
  assert.equal(created.status, 201);
  assert.equal(created.body.createdById, f.admin.id);
  assert.equal(created.body.assignedToName, f.member.name);
  const ack = record => ({ tenantId: f.tenant.id, id: record.id, expectedUpdatedAt: record.updatedAt, action: 'ACKNOWLEDGE' });
  assert.equal((await invoke(roles, 'PATCH', { actor: f.member, body: ack(created.body) })).status, 400);
  assert.equal((await invoke(roles, 'PATCH', { actor: f.member, body: { ...input, id: created.body.id, expectedUpdatedAt: created.body.updatedAt } })).status, 403);
  let listed = await invoke(roles, 'GET', { actor: f.auditor, query: { tenantId: f.tenant.id } });
  assert.equal(listed.body.coverage.structuralReady, true);
  const matrix = listed.body.matrix;
  const submitted = await invoke(roles, 'PATCH', { actor: f.admin, body: { tenantId: f.tenant.id, matrixId: matrix.id, expectedUpdatedAt: matrix.updatedAt, action: 'SUBMIT_MATRIX', note: '' } });
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.status, 'EN_REVISION');
  const ordinaryAdmin = await prisma.user.create({ data: { tenantId: f.tenant.id, email: 'ordinary-' + f.tenant.id + '@example.test', name: 'Administrador operativo', role: 'ADMIN_EMPRESA', topManagement: false } });
  const director = await prisma.user.create({ data: { tenantId: f.tenant.id, email: 'director-' + f.tenant.id + '@example.test', name: 'Directora del sistema', role: 'USUARIO', topManagement: true } });
  const rejectedApproval = { tenantId: f.tenant.id, matrixId: matrix.id, expectedUpdatedAt: submitted.body.updatedAt, action: 'APPROVE_MATRIX', approvalNote: 'La alta dirección revisó responsabilidades, autoridades y cobertura.', nextReviewAt: futureDate() };
  assert.equal((await invoke(roles, 'PATCH', { actor: ordinaryAdmin, body: rejectedApproval })).status, 403);
  const returned = await invoke(roles, 'PATCH', { actor: director, body: { tenantId: f.tenant.id, matrixId: matrix.id, expectedUpdatedAt: submitted.body.updatedAt, action: 'RETURN_TO_DRAFT', note: 'Ajustar la descripción de autoridad antes de aprobar.' } });
  assert.equal(returned.status, 200);
  assert.equal(returned.body.status, 'BORRADOR');
  const resubmitted = await invoke(roles, 'PATCH', { actor: f.admin, body: { tenantId: f.tenant.id, matrixId: matrix.id, expectedUpdatedAt: returned.body.updatedAt, action: 'SUBMIT_MATRIX', note: '' } });
  assert.equal(resubmitted.status, 200);
  const approvalBody = { ...rejectedApproval, expectedUpdatedAt: resubmitted.body.updatedAt };
  const approved = await invoke(roles, 'PATCH', { actor: director, body: approvalBody });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.status, 'VIGENTE');
  assert.equal(approved.body.approvedById, director.id);
  assert.equal((await invoke(roles, 'PATCH', { actor: f.admin, body: { ...input, id: created.body.id, expectedUpdatedAt: created.body.updatedAt } })).status, 409);
  const communication = { tenantId: f.tenant.id, id: created.body.id, expectedUpdatedAt: created.body.updatedAt, action: 'COMMUNICATE', communicatedAt: approved.body.effectiveAt.slice(0, 10), communicationMethod: 'Reunión individual', communicationAudience: f.member.name, communicationEvidence: 'Acta de comunicación del cargo número 2, archivo de calidad.' };
  assert.equal((await invoke(roles, 'PATCH', { actor: f.admin, body: { ...communication, communicatedAt: '2020-01-01' } })).status, 400);
  const communicated = await invoke(roles, 'PATCH', { actor: f.admin, body: communication });
  assert.equal(communicated.status, 200);
  assert.equal((await invoke(roles, 'PATCH', { actor: f.admin, body: ack(communicated.body) })).status, 403);
  await prisma.user.update({ where: { id: f.member.id }, data: { role: 'AUDITOR_INTERNO' } });
  const confirmed = await invoke(roles, 'PATCH', { actor: f.member, body: ack(communicated.body) });
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.body.acknowledgedById, f.member.id);
  assert.ok(confirmed.body.acknowledgedAt);
  assert.equal((await invoke(roles, 'PATCH', { actor: f.member, body: ack(confirmed.body) })).status, 409);
  listed = await invoke(roles, 'GET', { actor: f.auditor, query: { tenantId: f.tenant.id } });
  assert.equal(listed.body.coverage.implementationStatus, 'IMPLEMENTADA');
  const revision = await invoke(roles, 'PATCH', { actor: f.admin, body: { tenantId: f.tenant.id, matrixId: approved.body.id, expectedUpdatedAt: approved.body.updatedAt, action: 'CREATE_REVISION', note: '' } });
  assert.equal(revision.status, 201);
  assert.equal(revision.body.version, 2);
  const adminDefault = await invoke(roles, 'GET', { actor: f.admin, query: { tenantId: f.tenant.id } });
  const commonDefault = await invoke(roles, 'GET', { actor: f.member, query: { tenantId: f.tenant.id } });
  assert.equal(adminDefault.body.matrix.id, revision.body.id);
  assert.equal(commonDefault.body.matrix.id, approved.body.id);
  const draft = await invoke(roles, 'GET', { actor: f.admin, query: { tenantId: f.tenant.id, matrixId: revision.body.id } });
  const copied = draft.body.records[0];
  assert.equal(copied.communicatedAt, null);
  assert.equal(copied.acknowledgedAt, null);
  const changedInput = { ...input, matrixId: revision.body.id, authorities: 'Aprobar presupuestos de formación y solicitar acciones correctivas.' };
  const changed = await invoke(roles, 'PATCH', { actor: f.admin, body: { ...changedInput, id: copied.id, expectedUpdatedAt: copied.updatedAt } });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.acknowledgedAt, null);
  assert.equal(changed.body.communicatedAt, null);
  assert.equal(changed.body.communicationEvidence, null);
  assert.equal((await invoke(roles, 'PATCH', { actor: f.member, body: ack(changed.body) })).status, 400);
  const archived = await invoke(roles, 'PATCH', { actor: f.admin, body: { ...changedInput, active: false, id: copied.id, expectedUpdatedAt: changed.body.updatedAt } });
  assert.equal(archived.status, 200);
  assert.equal(archived.body.active, false);
  listed = await invoke(roles, 'GET', { actor: f.auditor, query: { tenantId: f.tenant.id, matrixId: approved.body.id } });
  const confirmation = listed.body.events.find(event => event.action === 'COMPRENSION_CONFIRMADA' && event.recordId === created.body.id);
  assert.equal(confirmation.snapshot.authorities, input.authorities);
  assert.equal(confirmation.snapshot.acknowledgedById, f.member.id);
  assert.ok(listed.body.events.some(event => event.action === 'ARCHIVADO'));
  assert.ok(listed.body.events.some(event => event.action === 'MATRIZ_APROBADA'));
  assert.ok(listed.body.users.every(user => user.id !== f.outsider.id));
});

test('roles: un superadministrador externo puede enviar la matriz sin violar el aislamiento', options, async () => {
  const f = await fixture('leadership-cross-tenant-submit');
  const superAdmin = await prisma.user.create({ data: {
    tenantId: f.otherTenant.id,
    email: `super-${f.otherTenant.id}@example.test`,
    name: 'Administración global',
    role: 'SUPER_ADMIN',
  } });
  assert.equal((await invoke(roles, 'POST', { actor: f.admin, body: roleBody(f) })).status, 201);
  const listed = await invoke(roles, 'GET', { actor: superAdmin, query: { tenantId: f.tenant.id } });
  assert.equal(listed.status, 200);
  assert.equal(listed.body.coverage.structuralReady, true);

  const submitted = await invoke(roles, 'PATCH', { actor: superAdmin, body: {
    tenantId: f.tenant.id,
    matrixId: listed.body.matrix.id,
    expectedUpdatedAt: listed.body.matrix.updatedAt,
    action: 'SUBMIT_MATRIX',
    note: '',
  } });

  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.status, 'EN_REVISION');
  assert.equal(submitted.body.submittedById, null);
  assert.equal(submitted.body.submittedByName, superAdmin.name);
  const event = await prisma.leadershipRecordEvent.findFirstOrThrow({
    where: { tenantId: f.tenant.id, recordId: listed.body.matrix.id, action: 'ENVIADA_REVISION' },
  });
  assert.equal(event.userId, superAdmin.id);
  assert.equal(event.userName, superAdmin.name);
});

test('roles: edición y envío concurrentes no alteran una versión ya enviada', options, async () => {
  const f = await fixture('leadership-role-transition-race');
  const input = roleBody(f);
  const created = await invoke(roles, 'POST', { actor: f.admin, body: input });
  assert.equal(created.status, 201);
  const listed = await invoke(roles, 'GET', { actor: f.admin, query: { tenantId: f.tenant.id } });
  const matrix = listed.body.matrix;
  const [submitted, edited] = await Promise.all([
    invoke(roles, 'PATCH', { actor: f.admin, body: { tenantId: f.tenant.id, matrixId: matrix.id, expectedUpdatedAt: matrix.updatedAt, action: 'SUBMIT_MATRIX', note: '' } }),
    invoke(roles, 'PATCH', { actor: f.admin, body: { ...input, authorities: 'Aprobar controles actualizados y solicitar planes de acción.', id: created.body.id, expectedUpdatedAt: created.body.updatedAt } }),
  ]);
  assert.deepEqual([submitted.status, edited.status].sort(), [200, 409]);
});

test('roles: dos asignaciones iniciales idénticas no se crean en paralelo', options, async () => {
  const f = await fixture('leadership-role-duplicate-race');
  const results = await Promise.all([
    invoke(roles, 'POST', { actor: f.admin, body: roleBody(f) }),
    invoke(roles, 'POST', { actor: f.admin, body: roleBody(f) }),
  ]);
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
});

test('compromisos: evidencia de cierre, enfoque al cliente e identidad auditada', options, async () => {
  const f = await fixture('leadership-commitment-cycle');
  const input = commitmentBody(f);
  assert.equal((await invoke(commitments, 'POST', { actor: f.member, body: { ...input, status: 'CERRADA', evidence: 'Acta de ejecución y verificación.', result: 'Se completaron las acciones previstas.' } })).status, 400);
  assert.equal((await invoke(commitments, 'POST', { actor: f.member, body: { ...input, category: 'CLIENTE' } })).status, 400);
  const created = await invoke(commitments, 'POST', { actor: f.member, body: { ...input, createdById: f.outsider.id, responsibleName: 'Suplantado' } });
  assert.equal(created.status, 201);
  assert.equal(created.body.createdById, f.member.id);
  assert.equal(created.body.responsibleName, f.member.name);
  const patch = { ...input, id: created.body.id, expectedUpdatedAt: created.body.updatedAt, status: 'CERRADA' };
  assert.equal((await invoke(commitments, 'PATCH', { actor: f.member, body: patch })).status, 400);
  assert.equal((await invoke(commitments, 'PATCH', { actor: f.auditor, body: patch })).status, 403);
  const closed = await invoke(commitments, 'PATCH', { actor: f.member, body: { ...patch, evidence: 'Acta 15 y presupuesto aprobado en archivo de calidad.', result: 'Recursos asignados y ejecución verificada contra el plan.' } });
  assert.equal(closed.status, 200);
  assert.equal(closed.body.status, 'CERRADA');
  const stale = await invoke(commitments, 'PATCH', { actor: f.member, body: { ...input, id: created.body.id, expectedUpdatedAt: created.body.updatedAt } });
  assert.equal(stale.status, 409);
  const foreignId = await invoke(commitments, 'PATCH', { actor: f.outsider, body: { ...input, tenantId: f.otherTenant.id, responsibleId: f.outsider.id, id: created.body.id, expectedUpdatedAt: closed.body.updatedAt } });
  assert.equal(foreignId.status, 404);
  const listed = await invoke(commitments, 'GET', { actor: f.auditor, query: { tenantId: f.tenant.id } });
  assert.equal(listed.body.events.length, 2);
  assert.equal(listed.body.events.find(event => event.action === 'CREADO').snapshot.status, 'ABIERTA');
  assert.equal(listed.body.events.find(event => event.action === 'CERRADO').snapshot.result, closed.body.result);
  const customer = await invoke(commitments, 'POST', { actor: f.member, body: { ...input, category: 'CLIENTE', customerRequirements: 'Requisitos contractuales y legales revisados por ventas.', customerRisks: 'Riesgo de incumplimiento de entregas tratado con operaciones.', customerSatisfaction: 'Encuestas trimestrales y evaluación de reclamaciones.' } });
  assert.equal(customer.status, 201);
});

test('liderazgo: las escrituras simultáneas no sobrescriben versiones ni duplican eventos', options, async () => {
  const f = await fixture('leadership-concurrency');
  const input = commitmentBody(f);
  const created = await invoke(commitments, 'POST', { actor: f.member, body: input });
  assert.equal(created.status, 201);
  const results = await Promise.all(['Primera actualización', 'Segunda actualización'].map(title => invoke(commitments, 'PATCH', { actor: f.member, body: { ...input, title, id: created.body.id, expectedUpdatedAt: created.body.updatedAt } })));
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  const listed = await invoke(commitments, 'GET', { actor: f.member, query: { tenantId: f.tenant.id } });
  assert.equal(listed.body.events.length, 2);
  assert.equal(listed.body.records[0].title, results.find(result => result.status === 200).body.title);
});
