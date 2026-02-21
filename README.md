# Skill Quest AI

RPG風のタスク管理アプリケーション。日々のタスクをクエストとして管理し、AIが生成する物語と共に成長する体験を提供します。

## 概要

Skill Quest AIは、タスク管理をRPGの冒険として体験できるアプリケーションです。ユーザーはタスクを完了することで経験値を獲得し、AIが生成する物語を通じて自分の成長を楽しみながら、習慣化を実現できます。

### 主な機能

- **Genesis (世界生成)**: ユーザー登録時にAIが独自のプロローグと初期クラスを生成
- **Quest Board (タスク管理)**: デイリータスク、習慣、To-Doの登録・編集・削除
- **Narrative Check-in**: タスク完了時にAIが物語の1セグメントと報酬を生成
- **Character Status**: HP、MP、XP、Levelの可視化
- **Grimoire (冒険ログ)**: 過去に生成された物語の履歴閲覧
- **AI Partner Chat**: AIパートナーとの対話機能

## 技術スタック

### バックエンド
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **認証**: Better Auth
- **AI**: Cloudflare Workers AI (Llama 3)

### フロントエンド
- **Framework**: React 19
- **Build Tool**: Vite
- **State Management**: TanStack Query (React Query)
- **UI Components**: Lucide React
- **Charts**: Recharts

### 開発環境
- **Monorepo**: pnpm workspaces + Turbo
- **Language**: TypeScript
- **Testing**: Vitest
- **Linting**: ESLint

## プロジェクト構成

```
skill-quest-ai/
├── apps/
│   ├── backend/          # Cloudflare Workers バックエンド
│   └── frontend/         # React フロントエンド
├── packages/
│   ├── shared/           # 共有型定義とスキーマ
│   └── config/           # 共有設定（ESLint、TypeScript）
├── docs/                 # ドキュメント
│   ├── architecture/     # アーキテクチャ設計書
│   ├── setup/           # セットアップガイド
│   └── postman/         # Postmanコレクション
├── .kiro/               # Spec-Driven Development設定
└── .github/             # GitHub Actionsワークフロー
```

## セットアップ

### 前提条件

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Cloudflareアカウント（開発用）

### インストール

```bash
# 依存関係のインストール
pnpm install
```

### 環境変数の設定

#### バックエンド (`apps/backend/.dev.vars`)

```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:8787
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

詳細なセットアップ手順は [`docs/setup/`](./docs/setup/) を参照してください。

### データベースのセットアップ

```bash
# ローカルデータベースのマイグレーション
cd apps/backend
pnpm db:migrate:local

# データベーステーブルの確認
pnpm db:tables
```

### 開発サーバーの起動

```bash
# すべてのアプリケーションを起動
pnpm dev

# 個別に起動する場合
cd apps/backend && pnpm dev    # バックエンド (http://localhost:8787)
cd apps/frontend && pnpm dev   # フロントエンド (http://localhost:3000)
```

## 開発

### 利用可能なスクリプト

```bash
# 開発サーバーの起動
pnpm dev

# ビルド
pnpm build

# テストの実行
pnpm test

# 型チェック
pnpm type-check

# リント
pnpm lint
```

### データベース操作

```bash
cd apps/backend

# マイグレーションファイルの生成
pnpm db:generate

# ローカルデータベースへのマイグレーション適用
pnpm db:migrate:local

# リモートデータベースへのマイグレーション適用
pnpm db:migrate:remote

# テーブル一覧の確認
pnpm db:tables

# 各テーブルのレコード数を確認
pnpm db:counts
```

### デプロイ

```bash
cd apps/backend

# プレビュー環境へのデプロイ
pnpm deploy:preview

# 本番環境へのデプロイ
pnpm deploy:production
```

## テスト

```bash
# すべてのテストを実行
pnpm test

# ウォッチモードでテストを実行
cd apps/backend && pnpm test:watch
cd apps/frontend && pnpm test:watch
```

## ドキュメント

- [アーキテクチャ設計書](./docs/architecture/)
- [セットアップガイド](./docs/setup/)
- [Postmanコレクション](./docs/postman/)
- [ZAP セキュリティ対策状況](./docs/ZAP_REMEDIATION.md)

## Spec-Driven Development

このプロジェクトはKiro-style Spec-Driven Developmentを採用しています。

- **Steering**: `.kiro/steering/` - プロジェクト全体のルールとコンテキスト
- **Specs**: `.kiro/specs/` - 個別機能の開発プロセス

詳細は [`AGENTS.md`](./AGENTS.md) を参照してください。

## コントリビューション

現在、このプロジェクトへの外部コントリビューションは受け付けていません。
