const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const { configured, prisma, fixture, invoke } = require('./integration-fixture.cjs');
const risks = require('../src/app/api/planificacion/riesgos/route.ts');
const changes = require('../src/app/api/planificacion/cambios/route.ts');

after(async () => { await prisma.$disconnect(); });

function riskInput(f, extra = {}) {
  return {
    tenantId: f.tenant.id, kind: 'RIESGO', description: 'Pérdida de trazabilidad de lotes',
    sourceType: 'PROCESO', sourceId: f.process.id, sourceReference: 'Control de identificación durante la recepción',
    processId: f.process.id, cause: 'Registro manual incompleto', consequence: 'Producto no conforme sin identificar',
    probability: 3, impact: 4, existingControls: 'Revisión semanal', treatmentPlan: 'Validar todos los lotes al recibirlos',
    treatmentJustification: 'Control proporcional al impacto sobre la conformidad', resources: 'Supervisor disponible dos horas por semana',
    integrationPlan: 'Actualizar la instrucción de recepción y capacitar al equipo', responsibleId: f.member.id,
    dueDate: '2026-11-01', evaluationMethod: '100% de 30 lotes trazables', evaluationDueDate: '2026-12-01', status: 'ABIERTA',
    ...extra,
  };
}

function changeInput(f, extra = {}) {
  return {
    tenantId: f.tenant.id, title: 'Nuevo control de recepción', purpose: 'Evitar errores de identificación',
    consequences: 'Modificar instrucciones y capacitar a recepción', integrityMeasures: 'Conservar revisión independiente durante la transición',
    resources: 'Supervisor y equipos disponibles', responsibilityChanges: 'Operador registra, supervisor valida',
    implementationPlan: 'Piloto, formación, revisión y despliegue', evaluationMethod: 'Verificar 30 lotes sin errores',
    processId: f.process.id, responsibleId: f.member.id, dueDate: '2026-11-01', status: 'PLANIFICADO',
    ...extra,
  };
}

function reviewInput(record, extra = {}) {
  return {
    tenantId: record.tenantId, id: record.id, updatedAt: record.updatedAt, action: 'review', result: 'EFICAZ',
    evaluation: '30 lotes de 30 trazables, sin hallazgos', evidence: 'Registro de verificación R-15, 2026-12-01, archivo de calidad',
    ...(record.kind === 'RIESGO' ? { residualProbability: 1, residualImpact: 4 } : {}),
    ...extra,
  };
}

async function request(route, method, options, expected) {
  const result = await invoke(route, method, options);
  assert.equal(result.status, expected, JSON.stringify(result.body));
  return result.body;
}

test('planificación: sesión, auditoría de solo lectura y aislamiento de empresas', { skip: !configured }, async () => {
  const f = await fixture('planning-permissions');
  for (const [route, input] of [[risks, riskInput(f)], [changes, changeInput(f)]]) {
    await request(route, 'GET', { query: { tenantId: f.tenant.id } }, 401);
    await request(route, 'POST', { body: input }, 401);
    await request(route, 'GET', { actor: f.outsider, query: { tenantId: f.tenant.id } }, 403);
    await request(route, 'POST', { actor: f.outsider, body: input }, 403);
    await request(route, 'POST', { actor: f.auditor, body: input }, 403);
    await request(route, 'POST', { actor: f.member, body: { ...input, responsibleId: f.outsider.id } }, 400);
    const created = await request(route, 'POST', { actor: f.member, body: { ...input, createdBy: f.outsider.id, createdByName: 'Suplantación' } }, 201);
    assert.equal(created.createdBy, f.member.id);
    assert.equal(created.createdByName, f.member.name);
    const own = await request(route, 'GET', { actor: f.auditor, query: { tenantId: f.tenant.id } }, 200);
    assert.equal(own.records.length, 1);
    assert.equal(own.records[0].id, created.id);
    assert.equal(own.users.some(user => user.id === f.outsider.id), false);
    const other = await request(route, 'GET', { actor: f.outsider, query: { tenantId: f.otherTenant.id } }, 200);
    assert.equal(other.records.length, 0);
    await request(route, 'POST', { actor: f.auditor, body: reviewInput(created) }, 403);
  }
  const outsideSource = await prisma.dOFAItem.create({ data: { tenantId: f.otherTenant.id, category: 'AMENAZA', description: 'Origen externo al tenant' } });
  await request(risks, 'POST', { actor: f.member, body: riskInput(f, { sourceType: 'CONTEXTO', sourceId: outsideSource.id }) }, 400);
  const outsideProcess = await prisma.process.create({ data: { tenantId: f.otherTenant.id, name: 'Otro proceso', code: 'OTRO', category: 'APOYO', objective: 'Prueba', scope: 'Otro', responsibleId: f.outsider.id, order: 1 } });
  await request(risks, 'POST', { actor: f.member, body: riskInput(f, { processId: outsideProcess.id }) }, 400);
  await request(changes, 'POST', { actor: f.member, body: changeInput(f, { processId: outsideProcess.id }) }, 400);
});

