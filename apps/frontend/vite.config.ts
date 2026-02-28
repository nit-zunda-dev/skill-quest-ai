import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
      },
    },
    plugins: [react(), tailwindcss()],
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        // better-auth 1.4.18 の core に dist/utils が無い場合のフォールバック（dev/build）
        '@better-auth/core/utils': path.resolve(
          __dirname,
          'src/__tests__/shims/better-auth-core-utils.ts'
        ),
      },
    },
  };
});
