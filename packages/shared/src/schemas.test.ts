import { describe, it, expect } from 'vitest';
import {
  createQuestSchema,
  updateQuestSchema,
  updateQuestStatusSchema,
  updateProfileSchema,
  genesisFormDataSchema,
  narrativeRequestSchema,
  chatRequestSchema,
  partnerMessageRequestSchema,
  signUpRequestSchema,
  signInRequestSchema,
  suggestQuestsRequestSchema,
  suggestedQuestItemSchema,
  createQuestBatchSchema,
} from './schemas';
import type { SuggestQuestsRequest, SuggestedQuestItem, CreateQuestBatchRequest } from './schemas';
import { TaskType, Difficulty, Genre } from './types';

describe('createQuestSchema', () => {
  describe('parse', () => {
    it('正常系: 有効なデータでパースできる', () => {
      const validData = {
        title: 'テストクエスト',
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
        skillId: 'skill-123',
        scenario: 'テストシナリオ',
        winCondition: { key: 'value' },
      };

      const result = createQuestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('正常系: オプショナルフィールドが省略されてもパースできる', () => {
      const validData = {
        title: 'テストクエスト',
        type: TaskType.HABIT,
        difficulty: Difficulty.MEDIUM,
      };

      const result = createQuestSchema.parse(validData);
      expect(result.title).toBe('テストクエスト');
      expect(result.type).toBe(TaskType.HABIT);
      expect(result.difficulty).toBe(Difficulty.MEDIUM);
    });

    it('異常系: タイトルが空文字列の場合エラーを投げる', () => {
      const invalidData = {
        title: '',
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      };

      expect(() => createQuestSchema.parse(invalidData)).toThrow();
    });

    it('異常系: タイトルが200文字を超える場合エラーを投げる', () => {
      const invalidData = {
        title: 'a'.repeat(201),
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      };

      expect(() => createQuestSchema.parse(invalidData)).toThrow();
    });

    it('異常系: 必須フィールドが欠けている場合エラーを投げる', () => {
      const invalidData = {
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      };

      expect(() => createQuestSchema.parse(invalidData)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功する', () => {
      const validData = {
        title: 'テストクエスト',
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      };

      const result = createQuestSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('異常系: 無効なデータで失敗する', () => {
      const invalidData = {
        title: '',
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      };

      const result = createQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.issues).toBeDefined();
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues[0].message).toContain('タイトルは必須です');
      }
    });

    it('異常系: エラーオブジェクトの構造が正しい', () => {
      const invalidData = {
        title: 'a'.repeat(201),
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      };

      const result = createQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]).toHaveProperty('code');
        expect(result.error.issues[0]).toHaveProperty('path');
        expect(result.error.issues[0]).toHaveProperty('message');
        expect(result.error.issues[0].message).toContain('200文字以内');
      }
    });
  });
});

