#!/usr/bin/env bash

set -euo pipefail

# Sincroniza la base de datos de Railway a un contenedor PostgreSQL local.
# La credencial nunca debe quedar guardada en el repositorio.
: "${RAILWAY_DATABASE_URL:?Define RAILWAY_DATABASE_URL con la URL publica de PostgreSQL de Railway}"

LOCAL_CONTAINER="${LOCAL_CONTAINER:-sgc-postgres}"
LOCAL_USER="${LOCAL_USER:-johndoe}"
LOCAL_DB="${LOCAL_DB:-mydb}"
BACKUP_FILE="$(mktemp "${TMPDIR:-/tmp}/sgc-railway-backup.XXXXXX.sql")"

trap 'rm -f "$BACKUP_FILE"' EXIT

echo "🔄 Iniciando sincronización de datos desde Railway..."

echo "📥 Descargando datos de producción..."
docker exec -t "$LOCAL_CONTAINER" pg_dump "$RAILWAY_DATABASE_URL" > "$BACKUP_FILE"

echo "📤 Importando datos a la base local..."
docker exec -i "$LOCAL_CONTAINER" psql -U "$LOCAL_USER" -d "$LOCAL_DB" < "$BACKUP_FILE"

echo "✅ Sincronización completada. Tu base de datos local ahora tiene los datos reales de Railway."
