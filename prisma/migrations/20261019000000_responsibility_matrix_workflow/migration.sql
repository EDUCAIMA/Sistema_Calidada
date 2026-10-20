-- Matriz versionada de responsabilidades y autoridades (ISO 9001:2015, 5.3).

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "topManagement" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "ResponsibilityMatrix" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "code" TEXT NOT NULL DEFAULT 'SGC-MAT-01',
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'BORRADOR',
  "scope" TEXT NOT NULL DEFAULT 'Todos los procesos del Sistema de Gestión de la Calidad',
  "supersedesId" TEXT,
  "submittedById" TEXT,
  "submittedByName" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedById" TEXT,
  "approvedByName" TEXT,
  "approvedAt" TIMESTAMP(3),
  "approvalNote" TEXT,
  "effectiveAt" TIMESTAMP(3),
  "nextReviewAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "updatedByName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResponsibilityMatrix_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ResponsibilityMatrix_version_check" CHECK ("version" > 0),
  CONSTRAINT "ResponsibilityMatrix_status_check" CHECK ("status" IN ('BORRADOR', 'EN_REVISION', 'VIGENTE', 'OBSOLETA'))
);

ALTER TABLE "ResponsibilityAssignment"
  ADD COLUMN IF NOT EXISTS "matrixId" TEXT,
  ADD COLUMN IF NOT EXISTS "processId" TEXT,
  ADD COLUMN IF NOT EXISTS "processName" TEXT,
  ADD COLUMN IF NOT EXISTS "raciRoles" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "communicationMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "communicationAudience" TEXT,
  ADD COLUMN IF NOT EXISTS "understandingEvidence" TEXT;

-- Evita asociar filas a una versión ambigua si se retoma una instalación parcial.
DO $matrix_version_preflight$
DECLARE
  issue TEXT;
BEGIN
  SELECT format('empresa=%s, versión=%s, filas=%s', d."tenantId", d."version", d.total)
  INTO issue
  FROM (
    SELECT "tenantId", "version", count(*) AS total
    FROM "ResponsibilityMatrix"
    GROUP BY "tenantId", "version"
    HAVING count(*) > 1
    ORDER BY "tenantId", "version"
    LIMIT 1
  ) d;

  IF issue IS NOT NULL THEN
    RAISE EXCEPTION 'No se puede migrar la matriz 5.3: hay versiones duplicadas (%).', issue
      USING HINT = 'Consolide las versiones duplicadas conservando el historial antes de volver a ejecutar la migración.';
  END IF;
END
$matrix_version_preflight$;

-- Si había filas del primer módulo 5.3, se conservan en un borrador inicial.
-- Los actores se toman de filas completas para no combinar el ID de una persona
-- con el nombre de otra.
WITH created_actor AS (
  SELECT DISTINCT ON (a."tenantId")
    a."tenantId", a."createdById", a."createdByName"
  FROM "ResponsibilityAssignment" a
  WHERE a."matrixId" IS NULL
  ORDER BY a."tenantId", a."createdAt", a."id"
),
updated_actor AS (
  SELECT DISTINCT ON (a."tenantId")
    a."tenantId", a."updatedById", a."updatedByName"
  FROM "ResponsibilityAssignment" a
  WHERE a."matrixId" IS NULL
  ORDER BY a."tenantId", a."updatedAt" DESC, a."id" DESC
)
INSERT INTO "ResponsibilityMatrix" (
  "id", "tenantId", "version", "status", "createdById", "createdByName", "updatedById", "updatedByName", "updatedAt"
)
SELECT
  'rm_' || substr(md5(c."tenantId" || clock_timestamp()::text), 1, 24),
  c."tenantId", 1, 'BORRADOR', c."createdById", c."createdByName", u."updatedById", u."updatedByName", CURRENT_TIMESTAMP
FROM created_actor c
JOIN updated_actor u ON u."tenantId" = c."tenantId"
WHERE NOT EXISTS (
  SELECT 1
  FROM "ResponsibilityMatrix" m
  WHERE m."tenantId" = c."tenantId" AND m."version" = 1
);

UPDATE "ResponsibilityAssignment" a
SET "matrixId" = m."id"
FROM "ResponsibilityMatrix" m
WHERE a."matrixId" IS NULL AND m."tenantId" = a."tenantId" AND m."version" = 1;

