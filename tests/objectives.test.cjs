const { test } = require('node:test');
const assert = require('node:assert/strict');
require('./register.cjs');
const { calculateNextEvaluationDate, calculatePlanEvaluationDate, calculateQualityObjectiveStatus, objectivePlanSchema, objectiveTrackingSchema } = require('../src/lib/quality-objectives.ts');

const plan = {
  tenantId: 'tenant-a', policyId: 'policy-a', processId: 'process-a', responsibleId: 'user-a',
  organizationalLevel: 'Operativo', description: 'Reducir devoluciones', indicator: 'Porcentaje de devoluciones',
  target: 'Menor o igual al 2%', actual: '4%', applicableRequirements: 'Acuerdos con clientes',
  relevance: 'Conformidad del producto y satisfacción del cliente', actionPlan: 'Capacitar e inspeccionar en recepción.',
  evaluationMethod: 'Devoluciones / ventas x 100; reporte mensual; cumple si el resultado es menor o igual a 2.',
  resources: '40 horas; presupuesto de capacitación', deadline: '2027-12-31', evaluationFreq: 'Mensual',
  communicationRecipients: 'Equipo operativo', communicationDate: '2025-01-20', communicationEvidence: 'Acta 20-01-2025',
};
const expectedUpdatedAt = '2026-10-18T00:00:00.000Z';
const measurement = { tenantId: 'tenant-a', objectiveId: 'objective-a', expectedUpdatedAt, progress: 100, actual: '3%', targetMet: false, note: 'Acciones ejecutadas; persisten devoluciones; reforzar inspección.', evidence: 'Reporte mensual 001' };

test('100% de acciones no demuestra que la meta se cumplió', () => {
  assert.equal(calculateQualityObjectiveStatus({ progress: 100, deadline: new Date('2027-12-31'), now: new Date('2026-10-18'), targetMet: false }), 'EN_PROGRESO');
  assert.equal(calculateQualityObjectiveStatus({ progress: 100, deadline: new Date('2027-12-31'), now: new Date('2026-10-18') }), 'EN_PROGRESO');
  assert.equal(calculateQualityObjectiveStatus({ progress: 25, targetMet: true, deadline: new Date('2027-12-31') }), 'CUMPLIDO');
});

test('un plazo vence al terminar su día; seguimiento vencido alerta y archivo conserva estado', () => {
  const objective = { deadline: new Date('2026-10-18'), now: new Date('2026-10-18T23:59:00Z') };
  assert.equal(calculateQualityObjectiveStatus(objective), 'EN_PROGRESO');
  assert.equal(calculateQualityObjectiveStatus({ ...objective, now: new Date('2026-10-19') }), 'ATRASADO');
  assert.equal(calculateQualityObjectiveStatus({ ...objective, nextEvaluationDate: new Date('2026-10-17') }), 'EN_RIESGO');
  assert.equal(calculateQualityObjectiveStatus({ ...objective, targetMet: true, archivedAt: new Date('2026-10-18') }), 'ARCHIVADO');
});

test('la siguiente evaluación respeta finales de mes y año bisiesto', () => {
  assert.equal(calculateNextEvaluationDate('Mensual', new Date('2026-01-31T12:00:00Z')).toISOString(), '2026-02-28T12:00:00.000Z');
  assert.equal(calculateNextEvaluationDate('Mensual', new Date('2024-01-31T12:00:00Z')).toISOString(), '2024-02-29T12:00:00.000Z');
  assert.equal(calculateNextEvaluationDate('Anual', new Date('2024-02-29T12:00:00Z')).toISOString(), '2025-02-28T12:00:00.000Z');
  assert.equal(calculateNextEvaluationDate('Cuando sea posible'), null);
});

