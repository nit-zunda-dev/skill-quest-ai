# Research & Design Decisions: infra-stability-cost

---
**Purpose**: フェーズ3（インフラ安定化・コスト管理）の調査結果と設計判断の根拠を記録する。

---

## Summary

- **Feature**: infra-stability-cost
- **Discovery Scope**: Extension（既存バックエンド・ai-usage・CORS・ルートへの拡張と新規運用者API）
- **Key Findings**:
  - Workers AI の Neurons は API レスポンスに直接含まれない。Cloudflare ダッシュボードで確認可能。アプリ側では「操作種別×係数」による概算で D1 に日次集計する方式が 06_AI設計.md と整合する。
  - Cloudflare Workers では JSON 形式の構造化ログが推奨され、observability 設定でフィールドがインデックスされる。console.log に JSON 文字列を渡すパターンで実現可能。
  - ヘルスチェックは Worker 内に GET エンドポイントを用意し、オプションで D1 の軽いクエリ（SELECT 1）で健全性を返す。外形監視は認証なしで 200 を返す設計が一般的。

---

## Research Log

### Workers AI Neurons 計測

- **Context**: 要件 1（AI利用量の可視化）で Neurons 相当の計測・集計が必要。Workers バインディングの run レスポンスに Neurons が含まれるか確認した。
- **Sources Consulted**: Cloudflare Workers AI Pricing, 06_AI設計.md, docs/setup/03_workers_ai_setup.md
- **Findings**:
  - 課金単位は Neurons。無料枠 10,000 Neurons/日（00:00 UTC リセット）。REST API の usage にはトークン数が含まれる場合があるが、Worker の `env.AI.run()` 戻り値の型には Neurons フィールドの記載なし。
  - 06_AI設計.md では「1リクエストあたり平均 20 Neurons」「キャラ生成で約 19 Neurons」と概算で D1 に日次集計する方式を採用済み。
- **Implications**: アプリ側では「操作種別（generate-character / narrative / partner / chat / grimoire / goal-update）ごとの係数」で Neurons を概算し、D1 に記録・集計する。実際の課金は Cloudflare ダッシュボードで確認し、係数はドキュメントで調整可能とする。

### 構造化ログ（Workers）

- **Context**: 要件 5（ログ構造化）で構造化ログの形式と Cloudflare 連携を決める必要がある。
- **Sources Consulted**: Cloudflare Workers Logs, Console runtime API, observability 設定
- **Findings**:
  - Workers では JSON 形式でログを出すと observability でフィールドがインデックスされ、検索・集計しやすい。
  - `[observability] enabled=true` を wrangler.toml に追加する。console.log(JSON.stringify({ level, msg, path, ... })) のパターンで十分。
- **Implications**: 新規に構造化ログ用ヘルパー（例: `logStructured`）を用意し、既存 logging ミドルウェアとエラーハンドラから呼び出す。機密フィールドは渡さない。

### ヘルスチェックと D1

- **Context**: 要件 4 で /api/health とオプションで D1 健全性を返す。
- **Sources Consulted**: Cloudflare Health Checks, Workers best practices
- **Findings**:
  - Cloudflare の Standalone Health Checks はオリジンやアプリの URL を叩く。Worker 内に GET エンドポイントを用意すればよい。
  - D1 の健全性は `SELECT 1` などの軽いクエリで確認可能。失敗時は 503 または 200 で db: "unhealthy" を返す方針が一般的。
- **Implications**: GET /api/health を index に追加。レスポンスは { status: "ok" } とし、オプションで checks: { db: "ok" | "unhealthy" } を含める。認証は不要とする。

### 運用者 API の認可

- **Context**: 要件 6（ユーザー数可視化）と EP-31 の運用者向け利用量 API は認可が必要。
- **Sources Consulted**: gap-analysis.md, 既存 Better Auth
- **Findings**:
  - 現状 Better Auth に管理者ロールは未実装。API キー（環境変数で保持）で運用者を認可する方式が、実装コストが低く、Cloudflare のアクセス制御（IP 制限等）と組み合わせやすい。
- **Implications**: 運用者向けエンドポイントはヘッダー `X-Ops-API-Key` と env の `OPS_API_KEY` を比較する方式を採用。キー未設定の環境では 404 または 501 を返す。

---

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|----------------------|-------|
| 既存拡張のみ | ヘルス・フォールバック・CORS を既存 index/middleware/ai に追加 | 変更箇所が少ない | ai.ts とルートが肥大化、Neurons 集計の責務が混在 | EP-34, EP-33 向き |
| 新規コンポーネント中心 | 運用者 API・Neurons 集計・構造化ログを新規 routes/services に分離 | 責務明確、テストしやすい | ファイル数増加 | EP-31, EP-44, EP-35 向き |
| ハイブリッド | ヘルス・CORS・フォールバックは拡張、Neurons 集計・ops API・ログは新規 | バランスが良く、既存パターンに沿う | 実装時に境界の一貫性が必要 | 採用 |