-- El DEFAULT solo permite rellenar filas históricas. Las filas nuevas deben
-- declarar explícitamente al menos una función RACI en la aplicación.
UPDATE "ResponsibilityAssignment"
SET "raciRoles" = '[]'::jsonb
WHERE "raciRoles" IS NULL;

ALTER TABLE "ResponsibilityAssignment"
  ALTER COLUMN "raciRoles" SET NOT NULL,
  ALTER COLUMN "raciRoles" DROP DEFAULT;

-- Valida todo antes de crear índices o claves foráneas, con ejemplos que
-- permitan corregir datos históricos sin perderlos.
DO $integrity_preflight$
DECLARE
  issue TEXT;
  relation_name TEXT;
  record_id TEXT;
  reference_id TEXT;
BEGIN
  SELECT format('id=%s, empresa=%s, versión=%s', "id", "tenantId", coalesce("version"::TEXT, '<nula>'))
  INTO issue
  FROM "ResponsibilityMatrix"
  WHERE "version" IS NULL OR "version" <= 0
  ORDER BY "tenantId", "id"
  LIMIT 1;
  IF issue IS NOT NULL THEN
    RAISE EXCEPTION 'No se puede migrar la matriz 5.3: existe una versión no positiva (%).', issue
      USING HINT = 'Asigne un número de versión mayor que cero y vuelva a ejecutar la migración.';
  END IF;

  issue := NULL;
  SELECT format('id=%s, empresa=%s, estado=%s', "id", "tenantId", coalesce("status", '<nulo>'))
  INTO issue
  FROM "ResponsibilityMatrix"
  WHERE "status" IS NULL OR "status" NOT IN ('BORRADOR', 'EN_REVISION', 'VIGENTE', 'OBSOLETA')
  ORDER BY "tenantId", "id"
  LIMIT 1;
  IF issue IS NOT NULL THEN
    RAISE EXCEPTION 'No se puede migrar la matriz 5.3: existe un estado desconocido (%).', issue
      USING HINT = 'Use únicamente BORRADOR, EN_REVISION, VIGENTE u OBSOLETA.';
  END IF;

  issue := NULL;
  SELECT format('empresa=%s, versión=%s, filas=%s', d."tenantId", d."version", d.total)
  INTO issue
  FROM (
    SELECT "tenantId", "version", count(*) AS total
    FROM "ResponsibilityMatrix"
    GROUP BY "tenantId", "version"
    HAVING count(*) > 1
    ORDER BY "tenantId", "version"
    LIMIT 1
  ) d;
  IF issue IS NOT NULL THEN
    RAISE EXCEPTION 'No se puede migrar la matriz 5.3: hay versiones duplicadas (%).', issue
      USING HINT = 'Consolide las versiones duplicadas conservando el historial.';
  END IF;

  issue := NULL;
  SELECT format('empresa=%s, vigentes=%s', d."tenantId", d.total)
  INTO issue
  FROM (
    SELECT "tenantId", count(*) AS total
    FROM "ResponsibilityMatrix"
    WHERE "status" = 'VIGENTE'
    GROUP BY "tenantId"
    HAVING count(*) > 1
    ORDER BY "tenantId"
    LIMIT 1
  ) d;
  IF issue IS NOT NULL THEN
    RAISE EXCEPTION 'No se puede migrar la matriz 5.3: hay más de una versión vigente (%).', issue
      USING HINT = 'Marque como OBSOLETA toda versión reemplazada antes de volver a ejecutar la migración.';
  END IF;

  issue := NULL;
  SELECT format('empresa=%s, revisiones abiertas=%s', d."tenantId", d.total)
  INTO issue
  FROM (
    SELECT "tenantId", count(*) AS total
    FROM "ResponsibilityMatrix"
    WHERE "status" IN ('BORRADOR', 'EN_REVISION')
    GROUP BY "tenantId"
    HAVING count(*) > 1
    ORDER BY "tenantId"
    LIMIT 1
  ) d;
  IF issue IS NOT NULL THEN
    RAISE EXCEPTION 'No se puede migrar la matriz 5.3: hay más de una revisión abierta (%).', issue
      USING HINT = 'Conserve una sola versión BORRADOR o EN_REVISION por empresa y archive las demás preservando su evidencia.';
  END IF;

  issue := NULL;
  SELECT format(
    'matriz=%s, proceso=%s, persona=%s, cargo=%s, filas=%s',
    d."matrixId", coalesce(d."processId", '<sin proceso>'), d."assignedToId", d."title", d.total
  )
  INTO issue
  FROM (
    SELECT "matrixId", "processId", "assignedToId", "title", count(*) AS total
    FROM "ResponsibilityAssignment"
    WHERE "active" = true
    GROUP BY "matrixId", "processId", "assignedToId", "title"
    HAVING count(*) > 1
    ORDER BY "matrixId", "assignedToId", "title"
    LIMIT 1
  ) d;
  IF issue IS NOT NULL THEN
    RAISE EXCEPTION 'No se puede migrar la matriz 5.3: hay asignaciones activas duplicadas (%).', issue
      USING HINT = 'Archive el duplicado y conserve una sola fila activa para la misma matriz, proceso, persona y cargo.';
  END IF;

  issue := NULL;
  SELECT format('id=%s, empresa=%s', "id", "tenantId")
  INTO issue
  FROM "ResponsibilityAssignment"
  WHERE "matrixId" IS NULL
  ORDER BY "tenantId", "id"
  LIMIT 1;
  IF issue IS NOT NULL THEN
    RAISE EXCEPTION 'No se puede migrar la matriz 5.3: una asignación no pudo asociarse a una versión (%).', issue
      USING HINT = 'Cree o identifique la versión de la empresa y asigne su matrixId antes de reintentar.';
  END IF;

  SELECT p.relation_name, p.record_id, p.reference_id
  INTO relation_name, record_id, reference_id
  FROM (
    SELECT 'ResponsibilityMatrix.tenantId'::TEXT AS relation_name, m."id" AS record_id, m."tenantId" AS reference_id
    FROM "ResponsibilityMatrix" m
    WHERE NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = m."tenantId")

    UNION ALL

    SELECT 'ResponsibilityMatrix.submittedById', m."id", m."tenantId" || '/' || m."submittedById"
    FROM "ResponsibilityMatrix" m
    WHERE m."submittedById" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "User" u
        WHERE u."tenantId" = m."tenantId" AND u."id" = m."submittedById"
      )

    UNION ALL

    SELECT 'ResponsibilityMatrix.approvedById', m."id", m."tenantId" || '/' || m."approvedById"
    FROM "ResponsibilityMatrix" m
    WHERE m."approvedById" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "User" u
        WHERE u."tenantId" = m."tenantId" AND u."id" = m."approvedById"
      )

    UNION ALL

    SELECT 'ResponsibilityMatrix.supersedesId', m."id", m."tenantId" || '/' || m."supersedesId"
    FROM "ResponsibilityMatrix" m
    WHERE m."supersedesId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "ResponsibilityMatrix" previous
        WHERE previous."tenantId" = m."tenantId" AND previous."id" = m."supersedesId"
      )

    UNION ALL

    SELECT 'ResponsibilityAssignment.tenantId', a."id", a."tenantId"
    FROM "ResponsibilityAssignment" a
    WHERE NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = a."tenantId")

    UNION ALL

    SELECT 'ResponsibilityAssignment.matrixId', a."id", a."tenantId" || '/' || a."matrixId"
    FROM "ResponsibilityAssignment" a
    WHERE NOT EXISTS (
      SELECT 1 FROM "ResponsibilityMatrix" m
      WHERE m."tenantId" = a."tenantId" AND m."id" = a."matrixId"
    )

    UNION ALL

    SELECT 'ResponsibilityAssignment.processId', a."id", a."tenantId" || '/' || a."processId"
    FROM "ResponsibilityAssignment" a
    WHERE a."processId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "Process" process
        WHERE process."tenantId" = a."tenantId" AND process."id" = a."processId"
      )

    UNION ALL

    SELECT 'ResponsibilityAssignment.assignedToId', a."id", a."tenantId" || '/' || a."assignedToId"
    FROM "ResponsibilityAssignment" a
    WHERE NOT EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."tenantId" = a."tenantId" AND u."id" = a."assignedToId"
    )

    UNION ALL

    SELECT 'ResponsibilityAssignment.acknowledgedById', a."id", a."tenantId" || '/' || a."acknowledgedById"
    FROM "ResponsibilityAssignment" a
    WHERE a."acknowledgedById" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "User" u
        WHERE u."tenantId" = a."tenantId" AND u."id" = a."acknowledgedById"
      )
  ) p
  ORDER BY p.relation_name, p.record_id
  LIMIT 1;

  IF relation_name IS NOT NULL THEN
    RAISE EXCEPTION 'No se puede migrar la matriz 5.3: referencia inexistente o de otra empresa en %, registro %, referencia %.', relation_name, record_id, reference_id
      USING HINT = 'Corrija la referencia conservando el dato histórico; las relaciones de la matriz deben permanecer dentro de la misma empresa.';
  END IF;
