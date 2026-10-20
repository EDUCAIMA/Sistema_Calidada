const { randomUUID } = require('node:crypto');
const configured = Boolean(process.env.TEST_DATABASE_URL);
if (configured) {
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.startsWith('/sgc_validation')) {
    throw new Error('Las pruebas requieren una base local cuyo nombre empiece por sgc_validation.');
  }
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
const prisma = require('../src/lib/db.ts').default;
const { createSessionToken } = require('../src/lib/auth-session.ts');
async function fixture(label) {
  const suffix = randomUUID();
  const tenant = await prisma.tenant.create({ data: { name: 'Prueba ' + label, slug: label + suffix } });
  const otherTenant = await prisma.tenant.create({ data: { name: 'Otra empresa', slug: 'other' + suffix } });
  const user = (role, target, name, topManagement = false) => prisma.user.create({ data: {
    tenantId: target.id, email: name + suffix + '@example.test', name, role,
    topManagement,
  } });
  const admin = await user('ADMIN_EMPRESA', tenant, 'Dirección', true);
  const member = await user('USUARIO', tenant, 'Responsable');
  const auditor = await user('AUDITOR_INTERNO', tenant, 'Auditor');
  const outsider = await user('ADMIN_EMPRESA', otherTenant, 'Otra dirección');
  const process = await prisma.process.create({ data: {
    tenantId: tenant.id, name: 'Calidad', code: 'CAL', category: 'ESTRATEGICO',
    objective: 'Planificar calidad', scope: 'Sistema', responsibleId: member.id, order: 1,
  } });
  return { tenant, otherTenant, admin, member, auditor, outsider, process };
}
async function invoke(route, method, { actor, body, query = {}, params = {} } = {}) {
  const headers = new Headers();
  if (actor) headers.set('cookie', 'sgc_session=' + createSessionToken(actor.id, 3600));
  if (body !== undefined) headers.set('content-type', 'application/json');
  const request = new Request('http://localhost/api/test?' + new URLSearchParams(query), {
    method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const response = await route[method](request, { params: Promise.resolve(params) });
  return { status: response.status, body: await response.json() };
}
module.exports = { configured, prisma, fixture, invoke };
