/**
 * D1データベースのモック関数
 * テストで使用するD1データベースのモックを提供
 */
import type { D1Database } from '@cloudflare/workers-types';
import { createMockAuthUser } from './mock-auth';

/**
 * AI利用制限用のD1モック（未使用=0、記録は何もしない）
 */
export function createMockD1ForAiUsage(overrides?: {
  hasCharacter?: boolean;
  storedProfile?: unknown | null;
  narrativeCount?: number;
  partnerCount?: number;
  chatCount?: number;
  grimoireCount?: number;
  goalUpdateCount?: number;
}): D1Database {
  const hasCharacter = overrides?.hasCharacter ?? false;
  const storedProfile = overrides?.storedProfile ?? null;
  const narrativeCount = overrides?.narrativeCount ?? 0;
  const partnerCount = overrides?.partnerCount ?? 0;
  const chatCount = overrides?.chatCount ?? 0;
  const grimoireCount = overrides?.grimoireCount ?? 0;
  const goalUpdateCount = overrides?.goalUpdateCount ?? 0;
  const first = async (sql: string, ...params: unknown[]) => {
    if (sql.includes('user_character_generated')) return hasCharacter ? { user_id: params[0] } : null;
    if (sql.includes('user_character_profile') && sql.includes('profile'))
      return storedProfile != null ? { profile: JSON.stringify(storedProfile) } : null;
    if (sql.includes('ai_daily_usage') && sql.includes('narrative_count'))
      return { narrative_count: narrativeCount, partner_count: partnerCount, chat_count: chatCount, grimoire_count: grimoireCount, goal_update_count: goalUpdateCount };
    return null;
  };
  const run = async () => ({ success: true, meta: {} });
  // gacha: items SELECT は .all()、user_acquired_items は .bind().first() / .bind().run()
  const all = async () => ({ results: [] });
  return {
    prepare: (sql: string) => ({
      all,
      bind: (..._args: unknown[]) => ({ run, first: () => first(sql, ..._args) }),
    }),
  } as unknown as D1Database;
}

/**
 * AI利用状況用のD1モック（user_character_generated / ai_daily_usage 用）
 */
export function createMockD1ForAiUsageService(): D1Database {
  const characterRows: { user_id: string }[] = [];
  const usageRows: Map<string, { narrative: number; partner: number; chat: number; grimoire: number; goalUpdate: number }> = new Map();

  const run = async (sql: string, ...params: unknown[]) => {
    const key = (params[0] as string) + '-' + (params[1] as string);
    if (sql.includes('INSERT INTO user_character_generated')) {
      characterRows.push({ user_id: params[0] as string });
      return { success: true, meta: {} };
    }
    if (sql.includes('INSERT INTO ai_daily_usage')) {
      const cur = usageRows.get(key) ?? { narrative: 0, partner: 0, chat: 0, grimoire: 0, goalUpdate: 0 };
      if (sql.includes('1, 0, 0, 0, 0)') && sql.includes('narrative_count')) cur.narrative = 1;
      else if (sql.includes('0, 1, 0, 0, 0)') && sql.includes('partner_count')) cur.partner = 1;
      else if (sql.includes('0, 0, 1, 0, 0)') && sql.includes('chat_count')) cur.chat = (cur.chat || 0) + 1;
      else if (sql.includes('0, 0, 0, 1, 0)') && sql.includes('grimoire_count')) cur.grimoire = 1;
      else if (sql.includes('0, 0, 0, 0, 1)') && sql.includes('goal_update_count')) cur.goalUpdate = (cur.goalUpdate || 0) + 1;
      usageRows.set(key, cur);
      return { success: true, meta: {} };
    }
    if (sql.includes('DO UPDATE SET narrative_count')) {
      const cur = usageRows.get(key) ?? { narrative: 0, partner: 0, chat: 0, grimoire: 0, goalUpdate: 0 };
      usageRows.set(key, { ...cur, narrative: 1 });
      return { success: true, meta: {} };
    }
    if (sql.includes('DO UPDATE SET partner_count')) {
      const cur = usageRows.get(key) ?? { narrative: 0, partner: 0, chat: 0, grimoire: 0, goalUpdate: 0 };
      usageRows.set(key, { ...cur, partner: 1 });
      return { success: true, meta: {} };
    }
    if (sql.includes('DO UPDATE SET chat_count')) {
      const cur = usageRows.get(key) ?? { narrative: 0, partner: 0, chat: 0, grimoire: 0, goalUpdate: 0 };
      usageRows.set(key, { ...cur, chat: cur.chat + 1 });
      return { success: true, meta: {} };
    }
    if (sql.includes('DO UPDATE SET grimoire_count')) {
      const cur = usageRows.get(key) ?? { narrative: 0, partner: 0, chat: 0, grimoire: 0, goalUpdate: 0 };
      usageRows.set(key, { ...cur, grimoire: 1 });
      return { success: true, meta: {} };
    }
    if (sql.includes('DO UPDATE SET goal_update_count')) {
      const cur = usageRows.get(key) ?? { narrative: 0, partner: 0, chat: 0, grimoire: 0, goalUpdate: 0 };
      usageRows.set(key, { ...cur, goalUpdate: (cur.goalUpdate || 0) + 1 });
      return { success: true, meta: {} };
    }
    return { success: true, meta: {} };
  };

  const first = async (sql: string, ...params: unknown[]) => {
    if (sql.includes('user_character_generated')) {
      const uid = params[0] as string;
      return characterRows.some((r) => r.user_id === uid) ? { user_id: uid } : null;
    }
    if (sql.includes('SELECT narrative_count') && sql.includes('ai_daily_usage')) {
      const key = (params[0] as string) + '-' + (params[1] as string);
      const row = usageRows.get(key);
      return row
        ? {
            narrative_count: row.narrative,
            partner_count: row.partner,
            chat_count: row.chat,
            grimoire_count: row.grimoire,
            goal_update_count: row.goalUpdate,
          }
        : null;
    }
    return null;
  };

  const prepare = (sql: string) => ({
    bind: (...args: unknown[]) => ({
      run: () => run(sql, ...args),
      first: () => first(sql, ...args),
    }),
  });

  return { prepare } as unknown as D1Database;
}

