# Gap Analysis: infra-stability-cost

## 1. Current State Investigation

### 1.1 ドメイン関連資産

| 領域 | 主要ファイル・モジュール | 役割 |
|------|-------------------------|------|
| AI利用管理 | `apps/backend/src/services/ai-usage.ts`, `apps/backend/src/db/schema.ts` (ai_daily_usage) | ユーザー別・日次でナラティブ/パートナー/チャット/グリモワール/目標更新の**回数**を記録。Neurons は未計測。 |
| AI呼び出し | `apps/backend/src/services/ai.ts`, `apps/backend/src/routes/ai.ts` | Workers AI 呼び出し。`INTEGRATION_TEST_AI_STUB` でスタブ切り替えあり。ユーザー単位の日次上限で 429 返却。 |
| CORS・セキュリティ | `apps/backend/src/middleware/index.ts` | Hono cors（許可リスト: FRONTEND_URL + localhost）、secureHeaders、HSTS（HTTPS 時）。 |
| 環境・機密 | `apps/backend/src/types.ts` (Bindings), `wrangler.toml`, `apps/backend/src/auth.ts` | DB / AI / BETTER_AUTH_SECRET / FRONTEND_URL 等は Bindings。機密はコードにハードコードされていない。 |
| ロギング | `apps/backend/src/middleware/logging.ts` | リクエスト開始・完了を `console.log` で記録（メソッド・パス・ステータス・所要時間）。構造化ログなし。 |
| レート制限 | `apps/backend/src/middleware/rate-limit.ts`, `schema.ts` (rate_limit_logs) | ユーザー・エンドポイント単位の短時間連打防止。D1 にログ保存。 |

**ルーティング**: `apps/backend/src/index.ts` で `/` に簡易メッセージ、`/api/ai/usage` で利用残数返却。**`/api/health` は未存在**。管理用・集計用 API はなし。

**フロント**: `useAiUsage` で `GET /api/ai/usage` を呼び、残り回数表示。運用者向けダッシュボード・ユーザー数表示はなし。

### 1.2 規約・パターン

- **命名**: サービスは `services/*.ts`、ルートは `routes/*.ts`、ミドルウェアは `middleware/*.ts`。D1 は `c.env.DB`、AI は `c.env.AI`。
- **依存方向**: ルート → サービス → ai-usage / schema。機密はすべて `c.env`（Bindings）経由。
- **テスト**: Vitest、`*.test.ts` / `*.integration.test.ts`。D1 はモックまたはローカル D1。AI は `INTEGRATION_TEST_AI_STUB` でスタブ。

### 1.3 統合面

- **データモデル**: `ai_daily_usage` は (user_id, date_utc) PK、種別ごとの回数カラム。Neurons や「グローバル日次合計」用カラムはない。
- **認証**: Better Auth。管理用の別認可（管理者ロール等）は未実装。
- **設定**: 本番オリジンは `wrangler.toml` の `[env.production].vars.FRONTEND_URL` と CORS 許可リストで連動。

---

## 2. Requirements Feasibility & Gap Map

### 2.1 要件 ↔ 資産マップ（ギャップタグ付き）

