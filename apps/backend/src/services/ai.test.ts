import { describe, it, expect, vi } from 'vitest';
import type { Bindings } from '../types';
import { Genre } from '@skill-quest/shared';
import {
  createAiService,
  runWithLlama31_8b,
  runWithLlama33_70b,
  generateCharacter,
  MODEL_LLAMA_31_8B,
  MODEL_LLAMA_33_70B,
} from './ai';

describe('AI service', () => {
  describe('createAiService', () => {
    it('returns service that uses env.AI binding', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'ok' });
      const env = { AI: { run } } as unknown as Bindings;

      const service = createAiService(env);
      await service.runWithLlama31_8b('test prompt');

      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_31_8B, expect.objectContaining({ prompt: 'test prompt' }));
    });
  });

  describe('runWithLlama31_8b', () => {
    it('calls AI.run with Llama 3.1 8B model and returns response text', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'Generated text from 8B' });
      const ai = { run };

      const result = await runWithLlama31_8b(ai, 'Hello');

      expect(run).toHaveBeenCalledTimes(1);
      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_31_8B, { prompt: 'Hello' });
      expect(result).toBe('Generated text from 8B');
    });
  });

  describe('runWithLlama33_70b', () => {
    it('calls AI.run with Llama 3.3 70B model and returns response text', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'Complex reasoning from 70B' });
      const ai = { run };

      const result = await runWithLlama33_70b(ai, 'Complex question');

      expect(run).toHaveBeenCalledTimes(1);
      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_33_70B, { prompt: 'Complex question' });
      expect(result).toBe('Complex reasoning from 70B');
    });
  });

  describe('generateCharacter', () => {
    const validProfileJson = JSON.stringify({
      name: 'テスト',
      className: '戦士',
      title: '見習い',
      stats: { strength: 60, intelligence: 40, charisma: 50, willpower: 50, luck: 50 },
      prologue: '目標に向かう',
      startingSkill: '剣術',
      themeColor: '#c0392b',
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      hp: 100,
      maxHp: 100,
      gold: 0,
    });

    it('uses Llama 3.1 8B and returns parsed CharacterProfile when AI returns valid JSON', async () => {
      const run = vi.fn().mockResolvedValue({ response: validProfileJson });
      const ai = { run };
      const data = { name: 'テスト', goal: '目標', genre: Genre.FANTASY };

      const result = await generateCharacter(ai, data);

      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_31_8B, expect.objectContaining({ prompt: expect.any(String) }));
      const prompt = (run.mock.calls[0] as unknown[])[1] as { prompt: string };
      expect(prompt.prompt).toContain('テスト');
      expect(prompt.prompt).toContain('目標');
      expect(result.name).toBe('テスト');
      expect(result.className).toBe('戦士');
      expect(result.stats.strength).toBe(60);
    });

    it('returns fallback profile when AI returns invalid JSON', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'not json at all' });
      const ai = { run };
      const data = { name: 'フォールバック', goal: '目指す', genre: Genre.MODERN };

      const result = await generateCharacter(ai, data);

      expect(result.name).toBe('フォールバック');
      expect(result.prologue).toContain('目指す');
      expect(result.className).toBe('冒険者');
    });

    it('returns fallback profile when AI throws', async () => {
      const run = vi.fn().mockRejectedValue(new Error('AI error'));
      const ai = { run };
      const data = { name: 'エラー時', goal: '目標', genre: Genre.SCI_FI };

      const result = await generateCharacter(ai, data);

      expect(result.name).toBe('エラー時');
      expect(result.prologue).toContain('目標');
    });
  });
});
