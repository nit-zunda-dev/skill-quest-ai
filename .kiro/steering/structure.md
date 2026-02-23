# Project Structure

## Organization Philosophy

Monorepo の app/package 分離。機能は「バックエンド API」「フロントエンド SPA」「共有型・スキーマ」に分け、`apps/` と `packages/` で明確に役割を分ける。

## Directory Patterns

### Backend (`apps/backend/`)
**Location**: `apps/backend/src/`  
**Purpose**: Hono ルート、ミドルウェア、認証、サービス層、DB スキーマ。  
**Example**: `routes/quests.ts`, `routes/ai.ts`, `services/ai.ts`, `db/schema.ts`, `middleware/auth.ts`

### Frontend (`apps/frontend/`)
**Location**: `apps/frontend/src/`  
**Purpose**: ページ、レイアウト、UI コンポーネント、フック、コンテキスト、ルーティング・API クライアント。  
**Example**: `pages/HomePage.tsx`, `components/QuestBoard.tsx`, `hooks/useAuth.tsx`, `contexts/ProfileContext.tsx`, `lib/api-client.ts`

### Shared (`packages/shared/`)
**Location**: `packages/shared/src/`  
**Purpose**: 型定義と Zod スキーマ。API のリクエスト/レスポンスやドメイン型を共有。  
**Example**: `types.ts`, `schemas.ts`。export は `index.ts` から一括。

### Config (`packages/config/`)
**Location**: `packages/config/`  
**Purpose**: 共有 ESLint 等の設定。アプリからは `@skill-quest/eslint-config` 等で参照。

## Naming Conventions

- **Components / Pages**: PascalCase（`QuestBoard.tsx`, `HomePage.tsx`）
- **Hooks, contexts, lib**: camelCase ファイル（`useAuth.tsx`, `api-client.ts`, `route-meta.ts`）
- **Routes (backend)**: 機能ごとファイル（`quests.ts`, `grimoire.ts`）。ルーターは `*Router` で export
- **Tests**: 対象と同じベース名 + `.test.ts` / `.test.tsx`

## Import Organization

**Frontend**（`@/` = `src/`）:

```ts
import { Task, TaskType } from '@skill-quest/shared';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { PATH_APP } from '@/lib/paths';
```

**Backend**（相対 + ワークスペース）:

```ts
import type { Bindings } from '../types';
import { schema } from '../db/schema';
import { Difficulty, TaskType } from '@skill-quest/shared';
import { questsRouter } from './routes/quests';
```

**Path Aliases**:
- Frontend: `@/*` → `src/*`
- 共有型・スキーマ: 必ず `@skill-quest/shared` から import（相対で `../../packages/shared` は使わない）

## Code Organization Principles

- バックエンド: ルートは「薄く」し、ビジネスロジックは `services/` に集約。D1 は `c.env.DB` で渡し、サービスで利用。
- フロントエンド: ページはレイアウトとデータ取得の組み合わせ。再利用 UI は `components/`、画面固有は `pages/`。API 呼び出しは `lib/api-client.ts` や TanStack Query のフックに集約。
- 新規機能は既存の「routes + services」「pages + components + hooks」パターンに従う。同じパターンなら steering の更新は不要。

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