| Req | 要件領域 | 既存資産 | ギャップ |
|-----|----------|----------|----------|
| 1 | AI利用量の可視化（EP-31） | ai_daily_usage（回数）、GET /api/ai/usage（ユーザー別残数） | **Missing**: Neurons 相当の計測・集計ロジック、日次/全体の集計、運用者向けダッシュボードまたは API。**Constraint**: 課金単位は Cloudflare 仕様に依存（Research Needed: Neurons 算出方法）。 |
| 2 | フォールバック機能（EP-32） | ユーザー別日次上限（429）、createStubAiService（テスト用）、06_AI設計.md に閾値フォールバック方針 | **Missing**: グローバル無料枠（例: 10,000 Neurons/日）の判定、閾値超過時のスタブ切り替え、設定可能な閾値。**Constraint**: 既存の「ユーザー単位制限」と「グローバル枠」の両立が必要。 |
| 3 | セキュリティ強化（EP-33） | CORS 許可リスト、secureHeaders、HSTS、Bindings で機密参照 | **Constraint**: 本番オリジンは FRONTEND_URL 前提。環境別の明示リスト・機密の見直しは設定とドキュメントで対応可能。**Missing**: 機密参照の明文化・検証（設計で方針決定）。 |
| 4 | ヘルスチェックと監視（EP-34） | `GET /` で固定メッセージのみ | **Missing**: `/api/health` エンドポイント、200 + ステータス、オプションで D1 等の健全性。外形監視の受け口はエンドポイント追加で対応可。 |
| 5 | ログ構造化とAnalytics（EP-35） | loggingMiddleware（console.log の非構造化）、エラーは console.error | **Missing**: 構造化ログ形式（JSON 等）、必須フィールド、Cloudflare Analytics 連携設定。**Research Needed**: Workers での構造化ログベストプラクティス・Analytics 連携方法。 |
| 6 | ユーザー数可視化（EP-44） | package.json の db:counts（手動 SQL）、user テーブル存在 | **Missing**: 登録ユーザー数・アクティブユーザー数の API、定義（アクティブの期間）、認可された運用者または内部専用 API。ダッシュボードはフロントまたは外部ツールで利用想定。 |

### 2.2 技術ニーズと不足

- **データモデル**: Neurons 概算用の日次集計（アプリ側）または Cloudflare 側メトリクス取得が必要。アクティブユーザー定義に基づく集計用クエリ。
- **API**: `/api/health`、運用者向け AI 利用量・ユーザー数（認可付き）。
- **ビジネスルール**: 無料枠閾値の判定、閾値超過時のスタブ切り替え、閾値の設定手段（環境変数等）。
- **非機能**: ログに機密を含めない、ヘルスは軽量に保つ。

### 2.3 複雑性シグナル

- **EP-31**: 中〜高 — 外部仕様（Neurons）への依存、集計と表示の新規実装。
- **EP-32**: 中 — 既存 createAiService / スタブの拡張、グローバル状態の導入。
- **EP-33**: 低 — 既存 CORS・Bindings の見直しとドキュメント。
- **EP-34**: 低 — 新規ルート 1 本、オプションで D1 チェック。
- **EP-35**: 中 — ロギング方式の変更、外部（Cloudflare）連携。
- **EP-44**: 中 — 新規 API、アクティブ定義と認可の設計。

---

## 3. Implementation Approach Options

### Option A: 既存コンポーネントの拡張

- **対象**: ヘルスチェック（`index.ts` に `/api/health` 追加）、CORS・機密（既存ミドルウェア・Bindings の設定見直し）、フォールバック（`createAiService` に閾値チェックとスタブ分岐を追加）。
- **メリット**: 変更ファイルが少ない。既存パターンに乗る。
- **デメリット**: `ai.ts` とルートが「グローバル枠」ロジックで肥大化しうる。Neurons 集計を既存 `ai_daily_usage` に無理に載せるとスキーマと責務が混在する。

**向き**: EP-34 全体、EP-33 の一部、EP-32 の「スタブ切り替え」ロジックの一部。

### Option B: 新規コンポーネントの作成

- **対象**: 運用者向け API 用ルート（例: `routes/admin/` または `routes/ops/`）、Neurons 概算・日次集計用サービス、ヘルス用ハンドラ（オプションで専用モジュール）、構造化ログ用ユーティリティ。
- **メリット**: 責務分離が明確。管理系と通常 API を分けやすい。
- **デメリット**: 新規ルート・サービスが増える。認可・ネットワーク制限の設計が必要。

**向き**: EP-31 の集計・表示 API、EP-44 のユーザー数 API、EP-35 の構造化ログユーティリティ。

### Option C: ハイブリッド

