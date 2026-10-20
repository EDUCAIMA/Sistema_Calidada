const assert = require('node:assert/strict');
const test = require('node:test');
const { riskPlanSchema, changePlanSchema, planReviewSchema, riskLevel, canEditPlan, reviewStatus } = require('../src/lib/planning-validation.ts');

const riskPlan = {
    kind: 'RIESGO', description: 'Falla en trazabilidad de lotes', sourceType: 'CONTEXTO', sourceId: 'dofa-real',
    sourceReference: 'Debilidad del control de registros', processId: 'proceso-real', cause: 'Registros incompletos',
    consequence: 'Producto no conforme no identificable', probability: 3, impact: 4, existingControls: 'Revisión semanal',
    treatmentPlan: 'Validar cada lote en recepción', treatmentJustification: 'La verificación evita pérdida de trazabilidad',
    resources: 'Dos horas semanales del supervisor', integrationPlan: 'Actualizar control en recepción y capacitar al equipo',
    responsibleId: 'responsable-real', dueDate: '2026-11-01', evaluationMethod: '100% lotes identificados durante un mes',
    evaluationDueDate: '2026-12-01', status: 'ABIERTA',
};
const changePlan = {
    title: 'Cambio de proceso de recepción', purpose: 'Reducir errores de identificación', consequences: 'Ajustar instrucciones y entrenar al equipo',
    integrityMeasures: 'Mantener revisión independiente durante la transición', resources: 'Supervisión disponible por dos semanas',
    responsibilityChanges: 'Supervisor valida y operador registra', implementationPlan: 'Piloto, capacitación y despliegue',
    evaluationMethod: 'Verificar 30 lotes sin errores', processId: 'proceso-real', responsibleId: 'responsable-real',
    dueDate: '2026-11-01', status: 'PLANIFICADO',
};

test('riesgos y oportunidades requieren origen, acción, integración y evaluación', () => {
    assert.equal(riskPlanSchema.parse(riskPlan).kind, 'RIESGO');
    assert.equal(riskPlanSchema.parse({ ...riskPlan, kind: 'OPORTUNIDAD' }).kind, 'OPORTUNIDAD');
    for (const field of ['sourceId', 'sourceReference', 'treatmentPlan', 'treatmentJustification', 'resources', 'integrationPlan', 'responsibleId', 'evaluationMethod']) {
        assert.equal(riskPlanSchema.safeParse({ ...riskPlan, [field]: ' ' }).success, false, field);
    }
});

test('rechaza fechas inexistentes, secuencia de evaluación inválida y valoraciones fuera de escala', () => {
    for (const dueDate of ['2026-02-30', '2026-13-01', 'no-fecha']) assert.equal(riskPlanSchema.safeParse({ ...riskPlan, dueDate }).success, false);
    assert.equal(riskPlanSchema.safeParse({ ...riskPlan, evaluationDueDate: '2026-10-01' }).success, false);
    for (const probability of [0, 6, 2.5, '', 'NaN', true, [2], null]) assert.equal(riskPlanSchema.safeParse({ ...riskPlan, probability }).success, false);
    assert.equal(riskPlanSchema.safeParse({ ...riskPlan, status: 'CERRADA' }).success, false);
});

test('cambios exigen todos los elementos 6.3 antes de ejecutarse', () => {
    assert.equal(changePlanSchema.safeParse(changePlan).success, true);
    for (const field of ['purpose', 'consequences', 'integrityMeasures', 'resources', 'responsibilityChanges', 'implementationPlan', 'evaluationMethod']) {
        assert.equal(changePlanSchema.safeParse({ ...changePlan, [field]: '' }).success, false, field);
    }
    assert.equal(changePlanSchema.safeParse({ ...changePlan, status: 'COMPLETADO' }).success, false);
});

test('la evaluación exige evidencia y seguimiento cuando no es eficaz', () => {
    const review = { result: 'EFICAZ', evaluation: '30 lotes trazables de 30', evidence: 'Informe de verificación, registro R-15' };
    assert.equal(planReviewSchema.safeParse(review).success, true);
    assert.equal(planReviewSchema.safeParse({ ...review, evidence: '' }).success, false);
    assert.equal(planReviewSchema.safeParse({ ...review, result: 'NO_EFICAZ' }).success, false);
    assert.equal(planReviewSchema.safeParse({ ...review, result: 'NO_EFICAZ', followUp: 'Reentrenar y verificar 30 lotes más' }).success, true);
    assert.equal(planReviewSchema.safeParse({ ...review, residualProbability: 2 }).success, false);
    assert.equal(planReviewSchema.safeParse({ ...review, residualProbability: 2, residualImpact: 3 }).success, true);
});

test('solo ejecución admite revisión; cierre eficaz queda inmutable', () => {
    assert.throws(() => reviewStatus('risk', 'ABIERTA', 'EFICAZ'));
    assert.throws(() => reviewStatus('change', 'PLANIFICADO', 'EFICAZ'));
    assert.throws(() => reviewStatus('risk', 'CERRADA', 'EFICAZ'));
    assert.throws(() => reviewStatus('change', 'COMPLETADO', 'EFICAZ'));
    assert.equal(reviewStatus('risk', 'EN_PROGRESO', 'NO_EFICAZ'), 'EN_PROGRESO');
    assert.equal(reviewStatus('risk', 'EN_PROGRESO', 'EFICAZ'), 'CERRADA');
    assert.equal(reviewStatus('change', 'EN_EJECUCION', 'EFICAZ'), 'COMPLETADO');
    assert.equal(canEditPlan('risk', 'CERRADA', 'ABIERTA'), false);
    assert.equal(canEditPlan('change', 'COMPLETADO', 'EN_EJECUCION'), false);
    assert.equal(canEditPlan('risk', 'ABIERTA', 'CERRADA'), false);
    assert.equal(canEditPlan('change', 'PLANIFICADO', 'EN_EJECUCION'), true);
});

test('clasificación calcula límites coherentes a partir de la escala', () => {
    assert.equal(riskLevel(1, 3), 'BAJO');
    assert.equal(riskLevel(2, 2), 'MEDIO');
    assert.equal(riskLevel(3, 3), 'ALTO');
    assert.equal(riskLevel(3, 5), 'CRITICO');
});
