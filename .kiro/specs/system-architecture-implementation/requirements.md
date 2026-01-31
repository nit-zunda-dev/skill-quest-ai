# Requirements Document

## Project Description (Input)
既存のプロジェクトを拡張してarchitectureフォルダに記載したシステムアーキテクチャを目指したいです。@docs/architecture

## Introduction

本プロジェクトは、既存のSkill Quest AIフロントエンドアプリケーションを、Cloudflare Workers + D1 + Workers AIを中核としたエッジファーストの分散型アーキテクチャに拡張することを目的とします。モノレポ構成、型安全なAPI通信、認証、AI機能の統合により、低レイテンシで低コストな本番環境を構築します。

## Requirements

### Requirement 1: モノレポ構成の実装
**Objective:** 開発者として、pnpm workspacesとTurborepoを使用したモノレポ構成を実装したい。これにより、バックエンドとフロントエンド間で型定義を共有し、開発効率と型安全性を向上させたい。

#### Acceptance Criteria
1. ルートディレクトリに `pnpm-workspace.yaml` を作成し、`apps/` と `packages/` をワークスペースとして定義する
2. `apps/frontend` と `apps/backend` を独立したアプリケーションとして構成する
3. `packages/shared` パッケージを作成し、Zodスキーマと型定義を共有可能にする
4. `packages/config` パッケージを作成し、ESLintやTypeScriptの共有設定を配置する
5. ルートに `turbo.json` を配置し、ビルドパイプラインを定義する
6. ルートにベースとなる `tsconfig.json` を作成し、各パッケージが継承できるようにする
7. ワークスペース間の依存関係が正しく解決され、`pnpm install` で全パッケージがインストールされる

### Requirement 2: バックエンド（Hono on Workers）の実装
**Objective:** 開発者として、Honoフレームワークを使用したCloudflare Workersバックエンドを実装したい。これにより、エッジネットワーク上で高速なAPIレスポンスを提供し、型安全なエンドポイントを構築したい。

#### Acceptance Criteria
1. `apps/backend` ディレクトリを作成し、Honoアプリケーションの基本構造を実装する
2. `wrangler.toml` を設定し、Cloudflare Workers環境を構成する
3. `Bindings` 型を定義し、D1データベース、Workers AI、環境変数への型安全なアクセスを実現する
4. 共通ミドルウェア（ロギング、エラーハンドリング）を実装する
5. `@hono/zod-validator` を使用した入力バリデーション機能を実装する
6. ルートハンドラをモジュール化し、`apps/backend/src/routes/` 配下に整理する
7. `apps/backend/src/index.ts` で `AppType` をエクスポートし、フロントエンドから型インポート可能にする
8. 開発環境で `wrangler dev` コマンドでローカル実行が可能になる

### Requirement 3: データベース（D1 + Drizzle ORM）の実装
**Objective:** 開発者として、Cloudflare D1とDrizzle ORMを使用したデータベース層を実装したい。これにより、エッジでの高速なデータアクセスと型安全なクエリを実現したい。

#### Acceptance Criteria
1. `apps/backend/src/db/schema.ts` にDrizzleスキーマを定義する
2. Better Authが必要とする認証系テーブル（`user`, `session`, `account`, `verification`）のスキーマを定義する
3. Skill Quest固有の業務ドメインテーブル（`skills`, `quests`, `user_progress`, `interaction_logs`）のスキーマを定義する
4. 外部キー制約を有効化し、データ整合性を担保する
5. JSONカラムを適切に活用し、柔軟なデータ構造をサポートする
6. `drizzle-kit` を使用してマイグレーションファイルを生成できる
7. ローカル環境で `wrangler d1 migrations apply` コマンドでマイグレーションを適用できる
8. 本番環境用のマイグレーション適用プロセスをCI/CDパイプラインに組み込む

### Requirement 4: 認証（Better Auth）の実装
**Objective:** 開発者として、Better Authを使用した認証システムを実装したい。これにより、GitHub OAuthによる安全なユーザー認証とセッション管理を実現したい。

#### Acceptance Criteria
1. Better AuthとDrizzleアダプタをインストールし、設定ファイル `apps/backend/src/auth.ts` を作成する
2. オンデマンド初期化パターンを実装し、リクエストごとに `env.DB` からD1バインディングを注入する
3. GitHub OAuthプロバイダーを設定し、環境変数から認証情報を取得する
4. `apps/backend/src/routes/auth.ts` に認証エンドポイントを実装し、Better Authハンドラをマウントする
5. CORS設定を適切に構成し、フロントエンドからの認証リクエストを許可する
6. HttpOnly Cookieによるセッション管理が機能する
7. 認証ミドルウェアを実装し、保護されたエンドポイントでユーザー認証を検証できる
8. フロントエンドから認証状態を取得・更新できるAPIエンドポイントを提供する

