# ガチャ機能 調査・設計判断ログ

---
**目的**: ディスカバリーで得た知見と、設計判断の根拠を記録する。
---

## Summary

- **Feature**: gacha
- **Discovery Scope**: Extension（既存クエスト完了フローへの統合＋新規ドメイン）
- **Key Findings**:
  - クエスト完了は2経路（POST generate-narrative 内の completeQuest と PATCH quests/:id/complete または PATCH quests/:id/status）で発生。両方で「初回完了時のみ1回付与」を保証するには、共通のガチャ付与サービスを呼び出し、user_acquired_items に quest_id を保持して (user_id, quest_id) の一意性で冪等にする。
  - 既存パターンは routes + services、D1/Drizzle、@skill-quest/shared の型・Zod スキーマ。新規は gacha サービス・items ルート・items / user_acquired_items テーブルのみで足りる。
  - マスタ空・droppable 0 件時は「付与なし」とし、例外で落とさず定義済み挙動とする（要件 2.4）。

## Research Log

### 拡張ポイント（クエスト完了）

- **Context**: ガチャ付与を「クエスト完了時1回」に紐づけるため、完了が発生する箇所を特定した。
- **Sources**: gap-analysis.md、apps/backend/src/routes/ai.ts、apps/backend/src/routes/quests.ts、apps/backend/src/services/ai-usage.ts
- **Findings**:
  - `completeQuest(db, userId, questId)` は ai-usage.ts で定義され、generate-narrative ハンドラ内でのみ呼ばれている。quests の completedAt を UPDATE するだけ。
  - PATCH /api/quests/:id/complete と PATCH /api/quests/:id/status（status=done）は quests.ts 内で直接 completedAt を更新。completeQuest は呼ばれない。
  - したがって「完了」が発生するのは (1) generate-narrative 成功後、(2) PATCH complete または PATCH status の2系統。両方で同じユーザー・同じ quest に対して二重に付与しないよう、付与ロジックは1箇所に集約し、quest 単位で「すでに付与済み」をチェックする必要がある。
- **Implications**: 新規サービス（例: grantItemOnQuestComplete）を用意し、quests ルートの PATCH と ai ルートの generate-narrative の両方から呼ぶ。付与済み判定は user_acquired_items の quest_id 有無（またはユニーク制約）で行う。

### 既存スキーマ・命名

- **Context**: 新規テーブルを Drizzle/D1 で追加する際の命名とリレーションを揃える。
- **Sources**: apps/backend/src/db/schema.ts
- **Findings**: テーブルは sqliteTable、PK は id (text)、外部キーは references(() => table.id, { onDelete: 'cascade' })、タイムスタンプは integer mode: 'timestamp'。リレーションは relations() で定義し schema に含める。
- **Implications**: items は id, category, rarity, name, description, enabled_for_drop 等。user_acquired_items は id, user_id, item_id, quest_id, acquired_at。quest_id は NULL 許容（将来の経路で紐づけない場合に備えてもよいが、本設計では常に紐づける）。

### 確率分布・設定

- **Context**: レアリティ別確率をコードで持つか設定で持つか。
- **Sources**: requirements.md 2.2、docs/product/gacha-items-nanobanana.md
- **Findings**: 要件は「approximately 50/30/13/5/2、exact values may be configurable」。既存プロジェクトに KV や env で確率を外出しする慣習はない。
- **Implications**: 初期は定数（デフォルト確率）をサービス内に持つ。将来の調整は定数変更または設定テーブル拡張で対応可能とし、設計では「確率は common > rare > … の順序を保つ」ことのみ保証する。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存拡張のみ | ai-usage に抽選・付与を追加、quests からも ai-usage を呼ぶ | 変更ファイルが少ない | ai-usage の責務過多、quests が ai に依存 | gap-analysis Option A |
| 新規のみ | gacha サービス・items ルートを新設、両ルートから呼ぶ | 責務分離が明確 | 両ルートで呼び忘れ・条件ずれのリスク | gap-analysis Option B |
| ハイブリッド | 新規 gacha サービス＋items ルート、完了2経路から共通「付与1回」を呼ぶ | 責務分離と冪等性を両立 | 付与トリガー仕様の明文化が必要 | gap-analysis 推奨 Option C |

## Design Decisions

### Decision: 付与トリガーと冪等性

- **Context**: 同一クエストで PATCH 完了と generate-narrative の両方が起こり得る場合の二重付与を防ぐ。
- **Alternatives Considered**:
  1. 付与は generate-narrative 時のみ → PATCH で完了したユーザーはアイテムを得られない。体験が不統一。
  2. 両経路で付与するが、付与時に「この quest で既に付与済みか」をチェックし、未付与なら付与して user_acquired_items に quest_id を記録。同一 quest_id では1件のみ。
