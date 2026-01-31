# Requirements Document

## Introduction

本ドキュメントは、Skill Quest AIプロジェクトのアーキテクチャ設計に基づいて、既存のフロントエンド実装を拡張し、完全なフルスタックアプリケーションを構築するための要件を定義します。アーキテクチャドキュメント（`docs/architecture/`）に記載された設計方針に従い、Cloudflare Workers + D1 + Workers AIを中核としたエッジファーストの分散型アーキテクチャを実現します。

## Requirements

### Requirement 1: モノレポ構成の実装

**Objective:** As a 開発者, I want pnpm workspacesとTurborepoによるモノレポ構成, so that バックエンドとフロントエンド間で型定義を共有し、開発効率を向上させることができる

#### Acceptance Criteria
1. When プロジェクトルートに`pnpm-workspace.yaml`が作成された時, the モノレポシステム shall `apps/`と`packages/`ディレクトリをワークスペースとして認識する
2. When `turbo.json`が設定された時, the ビルドパイプライン shall 依存関係に基づいて並列実行を最適化する
3. When バックエンドの型定義が変更された時, the フロントエンド shall 型エラーとして即座に検知できる
4. The モノレポ構成 shall `apps/frontend`、`apps/backend`、`packages/shared`、`packages/config`を含む
5. Where 共有型定義が存在する場合, the システム shall `packages/shared`から型をエクスポートし、`apps/`からインポートできる

### Requirement 2: バックエンド実装（Hono on Workers）

**Objective:** As a 開発者, I want Honoフレームワークを使用したCloudflare Workersバックエンド, so that エッジネットワーク上で高速なAPIレスポンスを提供できる

#### Acceptance Criteria
1. When リクエストがWorkerに到達した時, the Honoアプリケーション shall 環境変数とバインディング（`env.DB`、`env.AI`）をコンテキストに注入する
2. When APIエンドポイントが呼び出された時, the バックエンド shall Zodバリデーターを使用して入力を検証する
3. When バリデーションエラーが発生した時, the システム shall 適切なエラーレスポンスを返す
4. When ルートハンドラが実行された時, the システム shall `AppType`をエクスポートし、フロントエンドで型推論を可能にする
5. The バックエンド shall `/api/quests`、`/api/auth`、`/api/ai`などのルートを提供する
6. While リクエストが処理中である間, the システム shall 共通のロギングとエラーハンドリングミドルウェアを適用する

### Requirement 3: データベース実装（D1 + Drizzle ORM）

**Objective:** As a 開発者, I want Cloudflare D1とDrizzle ORMによるデータベース層, so that エッジでの高速な読み取り性能と型安全なデータアクセスを実現できる

#### Acceptance Criteria
1. When データベーススキーマが定義された時, the システム shall Drizzle ORMスキーマを使用してテーブル構造を定義する
2. When マイグレーションが生成された時, the システム shall `drizzle-kit generate`コマンドでSQLファイルを生成する
3. When ローカル開発環境でマイグレーションを適用する時, the システム shall `wrangler d1 migrations apply --local`を実行する
4. When 本番環境でマイグレーションを適用する時, the CI/CDパイプライン shall `wrangler d1 migrations apply`を実行する
5. The データベーススキーマ shall Better Auth用の認証テーブル（`user`、`session`、`account`、`verification`）を含む
6. The データベーススキーマ shall アプリケーション固有のテーブル（`skills`、`quests`、`user_progress`、`interaction_logs`）を含む
7. When 外部キー制約が有効化された時, the システム shall `PRAGMA foreign_keys = ON;`を設定する
8. Where JSONカラムが使用される場合, the システム shall SQLiteのJSON型を活用して柔軟なデータ構造を格納する

### Requirement 4: 認証実装（Better Auth）

**Objective:** As a ユーザー, I want Better Authによる認証機能, so that セキュアにアプリケーションにログインし、セッションを管理できる

#### Acceptance Criteria
1. When 認証リクエストが送信された時, the バックエンド shall リクエストごとに`auth`関数を呼び出し、環境変数からDBバインディングを注入する
2. When メール/パスワード認証が実行された時, the システム shall Better Authの`emailAndPassword`設定を使用して認証フローを処理する
3. When GitHub OAuth認証が実行された時, the システム shall Better Authの`socialProviders`設定を使用してOAuthフローを処理する
4. When セッションが作成された時, the システム shall HttpOnly Cookieにセッショントークンを保存する
5. When 認証が必要なエンドポイントにアクセスした時, the システム shall Better Authミドルウェアでセッションを検証する
6. If 無効なセッションが検出された場合, the システム shall 401 Unauthorizedレスポンスを返す
7. When CORSリクエストが送信された時, the システム shall `Access-Control-Allow-Credentials: true`ヘッダーを設定する
8. The 認証システム shall CSRF対策をデフォルトで実装する

### Requirement 5: AI統合（Workers AIへの移行）

**Objective:** As a ユーザー, I want Cloudflare Workers AIを使用したAI機能, so that 既存のGemini API依存を排除し、エッジで高速なAI推論を利用できる

