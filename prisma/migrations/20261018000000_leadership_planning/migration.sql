-- AlterEnum
ALTER TYPE "PolicyStatus" ADD VALUE IF NOT EXISTS 'BORRADOR';

-- DropForeignKey
ALTER TABLE "Risk" DROP CONSTRAINT IF EXISTS "Risk_matrixId_fkey";

-- AlterTable
ALTER TABLE "Risk" ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
ADD COLUMN IF NOT EXISTS "createdByName" TEXT,
ADD COLUMN IF NOT EXISTS "evaluationDueDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "evaluationMethod" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "integrationPlan" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'RIESGO',
ADD COLUMN IF NOT EXISTS "resources" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "responsibleId" TEXT,
ADD COLUMN IF NOT EXISTS "sourceId" TEXT,
ADD COLUMN IF NOT EXISTS "sourceReference" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "sourceType" TEXT NOT NULL DEFAULT 'CONTEXTO',
ADD COLUMN IF NOT EXISTS "treatmentJustification" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "matrixId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Policy" ADD COLUMN IF NOT EXISTS "approvalChecks" JSONB,
ADD COLUMN IF NOT EXISTS "supersedesId" TEXT;

-- AlterTable
ALTER TABLE "PolicyApprovalEvent" ADD COLUMN IF NOT EXISTS "snapshot" JSONB;

-- AlterTable
ALTER TABLE "PolicyCommunication" ADD COLUMN IF NOT EXISTS "audienceType" TEXT NOT NULL DEFAULT 'INTERNA',
ADD COLUMN IF NOT EXISTS "registeredById" TEXT,
ADD COLUMN IF NOT EXISTS "understandingEvidence" TEXT;

-- AlterTable
ALTER TABLE "QualityObjective" ADD COLUMN IF NOT EXISTS "actionPlan" TEXT,
ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "evaluationMethod" TEXT,
ADD COLUMN IF NOT EXISTS "targetMet" BOOLEAN;

-- AlterTable
ALTER TABLE "ObjectiveTracking" ADD COLUMN IF NOT EXISTS "actorId" TEXT,
ADD COLUMN IF NOT EXISTS "actorName" TEXT,
ADD COLUMN IF NOT EXISTS "eventType" TEXT NOT NULL DEFAULT 'MEASUREMENT',
ADD COLUMN IF NOT EXISTS "evidence" TEXT,
ADD COLUMN IF NOT EXISTS "snapshot" JSONB,
ADD COLUMN IF NOT EXISTS "targetMet" BOOLEAN;

-- Si una columna ya existía por una sincronización previa no registrada,
-- normaliza solamente los DEFAULT/NOT NULL exigidos por el esquema actual.
UPDATE "Risk" SET
  "evaluationMethod" = coalesce("evaluationMethod", ''),
  "integrationPlan" = coalesce("integrationPlan", ''),
  "kind" = coalesce("kind", 'RIESGO'),
  "resources" = coalesce("resources", ''),
  "sourceReference" = coalesce("sourceReference", ''),
  "sourceType" = coalesce("sourceType", 'CONTEXTO'),
  "treatmentJustification" = coalesce("treatmentJustification", '');

ALTER TABLE "Risk"
  ALTER COLUMN "evaluationMethod" SET DEFAULT '',
  ALTER COLUMN "evaluationMethod" SET NOT NULL,
  ALTER COLUMN "integrationPlan" SET DEFAULT '',
  ALTER COLUMN "integrationPlan" SET NOT NULL,
  ALTER COLUMN "kind" SET DEFAULT 'RIESGO',
  ALTER COLUMN "kind" SET NOT NULL,
  ALTER COLUMN "resources" SET DEFAULT '',
  ALTER COLUMN "resources" SET NOT NULL,
  ALTER COLUMN "sourceReference" SET DEFAULT '',
  ALTER COLUMN "sourceReference" SET NOT NULL,
  ALTER COLUMN "sourceType" SET DEFAULT 'CONTEXTO',
  ALTER COLUMN "sourceType" SET NOT NULL,
  ALTER COLUMN "treatmentJustification" SET DEFAULT '',
  ALTER COLUMN "treatmentJustification" SET NOT NULL;

UPDATE "PolicyCommunication"
SET "audienceType" = coalesce("audienceType", 'INTERNA');
ALTER TABLE "PolicyCommunication"
  ALTER COLUMN "audienceType" SET DEFAULT 'INTERNA',
  ALTER COLUMN "audienceType" SET NOT NULL;

