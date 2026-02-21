import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button (shadcn, Task 2.2)', () => {
  it('renders as a button element with accessible role', () => {
    render(<Button>CTA</Button>);
    const btn = screen.getByRole('button', { name: 'CTA' });
    expect(btn).toBeTruthy();
    expect(btn.tagName).toBe('BUTTON');
  });

  it('accepts and renders children', () => {
    render(<Button>冒険を始める</Button>);
    const btn = screen.getByRole('button', { name: '冒険を始める' });
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('冒険を始める');
  });
});
