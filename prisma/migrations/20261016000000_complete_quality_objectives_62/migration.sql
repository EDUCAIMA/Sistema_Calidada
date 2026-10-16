-- Evolución aditiva del módulo ISO 9001:2015, numerales 6.2.1 y 6.2.2.
-- IF NOT EXISTS permite aplicarla con seguridad en bases locales o desplegadas
-- que ya tengan alguna de estas columnas.
ALTER TABLE "QualityObjective"
  ADD COLUMN IF NOT EXISTS "policyId" TEXT,
  ADD COLUMN IF NOT EXISTS "processId" TEXT,
  ADD COLUMN IF NOT EXISTS "organizationalLevel" TEXT,
  ADD COLUMN IF NOT EXISTS "applicableRequirements" TEXT,
  ADD COLUMN IF NOT EXISTS "relevance" TEXT,
  ADD COLUMN IF NOT EXISTS "nextEvaluationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "communicationRecipients" TEXT,
  ADD COLUMN IF NOT EXISTS "communicationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "communicationEvidence" TEXT;

ALTER TABLE "ObjectiveTracking"
  ADD COLUMN IF NOT EXISTS "actual" TEXT;

CREATE INDEX IF NOT EXISTS "QualityObjective_tenantId_idx"
  ON "QualityObjective"("tenantId");
CREATE INDEX IF NOT EXISTS "QualityObjective_policyId_idx"
  ON "QualityObjective"("policyId");
CREATE INDEX IF NOT EXISTS "QualityObjective_processId_idx"
  ON "QualityObjective"("processId");
CREATE INDEX IF NOT EXISTS "QualityObjective_responsibleId_idx"
  ON "QualityObjective"("responsibleId");
