import { describe, it, expect } from 'vitest';
import {
  PATH_LANDING,
  PATH_LOGIN,
  PATH_ACCOUNT,
  PATH_GENESIS,
  PATH_APP_LEGACY,
} from '@/lib/paths';

describe('path constants', () => {
  it('defines landing, login, account', () => {
    expect(PATH_LANDING).toBe('/');
    expect(PATH_LOGIN).toBe('/login');
    expect(PATH_ACCOUNT).toBe('/account');
  });

  it('keeps legacy path constants for redirects', () => {
    expect(PATH_GENESIS).toBe('/genesis');
    expect(PATH_APP_LEGACY).toBe('/app');
  });
});
