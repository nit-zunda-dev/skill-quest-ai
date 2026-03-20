/**
 * 認証スキーマ（user / session / account / verification）の検証
 */
import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { user, session, account, verification, schema } from './schema';

function columnNames(table: ReturnType<typeof getTableColumns>): string[] {
  return Object.values(table).map((col) => col.name);
}

describe('auth schema', () => {
  it('exports only Better Auth tables on schema object', () => {
    expect(Object.keys(schema).sort()).toEqual(['account', 'session', 'user', 'verification']);
  });

  it('user has id, email, name', () => {
    const cols = columnNames(getTableColumns(user));
    expect(cols).toContain('id');
    expect(cols).toContain('email');
    expect(cols).toContain('name');
  });

  it('session references user', () => {
    const cols = columnNames(getTableColumns(session));
    expect(cols).toContain('user_id');
    expect(cols).toContain('token');
  });

  it('account has provider and password fields', () => {
    const cols = columnNames(getTableColumns(account));
    expect(cols).toContain('provider_id');
    expect(cols).toContain('user_id');
  });

  it('verification has identifier and value', () => {
    const cols = columnNames(getTableColumns(verification));
    expect(cols).toContain('identifier');
    expect(cols).toContain('value');
  });
});
