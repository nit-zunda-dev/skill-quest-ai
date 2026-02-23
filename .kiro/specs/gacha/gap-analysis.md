# ガチャ機能 実装ギャップ分析

## 1. 分析サマリ

- **スコープ**: 要件はアイテムマスタ・抽選アルゴリズム・クエスト完了時の1回付与・所持一覧の永続化・レアリティ/カテゴリ仕様準拠。既存コードにはアイテム/ガチャ系のテーブル・API・型が存在せず、**一から追加する必要がある**。
- **既存資産**: クエスト完了フロー（`completeQuest`・`PATCH /quests/:id/complete`・`generate-narrative`）、認証・D1/Drizzle・`routes + services` パターンはそのまま流用可能。フロントには「獲得アイテム」ルートとプレースホルダー `ItemsPage` が既にある。
- **主なギャップ**: (1) アイテムマスタ・ユーザー所持テーブルとマイグレーション、(2) レアリティベース抽選サービス、(3) 完了時「1回だけ付与」のフックと冪等性の設計、(4) 所持一覧APIと共有型/スキーマ、(5) フロントの一覧表示（EP-27 で演出拡張は別スコープ）。
- **推奨**: **ハイブリッド（Option C）** — 新規に `gacha` サービス・`items` ルート・アイテム/所持スキーマを追加し、既存の「クエスト完了」が走る2経路（ナラティブ完了・PATCH 完了）のどちらか一方、または共通の「完了＋付与」処理にガチャ付与を1回だけ実行するよう組み込む。設計フェーズで「付与トリガーをどちらに統一するか」と「冪等性の実装方法（例: クエスト単位で付与済みフラグ／所持レコードに quest_id 紐づけ）」を確定する。
- **次のアクション**: 本分析を参照し、`/kiro/spec-design gacha` で技術設計を作成する。設計時に「完了イベントの一元化」と「マスタデータの投入方法（シード/管理手段）」を検討する。

---

## 2. ドキュメントの位置づけ

- 本ドキュメントは `.kiro/settings/rules/gap-analysis.md` のフレームワークに沿って、承認済み要件（`.kiro/specs/gacha/requirements.md`）と現状コードベースの差分を分析した結果をまとめたものである。
- 設計の意思決定は行わず、**選択肢とトレードオフ**を提示する。最終的な方針は設計フェーズで決定すること。

---

## 3. 現状調査（Current State Investigation）

### 3.1 ドメイン周辺の資産

| 対象 | 状況 |
|------|------|
| **DB スキーマ** | `apps/backend/src/db/schema.ts`: `user`, `quests`, `grimoireEntries`, `userProgress`, `aiDailyUsage` 等。**アイテムマスタ・ユーザー所持アイテム用テーブルはなし**。 |
| **クエスト完了** | 完了は2経路で発生。(1) **POST /api/ai/generate-narrative**: ナラティブ生成後に `completeQuest(c.env.DB, user.id, data.taskId)` で `quests.completed_at` を更新。(2) **PATCH /api/quests/:id/complete** および **PATCH /api/quests/:id/status** (status=done): いずれも `completedAt` を設定。**いずれもガチャ付与は未実装**。 |
| **認証・ユーザー** | Better Auth + `authMiddleware`。`c.get('user')` で `AuthUser` 取得。所持データはユーザー単位で紐づける既存パターンあり（例: `grimoireEntries.userId`）。 |
| **バックエンド構成** | Hono ルートは `routes/`、ビジネスロジックは `services/`（例: `ai-usage.ts` に `completeQuest`）。D1 は `c.env.DB`、Drizzle は `drizzle(c.env.DB, { schema })`。 |

### 3.2 コンベンション

- **命名**: ルートは `*Router`、サービスは camelCase ファイル。テーブルは snake_case カラム（Drizzle で mode: 'timestamp' 等を使用）。
- **依存方向**: ルート → サービス、共有型は `@skill-quest/shared` から import。バックエンドは `schema` を `../db/schema` から参照。
- **テスト**: `*.test.ts` / `*.integration.test.ts`。D1 はモックまたは `@cloudflare/vitest-pool-workers` で検証。

### 3.3 統合ポイント

