const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const { configured, prisma, fixture, invoke } = require('./integration-fixture.cjs');
const dofa = require('../src/app/api/contexto/dofa/route.ts');
const stakeholders = require('../src/app/api/contexto/partes-interesadas/route.ts');
const risks = require('../src/app/api/planificacion/riesgos/route.ts');

after(async () => { await prisma.$disconnect(); });

async function expect(route, method, options, status) {
  const response = await invoke(route, method, options);
  assert.equal(response.status, status, JSON.stringify(response.body));
  return response.body;
}

for (const [label, route, fields, sourceType] of [
  ['DOFA', dofa, { category: 'DEBILIDAD', description: 'Registros manuales incompletos' }, 'CONTEXTO'],
  ['partes interesadas', stakeholders, { name: 'Clientes', type: 'EXTERNO', influence: 'ALTA', needs: 'Productos trazables' }, 'PARTE_INTERESADA'],
]) {
  test(`${label}: sesión, permisos, aislamiento y conservación del origen de 6.1`, { skip: !configured }, async () => {
    const f = await fixture(sourceType.toLowerCase());
    const body = { tenantId: f.tenant.id, ...fields };
    await expect(route, 'GET', { query: { tenantId: f.tenant.id } }, 401);
    await expect(route, 'POST', { body }, 401);
    await expect(route, 'DELETE', { query: { id: 'not-needed' } }, 401);
    await expect(route, 'GET', { actor: f.outsider, query: { tenantId: f.tenant.id } }, 403);
    await expect(route, 'POST', { actor: f.outsider, body }, 403);
    await expect(route, 'POST', { actor: f.auditor, body }, 403);
    await expect(route, 'POST', { actor: f.member, body: { ...body, category: 'INVALIDA', influence: 'INVALIDA' } }, 400);
    const fakeTenant = 'uncreated-' + f.tenant.id;
    await expect(route, 'POST', { actor: f.member, body: { ...body, tenantId: fakeTenant } }, 403);
    assert.equal(await prisma.tenant.findUnique({ where: { id: fakeTenant } }), null);

    const source = await expect(route, 'POST', { actor: f.member, body }, 201);
    const visible = await expect(route, 'GET', { actor: f.auditor, query: { tenantId: f.tenant.id } }, 200);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].id, source.id);
    await expect(route, 'POST', { actor: f.outsider, body: { ...body, id: source.id, tenantId: f.otherTenant.id } }, 404);
    await expect(route, 'DELETE', { actor: f.outsider, query: { id: source.id } }, 404);
    await expect(route, 'DELETE', { actor: f.auditor, query: { id: source.id } }, 403);
    const updated = await expect(route, 'POST', { actor: f.member, body: { ...body, id: source.id, strategy: 'Consulta mensual', actions: 'Revisión mensual' } }, 200);
    assert.equal(updated.tenantId, f.tenant.id);
    assert.equal(updated.id, source.id);

    await expect(risks, 'POST', { actor: f.member, body: {
      tenantId: f.tenant.id, kind: 'RIESGO', description: 'Pérdida de trazabilidad', sourceType, sourceId: source.id,
      sourceReference: 'Control requerido de identificación de lotes', processId: f.process.id,
      cause: 'Registros manuales incompletos', consequence: 'Producto no conforme sin identificar',
      probability: 3, impact: 4, existingControls: 'Revisión semanal', treatmentPlan: 'Verificar recepción de cada lote',
      treatmentJustification: 'Control proporcional al impacto en la conformidad', resources: 'Supervisor disponible',
      integrationPlan: 'Actualizar instrucción de recepción', responsibleId: f.member.id, dueDate: '2026-11-01',
      evaluationMethod: '30 lotes de 30 trazables', evaluationDueDate: '2026-12-01', status: 'ABIERTA',
    } }, 201);
    const blocked = await expect(route, 'DELETE', { actor: f.admin, query: { id: source.id } }, 409);
    assert.match(blocked.error, /conservarse/);
    assert.equal((await expect(route, 'GET', { actor: f.member, query: { tenantId: f.tenant.id } }, 200)).length, 1);

    const independent = await expect(route, 'POST', { actor: f.member, body }, 201);
    await expect(route, 'DELETE', { actor: f.member, query: { id: independent.id } }, 200);
    assert.equal((await expect(route, 'GET', { actor: f.member, query: { tenantId: f.tenant.id } }, 200)).length, 1);
  });
}