- **拡張**: `/api/health` を `index.ts` に追加。CORS・機密は既存ミドルウェアと wrangler で対応。フォールバックは `createAiService` 呼び出し前に「グローバル枠」をチェックするミドルウェアまたは ai-usage 拡張で「今日の Neurons 概算」を参照し、閾値超過時は既存スタブを返す。
- **新規**: Neurons 概算を記録するレイヤー（ai-usage 拡張または別サービス）、運用者向けエンドポイント（AI利用量・ユーザー数）、構造化ログ用ヘルパー。
- **段階**: Phase 1 — ヘルス、フォールバック、CORS・機密見直し。Phase 2 — Neurons 概算と利用量 API。Phase 3 — 構造化ログ・Analytics、ユーザー数 API・ダッシュボード。

**向き**: フェーズ3全体を一気にやる場合の現実的な折衷。

---

## 4. Implementation Complexity & Risk

| 項目 | 評価 | 理由（1行） |
|------|------|-------------|
| **Effort** | **L**（1〜2週間） | Neurons 計測・集計・フォールバック・ヘルス・ログ・ユーザー数と複数領域にまたがり、設計で仕様を詰める必要がある。 |
| **Risk** | **Medium** | Workers AI の Neurons 算出はドキュメント・API 次第。既存パターン（D1、Bindings、スタブ）は明確で、大きなアーキテクチャ変更は不要。 |

---

## 5. Design Phase への推奨事項

### 5.1 推奨アプローチ

- **ヘルスチェック（EP-34）**: Option A — `index.ts` に `GET /api/health` を追加。オプションで D1 `SELECT 1` 等の軽いチェックを検討。
- **フォールバック（EP-32）**: Option C — グローバル日次 Neurons 概算をどこに持つか（既存テーブル拡張 vs 新テーブル）、閾値の設定（環境変数）、`createAiService` またはその手前での「閾値超過時はスタブ」分岐を設計で決定。
- **AI利用量可視化（EP-31）**: Option B/C — Neurons 相当の計測方法（Research Needed）を設計で確定し、集計用ストアと運用者向け API を新規追加。既存 `ai_daily_usage` は「回数」のまま、Neurons は別カラム/別テーブル/別集計のいずれかで検討。
- **セキュリティ（EP-33）**: Option A — 既存 CORS・Bindings の本番向け明示化と、機密の扱い方のドキュメント化。
- **ログ・Analytics（EP-35）**: Option B — 構造化ログ用ヘルパーを新規作成し、既存 logging ミドルウェアから利用。Cloudflare Analytics は設定・ドキュメントで対応。
- **ユーザー数可視化（EP-44）**: Option B — 認可付きの運用者向け API を新規ルートで用意。アクティブユーザー定義（例: 直近 N 日以内のログインまたはアクション）を設計で定義。

### 5.2 設計フェーズで持ち込む検討事項

1. **Neurons 計測**: Workers AI / AI Gateway のレスポンスに Neurons 相当が含まれるか、含まれない場合の概算式（リクエスト種別×係数）を調査し、計測ロジックを確定する。
2. **グローバル枠の保存先**: 日次で「全ユーザー合計 Neurons 概算」をどこに持つか（D1 新テーブル、KV、または Cloudflare 側メトリクスのみ）。
3. **運用者 API の認可**: 管理者ロール（Better Auth 拡張）、API キー、または Cloudflare のアクセス制御のみなど、認可方式を決定する。
4. **構造化ログ**: Workers 上で JSON ログを出す方法、Cloudflare Logs や Analytics との連携方法を確認する。

### 5.3 Research Needed 一覧

- Workers AI の Neurons 消費量をリクエスト単位で取得する方法（API またはレスポンスフィールド）。
- Cloudflare Workers における構造化ログ（JSON）の推奨方式と、Cloudflare Analytics / Logs との連携。
- 外形監視ツールが `/api/health` を呼ぶ際の認証要否（多くの場合は認証なしで 200 のみ返す設計で十分か）。

---

## 6. 出力チェックリスト

- [x] 要件と資産のマッピング（Missing / Constraint / Research Needed タグ付き）
- [x] Option A / B / C の理由とトレードオフ
- [x] Effort: L、Risk: Medium とその理由
- [x] 設計フェーズへの推奨と、持ち込む検討・Research 項目
