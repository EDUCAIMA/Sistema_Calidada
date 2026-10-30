-- Additive migration: retain all legacy audits, findings and corrective actions.
CREATE TABLE "AuditProgram" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3) NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuditProgram_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AuditProgram_dates_check" CHECK ("endDate" >= "startDate")
);
CREATE UNIQUE INDEX "AuditProgram_tenantId_id_key" ON "AuditProgram"("tenantId", "id");
CREATE UNIQUE INDEX "AuditProgram_tenantId_code_key" ON "AuditProgram"("tenantId", "code");
ALTER TABLE "Audit" ADD COLUMN "programId" TEXT, ADD COLUMN "code" TEXT,
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1, ADD COLUMN "teamMemberIds" JSONB NOT NULL DEFAULT '[]';
CREATE UNIQUE INDEX "Audit_tenantId_id_key" ON "Audit"("tenantId", "id");
CREATE UNIQUE INDEX "Audit_tenantId_code_key" ON "Audit"("tenantId", "code");
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_tenantId_programId_fkey" FOREIGN KEY ("tenantId", "programId") REFERENCES "AuditProgram"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "AuditDocument" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL, "programId" TEXT, "auditId" TEXT, "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'BORRADOR', "version" INTEGER NOT NULL DEFAULT 1, "revision" INTEGER NOT NULL DEFAULT 1,
  "data" JSONB NOT NULL, "approvedAt" TIMESTAMP(3), "approvedBy" TEXT, "approvedByName" TEXT, "exportSnapshot" JSONB,
  "updatedBy" TEXT NOT NULL, "updatedByName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuditDocument_parent_check" CHECK (("kind" = 'F1' AND "programId" IS NOT NULL AND "auditId" IS NULL) OR ("kind" IN ('F2','F3','F4','F5','F6','F7','F8') AND "auditId" IS NOT NULL AND "programId" IS NULL)),
  CONSTRAINT "AuditDocument_status_check" CHECK ("status" IN ('BORRADOR','EN_REVISION','APROBADO')),
  CONSTRAINT "AuditDocument_version_check" CHECK ("version" > 0 AND "revision" > 0),
  CONSTRAINT "AuditDocument_approval_check" CHECK ("status" <> 'APROBADO' OR ("approvedAt" IS NOT NULL AND "approvedBy" IS NOT NULL AND "exportSnapshot" IS NOT NULL)),
  CONSTRAINT "AuditDocument_tenantId_programId_fkey" FOREIGN KEY ("tenantId", "programId") REFERENCES "AuditProgram"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AuditDocument_tenantId_auditId_fkey" FOREIGN KEY ("tenantId", "auditId") REFERENCES "Audit"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AuditDocument_programId_kind_key" ON "AuditDocument"("programId", "kind");
CREATE UNIQUE INDEX "AuditDocument_auditId_kind_key" ON "AuditDocument"("auditId", "kind");
CREATE INDEX "AuditDocument_tenantId_kind_status_idx" ON "AuditDocument"("tenantId", "kind", "status");
CREATE TABLE "AuditDocumentEvent" (
  "id" TEXT PRIMARY KEY, "documentId" TEXT NOT NULL, "action" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "userId" TEXT NOT NULL, "userName" TEXT NOT NULL, "note" TEXT NOT NULL, "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditDocumentEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AuditDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "AuditDocumentEvent_documentId_createdAt_idx" ON "AuditDocumentEvent"("documentId", "createdAt");
