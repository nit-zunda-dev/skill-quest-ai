import { describe, it, expect } from 'vitest';
import { getValidReturnUrl } from '@/lib/returnUrl';
import { PATH_ACCOUNT } from '@/lib/paths';

describe('getValidReturnUrl', () => {
  it('returns pathname + search for /account paths', () => {
    expect(getValidReturnUrl('/account', '')).toBe('/account');
    expect(getValidReturnUrl('/account/settings', '')).toBe('/account/settings');
    expect(getValidReturnUrl('/account', '?x=1')).toBe('/account?x=1');
  });

  it('returns PATH_ACCOUNT for non-account paths', () => {
    expect(getValidReturnUrl('/', '')).toBe(PATH_ACCOUNT);
    expect(getValidReturnUrl('/login', '')).toBe(PATH_ACCOUNT);
    expect(getValidReturnUrl('/app', '')).toBe(PATH_ACCOUNT);
  });

  it('does not treat /accountfoo as internal', () => {
    expect(getValidReturnUrl('/accountfoo', '')).toBe(PATH_ACCOUNT);
  });
});
