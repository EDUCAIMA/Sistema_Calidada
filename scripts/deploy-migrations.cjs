const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { Client } = require('pg');

async function main() {
  const envPath = path.join(process.cwd(), '.env');
  if (!process.env.DATABASE_URL && fs.existsSync(envPath) && process.loadEnvFile) process.loadEnvFile(envPath);
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL es obligatoria.');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock(61018056)');
    await client.query('CREATE TABLE IF NOT EXISTS "_sgc_migrations" ("name" TEXT PRIMARY KEY, "checksum" TEXT NOT NULL, "appliedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    const root = path.join(process.cwd(), 'prisma', 'migrations');
    for (const name of fs.readdirSync(root).sort()) {
      const file = path.join(root, name, 'migration.sql');
      if (!fs.existsSync(file)) continue;
      const sql = fs.readFileSync(file, 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const previous = await client.query('SELECT "checksum" FROM "_sgc_migrations" WHERE "name" = $1', [name]);
      if (previous.rowCount) {
        if (previous.rows[0].checksum !== checksum) throw new Error('La migración aplicada cambió: ' + name);
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO "_sgc_migrations" ("name", "checksum") VALUES ($1, $2)', [name, checksum]);
        await client.query('COMMIT');
        console.log('Migración aplicada: ' + name);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(61018056)').catch(() => {});
    await client.end();
  }
}
main().catch(error => { console.error('No se aplicaron las migraciones:', error.message); process.exitCode = 1; });