- **クエスト完了のたびに1回だけアイテムを付与する**には、現在 `completeQuest` が呼ばれるタイミング（generate-narrative 内）と、PATCH で完了にするタイミングの両方で「1クエスト1回付与」を保証する必要がある。そのため **「完了＋付与」を一箇所にまとめるか、両方から共通サービスを呼び出し、冪等になるよう設計する**必要がある。
- **所持一覧**: 認証ユーザー本人のみ取得する API がまだない。`/api/profile` や `/api/grimoire` と同様に、認証必須の GET でユーザー所持アイテムを返すエンドポイントが不足。

---

## 4. 要件充足性とギャップ（Requirements Feasibility）

### 4.1 要件 ↔ 資産マップ（ギャップタグ付き）

| 要件（要約） | 必要な技術要素 | 現状 | ギャップ |
|--------------|----------------|------|----------|
| **Req 1** アイテムマスタ・一意ID・カテゴリ・レアリティ・表示情報・画像パス解決 | アイテム用テーブル、カテゴリ/レアリティの列挙型、画像パス規則 | なし | **Missing** |
| **Req 2** 抽選アルゴリズム（1回1個、レアリティ確率分布、有効アイテムのみ、空マスタ時の挙動） | 抽選サービス、確率設定（設定可能 or 定数）、droppable フラグ | なし | **Missing** |
| **Req 3** クエスト完了時に1回抽選・付与・記録、冪等・認証/オーナーチェック | 完了フック、付与レコード、冪等性（同一クエストで二重付与しない） | 完了はあるが付与なし。冪等設計なし | **Missing** |
| **Req 4** 所持の永続化・一覧API・本人のみ・同一アイテム複数回の表現 | 所持テーブル、GET 一覧 API、認証スコープ | なし。ItemsPage はプレースホルダーのみ | **Missing** |
| **Req 5** レアリティ順序・カテゴリ閉集合・設定値のドキュメント/制約 | 共有型（Rarity/Category）、バリデーション or ドキュメント | なし | **Missing** |

- **Constraint**: 付与は「クエスト完了」に紐づける必要があるため、既存の `quests` または「完了を記録する1箇所」と整合した設計が必須。また、`generate-narrative` は1日1回制限があるが、PATCH 完了は回数制限がないため、**付与トリガーを「初回完了時のみ」にするか「PATCH 完了も含むか」は設計で明確化する必要がある**（Research Needed）。

### 4.2 非機能・複雑さ

- **セキュリティ**: 認証済みユーザー本人のみ付与・一覧取得。既存の `authMiddleware` と `user.id` で対応可能。
- **パフォーマンス**: 1回の完了あたり1回の抽選＋1件の INSERT。既存の D1 利用で足りる想定。
- **複雑さ**: 新規テーブル・新規サービス・既存完了フローへの組み込みのため、**中程度**（新規パターンは少ないが、付与トリガーと冪等性の仕様が重要）。

---

## 5. 実装アプローチの選択肢

### Option A: 既存コンポーネントの拡張

- **内容**: `ai-usage.ts` に抽選＋付与ロジックを追加。`completeQuest` の前後でガチャ実行。所持一覧は既存の `profileRouter` や `grimoireRouter` に GET を追加。アイテムマスタは既存 `schema.ts` にテーブル追加。
- **拡張箇所**: `services/ai-usage.ts`（抽選・付与）、`db/schema.ts`（items, user_acquired_items）、`routes/quests.ts`（PATCH complete 時にも付与するなら同じサービスを呼ぶ）、`routes/profile.ts` または `routes/grimoire.ts`（所持一覧）、`packages/shared`（型・スキーマ）。
- **トレードオフ**: 既存パターンの流用で初期実装は早い。一方で `ai-usage.ts` は既にキャラ・ナラティブ・利用制限・グリモワール・completeQuest を扱っており、責務が増える。PATCH 完了経路にも同じ付与を載せる場合は、quests ルートから ai-usage を参照するか、付与ロジックを別サービスに切り出さざるを得ない（結果的に Hybrid に近づく）。

### Option B: 新規コンポーネントの作成

