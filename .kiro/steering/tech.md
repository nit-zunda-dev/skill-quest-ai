# Technology Stack

## Architecture

モノレポ構成。pnpm workspaces + Turbo でビルド・テスト・リントをワークスペース単位で管理。フロントエンドとバックエンドを分離し、`packages/shared` で型・スキーマを共有。

## Core Technologies

- **Language**: TypeScript
- **Backend**: Cloudflare Workers + Hono
- **Frontend**: React 19 + Vite
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **認証**: Better Auth
- **AI**: Cloudflare Workers AI (Llama 3)
- **State**: TanStack Query (React Query)

## Key Libraries

- **Validation**: Zod（バックエンド・共有スキーマ）、`@hono/zod-validator`
- **UI**: Lucide React, Recharts
- **Testing**: Vitest, @testing-library/react
- **Linting**: ESLint（workspace 共有 config）

## Development Standards

### Type Safety

- TypeScript strict 利用
- `@skill-quest/shared` で型・Zod スキーマを共有
- バックエンドの `AppType` をエクスポートし、フロントエンドで型推論に利用

### Code Quality

- ESLint を全ワークスペースに適用
- Turbo で `lint` / `type-check` / `build` / `test` を一括実行
- テストは `*.test.ts` / `*.test.tsx` の命名規則

### Testing

- 単体テスト主体（70–80%）。Vitest + Testing Library
- AI・D1 はスタブまたはスキップ条件で扱う
- E2E は初期は手動、必要に応じて Playwright 導入

## Common Commands

```bash
pnpm dev          # 全アプリ起動
pnpm build        # ビルド
pnpm test         # テスト
pnpm type-check   # 型チェック
pnpm lint         # リント
cd apps/backend && pnpm db:migrate:local   # ローカルDBマイグレーション
```

## Key Technical Decisions

- **Cloudflare Workers**: エッジデプロイ、D1・Workers AI とのネイティブ統合
- **Hono**: 軽量・型安全なルーティング、zod-validator との連携
- **Better Auth**: メール認証、セッション管理、Cloudflare D1 対応
- **Monorepo**: 共有型・スキーマを `packages/shared` で一元管理し、フロント・バック間の型整合を保証

---
_updated_at: 2026-02-13_
