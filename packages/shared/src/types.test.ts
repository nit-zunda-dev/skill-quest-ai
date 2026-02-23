import { describe, it, expect } from 'vitest';
import {
  Rarity,
  Category,
  RARITY_ORDER,
  CATEGORIES,
  type Item,
  type AcquiredItemView,
  ITEM_IMAGE_PATH_PATTERN,
  buildItemImagePath,
} from './types';

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

describe('Item', () => {
  it('一意ID・表示名・カテゴリ・レアリティを持つ', () => {
    const item: Item = {
      id: 'item-1',
      name: 'ナノバナナ',
      category: Category.DRINK,
      rarity: Rarity.COMMON,
    };
    expect(item.id).toBe('item-1');
    expect(item.name).toBe('ナノバナナ');
    expect(item.category).toBe(Category.DRINK);
    expect(item.rarity).toBe(Rarity.COMMON);
  });

  it('説明は任意で持てる', () => {
    const item: Item = {
      id: 'item-2',
      name: 'レアチップ',
      category: Category.CHIP,
      rarity: Rarity.RARE,
      description: '説明文',
    };
    expect(item.description).toBe('説明文');
  });
});

describe('AcquiredItemView', () => {
  it('一覧表示に必要な itemId・取得時刻・名前・カテゴリ・レアリティを持つ', () => {
    const view: AcquiredItemView = {
      itemId: 'item-1',
      acquiredAt: '2025-02-23T12:00:00Z',
      name: 'ナノバナナ',
      category: Category.DRINK,
      rarity: Rarity.COMMON,
    };
    expect(view.itemId).toBe('item-1');
    expect(view.acquiredAt).toBe('2025-02-23T12:00:00Z');
    expect(view.name).toBe('ナノバナナ');
    expect(view.category).toBe(Category.DRINK);
    expect(view.rarity).toBe(Rarity.COMMON);
  });
});

describe('ITEM_IMAGE_PATH_PATTERN', () => {
  it('画像パス規則を定数で明示している', () => {
    expect(ITEM_IMAGE_PATH_PATTERN).toBe('/images/items/{category}/{id}.png');
  });
});

describe('buildItemImagePath', () => {
  it('category と id から画像パスを組み立てる', () => {
    expect(buildItemImagePath('banana-1', Category.DRINK)).toBe(
      '/images/items/drink/banana-1.png'
    );
    expect(buildItemImagePath('chip-legend', Category.CHIP)).toBe(
      '/images/items/chip/chip-legend.png'
    );
  });
});
