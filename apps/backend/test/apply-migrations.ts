/**
 * 統合テスト用セットアップ: D1 にマイグレーションを適用する。
 * Workers Vitest の worker コンテキストで実行される。
 */
import { env } from 'cloudflare:test';
import { applyD1Migrations } from 'cloudflare:test';

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    TEST_MIGRATIONS: D1Migration[];
  }
}

type D1Migration = { name: string; statements: string[] };

const migrations = (env as unknown as { TEST_MIGRATIONS: D1Migration[] }).TEST_MIGRATIONS;
if (migrations?.length) {
  await applyD1Migrations(env.DB, migrations);
}