test('cambiar frecuencia adelanta la evaluación sin prorrogar pendientes ni alterar una frecuencia intacta', () => {
  const now = new Date('2026-10-18T12:00:00Z');
  const annual = { evaluationFreq: 'Anual', nextEvaluationDate: new Date('2027-10-18T12:00:00Z') };
  assert.equal(calculatePlanEvaluationDate('Mensual', annual, now).toISOString(), '2026-11-18T12:00:00.000Z');
  assert.equal(calculatePlanEvaluationDate('Anual', annual, now), annual.nextEvaluationDate);
  const monthly = { evaluationFreq: 'Mensual', nextEvaluationDate: new Date('2026-11-01T12:00:00Z') };
  assert.equal(calculatePlanEvaluationDate('Anual', monthly, now), monthly.nextEvaluationDate);
  const overdue = { evaluationFreq: 'Anual', nextEvaluationDate: new Date('2026-01-01T12:00:00Z') };
  assert.equal(calculatePlanEvaluationDate('Mensual', overdue, now), overdue.nextEvaluationDate);
  assert.equal(calculatePlanEvaluationDate('Mensual', null, now).toISOString(), '2026-11-18T12:00:00.000Z');
});

test('plan exige acciones, metodología y evidencia de comunicación; rechaza fechas imposibles', () => {
  assert.equal(objectivePlanSchema.safeParse(plan).success, true);
  for (const field of ['actionPlan', 'evaluationMethod', 'communicationEvidence', 'resources', 'responsibleId']) {
    assert.equal(objectivePlanSchema.safeParse({ ...plan, [field]: '  ' }).success, false, field);
  }
  assert.equal(objectivePlanSchema.safeParse({ ...plan, deadline: '2027-02-30' }).success, false);
  assert.equal(objectivePlanSchema.safeParse({ ...plan, communicationDate: '2099-01-01', deadline: '2099-12-31' }).success, false);
  assert.equal(objectivePlanSchema.safeParse({ ...plan, deadline: '2025-01-01' }).success, false);
  assert.equal(objectivePlanSchema.safeParse({ ...plan, evaluationFreq: 'A veces' }).success, false);
});

test('las revisiones requieren motivo y no aceptan alterar avance ni cumplimiento desde el plan', () => {
  assert.equal(objectivePlanSchema.safeParse({ ...plan, id: 'objective-a' }).success, false);
  const result = objectivePlanSchema.parse({ ...plan, id: 'objective-a', expectedUpdatedAt, changeReason: 'Nueva fuente de datos', progress: 100, targetMet: true });
  assert.equal(result.progress, undefined);
  assert.equal(result.targetMet, undefined);
});

test('ediciones y mediciones exigen la versión ISO que el cliente consultó', () => {
  const revision = { ...plan, id: 'objective-a', changeReason: 'Actualizar recursos' };
  assert.equal(objectivePlanSchema.safeParse(revision).success, false);
  assert.equal(objectivePlanSchema.safeParse({ ...revision, expectedUpdatedAt }).success, true);
  for (const version of [undefined, null, '', '2026-10-18', 'not-a-date', '2026-02-30T12:00:00Z']) {
    assert.equal(objectivePlanSchema.safeParse({ ...revision, expectedUpdatedAt: version }).success, false);
    assert.equal(objectiveTrackingSchema.safeParse({ ...measurement, expectedUpdatedAt: version }).success, false);
  }
});

test('seguimiento exige evidencia, decisión explícita y avance entero dentro de rango', () => {
  assert.equal(objectiveTrackingSchema.safeParse(measurement).success, true);
  for (const value of [-1, 101, 10.5, '100', null, NaN]) {
    assert.equal(objectiveTrackingSchema.safeParse({ ...measurement, progress: value }).success, false);
  }
  for (const value of [undefined, null, 'true', 'false', 1]) {
    assert.equal(objectiveTrackingSchema.safeParse({ ...measurement, targetMet: value }).success, false);
  }
  assert.equal(objectiveTrackingSchema.safeParse({ ...measurement, evidence: ' ' }).success, false);
  assert.equal(objectiveTrackingSchema.safeParse({ ...measurement, actual: ' ' }).success, false);
});