test('riesgos: ejecución, evidencia, revisión ineficaz, snapshot y cierre inmutable', { skip: !configured }, async () => {
  const f = await fixture('planning-risk-lifecycle');
  await request(risks, 'POST', { actor: f.member, body: riskInput(f, { status: 'EN_PROGRESO' }) }, 400);
  await request(risks, 'POST', { actor: f.member, body: riskInput(f, { treatmentPlan: '' }) }, 400);
  const planned = await request(risks, 'POST', { actor: f.member, body: riskInput(f) }, 201);
  assert.equal(planned.riskValue, 12);
  assert.equal(planned.level, 'ALTO');
  await request(risks, 'POST', { actor: f.member, body: reviewInput(planned) }, 409);
  const running = await request(risks, 'POST', { actor: f.member, body: riskInput(f, { id: planned.id, updatedAt: planned.updatedAt, status: 'EN_PROGRESO' }) }, 200);
  await request(risks, 'POST', { actor: f.member, body: reviewInput(running, { evidence: '' }) }, 400);
  await request(risks, 'POST', { actor: f.member, body: reviewInput(running, { residualProbability: '', residualImpact: '' }) }, 400);
  await request(risks, 'POST', { actor: f.member, body: reviewInput(running, { result: 'NO_EFICAZ' }) }, 400);
  const ineffective = await request(risks, 'POST', { actor: f.member, body: reviewInput(running, {
    result: 'NO_EFICAZ', evaluation: '28 lotes identificados de 30', followUp: 'Reentrenar y verificar 30 lotes adicionales',
    userId: f.outsider.id, userName: 'Suplantación',
  }) }, 200);
  assert.equal(ineffective.status, 'EN_PROGRESO');
  assert.equal(ineffective.reviews.length, 1);
  assert.equal(ineffective.reviews[0].userId, f.member.id);
  assert.equal(ineffective.reviews[0].planSnapshot.treatmentPlan, planned.treatmentPlan);
  await request(risks, 'POST', { actor: f.member, body: riskInput(f, { id: running.id, updatedAt: running.updatedAt, status: 'EN_PROGRESO' }) }, 409);
  const adjusted = await request(risks, 'POST', { actor: f.member, body: riskInput(f, { id: ineffective.id, updatedAt: ineffective.updatedAt, status: 'EN_PROGRESO', treatmentPlan: 'Reentrenar y verificar con doble control' }) }, 200);
  assert.equal(adjusted.reviews[0].planSnapshot.treatmentPlan, planned.treatmentPlan);
  const closed = await request(risks, 'POST', { actor: f.admin, body: reviewInput(adjusted) }, 200);
  assert.equal(closed.status, 'CERRADA');
  assert.equal(closed.residualLevel, 'MEDIO');
  assert.equal(closed.reviews.length, 2);
  assert.equal(closed.reviews[0].userId, f.admin.id);
  assert.equal(closed.reviews[0].planSnapshot.treatmentPlan, adjusted.treatmentPlan);
  await request(risks, 'POST', { actor: f.member, body: riskInput(f, { id: closed.id, updatedAt: closed.updatedAt }) }, 409);
  await request(risks, 'POST', { actor: f.admin, body: reviewInput(closed) }, 409);
  assert.equal(await prisma.riskReview.count({ where: { riskId: closed.id } }), 2);
  const persisted = await request(risks, 'GET', { actor: f.auditor, query: { tenantId: f.tenant.id } }, 200);
  assert.equal(persisted.records[0].status, 'CERRADA');
  assert.equal(persisted.records[0].reviews.length, 2);
});

