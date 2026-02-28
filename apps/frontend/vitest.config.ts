import path from 'path';
import { defineConfig } from 'vitest/config';

const betterAuthCoreUtilsShim = path.resolve(
  __dirname,
  'src/__tests__/shims/better-auth-core-utils.ts'
);

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@skill-quest/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@better-auth/core/utils': betterAuthCoreUtilsShim,
    },
  },
  plugins: [
    {
      name: 'resolve-better-auth-core-utils',
      enforce: 'pre',
      resolveId(id: string) {
        if (id === '@better-auth/core/utils' || id.startsWith('@better-auth/core/utils?')) {
          return betterAuthCoreUtilsShim;
        }
      },
    },
  ],
  server: {
    deps: {
      inline: ['better-auth'],
    },
  },
  ssr: {
    noExternal: ['better-auth'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.config.ts',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/__tests__/shims/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
  },
});
