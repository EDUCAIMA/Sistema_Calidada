-- Flujo trazable de elaboración, revisión y aprobación documental (ISO 9001:2015, 7.5).
-- Es idempotente porque el proyecto ejecuta esta migración al iniciar cada despliegue.
ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "submittedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedByName" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedByName" TEXT;

CREATE TABLE IF NOT EXISTS "DocumentApprovalEvent" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "fromStatus" "DocumentStatus" NOT NULL,
  "toStatus" "DocumentStatus" NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentApprovalEvent_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'DocumentApprovalEvent_documentId_fkey'
  ) THEN
    ALTER TABLE "DocumentApprovalEvent"
      ADD CONSTRAINT "DocumentApprovalEvent_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "Document"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Document_tenantId_status_idx"
  ON "Document"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Document_tenantId_code_currentVersion_idx"
  ON "Document"("tenantId", "code", "currentVersion");
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentVersion_documentId_version_key"
  ON "DocumentVersion"("documentId", "version");
CREATE INDEX IF NOT EXISTS "DocumentApprovalEvent_documentId_createdAt_idx"
  ON "DocumentApprovalEvent"("documentId", "createdAt");