END
$integrity_preflight$;

ALTER TABLE "ResponsibilityAssignment"
  ALTER COLUMN "matrixId" SET NOT NULL;

ALTER TABLE "ResponsibilityMatrix"
  ALTER COLUMN "version" SET NOT NULL,
  ALTER COLUMN "status" SET NOT NULL;

-- Claves candidatas necesarias para relaciones compuestas por empresa.
CREATE UNIQUE INDEX IF NOT EXISTS "User_tenantId_id_key"
  ON "User"("tenantId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Process_tenantId_id_key"
  ON "Process"("tenantId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "ResponsibilityMatrix_tenantId_id_key"
  ON "ResponsibilityMatrix"("tenantId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "ResponsibilityMatrix_tenantId_version_key"
  ON "ResponsibilityMatrix"("tenantId", "version");

CREATE INDEX IF NOT EXISTS "ResponsibilityMatrix_tenantId_status_idx"
  ON "ResponsibilityMatrix"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ResponsibilityMatrix_tenantId_supersedesId_idx"
  ON "ResponsibilityMatrix"("tenantId", "supersedesId");
CREATE INDEX IF NOT EXISTS "ResponsibilityMatrix_tenantId_submittedById_idx"
  ON "ResponsibilityMatrix"("tenantId", "submittedById");
CREATE INDEX IF NOT EXISTS "ResponsibilityMatrix_tenantId_approvedById_idx"
  ON "ResponsibilityMatrix"("tenantId", "approvedById");
-- Estos índices parciales y el índice funcional de asignaciones son
-- invariantes intencionales administradas por SQL: Prisma no los representa.
CREATE UNIQUE INDEX IF NOT EXISTS "ResponsibilityMatrix_one_current_per_tenant_key"
  ON "ResponsibilityMatrix"("tenantId")
  WHERE "status" = 'VIGENTE';
CREATE UNIQUE INDEX IF NOT EXISTS "ResponsibilityMatrix_one_open_per_tenant_key"
  ON "ResponsibilityMatrix"("tenantId")
  WHERE "status" IN ('BORRADOR', 'EN_REVISION');

CREATE INDEX IF NOT EXISTS "ResponsibilityAssignment_matrixId_active_idx"
  ON "ResponsibilityAssignment"("matrixId", "active");
CREATE INDEX IF NOT EXISTS "ResponsibilityAssignment_processId_idx"
  ON "ResponsibilityAssignment"("processId");
CREATE INDEX IF NOT EXISTS "ResponsibilityAssignment_assignedToId_idx"
  ON "ResponsibilityAssignment"("assignedToId");
CREATE INDEX IF NOT EXISTS "ResponsibilityAssignment_tenantId_acknowledgedById_idx"
  ON "ResponsibilityAssignment"("tenantId", "acknowledgedById");
CREATE UNIQUE INDEX IF NOT EXISTS "ResponsibilityAssignment_active_identity_key"
  ON "ResponsibilityAssignment"("matrixId", coalesce("processId", ''), "assignedToId", "title")
  WHERE "active" = true;

DO $constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityMatrix'))
      AND conname = 'ResponsibilityMatrix_version_check'
  ) THEN
    ALTER TABLE "ResponsibilityMatrix" ADD CONSTRAINT "ResponsibilityMatrix_version_check"
      CHECK ("version" > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityMatrix'))
      AND conname = 'ResponsibilityMatrix_status_check'
  ) THEN
    ALTER TABLE "ResponsibilityMatrix" ADD CONSTRAINT "ResponsibilityMatrix_status_check"
      CHECK ("status" IN ('BORRADOR', 'EN_REVISION', 'VIGENTE', 'OBSOLETA'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityMatrix'))
      AND conname = 'ResponsibilityMatrix_tenantId_fkey'
  ) THEN
    ALTER TABLE "ResponsibilityMatrix" ADD CONSTRAINT "ResponsibilityMatrix_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityMatrix'))
      AND conname = 'ResponsibilityMatrix_tenantId_supersedesId_fkey'
  ) THEN
    ALTER TABLE "ResponsibilityMatrix" ADD CONSTRAINT "ResponsibilityMatrix_tenantId_supersedesId_fkey"
      FOREIGN KEY ("tenantId", "supersedesId") REFERENCES "ResponsibilityMatrix"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityMatrix'))
      AND conname = 'ResponsibilityMatrix_tenantId_submittedById_fkey'
  ) THEN
    ALTER TABLE "ResponsibilityMatrix" ADD CONSTRAINT "ResponsibilityMatrix_tenantId_submittedById_fkey"
      FOREIGN KEY ("tenantId", "submittedById") REFERENCES "User"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityMatrix'))
      AND conname = 'ResponsibilityMatrix_tenantId_approvedById_fkey'
  ) THEN
    ALTER TABLE "ResponsibilityMatrix" ADD CONSTRAINT "ResponsibilityMatrix_tenantId_approvedById_fkey"
      FOREIGN KEY ("tenantId", "approvedById") REFERENCES "User"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
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
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityAssignment'))
      AND conname = 'ResponsibilityAssignment_tenantId_matrixId_fkey'
  ) THEN
    ALTER TABLE "ResponsibilityAssignment" ADD CONSTRAINT "ResponsibilityAssignment_tenantId_matrixId_fkey"
      FOREIGN KEY ("tenantId", "matrixId") REFERENCES "ResponsibilityMatrix"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityAssignment'))
      AND conname = 'ResponsibilityAssignment_tenantId_processId_fkey'
  ) THEN
    ALTER TABLE "ResponsibilityAssignment" ADD CONSTRAINT "ResponsibilityAssignment_tenantId_processId_fkey"
      FOREIGN KEY ("tenantId", "processId") REFERENCES "Process"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityAssignment'))
      AND conname = 'ResponsibilityAssignment_tenantId_assignedToId_fkey'
  ) THEN
    ALTER TABLE "ResponsibilityAssignment" ADD CONSTRAINT "ResponsibilityAssignment_tenantId_assignedToId_fkey"
      FOREIGN KEY ("tenantId", "assignedToId") REFERENCES "User"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'ResponsibilityAssignment'))
      AND conname = 'ResponsibilityAssignment_tenantId_acknowledgedById_fkey'
  ) THEN
    ALTER TABLE "ResponsibilityAssignment" ADD CONSTRAINT "ResponsibilityAssignment_tenantId_acknowledgedById_fkey"
      FOREIGN KEY ("tenantId", "acknowledgedById") REFERENCES "User"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$constraints$;

