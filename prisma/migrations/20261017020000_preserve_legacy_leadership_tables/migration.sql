-- Conserva tablas heredadas que usan los mismos nombres elegidos por el módulo
-- ISO 9001:2015 5.3. No se elimina ni transforma información histórica.

DO $preflight$
DECLARE
  legacy_shape BOOLEAN;
  v53_shape BOOLEAN;
BEGIN
  IF to_regclass(format('%I.%I', current_schema(), 'ResponsibilityAssignment')) IS NOT NULL THEN
    SELECT
      COUNT(*) FILTER (WHERE column_name IN ('activityId', 'roleId', 'value')) = 3
        AND COUNT(*) FILTER (WHERE column_name IN ('id', 'tenantId')) = 0,
      COUNT(*) FILTER (WHERE column_name IN ('id', 'tenantId', 'title', 'assignedToId', 'responsibilities', 'authorities', 'sgcDuties')) = 7
        AND COUNT(*) FILTER (WHERE column_name IN ('activityId', 'roleId')) = 0
    INTO legacy_shape, v53_shape
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'ResponsibilityAssignment';

    IF legacy_shape THEN
      IF to_regclass(format('%I.%I', current_schema(), 'LegacyResponsibilityAssignment')) IS NOT NULL THEN
        RAISE EXCEPTION 'Existen ResponsibilityAssignment y LegacyResponsibilityAssignment heredadas; se requiere revisión manual';
      END IF;
      ALTER TABLE "ResponsibilityAssignment" RENAME TO "LegacyResponsibilityAssignment";
    ELSIF NOT v53_shape THEN
      RAISE EXCEPTION 'ResponsibilityAssignment tiene un esquema desconocido; no se modificó';
    END IF;
  END IF;
END
$preflight$;

DO $normalize$
BEGIN
  IF to_regclass(format('%I.%I', current_schema(), 'LegacyResponsibilityAssignment')) IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'LegacyResponsibilityAssignment')) AND conname = 'ResponsibilityAssignment_pkey') THEN
      ALTER TABLE "LegacyResponsibilityAssignment" RENAME CONSTRAINT "ResponsibilityAssignment_pkey" TO "LegacyResponsibilityAssignment_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'LegacyResponsibilityAssignment')) AND conname = 'ResponsibilityAssignment_activityId_fkey') THEN
      ALTER TABLE "LegacyResponsibilityAssignment" RENAME CONSTRAINT "ResponsibilityAssignment_activityId_fkey" TO "LegacyResponsibilityAssignment_activityId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'LegacyResponsibilityAssignment')) AND conname = 'ResponsibilityAssignment_roleId_fkey') THEN
      ALTER TABLE "LegacyResponsibilityAssignment" RENAME CONSTRAINT "ResponsibilityAssignment_roleId_fkey" TO "LegacyResponsibilityAssignment_roleId_fkey";
    END IF;
    IF to_regclass(format('%I.%I', current_schema(), 'ResponsibilityAssignment_roleId_idx')) IS NOT NULL THEN
      ALTER INDEX "ResponsibilityAssignment_roleId_idx" RENAME TO "LegacyResponsibilityAssignment_roleId_idx";
    END IF;
  END IF;
END
$normalize$;

DO $preflight$
DECLARE
  legacy_shape BOOLEAN;
  new_shape BOOLEAN;
BEGIN
  IF to_regclass(format('%I.%I', current_schema(), 'LeadershipCommitment')) IS NOT NULL THEN
    SELECT
      COUNT(*) FILTER (WHERE column_name IN ('clause', 'responsibleName', 'dueDate')) = 3
        AND COUNT(*) FILTER (WHERE column_name IN ('category', 'responsibleId', 'createdById')) = 0,
      COUNT(*) FILTER (WHERE column_name IN ('category', 'responsibleId', 'createdById', 'updatedById', 'customerRequirements')) = 5
        AND COUNT(*) FILTER (WHERE column_name = 'clause') = 0
    INTO legacy_shape, new_shape
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'LeadershipCommitment';

    IF legacy_shape THEN
      IF to_regclass(format('%I.%I', current_schema(), 'LegacyLeadershipCommitment')) IS NOT NULL THEN
        RAISE EXCEPTION 'Existen LeadershipCommitment y LegacyLeadershipCommitment heredadas; se requiere revisión manual';
      END IF;
      ALTER TABLE "LeadershipCommitment" RENAME TO "LegacyLeadershipCommitment";
    ELSIF NOT new_shape THEN
      RAISE EXCEPTION 'LeadershipCommitment tiene un esquema desconocido; no se modificó';
    END IF;
  END IF;
END
$preflight$;

DO $normalize$
BEGIN
  IF to_regclass(format('%I.%I', current_schema(), 'LegacyLeadershipCommitment')) IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'LegacyLeadershipCommitment')) AND conname = 'LeadershipCommitment_pkey') THEN
      ALTER TABLE "LegacyLeadershipCommitment" RENAME CONSTRAINT "LeadershipCommitment_pkey" TO "LegacyLeadershipCommitment_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'LegacyLeadershipCommitment')) AND conname = 'LeadershipCommitment_tenantId_fkey') THEN
      ALTER TABLE "LegacyLeadershipCommitment" RENAME CONSTRAINT "LeadershipCommitment_tenantId_fkey" TO "LegacyLeadershipCommitment_tenantId_fkey";
    END IF;
    IF to_regclass(format('%I.%I', current_schema(), 'LeadershipCommitment_tenantId_dueDate_idx')) IS NOT NULL THEN
      ALTER INDEX "LeadershipCommitment_tenantId_dueDate_idx" RENAME TO "LegacyLeadershipCommitment_tenantId_dueDate_idx";
    END IF;
  END IF;
END
$normalize$;
