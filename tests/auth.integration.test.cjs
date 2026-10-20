const { test, after } = require('node:test');
const assert = require('node:assert/strict');
require('./register.cjs');
const bcrypt = require('bcryptjs');
const { configured, prisma, fixture, invoke } = require('./integration-fixture.cjs');
const loginRoute = require('../src/app/api/auth/login/route.ts');
const tenants = require('../src/app/api/admin/tenants/route.ts');
const tenantRecord = require('../src/app/api/admin/tenants/[id]/route.ts');
const { verifySessionToken } = require('../src/lib/auth-session.ts');

after(async () => { await prisma.$disconnect(); });

async function account(label, password, { active = true, tenantActive = true } = {}) {
  const f = await fixture(label);
  f.member = await prisma.user.update({ where: { id: f.member.id }, data: { email: 'auth-' + f.member.id + '@example.test', password, active } });
  if (!tenantActive) await prisma.tenant.update({ where: { id: f.tenant.id }, data: { active: false } });
  return f;
}

async function login(body) {
  const response = await loginRoute.POST(new Request('http://localhost/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }));
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
}

test('login: cookie firmada y datos de sesión sin hashes; remember usa duración explícita', { skip: !configured }, async () => {
  const password = 'test-login-password';
  const hash = await bcrypt.hash(password, 10);
  const f = await account('auth-cookie', hash);
  const session = await login({ email: `  ${f.member.email.toUpperCase()}  `, password });
  assert.equal(session.status, 200);
  assert.equal(session.body.user.id, f.member.id);
  assert.equal(session.body.tenant.id, f.tenant.id);
  assert.equal('password' in session.body.user, false);
  assert.equal(JSON.stringify(session.body).includes(hash), false);
  assert.match(session.cookie, /httponly/i);
  assert.match(session.cookie, /samesite=lax/i);
  assert.match(session.cookie, /max-age=43200/i);
  const token = decodeURIComponent(session.cookie.match(/sgc_session=([^;]+)/)[1]);
  assert.equal(verifySessionToken(token).userId, f.member.id);
  const remembered = await login({ email: f.member.email, password, remember: true });
  assert.equal(remembered.status, 200);
  assert.match(remembered.cookie, /max-age=2592000/i);
});

test('login: solicitudes inválidas y credenciales incorrectas no emiten sesión', { skip: !configured }, async () => {
  const f = await account('auth-invalid', await bcrypt.hash('correct-password', 10));
  for (const body of [null, {}, { email: 123, password: 'valid' }, { email: 'invalid-email', password: 'valid' }, { email: f.member.email }, { email: f.member.email, password: '' }, { email: f.member.email, password: 'valid', remember: 'true' }, { email: f.member.email, password: 'ñ'.repeat(40) }]) {
    const result = await login(body);
    assert.equal(result.status, 400);
    assert.equal(result.cookie, null);
  }
  const invalidJson = await loginRoute.POST(new Request('http://localhost/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' }));
  assert.equal(invalidJson.status, 400);
  assert.equal(invalidJson.headers.get('set-cookie'), null);
  const wrong = await login({ email: f.member.email, password: 'wrong-password' });
  const unknown = await login({ email: 'missing-' + f.member.id + '@example.test', password: 'wrong-password' });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(wrong.body, unknown.body);
  assert.equal(wrong.cookie, null);
  assert.equal(unknown.cookie, null);
});

test('login: cuenta o empresa inactiva devuelve 403, sin cookie ni migración', { skip: !configured }, async () => {
  const password = 'legacy-inactive-password';
  for (const options of [{ active: false }, { tenantActive: false }]) {
    const f = await account('auth-inactive', password, options);
    const result = await login({ email: f.member.email, password });
    assert.equal(result.status, 403);
    assert.equal(result.cookie, null);
    assert.equal((await prisma.user.findUnique({ where: { id: f.member.id } })).password, password);
  }
});

test('login: la contraseña legada se convierte a bcrypt; el hash literal nunca autentica', { skip: !configured }, async () => {
  const password = 'legacy-login-password';
  const f = await account('auth-legacy', password);
  const first = await login({ email: f.member.email, password });
  assert.equal(first.status, 200);
  const migrated = await prisma.user.findUnique({ where: { id: f.member.id } });
  assert.notEqual(migrated.password, password);
  assert.match(migrated.password, /^\$2[ab]\$/);
  assert.equal(await bcrypt.compare(password, migrated.password), true);
  assert.equal((await login({ email: f.member.email, password })).status, 200);
  const literal = await login({ email: f.member.email, password: migrated.password });
  assert.equal(literal.status, 401);
  assert.equal(literal.cookie, null);
  assert.equal((await prisma.user.findUnique({ where: { id: f.member.id } })).password, migrated.password);
  const invalidHash = '$2b$invalid-hash';
  await prisma.user.update({ where: { id: f.member.id }, data: { password: invalidHash } });
  const malformed = await login({ email: f.member.email, password: invalidHash });
  assert.equal(malformed.status, 401);
  assert.equal(malformed.cookie, null);
});

test('empresas: directorio global, modificaciones y desactivación preservan permisos e historial', { skip: !configured }, async () => {
  const f = await fixture('auth-tenants');
  const hash = await bcrypt.hash('own-admin-test-password', 10);
  const superAdmin = await prisma.user.create({ data: { tenantId: f.tenant.id, name: 'Administración global', email: 'super-auth-' + f.tenant.id + '@example.test', role: 'SUPER_ADMIN', password: hash } });
  const otherSuper = await prisma.user.create({ data: { tenantId: f.otherTenant.id, name: 'Otra administración global', email: 'other-super-auth-' + f.tenant.id + '@example.test', role: 'SUPER_ADMIN', password: hash } });
  const historicalRecord = await prisma.leadershipCommitment.create({ data: {
    tenantId: f.otherTenant.id,
    category: 'RESPONSABILIDAD',
    title: 'Registro que debe conservarse',
    description: 'Evidencia histórica de la empresa antes de su desactivación.',
    responsibleId: f.outsider.id,
    responsibleName: f.outsider.name,
    dueDate: new Date('2030-01-01T12:00:00Z'),
    createdById: f.outsider.id,
    createdByName: f.outsider.name,
    updatedById: f.outsider.id,
    updatedByName: f.outsider.name,
  } });
  assert.equal((await invoke(tenants, 'GET')).status, 401);
  assert.equal((await invoke(tenants, 'GET', { actor: f.admin })).status, 403);
  assert.equal((await invoke(tenants, 'GET', { actor: f.member })).status, 403);
  const all = await invoke(tenants, 'GET', { actor: superAdmin });
  assert.equal(all.status, 200);
  assert.equal(all.body.some((item) => item.id === f.tenant.id), true);
  assert.equal(JSON.stringify(all.body).includes(hash), false);
  const params = { id: f.tenant.id };
  const body = { name: 'Empresa actualizada de prueba', active: false };
  assert.equal((await invoke(tenantRecord, 'PATCH', { params, body })).status, 401);
  assert.equal((await invoke(tenantRecord, 'PATCH', { actor: f.member, params, body })).status, 403);
  assert.equal((await invoke(tenantRecord, 'PATCH', { actor: f.outsider, params, body })).status, 403);
  const changed = await invoke(tenantRecord, 'PATCH', { actor: f.admin, params, body });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.name, body.name);
  assert.equal(changed.body.active, true);
  const deletionTarget = { id: f.otherTenant.id };
  const ownCredentials = { adminEmail: superAdmin.email, adminPassword: 'wrong-password' };
  assert.equal((await invoke(tenantRecord, 'DELETE', { params: deletionTarget, body: ownCredentials })).status, 401);
  assert.equal((await invoke(tenantRecord, 'DELETE', { actor: f.admin, params: deletionTarget, body: ownCredentials })).status, 403);
  assert.equal((await invoke(tenantRecord, 'DELETE', { actor: superAdmin, params: deletionTarget, body: {} })).status, 400);
  assert.equal((await invoke(tenantRecord, 'DELETE', { actor: superAdmin, params: deletionTarget, body: ownCredentials })).status, 401);
  assert.equal((await invoke(tenantRecord, 'DELETE', { actor: superAdmin, params: deletionTarget, body: { adminEmail: otherSuper.email, adminPassword: 'own-admin-test-password' } })).status, 403);
  assert.equal(await prisma.tenant.count({ where: { id: f.otherTenant.id } }), 1);
  assert.equal(await prisma.user.count({ where: { id: f.outsider.id } }), 1);

  const validCredentials = { adminEmail: superAdmin.email, adminPassword: 'own-admin-test-password' };
  assert.equal((await invoke(tenantRecord, 'DELETE', { actor: superAdmin, params: { id: f.tenant.id }, body: validCredentials })).status, 409);
  const deactivated = await invoke(tenantRecord, 'DELETE', { actor: superAdmin, params: deletionTarget, body: validCredentials });
  assert.equal(deactivated.status, 200);
  assert.equal(deactivated.body.deactivated, true);
  assert.equal(deactivated.body.alreadyInactive, false);
  assert.equal((await prisma.tenant.findUniqueOrThrow({ where: { id: f.otherTenant.id } })).active, false);
  assert.equal(await prisma.user.count({ where: { id: { in: [f.outsider.id, otherSuper.id] } } }), 2);
  assert.equal(await prisma.leadershipCommitment.count({ where: { id: historicalRecord.id } }), 1);
  assert.equal((await invoke(tenants, 'GET', { actor: f.outsider })).status, 401);

  const repeated = await invoke(tenantRecord, 'DELETE', { actor: superAdmin, params: deletionTarget, body: validCredentials });
  assert.equal(repeated.status, 200);
  assert.equal(repeated.body.alreadyInactive, true);
});
