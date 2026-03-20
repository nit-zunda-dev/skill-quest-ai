import { describe, it, expect } from 'vitest';
import { z } from './schemas';

describe('@skill-quest/shared schemas', () => {
  it('re-exports z', () => {
    expect(z.string().parse('x')).toBe('x');
  });
});
