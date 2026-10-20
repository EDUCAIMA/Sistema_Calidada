/* CommonJS is required by the project's TypeScript test loader. */
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
require('./register.cjs');
const { configured, prisma, fixture, invoke } = require('./integration-fixture.cjs');
const objectives = require('../src/app/api/planificacion/objetivos/route.ts');
const tracking = require('../src/app/api/planificacion/objetivos/tracking/route.ts');

after(async () => { await prisma.$disconnect(); });

async function objectiveFixture(label) {
  const records = await fixture(label);
  const policy = await prisma.policy.create({ data: {
    tenantId: records.tenant.id, title: 'Política de calidad', content: 'Compromiso con requisitos y mejora continua.',
    type: 'Calidad', status: 'VIGENTE', author: records.admin.name,
  } });
  const plan = {
    tenantId: records.tenant.id, policyId: policy.id, processId: records.process.id, responsibleId: records.member.id,
    organizationalLevel: 'Operativo', description: 'Reducir devoluciones', indicator: 'Porcentaje de devoluciones',
    target: 'Menor o igual al 2%', actual: '4%', applicableRequirements: 'Acuerdos con clientes',
    relevance: 'Conformidad del producto y satisfacción del cliente', actionPlan: 'Capacitar e inspeccionar en recepción.',
    evaluationMethod: 'Devoluciones / ventas x 100; reporte mensual; cumple si el resultado es menor o igual a 2.',
    resources: '40 horas; presupuesto de capacitación', deadline: '2099-12-31', evaluationFreq: 'Mensual',
    communicationRecipients: 'Equipo operativo', communicationDate: '2025-01-20', communicationEvidence: 'Acta 20-01-2025',
  };
  return { ...records, policy, plan };
}

test('6.2: autorización, medición evidenciada, revisión de criterios y archivo con historia', { skip: !configured }, async () => {
  const f = await objectiveFixture('objectives-lifecycle');
  assert.equal((await invoke(objectives, 'POST', { body: f.plan })).status, 401);
  assert.equal((await invoke(objectives, 'POST', { actor: f.outsider, body: f.plan })).status, 403);
  assert.equal((await invoke(objectives, 'POST', { actor: f.auditor, body: f.plan })).status, 403);
  assert.equal((await invoke(objectives, 'GET', { query: { tenantId: f.tenant.id } })).status, 401);
  assert.equal((await invoke(objectives, 'GET', { actor: f.outsider, query: { tenantId: f.tenant.id } })).status, 403);
  const created = await invoke(objectives, 'POST', { actor: f.member, body: { ...f.plan, progress: 100, targetMet: true } });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.progress, 0);
  assert.equal(created.body.targetMet, null);
  assert.equal(created.body.tracking[0].actorId, f.member.id);
  assert.equal(created.body.tracking[0].snapshot.after.actionPlan, f.plan.actionPlan);
  const id = created.body.id;
  const measurement = { tenantId: f.tenant.id, objectiveId: id, expectedUpdatedAt: created.body.updatedAt, progress: 100, actual: '3%', targetMet: false, note: 'Acciones terminadas; se requiere reforzar inspección.', evidence: 'Informe de medición 001' };
  assert.equal((await invoke(tracking, 'POST', { actor: f.auditor, body: measurement })).status, 403);
  assert.equal((await invoke(tracking, 'POST', { actor: f.outsider, body: { ...measurement, tenantId: f.otherTenant.id } })).status, 404);
  assert.equal((await invoke(tracking, 'POST', { actor: f.member, body: { ...measurement, evidence: '' } })).status, 400);
  const incomplete = await invoke(tracking, 'POST', { actor: f.member, body: measurement });
  assert.equal(incomplete.status, 200, JSON.stringify(incomplete.body));
  assert.equal(incomplete.body.objective.status, 'EN_PROGRESO');
  assert.equal(incomplete.body.objective.progress, 100);
  const measured = await invoke(tracking, 'POST', { actor: f.member, body: { ...measurement, expectedUpdatedAt: incomplete.body.objective.updatedAt, actual: '1%', targetMet: true, evidence: 'Informe 002; 1 devolución entre 100 ventas.' } });
  assert.equal(measured.status, 200);
  assert.equal(measured.body.objective.status, 'CUMPLIDO');
  const overdue = await prisma.qualityObjective.update({ where: { id }, data: { nextEvaluationDate: new Date('2000-01-01') } });
  const updated = await invoke(objectives, 'POST', { actor: f.member, body: { ...f.plan, id, expectedUpdatedAt: overdue.updatedAt.toISOString(), target: '0 devoluciones', actual: '0%', progress: 0, targetMet: true, changeReason: 'Nueva meta aprobada para mejorar la conformidad.' } });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal(updated.body.targetMet, null);
  assert.equal(updated.body.status, 'EN_RIESGO');
  assert.equal(updated.body.actual, '1%');
  assert.equal(updated.body.progress, 100);
  assert.equal(updated.body.nextEvaluationDate, '2000-01-01T00:00:00.000Z');
  assert.equal(updated.body.tracking.length, 4);
  const change = updated.body.tracking.find((item) => item.eventType === 'PLAN_UPDATED');
  assert.equal(change.snapshot.before.target, f.plan.target);
  assert.equal(change.snapshot.after.target, '0 devoluciones');
  assert.equal((await invoke(objectives, 'DELETE', { actor: f.member, query: { tenantId: f.tenant.id, id, expectedUpdatedAt: updated.body.updatedAt } })).status, 403);
  const archived = await invoke(objectives, 'DELETE', { actor: f.admin, query: { tenantId: f.tenant.id, id, expectedUpdatedAt: updated.body.updatedAt } });
  assert.equal(archived.status, 200);
  assert.equal(archived.body.status, 'ARCHIVADO');
  assert.equal(archived.body.tracking.length, 5);
  assert.equal((await invoke(tracking, 'POST', { actor: f.member, body: measurement })).status, 409);
  assert.equal((await invoke(objectives, 'POST', { actor: f.admin, body: { ...f.plan, id, expectedUpdatedAt: archived.body.updatedAt, changeReason: 'Intento de edición' } })).status, 409);
  const list = await invoke(objectives, 'GET', { actor: f.auditor, query: { tenantId: f.tenant.id } });
  assert.equal(list.status, 200);
  assert.equal(list.body.find((item) => item.id === id).tracking.length, 5);
});

