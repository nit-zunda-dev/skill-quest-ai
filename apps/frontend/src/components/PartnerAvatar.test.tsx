/**
 * PartnerAvatar のテスト（Task 3.1, 3.2, 7.3）
 * バリアント・表情で正しい src、className・aspectRatio・alt、onError 時のフォールバックを検証する。
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PartnerAvatar } from './PartnerAvatar';
import { getPartnerImagePath } from '@/lib/partner-assets';

describe('PartnerAvatar (Task 3.1, 7.3)', () => {
  it('sets img src from getPartnerImagePath for given variant and expression', () => {
    render(<PartnerAvatar variant="default" expression="standing" />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe(getPartnerImagePath('default', 'standing'));
  });

  it('sets img src for male variant and happy expression', () => {
    render(<PartnerAvatar variant="male" expression="happy" />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe(getPartnerImagePath('male', 'happy'));
  });

  it('applies className to the wrapper element', () => {
    const { container } = render(
      <PartnerAvatar variant="default" expression="default" className="my-custom-class" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom-class');
  });

  it('uses default aspect ratio 3/4 when aspectRatio is not provided', () => {
    const { container } = render(<PartnerAvatar variant="default" expression="standing" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('3/4');
  });

  it('applies custom aspectRatio when provided', () => {
    const { container } = render(
      <PartnerAvatar variant="default" expression="standing" aspectRatio="1/1" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('1/1');
  });

  it('applies default alt text when alt is not provided', () => {
    render(<PartnerAvatar variant="default" expression="standing" />);
    const img = screen.getByRole('img', { name: 'AIパートナー' });
    expect(img).toBeTruthy();
  });

  it('applies custom alt when provided', () => {
    render(
      <PartnerAvatar variant="default" expression="standing" alt="相棒の立ち絵" />
    );
    const img = screen.getByRole('img', { name: '相棒の立ち絵' });
    expect(img).toBeTruthy();
  });
});

describe('PartnerAvatar fallback on image error (Task 3.2, 7.3)', () => {
  it('shows fallback with supportive message when image fails to load (Req 6.1, 6.2)', () => {
    render(<PartnerAvatar variant="default" expression="standing" />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.getByText(/相棒がここにいる/)).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('does not crash on image load error', () => {
    render(<PartnerAvatar variant="male" expression="happy" />);
    const img = screen.getByRole('img');
    expect(() => fireEvent.error(img)).not.toThrow();
    expect(screen.getByText(/相棒がここにいる/)).toBeTruthy();
  });
});