describe('updateQuestSchema', () => {
  describe('parse', () => {
    it('正常系: すべてのフィールドがオプショナルで空オブジェクトでもパースできる', () => {
      const result = updateQuestSchema.parse({});
      expect(result).toEqual({});
    });

    it('正常系: 一部のフィールドのみ更新できる', () => {
      const validData = {
        title: '更新されたタイトル',
      };

      const result = updateQuestSchema.parse(validData);
      expect(result.title).toBe('更新されたタイトル');
    });

    it('異常系: タイトルが200文字を超える場合エラーを投げる', () => {
      const invalidData = {
        title: 'a'.repeat(201),
      };

      expect(() => updateQuestSchema.parse(invalidData)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功する', () => {
      const validData = {
        title: '更新されたタイトル',
        completed: true,
      };

      const result = updateQuestSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('更新されたタイトル');
        expect(result.data.completed).toBe(true);
      }
    });

    it('異常系: 無効なデータで失敗する', () => {
      const invalidData = {
        title: 'a'.repeat(201),
      };

      const result = updateQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('updateQuestStatusSchema', () => {
  describe('parse', () => {
    it('正常系: 有効なステータスでパースできる', () => {
      const validData = { status: 'todo' };
      const result = updateQuestStatusSchema.parse(validData);
      expect(result.status).toBe('todo');

      const validData2 = { status: 'in_progress' };
      const result2 = updateQuestStatusSchema.parse(validData2);
      expect(result2.status).toBe('in_progress');

      const validData3 = { status: 'done' };
      const result3 = updateQuestStatusSchema.parse(validData3);
      expect(result3.status).toBe('done');
    });

    it('異常系: 無効なステータスでエラーを投げる', () => {
      const invalidData = { status: 'invalid' };
      expect(() => updateQuestStatusSchema.parse(invalidData)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なステータスで成功する', () => {
      const result = updateQuestStatusSchema.safeParse({ status: 'todo' });
      expect(result.success).toBe(true);
    });

    it('異常系: 無効なステータスで失敗する', () => {
      const result = updateQuestStatusSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBeDefined();
      }
    });
  });
});

describe('updateProfileSchema', () => {
  describe('parse', () => {
    it('正常系: 有効な名前でパースできる', () => {
      const validData = { name: 'テストユーザー' };
      const result = updateProfileSchema.parse(validData);
      expect(result.name).toBe('テストユーザー');
    });

    it('正常系: 有効なテーマカラーでパースできる', () => {
      const validData = { themeColor: '#FF5733' };
      const result = updateProfileSchema.parse(validData);
      expect(result.themeColor).toBe('#FF5733');
    });

    it('異常系: 名前が空文字列の場合エラーを投げる', () => {
      const invalidData = { name: '' };
      expect(() => updateProfileSchema.parse(invalidData)).toThrow();
    });

    it('異常系: テーマカラーが無効な形式の場合エラーを投げる', () => {
      const invalidData = { themeColor: 'invalid' };
      expect(() => updateProfileSchema.parse(invalidData)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功する', () => {
      const result = updateProfileSchema.safeParse({ name: 'テストユーザー', themeColor: '#FF5733' });
      expect(result.success).toBe(true);
    });

    it('異常系: 無効なテーマカラーで失敗し、適切なエラーメッセージを返す', () => {
      const result = updateProfileSchema.safeParse({ themeColor: 'invalid' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('16進数カラーコード形式');
      }
    });
  });
});

describe('genesisFormDataSchema', () => {
  describe('parse', () => {
    it('正常系: ジャンルキー（FANTASY）でパースできる', () => {
      const validData = {
        name: 'テストキャラ',
        goal: 'テスト目標',
        genre: 'FANTASY',
      };

      const result = genesisFormDataSchema.parse(validData);
      expect(result.name).toBe('テストキャラ');
      expect(result.goal).toBe('テスト目標');
      expect(result.genre).toBe(Genre.FANTASY);
    });

    it('正常系: ジャンル値（ハイファンタジー）でパースできる', () => {
      const validData = {
        name: 'テストキャラ',
        goal: 'テスト目標',
        genre: 'ハイファンタジー',
      };

      const result = genesisFormDataSchema.parse(validData);
      expect(result.name).toBe('テストキャラ');
      expect(result.genre).toBe(Genre.FANTASY);
    });

    it('異常系: 名前が空文字列の場合エラーを投げる', () => {
      const invalidData = {
        name: '',
        goal: 'テスト目標',
        genre: 'FANTASY',
      };

      expect(() => genesisFormDataSchema.parse(invalidData)).toThrow();
    });

    it('異常系: 目標が500文字を超える場合エラーを投げる', () => {
      const invalidData = {
        name: 'テストキャラ',
        goal: 'a'.repeat(501),
        genre: 'FANTASY',
      };

      expect(() => genesisFormDataSchema.parse(invalidData)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功する', () => {
      const result = genesisFormDataSchema.safeParse({
        name: 'テストキャラ',
        goal: 'テスト目標',
        genre: 'FANTASY',
      });
      expect(result.success).toBe(true);
    });

    it('異常系: 無効なジャンルで失敗する', () => {
      const result = genesisFormDataSchema.safeParse({
        name: 'テストキャラ',
        goal: 'テスト目標',
        genre: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('narrativeRequestSchema', () => {
  describe('parse', () => {
    it('正常系: 有効なデータでパースできる', () => {
      const validData = {
        taskId: 'task-123',
        taskTitle: 'テストタスク',
        taskType: TaskType.DAILY,
        difficulty: Difficulty.EASY,
        userComment: 'コメント',
      };

      const result = narrativeRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('正常系: userCommentが省略されてもパースできる', () => {
      const validData = {
        taskId: 'task-123',
        taskTitle: 'テストタスク',
        taskType: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      };

      const result = narrativeRequestSchema.parse(validData);
      expect(result.taskId).toBe('task-123');
      expect(result.userComment).toBeUndefined();
    });

    it('異常系: taskIdが空文字列の場合エラーを投げる', () => {
      const invalidData = {
        taskId: '',
        taskTitle: 'テストタスク',
        taskType: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      };

      expect(() => narrativeRequestSchema.parse(invalidData)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功する', () => {
      const result = narrativeRequestSchema.safeParse({
        taskId: 'task-123',
        taskTitle: 'テストタスク',
        taskType: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      });
      expect(result.success).toBe(true);
    });

    it('異常系: 必須フィールドが欠けている場合失敗する', () => {
      const result = narrativeRequestSchema.safeParse({
        taskTitle: 'テストタスク',
        taskType: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]).toBeDefined();
        expect(result.error.issues[0].path).toEqual(['taskId']);
        // Zodのデフォルトエラーメッセージまたはカスタムメッセージを検証
        expect(result.error.issues[0].message).toBeDefined();
      }
    });
  });
});

describe('chatRequestSchema', () => {
  describe('parse', () => {
    it('正常系: 有効なデータでパースできる', () => {
      const validData = {
        message: 'テストメッセージ',
        context: { key: 'value' },
      };

      const result = chatRequestSchema.parse(validData);
      expect(result.message).toBe('テストメッセージ');
      expect(result.context).toEqual({ key: 'value' });
    });

    it('正常系: contextが省略されてもパースできる', () => {
      const validData = {
        message: 'テストメッセージ',
      };

      const result = chatRequestSchema.parse(validData);
      expect(result.message).toBe('テストメッセージ');
    });

    it('異常系: メッセージが空文字列の場合エラーを投げる', () => {
      const invalidData = {
        message: '',
      };

      expect(() => chatRequestSchema.parse(invalidData)).toThrow();
    });

    it('異常系: メッセージが2000文字を超える場合エラーを投げる', () => {
      const invalidData = {
        message: 'a'.repeat(2001),
      };

      expect(() => chatRequestSchema.parse(invalidData)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功する', () => {
      const result = chatRequestSchema.safeParse({ message: 'テストメッセージ' });
      expect(result.success).toBe(true);
    });

    it('異常系: 無効なデータで失敗し、適切なエラーメッセージを返す', () => {
      const result = chatRequestSchema.safeParse({ message: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('メッセージは必須です');
      }
    });
  });
});

describe('partnerMessageRequestSchema', () => {
  describe('parse', () => {
    it('正常系: すべてのフィールドがオプショナルで空オブジェクトでもパースできる', () => {
      const result = partnerMessageRequestSchema.parse({});
      expect(result).toEqual({});
    });

    it('正常系: 一部のフィールドのみ指定できる', () => {
      const validData = {
        progressSummary: '進捗サマリー',
      };

      const result = partnerMessageRequestSchema.parse(validData);
      expect(result.progressSummary).toBe('進捗サマリー');
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功する', () => {
      const result = partnerMessageRequestSchema.safeParse({
        progressSummary: '進捗サマリー',
        timeOfDay: 'morning',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('signUpRequestSchema', () => {
  describe('parse', () => {
    it('正常系: 有効なデータでパースできる', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'テストユーザー',
      };

      const result = signUpRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('異常系: 無効なメールアドレスの場合エラーを投げる', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'テストユーザー',
      };

      expect(() => signUpRequestSchema.parse(invalidData)).toThrow();
    });

    it('異常系: パスワードが8文字未満の場合エラーを投げる', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        name: 'テストユーザー',
      };

      expect(() => signUpRequestSchema.parse(invalidData)).toThrow();
    });

    it('異常系: 名前が100文字を超える場合エラーを投げる', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'a'.repeat(101),
      };

      expect(() => signUpRequestSchema.parse(invalidData)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功する', () => {
      const result = signUpRequestSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'テストユーザー',
      });
      expect(result.success).toBe(true);
    });

    it('異常系: 無効なメールアドレスで失敗し、適切なエラーメッセージを返す', () => {
      const result = signUpRequestSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
        name: 'テストユーザー',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('有効なメールアドレス');
      }
    });

    it('異常系: パスワードが短すぎる場合、適切なエラーメッセージを返す', () => {
      const result = signUpRequestSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
        name: 'テストユーザー',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('8文字以上');
      }
    });
  });
});

describe('signInRequestSchema', () => {
  describe('parse', () => {
    it('正常系: 有効なデータでパースできる', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = signInRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('異常系: 無効なメールアドレスの場合エラーを投げる', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      expect(() => signInRequestSchema.parse(invalidData)).toThrow();
    });

    it('異常系: パスワードが空文字列の場合エラーを投げる', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      expect(() => signInRequestSchema.parse(invalidData)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功する', () => {
      const result = signInRequestSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('異常系: 無効なデータで失敗し、適切なエラーメッセージを返す', () => {
      const result = signInRequestSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('有効なメールアドレス');
      }
    });

    it('異常系: エラーオブジェクトの構造が正しい', () => {
      const result = signInRequestSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]).toHaveProperty('code');
        expect(result.error.issues[0]).toHaveProperty('path');
        expect(result.error.issues[0]).toHaveProperty('message');
        expect(result.error.issues[0].message).toContain('パスワードは必須です');
      }
    });
  });
});

describe('suggestQuestsRequestSchema', () => {
  describe('parse', () => {
    it('正常系: goal のみでパースできる', () => {
      const validData = { goal: '英語力を上げる' };
      const result = suggestQuestsRequestSchema.parse(validData);
      expect(result.goal).toBe('英語力を上げる');
      expect(result.genre).toBeUndefined();
    });

    it('正常系: goal と genre でパースできる', () => {
      const validData = { goal: '習慣化したい', genre: 'FANTASY' };
      const result = suggestQuestsRequestSchema.parse(validData);
      expect(result.goal).toBe('習慣化したい');
      expect(result.genre).toBe(Genre.FANTASY);
    });

    it('異常系: goal が空文字列の場合エラーを投げる', () => {
      expect(() => suggestQuestsRequestSchema.parse({ goal: '' })).toThrow();
    });

    it('異常系: goal が500文字を超える場合エラーを投げる', () => {
      expect(() => suggestQuestsRequestSchema.parse({ goal: 'a'.repeat(501) })).toThrow();
    });

    it('異常系: goal が欠けている場合エラーを投げる', () => {
      expect(() => suggestQuestsRequestSchema.parse({})).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功する', () => {
      const result = suggestQuestsRequestSchema.safeParse({ goal: '目標' });
      expect(result.success).toBe(true);
      if (result.success) {
        const data: SuggestQuestsRequest = result.data;
        expect(data.goal).toBe('目標');
      }
    });
  });
});

describe('suggestedQuestItemSchema', () => {
  describe('parse', () => {
    it('正常系: title, type, difficulty でパースでき CreateQuestRequest と整合する', () => {
      const validData = {
        title: '毎日30分勉強する',
        type: TaskType.DAILY,
        difficulty: Difficulty.MEDIUM,
      };
      const result = suggestedQuestItemSchema.parse(validData);
      expect(result).toEqual(validData);
      expect(createQuestSchema.parse(result)).toEqual(validData);
    });

    it('異常系: タイトルが空の場合エラーを投げる', () => {
      expect(() =>
        suggestedQuestItemSchema.parse({
          title: '',
          type: TaskType.TODO,
          difficulty: Difficulty.EASY,
        })
      ).toThrow();
    });

    it('異常系: type が不正な場合エラーを投げる', () => {
      expect(() =>
        suggestedQuestItemSchema.parse({
          title: 'タスク',
          type: 'INVALID',
          difficulty: Difficulty.EASY,
        })
      ).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功し SuggestedQuestItem 型として扱える', () => {
      const result = suggestedQuestItemSchema.safeParse({
        title: '習慣にする',
        type: TaskType.HABIT,
        difficulty: Difficulty.HARD,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const item: SuggestedQuestItem = result.data;
        expect(item.title).toBe('習慣にする');
        expect(item.type).toBe(TaskType.HABIT);
        expect(item.difficulty).toBe(Difficulty.HARD);
      }
    });
  });
});

describe('createQuestBatchSchema', () => {
  describe('parse', () => {
    it('正常系: 1件以上20件以下のクエスト配列でパースできる', () => {
      const validData = {
        quests: [
          { title: 'クエスト1', type: TaskType.DAILY, difficulty: Difficulty.EASY },
          { title: 'クエスト2', type: TaskType.TODO, difficulty: Difficulty.MEDIUM },
        ],
      };
      const result = createQuestBatchSchema.parse(validData);
      expect(result.quests).toHaveLength(2);
      expect(result.quests[0].title).toBe('クエスト1');
    });

    it('異常系: quests が空配列の場合エラーを投げる', () => {
      expect(() => createQuestBatchSchema.parse({ quests: [] })).toThrow();
    });

    it('境界値: quests が20件ちょうどでパースできる', () => {
      const quests = Array.from({ length: 20 }, (_, i) => ({
        title: `クエスト${i}`,
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      }));
      const result = createQuestBatchSchema.parse({ quests });
      expect(result.quests).toHaveLength(20);
    });

    it('異常系: quests が21件の場合エラーを投げる', () => {
      const quests = Array.from({ length: 21 }, (_, i) => ({
        title: `クエスト${i}`,
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      }));
      expect(() => createQuestBatchSchema.parse({ quests })).toThrow();
    });

    it('異常系: 要素が createQuestSchema に違反する場合エラーを投げる', () => {
      expect(() =>
        createQuestBatchSchema.parse({
          quests: [{ title: '', type: TaskType.DAILY, difficulty: Difficulty.EASY }],
        })
      ).toThrow();
    });
  });

  describe('safeParse', () => {
    it('正常系: 有効なデータで成功し CreateQuestBatchRequest 型として扱える', () => {
      const result = createQuestBatchSchema.safeParse({
        quests: [{ title: 'バッチクエスト', type: TaskType.TODO, difficulty: Difficulty.HARD }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const data: CreateQuestBatchRequest = result.data;
        expect(data.quests).toHaveLength(1);
        expect(data.quests[0].title).toBe('バッチクエスト');
      }
    });
  });
});