### Requirement 5: AI（Workers AI）の実装
**Objective:** 開発者として、Cloudflare Workers AIを使用したAI機能を実装したい。これにより、Llama 3モデルによる会話機能とFunction Callingによるエージェント機能を実現したい。

#### Acceptance Criteria
1. Workers AIバインディングを `wrangler.toml` に設定する
2. Llama 3.1 8B Instructモデルを使用した基本的なチャット機能を実装する
3. Llama 3.3 70Bモデルを使用した高度な推論機能を実装する
4. Function Calling機能を実装し、`submit_answer`, `request_hint`, `search_docs` などのツールを定義する
5. ストリーミングレスポンスを実装し、Honoの `streamText` ヘルパーを使用してリアルタイムにトークンを送信する
6. 会話履歴をD1データベースに保存し、コンテキストとして利用できる
7. システムプロンプトを適切に設計し、AIエージェントとしての振る舞いを実現する
8. レート制限機能を実装し、AIエンドポイントへの乱用を防ぐ

### Requirement 6: フロントエンドの拡張（Hono RPC統合）
**Objective:** 開発者として、既存のフロントエンドをHono RPCクライアントと統合したい。これにより、型安全なAPI通信とTanStack Queryによる状態管理を実現したい。

#### Acceptance Criteria
1. `apps/frontend/src/lib/client.ts` を作成し、Hono RPCクライアントを初期化する
2. バックエンドの `AppType` を型のみインポートし、型推論が機能する
3. TanStack Queryをインストールし、プロバイダーを設定する
4. カスタムフック（例：`useQuests`, `useUser`）を作成し、型安全なデータフェッチを実装する
5. 既存のGemini API依存部分を削除し、Workers AIエンドポイントに置き換える
6. AIチャットUIでストリーミングレスポンスを表示できる `useChat` フックを実装する
7. Better Authクライアントライブラリを統合し、ログイン・ログアウト・セッション取得機能を実装する
8. 認証状態に応じてルーティングを制御する機能を実装する

### Requirement 7: インフラとセキュリティの設定
**Objective:** 開発者として、本番環境とプレビュー環境を分離し、セキュリティ対策を実装したい。これにより、安全で運用しやすいインフラストラクチャを構築したい。

#### Acceptance Criteria
1. `wrangler.toml` で環境分離を設定し、プレビュー環境と本番環境で異なるD1データベースをバインドする
2. 環境変数とシークレットを適切に管理し、Cloudflare Dashboardで設定できる
3. Cloudflare WAFを設定し、基本的なセキュリティ対策を有効化する
4. Workers内でレート制限を実装し、AIエンドポイントへの過剰なリクエストを防ぐ
5. 入力サニタイズ機能を実装し、Zodバリデーションに加えて追加のセキュリティチェックを行う
6. CORS設定を適切に構成し、許可されたオリジンのみからアクセス可能にする
7. エラーハンドリングを実装し、機密情報がエラーレスポンスに含まれないようにする
8. ロギング機能を実装し、Cloudflare Dashboardでリクエストログを確認できる

### Requirement 8: CI/CDパイプラインの構築
**Objective:** 開発者として、GitHub Actionsを使用したCI/CDパイプラインを構築したい。これにより、自動テスト、プレビューデプロイ、本番デプロイを実現したい。

#### Acceptance Criteria
1. `.github/workflows/` ディレクトリにGitHub Actionsワークフローファイルを作成する
2. PR作成時にESLint、TypeScript型チェック、単体テストを実行するワークフローを実装する
3. mainブランチへのマージ前に、Cloudflare PagesとWorkersのプレビュー環境へデプロイするワークフローを実装する
4. バックエンドデプロイ前に、D1データベースへのマイグレーションを適用するステップを組み込む
5. mainブランチへのマージをトリガーに本番環境へデプロイするワークフローを実装する
6. Turborepoを使用して、変更されたパッケージのみをビルド・デプロイする最適化を実装する
7. Cloudflare APIトークンをGitHub Secretsに設定し、デプロイが自動実行される
8. デプロイの成功・失敗をGitHubのPRにコメントとして通知する
