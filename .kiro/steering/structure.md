# Project Structure

## Organization Philosophy

モノレポでアプリとパッケージを分離。`apps/` に実行対象、`packages/` に共有コード。機能単位のルート・サービス配置。

## Directory Patterns

### Applications

**Location**: `apps/`  
**Purpose**: 実行可能なアプリケーション（frontend, backend）  
**例**: `apps/backend`（Hono + Workers）、`apps/frontend`（React + Vite）

### Shared Package

**Location**: `packages/shared/`  
**Purpose**: 型定義・Zod スキーマ・共通定数をフロント・バックで共有  
**例**: `CharacterProfile`, `Task`, `GrimoireEntry`, `GenesisFormData` など

### Backend Layout

**Location**: `apps/backend/src/`  
**Purpose**: ルーティング、サービス、ミドルウェア、DB スキーマの分離  
**パターン**: `routes/`（ルーター）、`services/`（ビジネスロジック）、`middleware/`（認証・レート制限・ロギング）、`db/`（スキーマ・マイグレーション）

### Frontend Layout

**Location**: `apps/frontend/src/`  
**Purpose**: コンポーネント、フック、API クライアントの分離  
**パターン**: `components/`（UI）、`hooks/`（TanStack Query 等）、`lib/`（api-client, auth-client, query 設定）

### Documentation

**Location**: `docs/`  
**Purpose**: アーキテクチャ、セットアップ、API（Postman）  
**例**: `docs/architecture/`, `docs/setup/`

## Naming Conventions

- **ファイル**: PascalCase（コンポーネント）、kebab-case（ルート・ユーティリティ）、camelCase は避ける
- **コンポーネント**: PascalCase、1ファイル1コンポーネント
- **フック**: `use` プレフィックス（`useAuth`, `useQuests`, `useGrimoire`）
- **テスト**: 対象ファイルと同階層に `*.test.ts` / `*.test.tsx`

## Import Organization

```typescript
// フロントエンド: @/ で src を参照
import { useAuth } from '@/hooks/useAuth';
import { generateCharacter } from '@/lib/api-client';
import AppLayout from '@/layouts/AppLayout';
import HomePage from '@/pages/HomePage';
import { CharacterProfile } from '@skill-quest/shared';

// バックエンド: 相対インポート
import { authMiddleware } from './middleware/auth';
import { questsRouter } from './routes/quests';
import type { Bindings } from './types';
```

**Path Aliases**:
- `@/`: フロントエンドの `src/` にマッピング（tsconfig `paths`）
- `@skill-quest/shared`: 共有パッケージ（workspace）

## Code Organization Principles

- ルートはドメイン単位で分割（quests, ai, profile, grimoire）
- 認証が必要なルートには `authMiddleware` を `app.use` で適用
- サービス層で D1・AI にアクセスし、ルートは薄く保つ
- フロントエンドの API 呼び出しは `lib/api-client` に集約

---
_updated_at: 2026-02-13_
