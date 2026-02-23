import { describe, it, expect } from 'vitest';
import { Rarity, Category, RARITY_ORDER, CATEGORIES } from './types';

describe('Rarity', () => {
  it('5段階のレアリティを定義している', () => {
    const values = Object.values(Rarity);
    expect(values).toHaveLength(5);
    expect(values).toContain('common');
    expect(values).toContain('rare');
    expect(values).toContain('super-rare');
    expect(values).toContain('ultra-rare');
    expect(values).toContain('legend');
  });

  it('文字列リテラルとして一意に識別できる', () => {
    expect(Rarity.COMMON).toBe('common');
    expect(Rarity.RARE).toBe('rare');
    expect(Rarity.SUPER_RARE).toBe('super-rare');
    expect(Rarity.ULTRA_RARE).toBe('ultra-rare');
    expect(Rarity.LEGEND).toBe('legend');
  });
});

describe('Category', () => {
  it('7カテゴリを定義している', () => {
    const values = Object.values(Category);
    expect(values).toHaveLength(7);
    expect(values).toContain('drink');
    expect(values).toContain('chip');
    expect(values).toContain('badge');
    expect(values).toContain('tool');
    expect(values).toContain('artifact');
    expect(values).toContain('android');
    expect(values).toContain('mythical');
  });

  it('文字列リテラルとして一意に識別できる', () => {
    expect(Category.DRINK).toBe('drink');
    expect(Category.CHIP).toBe('chip');
    expect(Category.BADGE).toBe('badge');
    expect(Category.TOOL).toBe('tool');
    expect(Category.ARTIFACT).toBe('artifact');
    expect(Category.ANDROID).toBe('android');
    expect(Category.MYTHICAL).toBe('mythical');
  });
});

describe('RARITY_ORDER', () => {
  it('表示・ソート用の順序が common < rare < super-rare < ultra-rare < legend である', () => {
    expect(RARITY_ORDER).toEqual([
      Rarity.COMMON,
      Rarity.RARE,
      Rarity.SUPER_RARE,
      Rarity.ULTRA_RARE,
      Rarity.LEGEND,
    ]);
  });

  it('Rarity の全要素を1回ずつ含む閉集合である', () => {
    const rarityValues = Object.values(Rarity);
    expect(RARITY_ORDER).toHaveLength(rarityValues.length);
    for (const r of rarityValues) {
      expect(RARITY_ORDER).toContain(r);
    }
  });
});

describe('CATEGORIES', () => {
  it('Category の全要素を1回ずつ含む閉集合である', () => {
    const categoryValues = Object.values(Category);
    expect(CATEGORIES).toHaveLength(categoryValues.length);
    for (const c of categoryValues) {
      expect(CATEGORIES).toContain(c);
    }
  });
});