test('oportunidades: se conservan separadas y evalúan beneficio sin valoración residual de riesgo', { skip: !configured }, async () => {
  const f = await fixture('planning-opportunity');
  const dofa = await prisma.dOFAItem.create({ data: { tenantId: f.tenant.id, category: 'OPORTUNIDAD', description: 'Automatización disponible' } });
  const input = riskInput(f, { kind: 'OPORTUNIDAD', description: 'Agilizar trazabilidad', sourceType: 'CONTEXTO', sourceId: dofa.id });
  const planned = await request(risks, 'POST', { actor: f.member, body: input }, 201);
  await request(risks, 'POST', { actor: f.member, body: { ...input, id: planned.id, updatedAt: planned.updatedAt, kind: 'RIESGO' } }, 400);
  const running = await request(risks, 'POST', { actor: f.member, body: { ...input, id: planned.id, updatedAt: planned.updatedAt, status: 'EN_PROGRESO' } }, 200);
  const closed = await request(risks, 'POST', { actor: f.member, body: reviewInput(running, { evaluation: 'Tiempo de consulta reducido de 10 a 2 minutos' }) }, 200);
  assert.equal(closed.kind, 'OPORTUNIDAD');
  assert.equal(closed.status, 'CERRADA');
  assert.equal(closed.residualProbability, null);
  assert.equal(closed.reviews[0].residualProbability, null);
  assert.equal(closed.reviews[0].planSnapshot.sourceId, dofa.id);
});

test('cambios: planificación completa, control de concurrencia, eficacia y cierre', { skip: !configured }, async () => {
  const f = await fixture('planning-change-lifecycle');
  await request(changes, 'POST', { actor: f.member, body: changeInput(f, { integrityMeasures: '' }) }, 400);
  await request(changes, 'POST', { actor: f.member, body: changeInput(f, { status: 'EN_EJECUCION' }) }, 400);
  const planned = await request(changes, 'POST', { actor: f.member, body: changeInput(f) }, 201);
  await request(changes, 'POST', { actor: f.member, body: reviewInput(planned) }, 409);
  const running = await request(changes, 'POST', { actor: f.member, body: changeInput(f, { id: planned.id, updatedAt: planned.updatedAt, status: 'EN_EJECUCION' }) }, 200);
  await request(changes, 'POST', { actor: f.member, body: changeInput(f, { id: planned.id, updatedAt: planned.updatedAt, status: 'EN_EJECUCION' }) }, 409);
  await request(changes, 'POST', { actor: f.member, body: reviewInput(running, { evidence: '' }) }, 400);
  await request(changes, 'POST', { actor: f.member, body: reviewInput(running, { result: 'NO_EFICAZ' }) }, 400);
  const competing = await Promise.all([1, 2].map(() => invoke(changes, 'POST', { actor: f.member, body: reviewInput(running, { result: 'NO_EFICAZ', evaluation: 'El piloto detectó dos errores', followUp: 'Ajustar instrucción y repetir piloto' }) })));
  assert.deepEqual(competing.map(result => result.status).sort(), [200, 409]);
  const ineffective = competing.find(result => result.status === 200).body;
  assert.equal(ineffective.status, 'EN_EJECUCION');
  assert.equal(ineffective.reviews.length, 1);
  assert.equal(ineffective.reviews[0].planSnapshot.integrityMeasures, planned.integrityMeasures);
  const updated = await request(changes, 'POST', { actor: f.member, body: changeInput(f, { id: ineffective.id, updatedAt: ineffective.updatedAt, status: 'EN_EJECUCION', integrityMeasures: 'Revisión independiente y respaldo diario' }) }, 200);
  assert.equal(updated.reviews[0].planSnapshot.integrityMeasures, planned.integrityMeasures);
  const closed = await request(changes, 'POST', { actor: f.admin, body: reviewInput(updated) }, 200);
  assert.equal(closed.status, 'COMPLETADO');
  assert.equal(closed.reviews.length, 2);
  assert.equal(closed.reviews[0].planSnapshot.integrityMeasures, updated.integrityMeasures);
  await request(changes, 'POST', { actor: f.member, body: changeInput(f, { id: closed.id, updatedAt: closed.updatedAt }) }, 409);
  await request(changes, 'POST', { actor: f.admin, body: reviewInput(closed) }, 409);
  assert.equal(await prisma.changeReview.count({ where: { changePlanId: closed.id } }), 2);
});