/**
 * クエスト用のD1モック（Drizzle D1 ドライバが bind().raw() を呼ぶため、D1 互換のモックを用意）
 */
export function createMockD1ForQuests(): D1Database {
  const quests: Record<string, unknown>[] = [];
  const defaultRow = () => ({
    id: 'test-quest-id',
    skillId: null,
    title: 'Test Quest',
    scenario: null,
    difficulty: 1,
    winCondition: { type: 'DAILY' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const createBound = (sql: string) => {
    const run = async () => {
      if (sql.includes('INSERT INTO')) quests.push(defaultRow());
      if (sql.includes('DELETE FROM')) quests.pop();
      return { success: true, meta: {} };
    };
    const rowForSelect = () => {
      if (sql.includes('SELECT')) {
        if (quests.length === 0) quests.push(defaultRow());
        return quests;
      }
      return quests;
    };
    const first = async () => rowForSelect()[0] ?? null;
    const all = async () => ({ results: rowForSelect(), success: true, meta: {} });
    const raw = async () => {
      if (sql.includes('INSERT INTO')) quests.push(defaultRow());
      return rowForSelect();
    };
    return { run, first, all, raw };
  };
  return {
    prepare: (sql: string) => ({
      bind: (..._args: unknown[]) => createBound(sql),
    }),
    batch: async (statements: Array<{ run?: () => Promise<unknown> }>) => {
      const out: unknown[] = [];
      for (const stmt of statements) {
        if (typeof stmt.run === 'function') out.push(await stmt.run());
        else out.push({ success: true, meta: {} });
      }
      return out;
    },
  } as unknown as D1Database;
}

/**
 * レート制限用のD1モック
 */
export function createMockD1ForRateLimit(overrides?: {
  recentRequests?: Array<{ user_id: string; endpoint: string; created_at: number }>;
  deleteCount?: number;
}): D1Database {
  const recentRequests = overrides?.recentRequests ?? [];
  let deleteCallCount = 0;

  const first = async (sql: string, params?: unknown[]) => {
    if (sql.includes('SELECT') && sql.includes('COUNT(*)')) {
      // パラメータに基づいてフィルタリング
      // bind()で渡されたパラメータは配列として渡される
      if (params && params.length >= 3) {
        const userId = params[0] as string;
        const endpoint = params[1] as string;
        const windowStart = params[2] as number;
        
        const filtered = recentRequests.filter(
          (req) =>
            req.user_id === userId &&
            req.endpoint === endpoint &&
            req.created_at > windowStart
        );
        return { count: filtered.length };
      }
      // パラメータがない場合は全件を返す
      return { count: recentRequests.length };
    }
    return null;
  };

  const run = async (sql: string) => {
    if (sql.includes('DELETE') && sql.includes('rate_limit_logs')) {
      deleteCallCount++;
      return { success: true, meta: {} };
    }
    if (sql.includes('INSERT') && sql.includes('rate_limit_logs')) {
      return { success: true, meta: {} };
    }
    return { success: true, meta: {} };
  };

  const prepare = (sql: string) => ({
    bind: (...args: unknown[]) => {
      // bind()で渡されたパラメータを保存
      const boundParams = args;
      return {
        run: async () => run(sql),
        first: async () => first(sql, boundParams),
      };
    },
  });

  return {
    prepare,
    first: async (sql: string, ...params: unknown[]) => first(sql, params),
    run: async (sql: string) => run(sql),
    getDeleteCallCount: () => deleteCallCount,
  } as unknown as D1Database;
}

/**
 * プロフィールルート用のD1モック（user テーブルの SELECT/UPDATE 用）
 */
export function createMockD1ForProfile(overrides?: {
  user?: {
    id: string;
    email: string;
    name: string;
    image: string | null;
  } | null;
}): D1Database {
  const defaultUser = createMockAuthUser();
  const userOverride = overrides?.user;
  const users: Array<{ id: string; email: string; name: string; image: string | null }> =
    userOverride === null
      ? []
      : [userOverride ?? { ...defaultUser, image: defaultUser.image ?? null }];

  const createBound = (sql: string) => {
    const run = async () => {
      if (sql.includes('UPDATE') && sql.includes('user')) return { success: true, meta: {} };
      return { success: true, meta: {} };
    };
    const rowForSelect = () => {
      if (sql.includes('SELECT') && sql.includes('user')) return users;
      return [];
    };
    const first = async () => rowForSelect()[0] ?? null;
    const all = async () => ({ results: rowForSelect(), success: true, meta: {} });
    const raw = async () => (sql.includes('SELECT') && sql.includes('user') ? users : []);

    return { run, first, all, raw };
  };

  return {
    prepare: (sql: string) => ({
      bind: (..._args: unknown[]) => createBound(sql),
    }),
    batch: async (statements: Array<{ run?: () => Promise<unknown> }>) => {
      const out: unknown[] = [];
      for (const stmt of statements) {
        if (typeof stmt.run === 'function') out.push(await stmt.run());
        else out.push({ success: true, meta: {} });
      }
      return out;
    },
  } as unknown as D1Database;
}

/**
 * グリモワールルート用のD1モック（grimoire_entries, completed quests 用）
 */
export function createMockD1ForGrimoire(overrides?: {
  grimoireEntries?: Array<{
    id: string;
    userId: string;
    taskTitle: string;
    narrative: string;
    rewardXp: number;
    rewardGold: number;
    createdAt: number;
  }>;
  completedQuests?: Array<{
    id: string;
    userId: string;
    title: string;
    difficulty: number;
    winCondition: unknown;
    completedAt: string | null;
  }>;
}): D1Database {
  const grimoireEntries = overrides?.grimoireEntries ?? [];
  const completedQuests = overrides?.completedQuests ?? [];

  const createBound = (sql: string) => {
    const run = async () => ({ success: true, meta: {} });
    const first = async () => null;
    const rowForSelect = () => {
      if (sql.includes('quests') && sql.includes('completed_at')) {
        return completedQuests.map((q) => ({
          id: q.id,
          userId: q.userId,
          skillId: null,
          title: q.title,
          scenario: null,
          difficulty: q.difficulty,
          winCondition: typeof q.winCondition === 'string' ? q.winCondition : JSON.stringify(q.winCondition),
          status: 'done',
          completedAt: q.completedAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }
      if (sql.includes('grimoire_entries')) return grimoireEntries;
      return [];
    };
    const all = async () => ({ results: rowForSelect(), success: true, meta: {} });
    const raw = async () => rowForSelect();
    return { run, first, all, raw };
  };

  return {
    prepare: (sql: string) => ({
      bind: (..._args: unknown[]) => createBound(sql),
    }),
    batch: async (statements: Array<{ run?: () => Promise<unknown> }>) => {
      const out: unknown[] = [];
      for (const stmt of statements) {
        if (typeof stmt.run === 'function') out.push(await stmt.run());
        else out.push({ success: true, meta: {} });
      }
      return out;
    },
  } as unknown as D1Database;
}
