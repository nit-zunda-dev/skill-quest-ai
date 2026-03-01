/**
 * Task 4.1: 構造化ログヘルパーのテスト。
 * 機密キーをマスキングし JSON で console に出力する。トークン・パスワード・認証ヘッダ等は含めない。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logStructured } from './structured-log';

describe('logStructured', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs a single JSON string to console.log', () => {
    logStructured({ level: 'info', msg: 'test' });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const arg = consoleLogSpy.mock.calls[0][0];
    expect(typeof arg).toBe('string');
    expect(() => JSON.parse(arg)).not.toThrow();
  });

  it('includes non-sensitive fields in output', () => {
    logStructured({
      level: 'info',
      msg: 'request',
      path: '/api/health',
      method: 'GET',
      status: 200,
      durationMs: 42,
    });
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(parsed.level).toBe('info');
    expect(parsed.msg).toBe('request');
    expect(parsed.path).toBe('/api/health');
    expect(parsed.method).toBe('GET');
    expect(parsed.status).toBe(200);
    expect(parsed.durationMs).toBe(42);
  });

  it('masks sensitive key "token"', () => {
    logStructured({ level: 'info', token: 'secret-token-123' });
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(parsed.token).toBe('[REDACTED]');
  });

  it('masks sensitive key "password"', () => {
    logStructured({ level: 'info', password: 'my-password' });
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(parsed.password).toBe('[REDACTED]');
  });

  it('masks sensitive key "authorization"', () => {
    logStructured({ level: 'info', authorization: 'Bearer xyz' });
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(parsed.authorization).toBe('[REDACTED]');
  });

  it('masks sensitive keys case-insensitively', () => {
    logStructured({ Authorization: 'Bearer abc', PASSWORD: 'pwd', Token: 't' });
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(parsed.Authorization).toBe('[REDACTED]');
    expect(parsed.PASSWORD).toBe('[REDACTED]');
    expect(parsed.Token).toBe('[REDACTED]');
  });

  it('does not expose cookie value', () => {
    logStructured({ level: 'info', cookie: 'session=abc123' });
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(parsed.cookie).toBe('[REDACTED]');
  });

  it('does not expose secret-like keys', () => {
    logStructured({ apiKey: 'key-123', api_key: 'key-456', secret: 's' });
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(parsed.apiKey).toBe('[REDACTED]');
    expect(parsed.api_key).toBe('[REDACTED]');
    expect(parsed.secret).toBe('[REDACTED]');
  });

  it('adds timestamp when not provided', () => {
    logStructured({ level: 'info', msg: 'test' });
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(parsed.timestamp).toBeDefined();
    expect(typeof parsed.timestamp).toBe('string');
  });
});