UPDATE "ObjectiveTracking"
SET "eventType" = coalesce("eventType", 'MEASUREMENT');
ALTER TABLE "ObjectiveTracking"
  ALTER COLUMN "eventType" SET DEFAULT 'MEASUREMENT',
  ALTER COLUMN "eventType" SET NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "LeadershipCommitment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsibleId" TEXT NOT NULL,
    "responsibleName" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABIERTA',
    "evidence" TEXT,
    "result" TEXT,
    "customerRequirements" TEXT,
    "customerRisks" TEXT,
    "customerSatisfaction" TEXT,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ResponsibilityAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "assignedToName" TEXT NOT NULL,
    "reportsTo" TEXT NOT NULL,
    "responsibilities" TEXT NOT NULL,
    "authorities" TEXT NOT NULL,
    "sgcDuties" JSONB NOT NULL,
    "communicatedAt" TIMESTAMP(3),
    "communicationEvidence" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsibilityAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LeadershipRecordEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadershipRecordEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RiskReview" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "evaluation" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "followUp" TEXT,
    "residualProbability" INTEGER,
    "residualImpact" INTEGER,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "planSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChangePlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "consequences" TEXT NOT NULL,
    "integrityMeasures" TEXT NOT NULL,
    "resources" TEXT NOT NULL,
    "responsibilityChanges" TEXT NOT NULL,
    "implementationPlan" TEXT NOT NULL,
    "evaluationMethod" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "processName" TEXT NOT NULL,
    "responsibleId" TEXT NOT NULL,
    "responsibleName" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANIFICADO',
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChangeReview" (
    "id" TEXT NOT NULL,
    "changePlanId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "evaluation" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "followUp" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "planSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeadershipCommitment_tenantId_status_idx" ON "LeadershipCommitment"("tenantId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ResponsibilityAssignment_tenantId_active_idx" ON "ResponsibilityAssignment"("tenantId", "active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeadershipRecordEvent_tenantId_recordType_recordId_createdA_idx" ON "LeadershipRecordEvent"("tenantId", "recordType", "recordId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RiskReview_riskId_createdAt_idx" ON "RiskReview"("riskId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChangePlan_tenantId_status_idx" ON "ChangePlan"("tenantId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChangeReview_changePlanId_createdAt_idx" ON "ChangeReview"("changePlanId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Risk_tenantId_kind_status_idx" ON "Risk"("tenantId", "kind", "status");

-- AddForeignKey. La tabla y el nombre forman la identidad; otras tablas pueden
-- usar legalmente el mismo nombre de constraint en PostgreSQL.
DO $constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'Risk'))
      AND conname = 'Risk_matrixId_fkey'
  ) THEN
    ALTER TABLE "Risk" ADD CONSTRAINT "Risk_matrixId_fkey"
      FOREIGN KEY ("matrixId") REFERENCES "RiskMatrix"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'LeadershipCommitment'))
      AND conname = 'LeadershipCommitment_tenantId_fkey'
  ) THEN
    ALTER TABLE "LeadershipCommitment" ADD CONSTRAINT "LeadershipCommitment_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityAssignment'))
      AND conname = 'ResponsibilityAssignment_tenantId_fkey'
  ) THEN
    ALTER TABLE "ResponsibilityAssignment" ADD CONSTRAINT "ResponsibilityAssignment_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'LeadershipRecordEvent'))
      AND conname = 'LeadershipRecordEvent_tenantId_fkey'
  ) THEN
    ALTER TABLE "LeadershipRecordEvent" ADD CONSTRAINT "LeadershipRecordEvent_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'RiskReview'))
      AND conname = 'RiskReview_riskId_fkey'
  ) THEN
    ALTER TABLE "RiskReview" ADD CONSTRAINT "RiskReview_riskId_fkey"
      FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ChangePlan'))
      AND conname = 'ChangePlan_tenantId_fkey'
  ) THEN
    ALTER TABLE "ChangePlan" ADD CONSTRAINT "ChangePlan_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ChangeReview'))
      AND conname = 'ChangeReview_changePlanId_fkey'
  ) THEN
    ALTER TABLE "ChangeReview" ADD CONSTRAINT "ChangeReview_changePlanId_fkey"
      FOREIGN KEY ("changePlanId") REFERENCES "ChangePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$constraints$;

ALTER TABLE "Risk" VALIDATE CONSTRAINT "Risk_matrixId_fkey";
ALTER TABLE "LeadershipCommitment" VALIDATE CONSTRAINT "LeadershipCommitment_tenantId_fkey";
ALTER TABLE "ResponsibilityAssignment" VALIDATE CONSTRAINT "ResponsibilityAssignment_tenantId_fkey";
ALTER TABLE "LeadershipRecordEvent" VALIDATE CONSTRAINT "LeadershipRecordEvent_tenantId_fkey";
ALTER TABLE "RiskReview" VALIDATE CONSTRAINT "RiskReview_riskId_fkey";
ALTER TABLE "ChangePlan" VALIDATE CONSTRAINT "ChangePlan_tenantId_fkey";
ALTER TABLE "ChangeReview" VALIDATE CONSTRAINT "ChangeReview_changePlanId_fkey";

-- El avance histórico no acredita cumplimiento de la meta sin evaluación.
UPDATE "QualityObjective" SET "status" = 'EN_PROGRESO' WHERE "status" = 'CUMPLIDO' AND "targetMet" IS NULL;
