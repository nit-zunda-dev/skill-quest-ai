# Technology Stack

## Architecture

Monorepo（pnpm workspaces + Turbo）。バックエンドは Cloudflare Workers 上で動く API、フロントエンドは SPA。型・スキーマは `@skill-quest/shared` で共有し、API 契約とバリデーションを一元化。

## Core Technologies

- **Language**: TypeScript（ルート・各パッケージで統一）
- **Backend**: Cloudflare Workers, Hono, D1 (SQLite), Drizzle ORM, Better Auth, Workers AI (Llama 3)
- **Frontend**: React 19, Vite, TanStack Query (React Query), React Router 7
- **Runtime**: Node.js >= 20（開発）, Cloudflare Workers（本番 API）

## Key Libraries

- **Validation**: Zod（`@skill-quest/shared` のスキーマ + `@hono/zod-validator`）
- **UI**: Lucide React, Recharts, Tailwind CSS, shadcn/ui 系（CVA, clsx, tailwind-merge）
- **Testing**: Vitest（単体・統合）, Playwright（E2E）

## Development Standards

### Type Safety

- TypeScript 厳格利用。共有型は `@skill-quest/shared` から import。
- バックエンドの `Bindings` 型で `c.env`（DB, AI 等）を型安全に利用。

### Code Quality

- ESLint はルートで一括（`@skill-quest/eslint-config`）。ビルド・型チェック・テストは Turbo で各パッケージに委譲。

### Testing

- 単体: `*.test.ts` / `*.test.tsx` を Vitest で実行。バックエンドは `@cloudflare/vitest-pool-workers` で D1 等をモック可能。
- E2E: Playwright。`pnpm test:e2e` / `pnpm test:e2e:local` で環境切り替え。

## Development Environment

### Required Tools

- Node.js >= 20, pnpm >= 8

### Common Commands

```bash
pnpm dev          # 全アプリ dev
pnpm build        # 全アプリ build
pnpm test         # 全テスト
pnpm type-check   # 型チェック
pnpm lint         # ESLint
cd apps/backend && pnpm db:migrate:local   # ローカル D1 マイグレーション
cd apps/backend && pnpm deploy:preview     # プレビューデプロイ
```

## Key Technical Decisions

- **D1 + Drizzle**: スキーマをコードで管理し、マイグレーションは `wrangler d1 migrations` で適用。
- **Better Auth**: 認証は `/api/auth/*` に委譲。セッションはフロントで `better-auth` クライアントと連携。
- **Workers AI**: ナラティブ生成・パートナーチャットは Workers AI をバックエンドから呼び出し。利用量は `ai_daily_usage` 等で管理。

---
_Document standards and patterns, not every dependency_
