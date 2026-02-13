import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Bindings, AuthUser } from '../types';
import { authMiddleware } from './auth';
import { auth } from '../auth';
import { errorHandler } from './error-handler';
import { createMockAuthUser } from '../../../../tests/utils';

// auth関数をモック
vi.mock('../auth', () => ({
  auth: vi.fn(),
}));

const testUser = createMockAuthUser();

function createTestApp(mockEnv: Bindings) {
  const app = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();
  app.onError(errorHandler);
  app.use('*', authMiddleware);
  app.get('/protected', (c) => {
    const user = c.get('user');
    return c.json({ user });
  });
  return { app, env: mockEnv };
}

describe('authMiddleware', () => {
  let mockEnv: Bindings;

  beforeEach(() => {
    mockEnv = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
    vi.clearAllMocks();
  });

  it('allows request when session is valid', async () => {
    // Better AuthのgetSessionが有効なセッションを返す
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: {
            id: testUser.id,
            email: testUser.email,
            name: testUser.name,
            image: testUser.image || null,
          },
        }),
      },
    };
    vi.mocked(auth).mockReturnValue(mockAuth as any);

    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json() as { user: AuthUser };
    expect(body.user).toEqual({
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      image: testUser.image || null,
    });
  });

  it('returns 401 when session is missing', async () => {
    // Better AuthのgetSessionがnullを返す
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    };
    vi.mocked(auth).mockReturnValue(mockAuth as any);

    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { error: { message: string } };
    expect(body.error.message).toContain('Unauthorized');
  });

  it('returns 401 when session user is missing', async () => {
    // Better AuthのgetSessionがuserなしのセッションを返す
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue({ user: null }),
      },
    };
    vi.mocked(auth).mockReturnValue(mockAuth as any);

    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { error: { message: string } };
    expect(body.error.message).toContain('Unauthorized');
  });

  it('returns 401 when getSession throws HTTPException', async () => {
    // Better AuthのgetSessionがHTTPExceptionをスロー
    const mockAuth = {
      api: {
        getSession: vi.fn().mockRejectedValue(
          new HTTPException(401, { message: 'Unauthorized: Authentication required' })
        ),
      },
    };
    vi.mocked(auth).mockReturnValue(mockAuth as any);

    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { error: { message: string } };
    expect(body.error.message).toContain('Unauthorized');
  });

  it('returns 401 when getSession throws other error', async () => {
    // Better AuthのgetSessionがその他のエラーをスロー
    const mockAuth = {
      api: {
        getSession: vi.fn().mockRejectedValue(new Error('Network error')),
      },
    };
    vi.mocked(auth).mockReturnValue(mockAuth as any);

    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { error: { message: string } };
    expect(body.error.message).toContain('Unauthorized');
  });

  it('injects user information into context', async () => {
    const customUser = {
      id: 'custom-user-id',
      email: 'custom@example.com',
      name: 'Custom User',
      image: 'https://example.com/avatar.png',
    };

    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: customUser,
        }),
      },
    };
    vi.mocked(auth).mockReturnValue(mockAuth as any);

    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json() as { user: AuthUser };
    expect(body.user).toEqual({
      id: customUser.id,
      email: customUser.email,
      name: customUser.name,
      image: customUser.image,
    });
  });

  it('calls auth with correct environment and request', async () => {
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: testUser,
        }),
      },
    };
    vi.mocked(auth).mockReturnValue(mockAuth as any);

    const { app, env } = createTestApp(mockEnv);
    await app.request('/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, env);

    // auth関数がenvとrequestで呼び出されることを確認
    expect(auth).toHaveBeenCalledWith(env, expect.any(Request));
  });
});