#### Acceptance Criteria
1. When キャラクター生成リクエストが送信された時, the システム shall Workers AIのLlama 3.1 8Bモデルを使用してプロフィールを生成する
2. When タスク完了ナラティブ生成リクエストが送信された時, the システム shall Llama 3.1 8Bモデルを使用して物語セグメントと報酬を生成する
3. When AIパートナーメッセージ生成リクエストが送信された時, the システム shall Llama 3.1 8Bモデルを使用して動的なセリフを生成する
4. When 複雑な推論が必要な場合, the システム shall Llama 3.3 70Bモデルを使用する
5. When Function Callingが必要な場合, the システム shall Llama 3.1のFunction Calling機能を使用してツール（`submit_answer`、`request_hint`、`search_docs`）を実行する
6. When ストリーミングレスポンスが要求された時, the システム shall Honoの`streamText`ヘルパーを使用してServer-Sent EventsまたはReadableStreamで逐次データを送信する
7. The AIシステム shall 既存のGemini API依存を完全に置き換える

### Requirement 6: フロントエンド拡張（Hono RPC統合）

**Objective:** As a 開発者, I want Hono RPCによる型安全なAPI通信, so that バックエンドの変更が即座にフロントエンドの型エラーとして検知できる

#### Acceptance Criteria
1. When フロントエンドがAPIを呼び出す時, the システム shall Hono RPCクライアント（`hc<AppType>`）を使用する
2. When バックエンドの型定義が変更された時, the フロントエンド shall TypeScriptの型エラーとして即座に検知する
3. When APIレスポンスを受信した時, the フロントエンド shall 型推論によりレスポンスの型を自動的に認識する
4. The フロントエンド shall `import type`を使用してバックエンドの型のみをインポートし、ビルドサイズを最小化する
5. Where クエリパラメータが使用される場合, the システム shall 型安全な方法でパラメータを渡す

### Requirement 7: フロントエンド拡張（TanStack Query統合）

**Objective:** As a ユーザー, I want TanStack Queryによるサーバー状態管理, so that データのキャッシュ、自動リフェッチ、ローディング状態を効率的に管理できる

#### Acceptance Criteria
1. When クエスト一覧を取得する時, the フロントエンド shall TanStack Queryの`useQuery`フックを使用する
2. When データがキャッシュされている時, the システム shall 即座にキャッシュされたデータを表示する
3. When データが古くなった時, the システム shall 自動的にリフェッチを実行する
4. When データ取得中である間, the システム shall ローディング状態を適切に表示する
5. When エラーが発生した時, the システム shall エラー状態を適切に表示する
6. The フロントエンド shall Hono RPCクライアントとTanStack Queryを組み合わせて型安全なデータフェッチを実現する

### Requirement 8: AIチャットUIの実装

**Objective:** As a ユーザー, I want ストリーミング対応のAIチャットUI, so that AIの応答をリアルタイムで確認できる

#### Acceptance Criteria
1. When ユーザーがチャットメッセージを送信した時, the システム shall ストリーミングレスポンスを受信し、逐次表示する
2. When AIが応答を生成している間, the システム shall ローディングインジケーターを表示する
3. When ストリーミングデータが受信された時, the システム shall テキストを逐次追加して表示する
4. The AIチャットUI shall カスタムフック（`useChat`）またはVercel AI SDKの`useChat`を使用する
5. Where ストリーム形式が異なる場合, the システム shall Cloudflare Workers AIのストリーム形式に合わせたアダプタを実装する

### Requirement 9: 認証UIの実装

**Objective:** As a ユーザー, I want Better Authクライアントライブラリを使用した認証UI, so that ログイン、ログアウト、セッション管理を簡単に実行できる

#### Acceptance Criteria
1. When ユーザーがログインボタンをクリックした時, the システム shall Better Authのログインメソッドを呼び出す
2. When ユーザーがログアウトボタンをクリックした時, the システム shall Better Authのログアウトメソッドを呼び出す
3. When アプリケーションが起動した時, the システム shall 現在のセッションを取得して認証状態を確認する
4. The 認証UI shall `apps/frontend/src/lib/auth-client.ts`にクライアントライブラリを実装する
5. Where GitHub OAuthが使用される場合, the システム shall OAuthフローを適切に処理する

### Requirement 10: インフラとデプロイメント設定

**Objective:** As a 開発者, I want 環境分離とCI/CDパイプライン, so that 安全に開発、プレビュー、本番環境にデプロイできる

#### Acceptance Criteria
1. When `wrangler.toml`が設定された時, the システム shall 環境ごとに異なるD1データベースと環境変数をバインドする
2. When プレビュー環境にデプロイする時, the システム shall プレビュー用のD1データベースを使用する
3. When 本番環境にデプロイする時, the システム shall 本番用のD1データベースを使用する
4. When Pull Requestが作成された時, the CI/CDパイプライン shall ESLint、TypeScript型チェック、単体テストを実行する
5. When バックエンドがデプロイされる前, the CI/CDパイプライン shall D1へのマイグレーションを適用する
6. When mainブランチにマージされた時, the CI/CDパイプライン shall 本番環境へのデプロイを実行する
7. The インフラ設定 shall Cloudflare Pages（フロントエンド）とCloudflare Workers（バックエンド）の両方をサポートする

### Requirement 11: セキュリティ対策

**Objective:** As a システム管理者, I want 適切なセキュリティ対策, so that アプリケーションを攻撃から保護できる

#### Acceptance Criteria
1. When AIエンドポイントにリクエストが送信された時, the システム shall レート制限を適用する
2. When 不正な入力が検出された時, the システム shall Zodバリデーションで拒否する
3. When AIプロンプトが送信された時, the システム shall プロンプトインジェクション攻撃を防ぐためのサニタイズを実行する
4. Where Llama Guard等のセーフティモデルが利用可能な場合, the システム shall AIパイプラインに組み込む
5. The セキュリティシステム shall Cloudflare WAFとWorkers内でのRate Limitingを実装する
