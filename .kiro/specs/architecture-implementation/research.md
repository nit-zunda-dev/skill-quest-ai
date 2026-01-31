# Research & Design Decisions Template

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:
- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.
---

## Summary
- **Feature**: `architecture-implementation`
- **Discovery Scope**: Complex Integration (既存フロントエンドの拡張 + 新規バックエンド構築)
- **Key Findings**:
  - 既存のReactフロントエンドは再利用可能だが、Gemini API直接呼び出しをWorkers AIバックエンドに置き換える必要がある
  - Hono RPCによる型共有はモノレポ構成と組み合わせることで、エンドツーエンドの型安全性を実現できる
  - Better Authのオンデマンド初期化パターンはCloudflare Workers環境に適している
  - Drizzle ORMはCloudflare D1との統合において軽量で効率的
  - Workers AIのFunction Callingとストリーミング機能により、既存のGemini API機能を置き換え可能

## Research Log

### Hono RPC型共有パターン
- **Context**: バックエンドとフロントエンド間で型定義を共有し、型安全なAPI通信を実現する必要がある
- **Sources Consulted**: 
  - アーキテクチャドキュメント（`docs/architecture/02_モノレポ構成.md`）
  - Hono公式ドキュメントのRPC機能
- **Findings**: 
  - Honoの`hc<AppType>`クライアントにより、バックエンドの型定義をフロントエンドで直接利用可能
  - `import type`を使用することで、ビルド時にバックエンドコードが含まれない
  - モノレポ構成により、ワークスペース内で型を直接インポートできる
- **Implications**: 
  - `apps/backend/src/index.ts`で`AppType`をエクスポートする必要がある
  - フロントエンドでは`@skill-quest/backend`から型のみをインポート
  - 型変更が即座にフロントエンドの型エラーとして検知される

### Better Auth Cloudflare Workers統合
- **Context**: Cloudflare Workers環境ではランタイム時にのみ環境変数にアクセス可能なため、Better Authの初期化方法を検討する必要がある
- **Sources Consulted**: 
  - アーキテクチャドキュメント（`docs/architecture/05_認証設計.md`）
  - Better Auth公式ドキュメント
- **Findings**: 
  - オンデマンド初期化パターンにより、リクエストごとに`auth(env)`関数を呼び出してBetter Authインスタンスを生成
  - Drizzleアダプタを使用してD1データベースと統合
  - CORS設定と`trustedOrigins`の設定が必須
- **Implications**: 
  - `apps/backend/src/auth.ts`にオンデマンド初期化関数を実装
  - Honoルートハンドラでリクエストごとに認証インスタンスを生成
  - HttpOnly CookieとCSRF対策がデフォルトで有効

### Workers AI Function Calling実装
- **Context**: Llama 3.1のFunction Calling機能を使用して、AIエージェントとしての振る舞いを実装する必要がある
- **Sources Consulted**: 
  - アーキテクチャドキュメント（`docs/architecture/06_AI設計.md`）
  - Cloudflare Workers AI公式ドキュメント
- **Findings**: 
  - Llama 3.1はFunction Callingをネイティブサポート
  - JSONスキーマ形式でツール定義をLLMに送信
  - LLMがツール実行を判断した場合、特定のJSON形式でレスポンスを返す
  - WorkerがJSONを解析し、実際のロジックを実行してから再度LLMに入力
- **Implications**: 
  - ツール定義（`submit_answer`、`request_hint`、`search_docs`）をJSONスキーマ形式で定義
  - Function Callingのレスポンス解析ロジックを実装
  - エラーハンドリングとリトライ戦略を考慮

### Workers AIストリーミング実装
- **Context**: AIチャットUIでストリーミングレスポンスを実現する必要がある
- **Sources Consulted**: 
  - アーキテクチャドキュメント（`docs/architecture/06_AI設計.md`）
  - Hono公式ドキュメントのストリーミング機能
- **Findings**: 
  - Honoの`streamText`ヘルパーを使用してServer-Sent EventsまたはReadableStreamで逐次データを送信
  - Workers AIは`stream: true`オプションでストリーミングを有効化
  - `chunk.response`プロパティからテキストを取得
- **Implications**: 
  - バックエンドで`streamText`を使用してストリーミングレスポンスを実装
  - フロントエンドでストリームを処理するカスタムフック（`useChat`）を実装
  - エラー時のフォールバック戦略を考慮

