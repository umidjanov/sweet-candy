const { execSync } = require('child_process');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../apps/api/prisma/schema.prisma');

console.log('🔧 [Sweet CANDY] Preparing Prisma Client...');
execSync(`npx prisma generate --schema="${schemaPath}"`, { stdio: 'inherit' });

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_PRISMA_URL ||
  process.env.STORAGE_DATABASE_URL ||
  process.env.STORAGE_POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_POSTGRES_URL ||
  '';

const isLocalDb =
  !dbUrl ||
  dbUrl.includes('localhost') ||
  dbUrl.includes('127.0.0.1');

if (!isLocalDb) {
  console.log('☁️ [Sweet CANDY] Cloud PostgreSQL URL detected. Syncing database schema...');
  try {
    execSync(`npx prisma db push --schema="${schemaPath}" --skip-generate --accept-data-loss`, {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    console.log('✅ [Sweet CANDY] Cloud database schema synchronized successfully.');
  } catch (err) {
    console.warn('⚠️ [Sweet CANDY] Database schema push skipped/failed during build (will retry if run manually):', err.message);
  }
} else {
  console.log('ℹ️ [Sweet CANDY] No remote DATABASE_URL set during build; skipping remote schema push.');
}
