/**
 * ログインクエリ正規化のテスト（Task 12.1, Requirements 5.3）
 */
import { describe, it, expect } from 'vitest';
import { normalizeLoginMode } from '@/lib/loginParams';

describe('normalizeLoginMode', () => {
  it('有効な mode はそのまま返す', () => {
    expect(normalizeLoginMode('login')).toBe('login');
    expect(normalizeLoginMode('signup')).toBe('signup');
  });

  it('無効な mode は login を返す', () => {
    expect(normalizeLoginMode('invalid')).toBe('login');
    expect(normalizeLoginMode('')).toBe('login');
    expect(normalizeLoginMode('LOGIN')).toBe('login');
    expect(normalizeLoginMode('SignUp')).toBe('login');
  });

  it('欠落（null/undefined）は login を返す', () => {
    expect(normalizeLoginMode(null)).toBe('login');
    expect(normalizeLoginMode(undefined)).toBe('login');
  });
});
