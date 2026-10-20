const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const { configured, prisma, fixture, invoke } = require('./integration-fixture.cjs');
const standard = require('../src/app/api/document-standard/route.ts');
const formats = require('../src/app/api/formatos/route.ts');
const documents = require('../src/app/api/apoyo/documentos/route.ts');
const { DEFAULT_DOCUMENT_STANDARD } = require('../src/lib/document-standard.ts');

after(async () => { await prisma.$disconnect(); });
const config = () => structuredClone(DEFAULT_DOCUMENT_STANDARD);

async function expect(route, method, options, status) {
  const result = await invoke(route, method, options);
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body;
}

test('estándar documental: aislamiento, permisos, logo y control de edición concurrente', { skip: !configured }, async () => {
  const f = await fixture('standard-access');
  const query = { tenantId: f.tenant.id };
  const input = { tenantId: f.tenant.id, config: config(), revision: 0 };
  await expect(standard, 'GET', { query }, 401);
  await expect(standard, 'GET', { actor: f.outsider, query }, 403);
  for (const actor of [f.member, f.auditor]) {
    const initial = await expect(standard, 'GET', { actor, query }, 200);
    assert.equal(initial.revision, 0);
    assert.deepEqual(initial.config, config());
    assert.equal(initial.tenant.id, f.tenant.id);
    await expect(standard, 'PUT', { actor, body: input }, 403);
  }
  await expect(standard, 'PUT', { actor: f.outsider, body: input }, 403);
  await expect(standard, 'PUT', { actor: f.admin, body: { ...input, logo: 'data:image/svg+xml;base64,PHN2Zz4=' } }, 400);
  await expect(standard, 'PUT', { actor: f.admin, body: { ...input, logo: 'data:image/png;base64,aW52YWxpZA==' } }, 400);
  await expect(standard, 'PUT', { actor: f.admin, body: { ...input, logo: 'javascript:alert(1)' } }, 400);
  await expect(standard, 'PUT', { actor: f.admin, body: { ...input, logo: 'https://secret@example.com/logo.png' } }, 400);
  const saved = await expect(standard, 'PUT', { actor: f.admin, body: { ...input, logo: 'https://example.com/company.png' } }, 200);
  assert.equal(saved.revision, 1);
  assert.equal(saved.tenant.logo, 'https://example.com/company.png');
  await expect(standard, 'PUT', { actor: f.admin, body: input }, 409);
  const changed = { ...config(), organizationPrefix: 'ACME' };
  const results = await Promise.all([
    invoke(standard, 'PUT', { actor: f.admin, body: { ...input, revision: 1, config: changed } }),
    invoke(standard, 'PUT', { actor: f.admin, body: { ...input, revision: 1, logo: null } }),
  ]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  const final = await expect(standard, 'GET', { actor: f.member, query }, 200);
  assert.equal(final.revision, 2);
  assert.equal((await prisma.documentStandard.findUnique({ where: { tenantId: f.tenant.id } })).updatedBy, f.admin.id);
  const other = await expect(standard, 'GET', { actor: f.outsider, query: { tenantId: f.otherTenant.id } }, 200);
  assert.equal(other.revision, 0);
  assert.equal(other.tenant.logo, null);
});

test('estándar documental: formatos autenticados, administración y preservación de códigos existentes', { skip: !configured }, async () => {
  const f = await fixture('standard-formats');
  const query = { tenantId: f.tenant.id, moduleKey: '4.1' };
  const input = { ...query, code: 'LEGACY-DOFA-01', version: '2', approvalDate: '' };
  await expect(formats, 'GET', { query }, 401);
  await expect(formats, 'POST', { body: input }, 401);
  await expect(formats, 'GET', { actor: f.outsider, query }, 403);
  await expect(formats, 'POST', { actor: f.member, body: input }, 403);
  await expect(formats, 'POST', { actor: f.auditor, body: input }, 403);
  for (const approvalDate of ['texto', '2026-02-30', '2026-13-01', '2026-2-01', '2026-01-01T00:00:00Z', '0000-01-01']) {
    await expect(formats, 'POST', { actor: f.admin, body: { ...input, approvalDate } }, 400);
  }
  const leapDate = await expect(formats, 'POST', { actor: f.admin, body: { ...input, approvalDate: '2024-02-29' } }, 200);
  assert.equal(leapDate.approvalDate, '2024-02-29');
  await expect(formats, 'POST', { actor: f.admin, body: input }, 200);
  await expect(standard, 'PUT', { actor: f.admin, body: {
    tenantId: f.tenant.id, revision: 0, config: { ...config(), organizationPrefix: 'NEW' },
  } }, 200);
  const saved = await expect(formats, 'GET', { actor: f.auditor, query }, 200);
  assert.equal(saved.code, input.code);
  assert.equal(saved.version, input.version);
  assert.equal(saved.approvalDate, '');
  const loaded = await expect(standard, 'GET', { actor: f.member, query: { tenantId: f.tenant.id } }, 200);
  assert.equal(loaded.formats.length, 1);
  assert.equal(loaded.formats[0].code, input.code);
});

test('estándar documental: códigos atómicos, tipos personalizados, conservación histórica y empresas aisladas', { skip: !configured }, async () => {
  const f = await fixture('standard-codes');
  const custom = config();
  custom.documentTypes.push({ id: 'ACTA', name: 'Acta de reunión', prefix: 'ACT', baseType: 'REGISTRO', active: true });
  await expect(standard, 'PUT', { actor: f.admin, body: { tenantId: f.tenant.id, revision: 0, config: custom } }, 200);
  const base = { tenantId: f.tenant.id, name: 'Acta de prueba', type: 'REGISTRO', documentTypeId: 'ACTA', code: '' };
  await expect(documents, 'POST', { actor: f.auditor, body: base }, 403);
  await expect(documents, 'POST', { actor: f.outsider, body: base }, 403);
  await expect(documents, 'POST', { actor: f.member, body: { ...base, documentTypeId: 'INEXISTENTE' } }, 400);
  const manual = await expect(documents, 'POST', { actor: f.member, body: { ...base, code: 'SGC-ACT-001' } }, 201);
  const concurrent = await Promise.all(Array.from({ length: 6 }, (_, index) => invoke(documents, 'POST', {
    actor: f.member, body: { ...base, name: `Acta ${index}` },
  })));
  assert.ok(concurrent.every(result => result.status === 201), JSON.stringify(concurrent));
  assert.equal(new Set(concurrent.map(result => result.body.code)).size, 6);
  assert.deepEqual(concurrent.map(result => result.body.code).sort(), ['002', '003', '004', '005', '006', '007'].map(sequence => `SGC-ACT-${sequence}`));
  for (const result of concurrent) {
    assert.equal(result.body.documentTypeId, 'ACTA');
    assert.equal(result.body.documentTypeName, 'Acta de reunión');
    assert.equal(result.body.type, 'REGISTRO');
  }
  const unchangedCode = await expect(documents, 'POST', {
    actor: f.member, body: { ...base, id: manual.id, name: 'Nombre actualizado' },
  }, 200);
  assert.equal(unchangedCode.code, 'SGC-ACT-001');
  await expect(documents, 'POST', { actor: f.member, body: { ...base, code: 'SGC-ACT-001' } }, 409);
  const version = await expect(documents, 'POST', {
    actor: f.member, body: { ...base, code: manual.code, currentVersion: 2, sourceDocumentId: manual.id },
  }, 201);
  assert.equal(version.code, manual.code);
  assert.equal(version.currentVersion, 2);
  const disabled = structuredClone(custom);
  disabled.documentTypes.find(type => type.id === 'ACTA').active = false;
  await expect(standard, 'PUT', { actor: f.admin, body: { tenantId: f.tenant.id, revision: 1, config: disabled } }, 200);
  await expect(documents, 'POST', { actor: f.member, body: base }, 400);
  const historical = await prisma.document.findUnique({ where: { id: manual.id } });
  assert.equal(historical.code, manual.code);
  assert.equal(historical.documentTypeName, 'Acta de reunión');
  const historicalEdit = await expect(documents, 'POST', {
    actor: f.member, body: { ...base, id: manual.id, name: 'Corrección con tipo desactivado' },
  }, 200);
  assert.equal(historicalEdit.documentTypeName, 'Acta de reunión');
  const historicalVersion = await expect(documents, 'POST', {
    actor: f.member, body: { ...base, currentVersion: 3, sourceDocumentId: version.id },
  }, 201);
  assert.equal(historicalVersion.code, manual.code);
  assert.equal(historicalVersion.documentTypeName, 'Acta de reunión');
  await expect(documents, 'POST', {
    actor: f.outsider, body: { ...base, tenantId: f.otherTenant.id, sourceDocumentId: manual.id, currentVersion: 4 },
  }, 404);
  await expect(documents, 'POST', {
    actor: f.member, body: { ...base, code: 'RECODIFICADO', currentVersion: 4, sourceDocumentId: manual.id },
  }, 400);
  const other = await expect(documents, 'POST', {
    actor: f.outsider, body: { tenantId: f.otherTenant.id, name: 'Matriz', type: 'REGISTRO', documentTypeId: 'MATRIZ', code: '' },
  }, 201);
  assert.equal(other.code, 'SGC-MAT-001');
});

test('estándar documental: no reutiliza consecutivos borrados ni colisiona con códigos manuales posteriores', { skip: !configured }, async () => {
  const f = await fixture('standard-code-gaps');
  const base = { tenantId: f.tenant.id, name: 'Matriz de prueba', type: 'REGISTRO', documentTypeId: 'MATRIZ', code: '' };
  const first = await expect(documents, 'POST', { actor: f.member, body: base }, 201);
  assert.equal(first.code, 'SGC-MAT-001');
  await expect(documents, 'POST', { actor: f.member, body: { ...base, code: 'SGC-MAT-002' } }, 201);
  const next = await expect(documents, 'POST', { actor: f.member, body: base }, 201);
  assert.equal(next.code, 'SGC-MAT-003');
  await expect(documents, 'DELETE', { actor: f.member, query: { tenantId: f.tenant.id, id: next.id } }, 200);
  const fourth = await expect(documents, 'POST', { actor: f.member, body: base }, 201);
  assert.equal(fourth.code, 'SGC-MAT-004');
  const revised = { ...config(), sequenceDigits: 5 };
  await expect(standard, 'PUT', { actor: f.admin, body: { tenantId: f.tenant.id, revision: 0, config: revised } }, 200);
  const fifth = await expect(documents, 'POST', { actor: f.member, body: base }, 201);
  assert.equal(fifth.code, 'SGC-MAT-00005');
  assert.equal((await prisma.document.findUnique({ where: { id: first.id } })).code, 'SGC-MAT-001');
  const concurrentManual = await Promise.all([0, 1].map(() => invoke(documents, 'POST', {
    actor: f.member, body: { ...base, code: 'LEGACY-MANUAL-001' },
  })));
  assert.deepEqual(concurrentManual.map(result => result.status).sort(), [201, 409]);
  assert.equal(await prisma.document.count({ where: { tenantId: f.tenant.id, code: 'LEGACY-MANUAL-001' } }), 1);
});
