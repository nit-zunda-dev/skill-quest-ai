import { describe, it, expect } from 'vitest';
import { createTestUser } from './factories';
import type { AuthUser } from '../../apps/backend/src/types';

describe('Test Data Factories', () => {
  describe('createTestUser', () => {
    it('creates a valid AuthUser with default values', () => {
      const user = createTestUser();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user.email).toContain('@');
    });

    it('allows overrides', () => {
      const overrides: Partial<AuthUser> = {
        id: 'custom-id',
        email: 'custom@example.com',
        name: 'Custom Name',
      };
      const user = createTestUser(overrides);
      expect(user.id).toBe('custom-id');
      expect(user.email).toBe('custom@example.com');
    });
  });
});
