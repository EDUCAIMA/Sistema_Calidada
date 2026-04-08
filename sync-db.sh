#!/bin/bash

# Este script sincroniza la base de datos de Railway a tu local
RAILWAY_URL="postgresql://postgres:oSIOGTZqgJQQFsdZQhMlQieeuaHiSnKI@ballast.proxy.rlwy.net:38462/railway"
LOCAL_CONTAINER="sgc-postgres"
LOCAL_USER="johndoe"
LOCAL_DB="mydb"

echo "🔄 Iniciando sincronización de datos desde Railway..."

# 1. Exportar datos de Railway
echo "📥 Descargando datos de producción..."
docker exec -t $LOCAL_CONTAINER pg_dump "$RAILWAY_URL" > temp_backup.sql

# 2. Restaurar en local
echo "📤 Importando datos a la base local..."
docker exec -i $LOCAL_CONTAINER psql -U $LOCAL_USER -d $LOCAL_DB < temp_backup.sql

# 3. Limpieza
rm temp_backup.sql

echo "✅ Sincronización completada. Tu base de datos local ahora tiene los datos reales de Railway."