test('6.2: referencias de empresa, política vigente y preservación del vínculo histórico', { skip: !configured }, async () => {
  const f = await objectiveFixture('objectives-references');
  assert.equal((await invoke(objectives, 'POST', { actor: f.member, body: { ...f.plan, responsibleId: f.outsider.id } })).status, 400);
  const draft = await prisma.policy.create({ data: { tenantId: f.tenant.id, title: 'Borrador', content: 'Propuesta', status: 'BORRADOR', author: f.admin.name } });
  assert.equal((await invoke(objectives, 'POST', { actor: f.member, body: { ...f.plan, policyId: draft.id } })).status, 400);
  const foreign = await prisma.policy.create({ data: { tenantId: f.otherTenant.id, title: 'Otra empresa', content: 'Política', status: 'VIGENTE', author: f.outsider.name } });
  assert.equal((await invoke(objectives, 'POST', { actor: f.member, body: { ...f.plan, policyId: foreign.id } })).status, 400);
  const created = await invoke(objectives, 'POST', { actor: f.member, body: f.plan });
  assert.equal(created.status, 201);
  await prisma.policy.update({ where: { id: f.policy.id }, data: { status: 'OBSOLETA' } });
  const revision = await invoke(objectives, 'POST', { actor: f.member, body: { ...f.plan, id: created.body.id, expectedUpdatedAt: created.body.updatedAt, resources: '80 horas', changeReason: 'Ampliar recursos preservando política de origen.' } });
  assert.equal(revision.status, 200, JSON.stringify(revision.body));
  assert.equal(revision.body.policyId, f.policy.id);
  assert.equal((await invoke(objectives, 'POST', { actor: f.member, body: f.plan })).status, 400);
  assert.equal((await invoke(objectives, 'POST', { actor: f.outsider, body: { ...f.plan, id: created.body.id, expectedUpdatedAt: created.body.updatedAt, tenantId: f.otherTenant.id, changeReason: 'Intento externo' } })).status, 404);
});

test('6.2: registros legados al 100% no se presentan como cumplidos sin evaluación', { skip: !configured }, async () => {
  const f = await objectiveFixture('objectives-legacy');
  const legacy = await prisma.qualityObjective.create({ data: { tenantId: f.tenant.id, description: 'Objetivo anterior', indicator: 'Tasa de error', target: 'Menor a 1%', deadline: new Date('2099-12-31'), progress: 100, status: 'CUMPLIDO' } });
  const list = await invoke(objectives, 'GET', { actor: f.auditor, query: { tenantId: f.tenant.id } });
  assert.equal(list.status, 200);
  assert.equal(list.body.find((item) => item.id === legacy.id).status, 'EN_PROGRESO');
  const rejected = await invoke(tracking, 'POST', { actor: f.member, body: { tenantId: f.tenant.id, objectiveId: legacy.id, expectedUpdatedAt: legacy.updatedAt.toISOString(), progress: 100, actual: '0%', targetMet: true, note: 'Medición', evidence: 'Informe' } });
  assert.equal(rejected.status, 409);
});

