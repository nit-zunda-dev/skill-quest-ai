import eslintConfig from '@skill-quest/eslint-config';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/.wrangler/**',
      '**/coverage/**',
      '**/pnpm-lock.yaml',
      '**/.git/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/migrations/**',
      '**/.dev.vars',
    ],
  },
  ...eslintConfig,
];
