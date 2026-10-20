const test = require('node:test');
const assert = require('node:assert/strict');
const { policyInput, policyApproval, policyCommunicationInput, policyRevisionIsNewer } = require('../src/lib/policy-validation.ts');
const { createSessionToken, verifySessionToken } = require('../src/lib/auth-session.ts');

test('la aprobación exige confirmación de los cuatro criterios de política', () => {
  const decision = { tenantId: 'tenant', expectedUpdatedAt: new Date().toISOString(), checks: { context: true, framework: true, requirements: true, improvement: true } };
  assert.equal(policyApproval.safeParse(decision).success, true);
  assert.equal(policyApproval.safeParse({ ...decision, checks: { ...decision.checks, improvement: false } }).success, false);
  assert.equal(policyApproval.safeParse({ ...decision, expectedUpdatedAt: undefined }).success, false);
});
test('la comunicación interna debe aportar evidencia de comprensión y fechas reales', () => {
  const body = { tenantId: 'tenant', policyId: 'policy', audience: 'Personal', audienceType: 'INTERNA', method: 'Taller', date: '2026-01-02', evidence: 'Acta 01' };
  assert.equal(policyCommunicationInput.safeParse(body).success, false);
  assert.equal(policyCommunicationInput.safeParse({ ...body, understandingEvidence: 'Evaluación del taller y aplicación al trabajo' }).success, true);
  assert.equal(policyCommunicationInput.safeParse({ ...body, audienceType: 'EXTERNA' }).success, true);
  assert.equal(policyCommunicationInput.safeParse({ ...body, audienceType: 'EXTERNA', date: '2026-02-30' }).success, false);
  assert.equal(policyCommunicationInput.safeParse({ ...body, audienceType: 'EXTERNA', date: '2999-01-01' }).success, false);
});
test('borradores rechazan contenido vacío y las revisiones deben avanzar', () => {
  assert.equal(policyInput.safeParse({ tenantId: 'tenant', title: 'Política', content: ' ', version: '1.0' }).success, false);
  assert.equal(policyRevisionIsNewer('1.10', '1.9'), true);
  assert.equal(policyRevisionIsNewer('1.0', '2.0'), false);
  assert.equal(policyRevisionIsNewer('1.0', '1.0'), false);
});
test('las sesiones rechazan expiración, manipulación y segmentos adicionales', () => {
  const token = createSessionToken('user', 60);
  assert.equal(verifySessionToken(token).userId, 'user');
  assert.equal(verifySessionToken(token + '.extra'), null);
  assert.equal(verifySessionToken(token.slice(0, -2) + 'xx'), null);
  assert.equal(verifySessionToken(createSessionToken('user', -1)), null);
});
