/* CommonJS is required by the project's TypeScript test loader. */
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { configured, prisma, fixture, invoke } = require('./integration-fixture.cjs');
const characterization = require('../src/app/api/procesos/caracterizacion/route.ts');

after(async () => { await prisma.$disconnect(); });
const options = { skip: !configured };

const bodyFor = f => ({
  processId: f.process.id,
  version: '2',
  date: '2026-10-19',
  objective: 'Asegurar la conformidad y eficacia del sistema.',
  scope: 'Todos los procesos incluidos en el SGC.',
  responsibleId: f.admin.id,
  planear: [], hacer: [], verificar: [], actuar: [], resources: [], indicators: [], documents: [], risks: [],
});

test('caracterización de procesos exige sesión, empresa y permiso de escritura', options, async () => {
  const f = await fixture('process-characterization-access');
  const body = bodyFor(f);
  assert.equal((await invoke(characterization, 'POST', { body })).status, 401);
  assert.equal((await invoke(characterization, 'POST', { actor: f.outsider, body })).status, 404);
  assert.equal((await invoke(characterization, 'POST', { actor: f.auditor, body })).status, 403);
});

test('caracterización valida el responsable activo y conserva el contrato de respuesta', options, async () => {
  const f = await fixture('process-characterization-references');
  const body = bodyFor(f);
  const foreign = await invoke(characterization, 'POST', { actor: f.member, body: { ...body, responsibleId: f.outsider.id } });
  assert.equal(foreign.status, 400);

  const saved = await invoke(characterization, 'POST', { actor: f.member, body });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.processId, f.process.id);
  assert.equal(saved.body.version, '2');
  const process = await prisma.process.findUniqueOrThrow({ where: { id: f.process.id } });
  assert.equal(process.responsibleId, f.admin.id);
  assert.equal(process.objective, body.objective);
  assert.equal(process.scope, body.scope);
});