-- Si se retoma una instalación donde alguna FK quedó NOT VALID, la prevalidación
-- anterior garantiza que ya puede validarse de forma segura.
ALTER TABLE "ResponsibilityMatrix" VALIDATE CONSTRAINT "ResponsibilityMatrix_version_check";
ALTER TABLE "ResponsibilityMatrix" VALIDATE CONSTRAINT "ResponsibilityMatrix_status_check";
ALTER TABLE "ResponsibilityMatrix" VALIDATE CONSTRAINT "ResponsibilityMatrix_tenantId_fkey";
ALTER TABLE "ResponsibilityMatrix" VALIDATE CONSTRAINT "ResponsibilityMatrix_tenantId_supersedesId_fkey";
ALTER TABLE "ResponsibilityMatrix" VALIDATE CONSTRAINT "ResponsibilityMatrix_tenantId_submittedById_fkey";
ALTER TABLE "ResponsibilityMatrix" VALIDATE CONSTRAINT "ResponsibilityMatrix_tenantId_approvedById_fkey";
ALTER TABLE "ResponsibilityAssignment" VALIDATE CONSTRAINT "ResponsibilityAssignment_tenantId_fkey";
ALTER TABLE "ResponsibilityAssignment" VALIDATE CONSTRAINT "ResponsibilityAssignment_tenantId_matrixId_fkey";
ALTER TABLE "ResponsibilityAssignment" VALIDATE CONSTRAINT "ResponsibilityAssignment_tenantId_processId_fkey";
ALTER TABLE "ResponsibilityAssignment" VALIDATE CONSTRAINT "ResponsibilityAssignment_tenantId_assignedToId_fkey";
ALTER TABLE "ResponsibilityAssignment" VALIDATE CONSTRAINT "ResponsibilityAssignment_tenantId_acknowledgedById_fkey";
