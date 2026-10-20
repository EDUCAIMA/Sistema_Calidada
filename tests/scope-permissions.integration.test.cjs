const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const { configured, prisma, fixture, invoke } = require('./integration-fixture.cjs');
const scope = require('../src/app/api/contexto/alcance/route.ts');

after(async () => { await prisma.$disconnect(); });

async function expect(method, options, status) {
  const result = await invoke(scope, method, options);
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body;
}

test('alcance: sesión, aislamiento, solo lectura y ninguna empresa o aprobación fabricada', { skip: !configured }, async () => {
  const f = await fixture('scope-permissions');
  const query = { tenantId: f.tenant.id };
  const body = { tenantId: f.tenant.id, scopeStatement: 'Diseño y prestación de servicios de calidad.' };
  await expect('GET', { query }, 401);
  await expect('POST', { body }, 401);
  await expect('GET', { actor: f.outsider, query }, 403);
  await expect('POST', { actor: f.outsider, body }, 403);
  await expect('POST', { actor: f.auditor, body }, 403);
  const nonexistentTenant = 'not-created-' + f.tenant.id;
  await expect('POST', { actor: f.admin, body: { ...body, tenantId: nonexistentTenant } }, 403);
  assert.equal(await prisma.tenant.count({ where: { id: nonexistentTenant } }), 0);
  const empty = await expect('GET', { actor: f.member, query }, 200);
  assert.equal(empty, null);
  const created = await expect('POST', { actor: f.member, body: { ...body, approvedBy: 'Nombre falsificado' } }, 200);
  assert.equal(created.approvedBy, '');
  await prisma.sGCScope.update({
    where: { id: created.id },
    data: {
      applicableStandards: ['ISO 9001:2015'],
      exclusions: [{ clause: '8.3', justification: 'Sin diseño de productos' }],
      sites: [{ name: 'Principal', address: 'Dirección existente', activities: 'Servicios' }],
      processes: [f.process.id],
    },
  });
  await expect('POST', { actor: f.outsider, body: { ...body, tenantId: f.otherTenant.id, id: created.id } }, 404);
  await expect('POST', { actor: f.member, body: { ...body, id: 'nonexistent-scope' } }, 404);
  const changed = await expect('POST', { actor: f.member, body: { ...body, id: created.id, scopeStatement: 'Declaración actualizada.' } }, 200);
  assert.deepEqual(changed.applicableStandards, ['ISO 9001:2015']);
  assert.equal(changed.exclusions.length, 1);
  assert.equal(changed.sites.length, 1);
  assert.deepEqual(changed.processes, [f.process.id]);
  assert.equal((await expect('GET', { actor: f.auditor, query }, 200)).scopeStatement, 'Declaración actualizada.');
});