### Drizzle ORMとD1統合
- **Context**: Cloudflare D1データベースにDrizzle ORMを使用してスキーマを定義し、マイグレーションを管理する必要がある
- **Sources Consulted**: 
  - アーキテクチャドキュメント（`docs/architecture/04_データベース設計.md`）
  - Drizzle ORM公式ドキュメント
- **Findings**: 
  - Drizzle ORMは軽量で、Cloudflare Workers環境に最適
  - `drizzle-kit generate`でマイグレーションSQLファイルを生成
  - `wrangler d1 migrations apply`でマイグレーションを適用
  - 外部キー制約は`PRAGMA foreign_keys = ON;`で有効化
- **Implications**: 
  - `apps/backend/src/db/schema.ts`にDrizzleスキーマを定義
  - Better Auth用テーブルとアプリケーション用テーブルを分離
  - JSONカラムを活用して柔軟なデータ構造を格納

### TanStack QueryとHono RPC統合
- **Context**: フロントエンドでサーバー状態管理を効率的に行うため、TanStack QueryとHono RPCを組み合わせる必要がある
- **Sources Consulted**: 
  - アーキテクチャドキュメント（`docs/architecture/07_フロントエンド設計.md`）
  - TanStack Query公式ドキュメント
- **Findings**: 
  - TanStack Queryの`useQuery`フックとHono RPCクライアントを組み合わせることで、型安全なデータフェッチが可能
  - キャッシュ、自動リフェッチ、ローディング状態の管理が自動化される
  - 既存の`useState`ベースの状態管理から移行が必要
- **Implications**: 
  - カスタムフック（`useQuests`、`useProfile`など）を作成
  - 既存コンポーネントを段階的に移行
  - エラーハンドリングとローディング状態の適切な表示

### モノレポ構成とTurborepo
- **Context**: pnpm workspacesとTurborepoを使用してモノレポ構成を実現し、型共有とビルド最適化を行う必要がある
- **Sources Consulted**: 
  - アーキテクチャドキュメント（`docs/architecture/02_モノレポ構成.md`）
  - pnpm公式ドキュメント
  - Turborepo公式ドキュメント
- **Findings**: 
  - `pnpm-workspace.yaml`でワークスペースを定義
  - `turbo.json`でビルドパイプラインを最適化
  - 依存関係に基づいて並列実行を最適化
- **Implications**: 
  - ルートレベルに`pnpm-workspace.yaml`と`turbo.json`を作成
  - `apps/frontend`、`apps/backend`、`packages/shared`、`packages/config`をワークスペースとして定義
  - 既存の`apps/frontend`をワークスペースに統合

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| モノレポ + Hono RPC | pnpm workspacesで型共有、Hono RPCで型安全なAPI通信 | エンドツーエンドの型安全性、開発効率向上 | 初期セットアップの複雑さ | アーキテクチャドキュメントで推奨 |
| マイクロサービス | 各サービスを独立してデプロイ | スケーラビリティ、技術選択の柔軟性 | 型共有の複雑さ、オーバーヘッド | 小規模プロジェクトには過剰 |
| モノリス | 単一のアプリケーション | シンプル、デプロイが容易 | スケーラビリティの制約 | Cloudflare Workers環境には不適切 |

**Selected Approach**: モノレポ + Hono RPC
- アーキテクチャドキュメントで明確に定義されている
- 型安全性と開発効率のバランスが最適
- Cloudflare Workers環境に適している

## Design Decisions

### Decision: ハイブリッドアプローチ（既存拡張 + 新規構築）
- **Context**: 既存のフロントエンド実装を最大限活用しつつ、新規バックエンドを構築する必要がある
- **Alternatives Considered**:
  1. 既存コンポーネントの完全な拡張 — 既存コードへの統合が容易だが、複雑度が増加
  2. 完全な新規構築 — クリーンな実装が可能だが、既存コードの再利用ができない
- **Selected Approach**: ハイブリッドアプローチ
  - 既存のUIコンポーネントは再利用
  - バックエンドは新規構築
  - 段階的な移行によりリスクを最小化
- **Rationale**: 既存のUI/UXを維持しつつ、適切な分離を実現できる
- **Trade-offs**: 
  - ✅ 既存コードを最大限活用
  - ✅ 新規機能は適切に分離
  - ❌ 計画と調整がより複雑
