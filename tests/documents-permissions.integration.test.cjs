const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const { configured, prisma, fixture, invoke } = require('./integration-fixture.cjs');
const documents = require('../src/app/api/apoyo/documentos/route.ts');
const submit = require('../src/app/api/apoyo/documentos/[id]/enviar-revision/route.ts');

after(async () => { await prisma.$disconnect(); });

async function expect(route, method, options, status) {
  const result = await invoke(route, method, options);
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body;
}

test('documentos: auditores solo leen; usuario gestiona borradores y envía a revisión', { skip: !configured }, async () => {
  const f = await fixture('documents-permissions');
  const external = await prisma.user.create({ data: {
    tenantId: f.tenant.id, name: 'Auditor externo', email: 'external-' + f.tenant.id + '@example.test', role: 'AUDITOR_EXTERNO',
  } });
  const input = { tenantId: f.tenant.id, code: 'PR-01', name: 'Procedimiento de prueba temporal', type: 'PROCEDIMIENTO', processId: f.process.id };
  await expect(documents, 'GET', { query: { tenantId: f.tenant.id } }, 401);
  await expect(documents, 'POST', { body: input }, 401);
  await expect(documents, 'DELETE', { query: { tenantId: f.tenant.id, id: 'draft' } }, 401);
  await expect(submit, 'POST', { params: { id: 'draft' }, body: { tenantId: f.tenant.id } }, 401);
  await expect(documents, 'POST', { actor: f.outsider, body: input }, 403);
  const draft = await expect(documents, 'POST', { actor: f.member, body: input }, 201);
  assert.equal(draft.status, 'BORRADOR');
  assert.equal(draft.createdBy, f.member.id);
  for (const actor of [f.auditor, external]) {
    const list = await expect(documents, 'GET', { actor, query: { tenantId: f.tenant.id } }, 200);
    assert.equal(list[0].id, draft.id);
    await expect(documents, 'POST', { actor, body: { ...input, code: 'PR-02' } }, 403);
    await expect(documents, 'POST', { actor, body: { ...input, id: draft.id, name: 'Cambio no autorizado' } }, 403);
    await expect(documents, 'DELETE', { actor, query: { tenantId: f.tenant.id, id: draft.id } }, 403);
    await expect(submit, 'POST', { actor, params: { id: draft.id }, body: { tenantId: f.tenant.id } }, 403);
  }
  const edited = await expect(documents, 'POST', { actor: f.member, body: { ...input, id: draft.id, name: 'Procedimiento actualizado' } }, 200);
  assert.equal(edited.name, 'Procedimiento actualizado');
  await expect(documents, 'DELETE', { actor: f.member, query: { tenantId: f.tenant.id, id: draft.id } }, 200);
  assert.equal(await prisma.document.findUnique({ where: { id: draft.id } }), null);
  const next = await expect(documents, 'POST', { actor: f.member, body: input }, 201);
  const submitted = await expect(submit, 'POST', { actor: f.member, params: { id: next.id }, body: { tenantId: f.tenant.id } }, 200);
  assert.equal(submitted.status, 'EN_REVISION');
  assert.equal(submitted.submittedBy, f.member.id);
});
