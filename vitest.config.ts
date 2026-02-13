import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * ルートレベルのVitest設定
 * tests/ディレクトリのテストユーティリティとファクトリのテストを実行するため
 */
export default defineConfig({
  resolve: {
    alias: {
      '@skill-quest/shared': path.resolve(__dirname, 'packages/shared/src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