- **内容**: `services/gacha.ts`（抽選＋付与）、`routes/items.ts`（GET 所持一覧、必要ならマスタ取得用）、`db/schema.ts` に items / user_acquired_items を追加。クエスト完了時は `questsRouter` と `aiRouter` の両方から `gacha.grantOnQuestComplete()` のような関数を呼ぶ。
- **責務境界**: ガチャ・アイテムはすべて `gacha` サービスと `items` ルートに集約。既存の `completeQuest` は「完了日時の更新」のみに保ち、付与は呼び出し元で行う。
- **トレードオフ**: 責務が明確でテストしやすい。その代わり、**「いつ付与するか」を両方のルートで同じ条件で呼ぶ必要**があり、冪等性（同一クエストで2回付与しない）は `gacha` サービス内で「この questId では既に付与済み」をチェックするなどして実装する必要がある。

### Option C: ハイブリッド（推奨）

- **内容**: **新規**: `services/gacha.ts`（抽選＋付与）、`routes/items.ts`（所持一覧 API）、`packages/shared` の Rarity/Category とアイテム・所持用の型/スキーマ、`db/schema.ts` の items / user_acquired_items。**拡張**: クエスト「完了」が確定する1箇所（例: `completeQuest` の拡張、または「完了＋付与」を行う新関数）でガチャ付与を1回だけ実行し、`questsRouter` の PATCH complete と `aiRouter` の generate-narrative の両方からその1箇所を呼ぶ（あるいは、付与は「初めて completedAt が立ったとき」に限定し、その処理を共通サービスにまとめる）。
- **組み合わせ**: 新規サービス・新規ルートでガチャと所持を分離しつつ、既存の完了フローには「1回だけ付与」する共通の入り口を設ける。マスタデータはマイグレーションまたはシードで投入。
- **トレードオフ**: 設計で「完了の定義」と「付与トリガー」を決める必要があるが、既存パターンを壊さず、テストと保守のバランスが良い。

---

## 6. 実装複雑度とリスク

| 項目 | 評価 | 理由（1行） |
|------|------|--------------|
| **Effort** | **M (3–7日)** | 新規テーブル・マイグレーション・抽選サービス・2経路への組み込み・共有型・所持API・フロント一覧差し替え。既存の D1/Drizzle/認証パターンは流用可能。 |
| **Risk** | **Medium** | 付与トリガーと冪等性を設計で明確にすれば、技術的未知は少ない。マスタデータの投入方法・画像パスの運用は設計で詰める必要あり。 |

---

## 7. 設計フェーズへの推奨事項

- **採用方針**: **Option C（ハイブリッド）** を前提に設計することを推奨する。新規の `gacha` サービスと `items` ルートでガチャ・所持を担当し、既存の「クエスト完了」が発生する2経路（generate-narrative / PATCH complete）から、**共通の「完了＋1回付与」処理**を呼ぶ形にすると、冪等性と責務の両立がしやすい。
- **設計で決めること**:
  - 付与トリガー: 「ナラティブ完了時のみ」とするか、「PATCH 含め初回完了時」とするか。両方なら「初めて completedAt が設定されたときだけ付与」とするか、`user_acquired_items` に `quest_id` を入れ「同一 quest_id では1件のみ」で冪等にするか。
  - アイテムマスタ: 初期データの投入方法（マイグレーション内 INSERT / 別シードスクリプト / 管理API）。`enabled_for_drop` やカテゴリ・レアリティの制約をどこで保証するか。
  - 画像パス: `/images/items/{category}/{id}.png` をどこでホストするか（フロント public、CDN、バックエンドの静的配信など）。EP-27 で演出が入る前提なら、パス規則だけ共有型 or API で固定する。
- **Research Needed**:
  - 同一クエストの「二重完了」（例: 先に PATCH で完了 → 後から generate-narrative を呼ぶ、または逆）が発生しうるか。発生しうる場合の冪等性の具体的な実装（テーブル設計・ユニーク制約・更新条件）。
  - マスタが空、または droppable が0件のときの挙動（no item / fallback アイテム / エラー）を仕様として確定する。

---

## 8. 次のステップ

- 本ギャップ分析の内容を踏まえ、**設計フェーズ**に進む。
  - `/kiro/spec-design gacha` で技術設計書を作成する。
  - 必要に応じて `/kiro/spec-design gacha -y` で要件を承認済みとして設計のみ進めてもよい。
- 設計完了後、`/kiro/spec-tasks gacha` でタスク分解し、`/kiro/spec-impl gacha` で実装に進む。
