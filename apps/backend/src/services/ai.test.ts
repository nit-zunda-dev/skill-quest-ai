import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Bindings } from '../types';
import type { D1Database } from '@cloudflare/workers-types';
import { Difficulty, TaskType } from '@skill-quest/shared';
import {
  createAiService,
  runWithLlama31_8b,
  runWithLlama33_70b,
  generateCharacter,
  generateNarrative,
  generatePartnerMessage,
  generateGrimoire,
  getGrimoireFallbackTitleAndRewards,
  buildGrimoireNarrativeFromTemplate,
  generateSuggestedQuests,
  MODEL_LLAMA_31_8B,
  MODEL_LLAMA_33_70B,
} from './ai';
import { getGlobalNeuronsEstimateForDate } from './ai-usage';

vi.mock('./ai-usage', () => ({
  getGlobalNeuronsEstimateForDate: vi.fn(),
}));

describe('AI service', () => {
  describe('createAiService', () => {
    beforeEach(() => {
      vi.mocked(getGlobalNeuronsEstimateForDate).mockClear();
    });

    it('returns service that uses env.AI binding', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'ok' });
      const env = { AI: { run } } as unknown as Bindings;

      const { service, isFallbackStub } = await createAiService(env);
      await service.runWithLlama31_8b('test prompt');

      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_31_8B, expect.objectContaining({ prompt: 'test prompt' }), undefined);
      expect(isFallbackStub).toBe(false);
    });

    it('passes AI Gateway ID when env.AI_GATEWAY_ID is set', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'ok' });
      const env = { AI: { run }, AI_GATEWAY_ID: 'gateway-123' } as unknown as Bindings;

      const { service } = await createAiService(env);
      await service.runWithLlama31_8b('test prompt');

      expect(run).toHaveBeenCalledWith(
        MODEL_LLAMA_31_8B,
        expect.objectContaining({ prompt: 'test prompt' }),
        { gateway: { id: 'gateway-123' } }
      );
    });

    it('returns stub when INTEGRATION_TEST_AI_STUB is 1 (takes priority over threshold)', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'real' });
      const env = {
        AI: { run },
        INTEGRATION_TEST_AI_STUB: '1',
        AI_NEURONS_FALLBACK_THRESHOLD: '100',
      } as unknown as Bindings;
      const getTodayUtc = () => '2026-03-01';
      const db = {} as D1Database;
      vi.mocked(getGlobalNeuronsEstimateForDate).mockResolvedValue(99999);

      const { service, isFallbackStub } = await createAiService(env, { db, getTodayUtc });
      const result = await service.runWithLlama31_8b('any');

      expect(getGlobalNeuronsEstimateForDate).not.toHaveBeenCalled();
      expect(run).not.toHaveBeenCalled();
      expect(result).toBe('');
      expect(isFallbackStub).toBe(true);
    });

    it('returns stub when options provided, threshold set, and today neurons >= threshold', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'real' });
      const env = {
        AI: { run },
        AI_NEURONS_FALLBACK_THRESHOLD: '50000',
      } as unknown as Bindings;
      const getTodayUtc = () => '2026-03-01';
      const db = {} as D1Database;
      vi.mocked(getGlobalNeuronsEstimateForDate).mockResolvedValue(50000);

      const { service, isFallbackStub } = await createAiService(env, { db, getTodayUtc });
      const result = await service.runWithLlama31_8b('any');

      expect(getGlobalNeuronsEstimateForDate).toHaveBeenCalledWith(db, '2026-03-01');
      expect(run).not.toHaveBeenCalled();
      expect(result).toBe('AI 利用一時制限中');
      expect(isFallbackStub).toBe(true);
    });

    it('when threshold stub, narrative and partner message contain AI limit message (Task 2.3)', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'real' });
      const env = {
        AI: { run },
        AI_NEURONS_FALLBACK_THRESHOLD: '50000',
      } as unknown as Bindings;
      const getTodayUtc = () => '2026-03-01';
      const db = {} as D1Database;
      vi.mocked(getGlobalNeuronsEstimateForDate).mockResolvedValue(50000);

      const { service } = await createAiService(env, { db, getTodayUtc });
      const narrativeResult = await service.generateNarrative({
        taskId: 't1',
        taskTitle: 'タスク',
        taskType: TaskType.DAILY,
        difficulty: Difficulty.MEDIUM,
      });
      const partnerMessage = await service.generatePartnerMessage({});

      expect(narrativeResult.narrative).toContain('AI 利用一時制限中');
      expect(partnerMessage).toContain('AI 利用一時制限中');
    });

    it('returns real AI when options provided, threshold set, and today neurons < threshold', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'real response' });
      const env = {
        AI: { run },
        AI_NEURONS_FALLBACK_THRESHOLD: '50000',
      } as unknown as Bindings;
      const getTodayUtc = () => '2026-03-01';
      const db = {} as D1Database;
      vi.mocked(getGlobalNeuronsEstimateForDate).mockResolvedValue(49999);

      const { service, isFallbackStub } = await createAiService(env, { db, getTodayUtc });
      const result = await service.runWithLlama31_8b('test');

      expect(getGlobalNeuronsEstimateForDate).toHaveBeenCalledWith(db, '2026-03-01');
      expect(run).toHaveBeenCalled();
      expect(result).toBe('real response');
      expect(isFallbackStub).toBe(false);
    });

    it('returns real AI when options not provided (no threshold check)', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'ok' });
      const env = { AI: { run }, AI_NEURONS_FALLBACK_THRESHOLD: '100' } as unknown as Bindings;

      const { service, isFallbackStub } = await createAiService(env);
      await service.runWithLlama31_8b('test');

      expect(getGlobalNeuronsEstimateForDate).not.toHaveBeenCalled();
      expect(run).toHaveBeenCalled();
      expect(isFallbackStub).toBe(false);
    });

    it('returns real AI when options provided but threshold not set in env', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'ok' });
      const env = { AI: { run } } as unknown as Bindings;
      const getTodayUtc = () => '2026-03-01';
      const db = {} as D1Database;
      vi.mocked(getGlobalNeuronsEstimateForDate).mockResolvedValue(99999);

      const { service, isFallbackStub } = await createAiService(env, { db, getTodayUtc });
      await service.runWithLlama31_8b('test');

      expect(getGlobalNeuronsEstimateForDate).not.toHaveBeenCalled();
      expect(run).toHaveBeenCalled();
      expect(isFallbackStub).toBe(false);
    });

    it('returns stub when getGlobalNeuronsEstimateForDate throws (safe side)', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'real' });
      const env = {
        AI: { run },
        AI_NEURONS_FALLBACK_THRESHOLD: '50000',
      } as unknown as Bindings;
      const getTodayUtc = () => '2026-03-01';
      const db = {} as D1Database;
      vi.mocked(getGlobalNeuronsEstimateForDate).mockRejectedValue(new Error('DB error'));

      const { service, isFallbackStub } = await createAiService(env, { db, getTodayUtc });
      const result = await service.runWithLlama31_8b('any');

      expect(run).not.toHaveBeenCalled();
      expect(result).toBe('AI 利用一時制限中');
      expect(isFallbackStub).toBe(true);
    });
  });

  describe('runWithLlama31_8b', () => {
    it('calls AI.run with Llama 3.1 8B model and returns response text', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'Generated text from 8B' });
      const ai = { run };

      const result = await runWithLlama31_8b(ai, 'Hello');

      expect(run).toHaveBeenCalledTimes(1);
      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_31_8B, { prompt: 'Hello' }, undefined);
      expect(result).toBe('Generated text from 8B');
    });

    it('passes gateway options when gatewayId is provided', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'Gateway response' });
      const ai = { run };

      const result = await runWithLlama31_8b(ai, 'Hello', 'gateway-456');

      expect(run).toHaveBeenCalledWith(
        MODEL_LLAMA_31_8B,
        { prompt: 'Hello' },
        { gateway: { id: 'gateway-456' } }
      );
      expect(result).toBe('Gateway response');
    });
  });

  describe('runWithLlama33_70b', () => {
    it('calls AI.run with Llama 3.3 70B model and returns response text', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'Complex reasoning from 70B' });
      const ai = { run };

      const result = await runWithLlama33_70b(ai, 'Complex question');

      expect(run).toHaveBeenCalledTimes(1);
      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_33_70B, { prompt: 'Complex question' }, undefined);
      expect(result).toBe('Complex reasoning from 70B');
    });

    it('passes gateway options when gatewayId is provided', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'Gateway 70B response' });
      const ai = { run };

      const result = await runWithLlama33_70b(ai, 'Complex question', 'gateway-789');

      expect(run).toHaveBeenCalledWith(
        MODEL_LLAMA_33_70B,
        { prompt: 'Complex question' },
        { gateway: { id: 'gateway-789' } }
      );
      expect(result).toBe('Gateway 70B response');
    });
  });

  describe('generateCharacter', () => {
    const validProfileJson = JSON.stringify({
      name: 'テスト',
      className: '戦士',
      title: '見習い',
      prologue: '目標に向かう',
      themeColor: '#c0392b',
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      gold: 0,
    });

    it('uses Llama 3.1 8B and returns parsed CharacterProfile when AI returns valid JSON', async () => {
      const run = vi.fn().mockResolvedValue({ response: validProfileJson });
      const ai = { run };
      const data = { name: 'テスト', goal: '目標' };

      const result = await generateCharacter(ai, data);

      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_31_8B, expect.objectContaining({ prompt: expect.any(String) }), undefined);
      const prompt = (run.mock.calls[0] as unknown[])[1] as { prompt: string };
      expect(prompt.prompt).toContain('テスト');
      expect(prompt.prompt).toContain('目標');
      expect(result.name).toBe('テスト');
      expect(result.className).toBe('戦士');
    });

    it('returns fallback profile when AI returns invalid JSON', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'not json at all' });
      const ai = { run };
      const data = { name: 'フォールバック', goal: '目指す' };

      const result = await generateCharacter(ai, data);

      expect(result.name).toBe('フォールバック');
      expect(result.prologue).toContain('目指す');
      expect(result.className).toBe('冒険者');
    });

    it('returns fallback profile when AI throws', async () => {
      const run = vi.fn().mockRejectedValue(new Error('AI error'));
      const ai = { run };
      const data = { name: 'エラー時', goal: '目標' };

      const result = await generateCharacter(ai, data);

      expect(result.name).toBe('エラー時');
      expect(result.prologue).toContain('目標');
    });

    it('passes gatewayId to runWithLlama31_8b when provided', async () => {
      const run = vi.fn().mockResolvedValue({ response: validProfileJson });
      const ai = { run };
      const data = { name: 'テスト', goal: '目標' };

      await generateCharacter(ai, data, 'gateway-123');

      expect(run).toHaveBeenCalledWith(
        MODEL_LLAMA_31_8B,
        expect.objectContaining({ prompt: expect.any(String) }),
        { gateway: { id: 'gateway-123' } }
      );
    });
  });

  describe('generateNarrative', () => {
    const validNarrativeJson = JSON.stringify({
      narrative: '険しい道のりを乗り越え、ついに目標を達成した。',
      rewardXp: 25,
      rewardGold: 12,
    });

    it('uses Llama 3.1 8B and returns parsed result when AI returns valid JSON', async () => {
      const run = vi.fn().mockResolvedValue({ response: validNarrativeJson });
      const ai = { run };
      const request = {
        taskId: 't1',
        taskTitle: '毎日勉強',
        taskType: TaskType.DAILY,
        difficulty: Difficulty.MEDIUM,
        userComment: '30分集中できた',
      };

      const result = await generateNarrative(ai, request);

      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_31_8B, expect.objectContaining({ prompt: expect.any(String) }), undefined);
      const prompt = (run.mock.calls[0] as unknown[])[1] as { prompt: string };
      expect(prompt.prompt).toContain('毎日勉強');
      expect(prompt.prompt).toContain('30分集中できた');
      expect(prompt.prompt).toContain('MEDIUM');
      expect(result.narrative).toBe('険しい道のりを乗り越え、ついに目標を達成した。');
      expect(result.rewardXp).toBe(25);
      expect(result.rewardGold).toBe(12);
    });

    it('includes taskType and difficulty in prompt', async () => {
      const run = vi.fn().mockResolvedValue({ response: validNarrativeJson });
      const ai = { run };
      const request = {
        taskId: 't2',
        taskTitle: '習慣',
        taskType: TaskType.HABIT,
        difficulty: Difficulty.HARD,
      };

      await generateNarrative(ai, request);

      const prompt = (run.mock.calls[0] as unknown[])[1] as { prompt: string };
      expect(prompt.prompt).toContain('習慣');
      expect(prompt.prompt).toContain('HABIT');
      expect(prompt.prompt).toContain('HARD');
    });

    it('returns fallback with difficulty-based rewards when AI returns invalid JSON', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'not json' });
      const ai = { run };
      const request = {
        taskId: 't1',
        taskTitle: 'タスク',
        taskType: TaskType.TODO,
        difficulty: Difficulty.HARD,
      };

      const result = await generateNarrative(ai, request);

      expect(result.narrative).toContain('タスク');
      expect(typeof result.rewardXp).toBe('number');
      expect(typeof result.rewardGold).toBe('number');
      expect(result.rewardXp).toBeGreaterThan(0);
      expect(result.rewardGold).toBeGreaterThan(0);
    });

    it('returns fallback when AI throws', async () => {
      const run = vi.fn().mockRejectedValue(new Error('AI error'));
      const ai = { run };
      const request = {
        taskId: 't1',
        taskTitle: 'タスク',
        taskType: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      };

      const result = await generateNarrative(ai, request);

      expect(result.narrative).toBeTruthy();
      expect(result.rewardXp).toBeGreaterThan(0);
      expect(result.rewardGold).toBeGreaterThan(0);
    });

    it('passes gatewayId to runWithLlama31_8b when provided', async () => {
      const run = vi.fn().mockResolvedValue({ response: validNarrativeJson });
      const ai = { run };
      const request = {
        taskId: 't1',
        taskTitle: '毎日勉強',
        taskType: TaskType.DAILY,
        difficulty: Difficulty.MEDIUM,
      };

      await generateNarrative(ai, request, 'gateway-456');

      expect(run).toHaveBeenCalledWith(
        MODEL_LLAMA_31_8B,
        expect.objectContaining({ prompt: expect.any(String) }),
        { gateway: { id: 'gateway-456' } }
      );
    });
  });

  describe('generatePartnerMessage', () => {
    it('uses Llama 3.1 8B and returns AI message when AI returns text', async () => {
      const run = vi.fn().mockResolvedValue({ response: '今日も一緒に頑張ろう。' });
      const ai = { run };
      const request = {
        progressSummary: '完了2、未完了3',
        timeOfDay: '朝',
        currentTaskTitle: '毎日勉強',
      };

      const result = await generatePartnerMessage(ai, request);

      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_31_8B, expect.objectContaining({ prompt: expect.any(String) }), undefined);
      const prompt = (run.mock.calls[0] as unknown[])[1] as { prompt: string };
      expect(prompt.prompt).toContain('朝');
      expect(prompt.prompt).toContain('完了2、未完了3');
      expect(prompt.prompt).toContain('毎日勉強');
      expect(result).toBe('今日も一緒に頑張ろう。');
    });

    it('includes all optional context in prompt when provided', async () => {
      const run = vi.fn().mockResolvedValue({ response: '調子はどうだ？' });
      const ai = { run };
      const request = {
        progressSummary: '進捗良好',
        timeOfDay: '夜',
        currentTaskTitle: '習慣を続ける',
      };

      await generatePartnerMessage(ai, request);

      const prompt = (run.mock.calls[0] as unknown[])[1] as { prompt: string };
      expect(prompt.prompt).toContain('夜');
      expect(prompt.prompt).toContain('進捗良好');
      expect(prompt.prompt).toContain('習慣を続ける');
    });

    it('returns fallback message when AI returns empty', async () => {
      const run = vi.fn().mockResolvedValue({ response: '   \n' });
      const ai = { run };
      const result = await generatePartnerMessage(ai, {});

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('returns fallback message when AI throws', async () => {
      const run = vi.fn().mockRejectedValue(new Error('AI error'));
      const ai = { run };
      const result = await generatePartnerMessage(ai, {});

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('passes gatewayId to runWithLlama31_8b when provided', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'ゲートウェイ経由のメッセージ' });
      const ai = { run };
      const request = {
        progressSummary: '進捗良好',
        timeOfDay: '朝',
      };

      await generatePartnerMessage(ai, request, 'gateway-789');

      expect(run).toHaveBeenCalledWith(
        MODEL_LLAMA_31_8B,
        expect.objectContaining({ prompt: expect.any(String) }),
        { gateway: { id: 'gateway-789' } }
      );
    });
  });

  describe('generateGrimoire', () => {
    const validGrimoireJson = JSON.stringify({
      title: '知識の塔への挑戦',
      rewardXp: 105,
      rewardGold: 61,
    });

    const testContext = {
      characterName: 'テスト冒険者',
      className: '魔導技師',
      title: '暁の探求者',
      level: 3,
      goal: 'プログラミング',
      previousNarratives: ['前回の冒険の記録。'],
    };

    it('returns fallback when completedTasks is empty', async () => {
      const run = vi.fn();
      const ai = { run };
      const result = await generateGrimoire(ai, []);

      expect(result.title).toBe('物語の始まりを待つ');
      expect(result.rewardXp).toBe(0);
      expect(result.rewardGold).toBe(0);
      expect(run).not.toHaveBeenCalled();
    });

    it('returns fallback with character name when context is provided and tasks empty', async () => {
      const run = vi.fn();
      const ai = { run };
      const result = await generateGrimoire(ai, [], undefined, testContext);

      expect(result.title).toBe('物語の始まりを待つ');
      expect(result.rewardXp).toBe(0);
      expect(result.rewardGold).toBe(0);
    });

    it('uses Llama 3.1 8B and returns parsed result when AI returns valid JSON', async () => {
      const run = vi.fn().mockResolvedValue({ response: validGrimoireJson });
      const ai = { run };
      const completedTasks = [
        {
          id: 't1',
          title: '毎日勉強',
          type: TaskType.DAILY,
          difficulty: Difficulty.EASY,
          completedAt: Math.floor(Date.now() / 1000),
        },
        {
          id: 't2',
          title: '習慣',
          type: TaskType.HABIT,
          difficulty: Difficulty.MEDIUM,
          completedAt: Math.floor(Date.now() / 1000),
        },
      ];

      const result = await generateGrimoire(ai, completedTasks);

      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_31_8B, expect.objectContaining({ prompt: expect.any(String) }), undefined);
      const prompt = (run.mock.calls[0] as unknown[])[1] as { prompt: string };
      expect(prompt.prompt).toContain('毎日勉強');
      expect(prompt.prompt).toContain('習慣');
      expect(prompt.prompt).not.toContain('narrative');
      expect(result.title).toBe('知識の塔への挑戦');
      expect(result.rewardXp).toBe(105);
      expect(result.rewardGold).toBe(61);
    });

    it('includes character profile and previous narratives in prompt when context is provided', async () => {
      const run = vi.fn().mockResolvedValue({ response: validGrimoireJson });
      const ai = { run };
      const completedTasks = [
        {
          id: 't1',
          title: 'クエスト',
          type: TaskType.DAILY,
          difficulty: Difficulty.EASY,
          completedAt: Math.floor(Date.now() / 1000),
        },
      ];

      await generateGrimoire(ai, completedTasks, undefined, testContext);

      const prompt = (run.mock.calls[0] as unknown[])[1] as { prompt: string };
      expect(prompt.prompt).toContain('テスト冒険者');
      expect(prompt.prompt).toContain('魔導技師');
      expect(prompt.prompt).toContain('暁の探求者');
      expect(prompt.prompt).toContain('前回の冒険の記録。');
      expect(prompt.prompt).toContain('title');
      expect(prompt.prompt).toContain('rewardXp');
      expect(prompt.prompt).toContain('rewardGold');
    });

    it('returns fallback with calculated rewards when AI returns invalid JSON', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'not json' });
      const ai = { run };
      const completedTasks = [
        {
          id: 't1',
          title: 'タスク1',
          type: TaskType.DAILY,
          difficulty: Difficulty.EASY,
          completedAt: Math.floor(Date.now() / 1000),
        },
        {
          id: 't2',
          title: 'タスク2',
          type: TaskType.HABIT,
          difficulty: Difficulty.HARD,
          completedAt: Math.floor(Date.now() / 1000),
        },
      ];

      const result = await generateGrimoire(ai, completedTasks);

      expect(result.title).toBeTruthy();
      expect(result.rewardXp).toBe(75); // 15 (EASY) + 60 (HARD)
      expect(result.rewardGold).toBe(43); // 8 (EASY) + 35 (HARD)
    });

    it('returns fallback when AI throws', async () => {
      const run = vi.fn().mockRejectedValue(new Error('AI error'));
      const ai = { run };
      const completedTasks = [
        {
          id: 't1',
          title: 'タスク',
          type: TaskType.DAILY,
          difficulty: Difficulty.MEDIUM,
          completedAt: Math.floor(Date.now() / 1000),
        },
      ];

      const result = await generateGrimoire(ai, completedTasks);

      expect(result.title).toBeTruthy();
      expect(result.rewardXp).toBe(30); // MEDIUM
      expect(result.rewardGold).toBe(18); // MEDIUM
    });

    it('calculates rewards correctly for multiple tasks with different difficulties', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'not json' });
      const ai = { run };
      const completedTasks = [
        {
          id: 't1',
          title: 'EASY',
          type: TaskType.DAILY,
          difficulty: Difficulty.EASY,
          completedAt: Math.floor(Date.now() / 1000),
        },
        {
          id: 't2',
          title: 'MEDIUM',
          type: TaskType.HABIT,
          difficulty: Difficulty.MEDIUM,
          completedAt: Math.floor(Date.now() / 1000),
        },
        {
          id: 't3',
          title: 'HARD',
          type: TaskType.TODO,
          difficulty: Difficulty.HARD,
          completedAt: Math.floor(Date.now() / 1000),
        },
      ];

      const result = await generateGrimoire(ai, completedTasks);

      expect(result.rewardXp).toBe(105); // 15 + 30 + 60
      expect(result.rewardGold).toBe(61); // 8 + 18 + 35
    });

    it('passes gatewayId to runWithLlama31_8b when provided', async () => {
      const run = vi.fn().mockResolvedValue({ response: validGrimoireJson });
      const ai = { run };
      const completedTasks = [
        {
          id: 't1',
          title: 'タスク',
          type: TaskType.DAILY,
          difficulty: Difficulty.EASY,
          completedAt: Math.floor(Date.now() / 1000),
        },
      ];

      await generateGrimoire(ai, completedTasks, 'gateway-999');

      expect(run).toHaveBeenCalledWith(
        MODEL_LLAMA_31_8B,
        expect.objectContaining({ prompt: expect.any(String) }),
        { gateway: { id: 'gateway-999' } }
      );
    });

    it('generates fallback title when AI returns JSON without title', async () => {
      const noTitleJson = JSON.stringify({
        rewardXp: 30,
        rewardGold: 18,
      });
      const run = vi.fn().mockResolvedValue({ response: noTitleJson });
      const ai = { run };
      const completedTasks = [
        {
          id: 't1',
          title: 'クエスト',
          type: TaskType.DAILY,
          difficulty: Difficulty.MEDIUM,
          completedAt: Math.floor(Date.now() / 1000),
        },
      ];

      const result = await generateGrimoire(ai, completedTasks, undefined, testContext);

      expect(result.title).toContain('クエスト');
      expect(result.title).toMatch(/\d+\/\d+\/\d+/);
      expect(result.rewardXp).toBe(30);
      expect(result.rewardGold).toBe(18);
    });
  });

  describe('getGrimoireFallbackTitleAndRewards', () => {
    it('returns zero-task title and 0,0 rewards when completedTasks is empty', () => {
      const result = getGrimoireFallbackTitleAndRewards([], '冒険者');
      expect(result.title).toBe('物語の始まりを待つ');
      expect(result.rewardXp).toBe(0);
      expect(result.rewardGold).toBe(0);
    });

    it('returns one-task fallback title and difficulty-based rewards for single task', () => {
      const completedTasks = [
        {
          id: 't1',
          title: '英単語10語',
          type: TaskType.DAILY,
          difficulty: Difficulty.MEDIUM,
          completedAt: Math.floor(new Date('2025-02-23').getTime() / 1000),
        },
      ];
      const result = getGrimoireFallbackTitleAndRewards(completedTasks, '冒険者');
      expect(result.title).toContain('2025/2/23');
      expect(result.title).toContain('英単語10語');
      expect(result.rewardXp).toBe(30);
      expect(result.rewardGold).toBe(18);
    });

    it('returns multiple-tasks fallback title and summed rewards', () => {
      const completedTasks = [
        {
          id: 't1',
          title: 'A',
          type: TaskType.TODO,
          difficulty: Difficulty.EASY,
          completedAt: Math.floor(new Date('2025-02-23').getTime() / 1000),
        },
        {
          id: 't2',
          title: 'B',
          type: TaskType.TODO,
          difficulty: Difficulty.HARD,
          completedAt: Math.floor(new Date('2025-02-23').getTime() / 1000),
        },
      ];
      const result = getGrimoireFallbackTitleAndRewards(completedTasks, 'テスト');
      expect(result.title).toContain('2025/2/23');
      expect(result.title).toContain('2クエスト制覇');
      expect(result.rewardXp).toBe(75); // 15 + 60
      expect(result.rewardGold).toBe(43); // 8 + 35
    });
  });

  describe('buildGrimoireNarrativeFromTemplate', () => {
    it('returns zero-task narrative with character name when completedTasks is empty', () => {
      const narrative = buildGrimoireNarrativeFromTemplate([], '冒険者', 0, 0);
      expect(narrative).toContain('冒険者');
      expect(narrative).toContain('グリモワール');
      expect(narrative).toContain('白紙');
    });

    it('returns one-task narrative with date, character, task, labels and rewards', () => {
      const completedTasks = [
        {
          id: 't1',
          title: '英単語10語',
          type: TaskType.DAILY,
          difficulty: Difficulty.MEDIUM,
          completedAt: Math.floor(new Date('2025-02-23').getTime() / 1000),
        },
      ];
      const narrative = buildGrimoireNarrativeFromTemplate(completedTasks, '冒険者', 30, 18);
      expect(narrative).toContain('2025/2/23');
      expect(narrative).toContain('冒険者');
      expect(narrative).toContain('英単語10語');
      expect(narrative).toContain('日課');
      expect(narrative).toContain('中');
      expect(narrative).toContain('30');
      expect(narrative).toContain('18');
    });

    it('returns multiple-tasks narrative with taskCount and taskTitles', () => {
      const completedTasks = [
        {
          id: 't1',
          title: 'A',
          type: TaskType.DAILY,
          difficulty: Difficulty.EASY,
          completedAt: Math.floor(new Date('2025-02-23').getTime() / 1000),
        },
        {
          id: 't2',
          title: 'B',
          type: TaskType.HABIT,
          difficulty: Difficulty.HARD,
          completedAt: Math.floor(new Date('2025-02-23').getTime() / 1000),
        },
      ];
      const narrative = buildGrimoireNarrativeFromTemplate(completedTasks, 'テスト', 75, 43);
      expect(narrative).toContain('2025/2/23');
      expect(narrative).toContain('テスト');
      expect(narrative).toContain('2つ');
      expect(narrative).toContain('A');
      expect(narrative).toContain('B');
      expect(narrative).toContain('75');
      expect(narrative).toContain('43');
    });
  });

  describe('generateSuggestedQuests', () => {
    const validSuggestionsJson = JSON.stringify([
      { title: '毎日30分勉強する', type: TaskType.DAILY, difficulty: Difficulty.MEDIUM },
      { title: '週3回運動する', type: TaskType.HABIT, difficulty: Difficulty.EASY },
      { title: '英語の本を1冊読む', type: TaskType.TODO, difficulty: Difficulty.HARD },
    ]);

    it('uses Llama 3.1 8B and returns parsed suggestions when AI returns valid JSON array', async () => {
      const run = vi.fn().mockResolvedValue({ response: validSuggestionsJson });
      const ai = { run };

      const result = await generateSuggestedQuests(ai, '英語力を上げる');

      expect(run).toHaveBeenCalledWith(MODEL_LLAMA_31_8B, expect.objectContaining({ prompt: expect.any(String) }), undefined);
      const prompt = (run.mock.calls[0] as unknown[])[1] as { prompt: string };
      expect(prompt.prompt).toContain('英語力を上げる');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ title: '毎日30分勉強する', type: TaskType.DAILY, difficulty: Difficulty.MEDIUM });
      expect(result[1].title).toBe('週3回運動する');
      expect(result[2].type).toBe(TaskType.TODO);
    });

    it('builds prompt with 3-7 items instruction and title/type/difficulty format', async () => {
      const run = vi.fn().mockResolvedValue({ response: validSuggestionsJson });
      const ai = { run };

      await generateSuggestedQuests(ai, 'テスト目標');

      const prompt = (run.mock.calls[0] as unknown[])[1] as { prompt: string };
      expect(prompt.prompt).toMatch(/3.*7/);
      expect(prompt.prompt).toContain('title');
      expect(prompt.prompt).toContain('type');
      expect(prompt.prompt).toContain('difficulty');
      expect(prompt.prompt).toContain('テスト目標');
    });

    it('returns empty array when AI returns invalid JSON', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'not json at all' });
      const ai = { run };

      const result = await generateSuggestedQuests(ai, '目標');

      expect(result).toEqual([]);
    });

    it('returns empty array when AI returns non-array JSON', async () => {
      const run = vi.fn().mockResolvedValue({ response: '{"single": "object"}' });
      const ai = { run };

      const result = await generateSuggestedQuests(ai, '目標');

      expect(result).toEqual([]);
    });

    it('throws when AI throws (all retries fail)', async () => {
      const run = vi.fn().mockRejectedValue(new Error('AI error'));
      const ai = { run };

      await expect(generateSuggestedQuests(ai, '目標')).rejects.toThrow('AI error');
    });

    it('returns complete objects from truncated JSON array (token limit)', async () => {
      const truncatedResponse = [
        '[',
        '    {',
        '      "title": "英単語の日々の挑戦",',
        '      "type": "DAILY",',
        '      "difficulty": "EASY"',
        '    },',
        '    {',
        '      "title": "TOEICのリスニングスキルを鍛える",',
        '      "type": "HABIT",',
        '      "difficulty": "MEDIUM"',
        '    },',
        '    {',
        '      "title": "読解力の向上を',
      ].join('\n');
      const run = vi.fn().mockResolvedValue({ response: truncatedResponse });
      const ai = { run };

      const result = await generateSuggestedQuests(ai, '目標');

      expect(result.length).toBe(2);
      expect(result[0].title).toBe('英単語の日々の挑戦');
      expect(result[0].type).toBe(TaskType.DAILY);
      expect(result[1].title).toBe('TOEICのリスニングスキルを鍛える');
      expect(result[1].type).toBe(TaskType.HABIT);
    });

    it('skips invalid items and normalizes valid ones (3-7 items)', async () => {
      const mixedJson = JSON.stringify([
        { title: '有効なタスク1', type: TaskType.DAILY, difficulty: Difficulty.EASY },
        { title: '', type: TaskType.TODO, difficulty: Difficulty.MEDIUM },
        { title: '有効なタスク2', type: 'INVALID_TYPE', difficulty: Difficulty.MEDIUM },
        { title: '有効なタスク3', type: TaskType.HABIT, difficulty: 'INVALID' },
      ]);
      const run = vi.fn().mockResolvedValue({ response: mixedJson });
      const ai = { run };

      const result = await generateSuggestedQuests(ai, '目標');

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.length).toBeLessThanOrEqual(4);
      const first = result.find((r) => r.title === '有効なタスク1');
      expect(first).toEqual({ title: '有効なタスク1', type: TaskType.DAILY, difficulty: Difficulty.EASY });
    });

    it('applies default type TODO and difficulty MEDIUM when type/difficulty are invalid', async () => {
      const singleItemJson = JSON.stringify([
        { title: 'タイトルのみ有効', type: 'INVALID_TYPE', difficulty: 'INVALID_DIFF' },
      ]);
      const run = vi.fn().mockResolvedValue({ response: singleItemJson });
      const ai = { run };

      const result = await generateSuggestedQuests(ai, '目標');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('タイトルのみ有効');
      expect(result[0].type).toBe(TaskType.TODO);
      expect(result[0].difficulty).toBe(Difficulty.MEDIUM);
    });

    it('passes gatewayId to runWithLlama31_8b when provided', async () => {
      const run = vi.fn().mockResolvedValue({ response: validSuggestionsJson });
      const ai = { run };

      await generateSuggestedQuests(ai, '目標', 'gateway-suggest');

      expect(run).toHaveBeenCalledWith(
        MODEL_LLAMA_31_8B,
        expect.objectContaining({ prompt: expect.any(String) }),
        { gateway: { id: 'gateway-suggest' } }
      );
    });
  });
});