- **Follow-up**: 段階的な移行計画を詳細化

### Decision: Better Authオンデマンド初期化パターン
- **Context**: Cloudflare Workers環境ではランタイム時にのみ環境変数にアクセス可能
- **Alternatives Considered**:
  1. グローバルな認証インスタンス — 実装が簡単だが、Workers環境では不可能
  2. リクエストごとの初期化 — パフォーマンスオーバーヘッドがあるが、Workers環境に適している
- **Selected Approach**: オンデマンド初期化パターン
  - リクエストごとに`auth(env)`関数を呼び出し
  - Drizzleアダプタを使用してD1と統合
- **Rationale**: Cloudflare Workers環境の制約に適合し、アーキテクチャドキュメントで推奨されている
- **Trade-offs**: 
  - ✅ Workers環境に適している
  - ✅ 型安全な実装が可能
  - ⚠️ リクエストごとの初期化オーバーヘッド（軽微）
- **Follow-up**: パフォーマンステストを実施

### Decision: Workers AIへの移行
- **Context**: 既存のGemini API依存を排除し、エッジで高速なAI推論を実現する必要がある
- **Alternatives Considered**:
  1. Gemini APIの継続使用 — 既存コードを維持できるが、エッジの利点を活用できない
  2. Workers AIへの完全移行 — エッジの利点を活用できるが、既存コードの置き換えが必要
- **Selected Approach**: Workers AIへの完全移行
  - Llama 3.1 8Bを通常の会話に使用
  - Llama 3.3 70Bを複雑な推論に使用
  - Function Callingとストリーミングを実装
- **Rationale**: エッジファーストアーキテクチャの核心であり、低レイテンシと低コストを実現できる
- **Trade-offs**: 
  - ✅ エッジでの高速な推論
  - ✅ 低コスト
  - ❌ 既存コードの置き換えが必要
- **Follow-up**: 既存のGemini API機能との互換性を確認

### Decision: Drizzle ORMの採用
- **Context**: Cloudflare D1データベースにORMを統合する必要がある
- **Alternatives Considered**:
  1. Prisma — 成熟したORMだが、Workers環境では重い
  2. Drizzle ORM — 軽量でWorkers環境に最適
  3. 生SQL — 最大のパフォーマンスだが、型安全性が低い
- **Selected Approach**: Drizzle ORM
  - 軽量でランタイムオーバーヘッドがほぼゼロ
  - サーバーレス環境に最適化
  - SQLライクなクエリでパフォーマンス予測が容易
- **Rationale**: アーキテクチャドキュメントで明確に推奨されており、Workers環境に最適
- **Trade-offs**: 
  - ✅ 軽量で高速
  - ✅ 型安全性
  - ⚠️ Prismaと比較して機能が少ない（本プロジェクトには十分）
- **Follow-up**: マイグレーション戦略を詳細化

## Risks & Mitigations
- **Better Auth統合の未知の部分** — オンデマンド初期化パターンの実装例が少ない可能性 → 実装フェーズで詳細な調査とテストを実施
- **Workers AI Function Callingの実装** — JSONスキーマ形式とレスポンス解析に未知の部分 → 公式ドキュメントとサンプルコードを参照
- **ストリーミング実装の複雑さ** — フロントエンドでのストリーム処理に未知の部分 → プロトタイプを作成して検証
- **既存コードの移行リスク** — Gemini APIからWorkers AIへの移行により既存機能が影響を受ける可能性 → 段階的な移行とフォールバック戦略を実装
- **モノレポ構成のセットアップ** — 初期セットアップの複雑さ → アーキテクチャドキュメントの手順に従い、段階的に実装

## References
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/) — Workers環境の制約とベストプラクティス
- [Hono Documentation](https://hono.dev/) — RPC機能とストリーミング実装
- [Better Auth Documentation](https://www.better-auth.com/) — Cloudflare Workers統合
- [Drizzle ORM Documentation](https://orm.drizzle.team/) — D1統合とマイグレーション
- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/) — Function Callingとストリーミング
- [TanStack Query Documentation](https://tanstack.com/query) — サーバー状態管理
- [pnpm Workspaces Documentation](https://pnpm.io/workspaces) — モノレポ構成
- [Turborepo Documentation](https://turbo.build/repo/docs) — ビルドパイプライン最適化
- アーキテクチャドキュメント（`docs/architecture/`） — プロジェクト固有の設計方針