test('6.2: clientes obsoletos no sobrescriben planes, resultados ni archivos', { skip: !configured }, async () => {
  const f = await objectiveFixture('objectives-concurrency');
  const created = await invoke(objectives, 'POST', { actor: f.member, body: f.plan });
  assert.equal(created.status, 201);
  const id = created.body.id;
  const initialVersion = created.body.updatedAt;
  const revision = { ...f.plan, id, expectedUpdatedAt: initialVersion, target: 'Menor o igual al 1%', changeReason: 'Nueva meta de calidad.' };
  const measurement = { tenantId: f.tenant.id, objectiveId: id, expectedUpdatedAt: initialVersion, progress: 80, actual: '0,5%', targetMet: true, note: 'La medición cumple el nuevo criterio.', evidence: 'Informe de 200 ventas y una devolución.' };
  for (const expectedUpdatedAt of [undefined, 'fecha-inválida']) {
    assert.equal((await invoke(objectives, 'POST', { actor: f.member, body: { ...revision, expectedUpdatedAt } })).status, 400);
    assert.equal((await invoke(tracking, 'POST', { actor: f.member, body: { ...measurement, expectedUpdatedAt } })).status, 400);
    assert.equal((await invoke(objectives, 'DELETE', { actor: f.admin, query: { tenantId: f.tenant.id, id, ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}) } })).status, 400);
  }
  const updated = await invoke(objectives, 'POST', { actor: f.member, body: revision });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.notEqual(updated.body.updatedAt, initialVersion);
  const assertStaleRejected = async (version) => {
    assert.equal((await invoke(objectives, 'POST', { actor: f.member, body: { ...revision, expectedUpdatedAt: version, target: 'Meta obsoleta' } })).status, 409);
    assert.equal((await invoke(tracking, 'POST', { actor: f.member, body: { ...measurement, expectedUpdatedAt: version, actual: 'Resultado obsoleto' } })).status, 409);
    assert.equal((await invoke(objectives, 'DELETE', { actor: f.admin, query: { tenantId: f.tenant.id, id, expectedUpdatedAt: version } })).status, 409);
  };
  await assertStaleRejected(initialVersion);
  assert.equal(await prisma.objectiveTracking.count({ where: { objectiveId: id } }), 2);
  const measured = await invoke(tracking, 'POST', { actor: f.member, body: { ...measurement, expectedUpdatedAt: updated.body.updatedAt } });
  assert.equal(measured.status, 200, JSON.stringify(measured.body));
  assert.notEqual(measured.body.objective.updatedAt, updated.body.updatedAt);
  await assertStaleRejected(updated.body.updatedAt);
  const stored = await prisma.qualityObjective.findUnique({ where: { id }, include: { tracking: true } });
  assert.equal(stored.target, revision.target);
  assert.equal(stored.actual, measurement.actual);
  assert.equal(stored.targetMet, true);
  assert.equal(stored.archivedAt, null);
  assert.equal(stored.tracking.length, 3);
  const archived = await invoke(objectives, 'DELETE', { actor: f.admin, query: { tenantId: f.tenant.id, id, expectedUpdatedAt: measured.body.objective.updatedAt } });
  assert.equal(archived.status, 200);
  assert.equal(archived.body.tracking.length, 4);
});

test('6.2: cambiar frecuencia adelanta la evaluación y conserva un vencimiento anterior', { skip: !configured }, async () => {
  const f = await objectiveFixture('objectives-frequency');
  const annualPlan = { ...f.plan, evaluationFreq: 'Anual' };
  const created = await invoke(objectives, 'POST', { actor: f.member, body: annualPlan });
  assert.equal(created.status, 201);
  const id = created.body.id;
  const monthlyPlan = { ...f.plan, id, expectedUpdatedAt: created.body.updatedAt, changeReason: 'Revisar resultados mensualmente.' };
  const shortened = await invoke(objectives, 'POST', { actor: f.member, body: monthlyPlan });
  assert.equal(shortened.status, 200);
  assert.equal(shortened.body.evaluationFreq, 'Mensual');
  assert.ok(new Date(shortened.body.nextEvaluationDate) < new Date(created.body.nextEvaluationDate));
  const expanded = await invoke(objectives, 'POST', { actor: f.member, body: { ...annualPlan, id, expectedUpdatedAt: shortened.body.updatedAt, changeReason: 'Cambiar frecuencia futura sin aplazar la revisión comprometida.' } });
  assert.equal(expanded.status, 200);
  assert.equal(expanded.body.nextEvaluationDate, shortened.body.nextEvaluationDate);
  const overdue = await prisma.qualityObjective.update({ where: { id }, data: { nextEvaluationDate: new Date('2000-01-01') } });
  const preserved = await invoke(objectives, 'POST', { actor: f.member, body: { ...monthlyPlan, expectedUpdatedAt: overdue.updatedAt.toISOString() } });
  assert.equal(preserved.status, 200);
  assert.equal(preserved.body.nextEvaluationDate, '2000-01-01T00:00:00.000Z');
  assert.equal(preserved.body.status, 'EN_RIESGO');
});
