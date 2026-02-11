/**
 * Vitest setup file
 * Provides global crypto API for tests
 */
import { webcrypto } from 'node:crypto';

// Node.js 18+ では crypto はグローバルに利用可能だが、
// 一部の環境では明示的に設定する必要がある
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.crypto = webcrypto as any;
}
