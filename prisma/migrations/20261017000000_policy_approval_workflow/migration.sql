-- Flujo de aprobación trazable para la política de calidad (ISO 9001:2015, 5.2).
-- La migración es idempotente porque se ejecuta al iniciar cada despliegue.
ALTER TABLE "Policy"
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedByName" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PolicyApprovalEvent" (
  "id" TEXT NOT NULL,
  "policyId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "fromStatus" "PolicyStatus" NOT NULL,
  "toStatus" "PolicyStatus" NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PolicyApprovalEvent_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PolicyApprovalEvent_policyId_fkey'
  ) THEN
    ALTER TABLE "PolicyApprovalEvent"
      ADD CONSTRAINT "PolicyApprovalEvent_policyId_fkey"
      FOREIGN KEY ("policyId") REFERENCES "Policy"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Policy_tenantId_status_idx"
  ON "Policy"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "PolicyApprovalEvent_policyId_createdAt_idx"
  ON "PolicyApprovalEvent"("policyId", "createdAt");
