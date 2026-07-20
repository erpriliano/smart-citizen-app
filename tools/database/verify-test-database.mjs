import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required.');
}

const psqlDatabaseUrl = new URL(testDatabaseUrl);
psqlDatabaseUrl.searchParams.delete('schema');

function run(command, args, environment = {}) {
  const result = spawnSync(command, args, {
    env: { ...process.env, ...environment },
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
  DATABASE_URL: testDatabaseUrl,
});
run('psql', [
  psqlDatabaseUrl.toString(),
  '-X',
  '-v',
  'ON_ERROR_STOP=1',
  '-f',
  'tools/database/verify-schema.sql',
]);