---

## Design Decisions

### Decision: Neurons 概算の保存先

- **Context**: グローバル日次 Neurons をどこに持つか。既存 ai_daily_usage はユーザー別・日次・回数。
- **Alternatives Considered**:
  1. ai_daily_usage に neurons_estimate カラムを追加し、ユーザー別に記録して SUM で日次合計を算出する。
  2. 新テーブル global_ai_daily_usage (date_utc, total_neurons_estimate) を用意し、AI 呼び出しのたびに UPDATE で加算する。
- **Selected Approach**: 1 を採用。既存テーブルに neurons_estimate を追加し、各操作記録時に係数に応じて加算。日次合計は SUM(neurons_estimate) WHERE date_utc = today で取得。既存の回数カラムはそのまま維持する。
- **Rationale**: ユーザー別の内訳も見たい場合に有利。テーブルが一つで済み、マイグレーションも単純。
- **Trade-offs**: 行数はユーザー×日付分だけ増えるが、集計は 1 日 1 回程度で許容。将来グローバルのみ欲しくなった場合は VIEW やキャッシュで対応可能。
- **Follow-up**: 係数は定数または Bindings のオプション変数で持つ。ドキュメントに「Cloudflare ダッシュボードの実測と照らして調整する」と明記する。

### Decision: フォールバックの判定タイミング

- **Context**: 無料枠閾値超過時にスタブに切り替えるタイミングをどこで行うか。
- **Alternatives Considered**:
  1. createAiService の前に、呼び出し元（各ルート）で「今日の合計 Neurons が閾値以上ならスタブ」を判定する。
  2. createAiService 内で env と DB を渡し、サービス層で「閾値超過ならスタブを返す」ラッパーを返す。
- **Selected Approach**: 2 を採用。createAiService(env, options?) にオプションで db と今日の合計取得関数を渡し、サービスが「閾値超過なら createStubAiService」を返す。既存の INTEGRATION_TEST_AI_STUB はそのまま優先。
- **Rationale**: ルートをいじらず、AI 呼び出しの境界一箇所で判定できる。テスト時は db を渡さず閾値チェックをスキップ可能。
- **Trade-offs**: ai サービスが D1 に依存するが、既に ai-usage は D1 を参照しているため、ルートから db を渡すだけの変更で済む。
- **Follow-up**: 閾値（例: 9_000）と日次上限（10_000）は環境変数 AI_NEURONS_DAILY_LIMIT / AI_NEURONS_FALLBACK_THRESHOLD で設定可能にする（未設定時はデフォルト値）。

### Decision: 運用者 API の認可

- **Context**: 運用者向け API（AI 利用量集計、ユーザー数）の認可方式。
- **Alternatives Considered**:
  1. Better Auth に管理者ロールを追加し、セッションで認可する。
  2. 固定 API キーを環境変数で持ち、リクエストヘッダで照合する。
- **Selected Approach**: 2 を採用。Bindings に OPS_API_KEY（オプション）を追加し、/api/ops/* では X-Ops-API-Key と比較。一致しなければ 401。キー未設定の環境では 404 または 501 を返す。
- **Rationale**: 管理者ロールのスキーマ変更・マイグレーションが不要。スクリプトや外形監視以外のツールからもキー1つで呼び出しやすい。
- **Trade-offs**: キーのローテーションは手動。本番では Cloudflare の IP 制限や WAF と組み合わせることを推奨。
- **Follow-up**: ドキュメントに「OPS_API_KEY は wrangler secret で設定」と記載する。

### Decision: ヘルスエンドポイントの認証

- **Context**: /api/health を外形監視が叩く際、認証を要求するか。
- **Selected Approach**: 認証なし。GET /api/health は常に 200 と { status: "ok" }（およびオプションで checks）を返す。機密情報は含めない。
- **Rationale**: 一般的な外形監視は認証なしで HTTP で叩く。障害検知が目的であり、詳細はログや運用者 API で確認する。
- **Follow-up**: なし。

---

## Risks & Mitigations

- **Neurons 概算のずれ**: 係数はモデル・入力長で変動する。実測（Cloudflare ダッシュボード）と照らして係数をドキュメントで更新し、閾値は余裕を持って設定する。
- **OPS_API_KEY 漏洩**: キーは wrangler secret で設定し、コード・ログに含めない。漏洩時はキーをローテーションし、WAF で異常なアクセスを検知する。
- **構造化ログのボリューム**: 全リクエストを JSON で出すと容量が増える。observability の head_sampling_rate や、エラー・重要操作のみ構造化ログに出す方針で調整する。

---

## References

- [Workers AI Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) — Neurons と料金
- [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs) — 構造化ログと observability
- [Health Checks](https://developers.cloudflare.com/health-checks) — Cloudflare 外形監視
- 06_AI設計.md — 閾値フォールバックと概算方針
- gap-analysis.md — 既存資産とギャップ
