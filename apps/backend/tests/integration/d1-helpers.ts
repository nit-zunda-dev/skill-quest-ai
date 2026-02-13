/**
 * Task 5.1: D1ローカルバインディング用ヘルパー
 * 統合テスト実行前にマイグレーション適用・DBリセット・テストデータ投入を行う。
 * wrangler d1 execute --local を使用する。
 */
import { execSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

const DEFAULT_D1_DATABASE_NAME = 'skill-quest-db';

/**
 * apps/backend の絶対パスを返す
 */
export function getBackendDir(): string {
  return path.resolve(__dirname, '..', '..');
}

/**
 * ローカルD1データベース名（wrangler.toml の database_name に合わせる）
 */
export function getD1DatabaseName(): string {
  return DEFAULT_D1_DATABASE_NAME;
}

export type D1HelperOptions = {
  cwd?: string;
};

/**
 * ローカルD1にマイグレーションを適用する。
 * wrangler d1 migrations apply skill-quest-db --local を実行する。
 */
export function applyMigrationsForLocal(options?: D1HelperOptions): void {
  const cwd = options?.cwd ?? getBackendDir();
  const dbName = getD1DatabaseName();
  execSync(`wrangler d1 migrations apply ${dbName} --local`, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

const RESET_SQL_PATH = path.join(__dirname, 'reset.sql');

/**
 * ローカルD1の全テーブルをリセット（全行削除）する。
 * tests/integration/reset.sql を wrangler d1 execute --local --file=... で実行する。
 */
export function resetD1Local(options?: D1HelperOptions): void {
  const cwd = options?.cwd ?? getBackendDir();
  const dbName = getD1DatabaseName();
  if (!fs.existsSync(RESET_SQL_PATH)) {
    throw new Error(`Reset SQL file not found: ${RESET_SQL_PATH}`);
  }
  execSync(`wrangler d1 execute ${dbName} --local --file="${RESET_SQL_PATH}"`, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

/**
 * 指定したSQLファイルをローカルD1に対して実行する（テストデータ投入用）。
 * wrangler d1 execute --local --file=... を使用する。
 */
export function seedD1Local(seedFilePath: string, options?: D1HelperOptions): void {
  const resolved = path.isAbsolute(seedFilePath) ? seedFilePath : path.resolve(getBackendDir(), seedFilePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Seed file not found: ${resolved}`);
  }
  const cwd = options?.cwd ?? getBackendDir();
  const dbName = getD1DatabaseName();
  execSync(`wrangler d1 execute ${dbName} --local --file="${resolved}"`, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}