- **Selected Approach**: 2。共通サービス `grantItemOnQuestComplete(db, userId, questId)` を用意し、(1) その quest で既に user_acquired_items にレコードがあれば何もしない（冪等）、(2) なければ抽選→1件 INSERT（quest_id を格納）。PATCH complete/status と generate-narrative の両方で、完了処理の後にこのサービスを呼ぶ。quest の completedAt 更新は既存のまま（completeQuest または quests ルートの UPDATE）とし、付与はその「後」の1回呼び出しで行う。
- **Rationale**: 1クエスト1付与を保証しつつ、どちらの完了経路でも同じ体験にできる。既存の completeQuest のシグネチャは変えず、呼び出し元で付与を呼ぶ形にすれば ai-usage の変更は最小限で済む。
- **Trade-offs**: quests ルートが gacha サービスに依存するが、依存は一方向でテストしやすい。user_acquired_items に quest_id を必須にすると「ナラティブ経由でない付与」はすべて PATCH 経路と紐づくが、現仕様では両経路とも quest があるので問題ない。
- **Follow-up**: 実装時に PATCH /:id/complete と PATCH /:id/status の両方で、完了成功後に grantItemOnQuestComplete を呼ぶことを忘れないようテストでカバーする。

### Decision: マスタ空・droppable 0 件時の挙動

- **Context**: 要件 2.4「behave in a defined way (e.g. no item granted or fallback), shall not fail silently」。
- **Alternatives Considered**:
  1. 例外を投げて 500 にする。
  2. 付与なし（grant しない）とし、呼び出し元には「今回付与なし」を返す。user_acquired_items には挿入しない。
- **Selected Approach**: 2。抽選結果が「アイテムなし」の場合は正常系として扱い、エラーにしない。クエスト完了そのものは成功したままとする。
- **Rationale**: 運用でマスタを空にした一時状態でも、完了操作が失敗しない方が安全。要件の「no item granted」に合致する。
- **Trade-offs**: ユーザーには「完了したがアイテムは出なかった」という状態が発生し得る。UI では「今回の報酬なし」などと表示する方針は EP-27 で検討可能。
- **Follow-up**: 抽選サービスは `drawResult: { item: Item | null }` のような型で返し、null のときは付与レコードを作らない。

### Decision: 所持の表現（同一アイテム複数回）

- **Context**: 要件 4.4「same item multiple times → duplicate entries or quantity so that collection state is unambiguous」。
- **Alternatives Considered**:
  1. 1ユーザー1アイテム1行で quantity を加算する。
  2. 取得ごとに1行（duplicate entries）。quest_id と acquired_at で履歴が分かる。
- **Selected Approach**: 2。user_acquired_items は「取得履歴」として複数行を許容する。一覧 API は時系列で返し、同一 item_id が複数行あってもそのまま返す。
- **Rationale**: コレクション状態が明確で、いつどのクエストで獲得したかも分かる。将来の「重複排出」表示や集計も容易。
- **Trade-offs**: 行数は増えるが、1完了1行程度であり D1 の規模では問題にならない想定。

### Decision: 画像パス解決

- **Context**: 要件 1.3「resolve path from category and identifier (e.g. /images/items/{category}/{id}.png)」。
- **Selected Approach**: パス規則を仕様として固定する。API では item に id と category を返すだけで、クライアントが `/images/items/${category}/${id}.png` を組み立てる。画像アセットのホスティング（public や CDN）は本機能のスコープ外とし、EP-27 やデプロイ設定に委ねる。
- **Rationale**: 既存フロントは静的は Vite の public を利用している想定。バックエンドでパス文字列を返してもよいが、規則が固定ならクライアント側で組み立てで十分。
- **Follow-up**: 共有型または API ドキュメントにパス規則を明記する。

## Risks & Mitigations

- **二重完了の順序**: 先に PATCH で完了→後から generate-narrative を呼ぶと、completeQuest が quest を再び completed に更新しようとするだけなので、付与は PATCH 時点で1回だけ行われる。逆の順序でも、2回目に grantItemOnQuestComplete が呼ばれた時点で「当該 quest で既に1件ある」ため付与しない。→ 冪等性で緩和済み。
- **マスタ未投入**: 初回デプロイで items が空だとすべての完了で「付与なし」になる。→ マイグレーションまたはシードで初期マスタを投入するタスクを設計に含める。
- **確率値の変更**: コード定数の変更で対応。将来、管理画面で変えたい場合は設定テーブルを追加する拡張で対応可能。→ 設計では「確率の相対順序」のみ保証し、具体的な数値は実装で持つ。

## References

- gap-analysis.md（本 spec 内）— 現状調査と Option A/B/C の比較
- requirements.md — 要件 ID 1.1〜5.3
- docs/product/gacha-items-nanobanana.md — カテゴリ・レアリティ・アイテム例
- steering: structure.md, tech.md, product.md — パターンとスタック
