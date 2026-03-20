import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getProfile, updateProfile, deleteAccount } from './api-client';

describe('api-client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('getProfile parses JSON on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', email: 'a@b.c', name: 'A', image: null }),
    }) as unknown as typeof fetch;

    const p = await getProfile();
    expect(p.email).toBe('a@b.c');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/profile'),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('updateProfile sends PATCH', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', email: 'a@b.c', name: 'B', image: null }),
    }) as unknown as typeof fetch;

    const p = await updateProfile({ name: 'B' });
    expect(p.name).toBe('B');
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1]).toMatchObject({ method: 'PATCH' });
  });

  it('deleteAccount throws on failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'no' }),
    }) as unknown as typeof fetch;

    await expect(deleteAccount('u1')).rejects.toThrow();
  });
});
