import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import path from 'node:path';
import { readD1Migrations } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig(async () => {
  const migrationsPath = path.join(__dirname, 'migrations');
  const migrations = await readD1Migrations(migrationsPath);
  return {
    test: {
      include: ['src/**/*.integration.test.ts'],
      setupFiles: [path.join(__dirname, 'test', 'apply-migrations.ts')],
      poolOptions: {
        workers: {
          wrangler: { configPath: path.join(__dirname, 'wrangler.toml') },
          miniflare: {
            bindings: {
              TEST_MIGRATIONS: migrations,
              BETTER_AUTH_SECRET: 'test-secret-at-least-32-chars-for-integration-tests',
              INTEGRATION_TEST_AI_STUB: '1',
            },
          },
        },
      },
    },
  };
});
