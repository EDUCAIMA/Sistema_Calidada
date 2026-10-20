-- Additive only: existing document codes, versions and uploaded files are preserved.
CREATE TABLE IF NOT EXISTS "DocumentStandard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentStandard_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentStandard_tenantId_key" ON "DocumentStandard"("tenantId");

CREATE TABLE IF NOT EXISTS "DocumentCodeCounter" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "seriesKey" TEXT NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentCodeCounter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentCodeCounter_tenantId_seriesKey_key"
    ON "DocumentCodeCounter"("tenantId", "seriesKey");

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "documentTypeId" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "documentTypeName" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DocumentStandard_tenantId_fkey') THEN
    ALTER TABLE "DocumentStandard" ADD CONSTRAINT "DocumentStandard_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DocumentCodeCounter_tenantId_fkey') THEN
    ALTER TABLE "DocumentCodeCounter" ADD CONSTRAINT "DocumentCodeCounter_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
