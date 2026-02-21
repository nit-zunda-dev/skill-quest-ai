# Research & Design Decisions: quest-auto-generation

---
**Purpose**: クエスト自動生成機能の調査結果と設計判断の根拠を記録する。

---

## Summary

- **Feature**: quest-auto-generation
- **Discovery Scope**: Extension（既存 Genesis / Quest Board / AI サービス / プロフィールの拡張）
- **Key Findings**:
  - 目標（goal）は現状プロフィール JSON に保存されていない。Genesis で formData にのみ存在し、GET /ai/character では返っていない。
  - 既存 AI サービスは generateCharacter / generateNarrative 等のパターン（プロンプト → runWithLlama31_8b → JSON 抽出・型ガード・フォールバック）に従っている。
  - クエスト登録は POST /api/quests の 1 件ずつのみ。一括登録用のバッチ API は存在しない。
  - プロフィール更新は `updateCharacterProfile`（ai-usage）で JSON をマージして保存。目標用の専用エンドポイントはない。目標変更の日次制限は ai_daily_usage に列を足して管理可能。

---

## Research Log

### 既存プロフィール・目標の永続化

- **Context**: 要件 1.1, 4.1 で「Genesis で入力された目標をクエスト自動生成の入力として利用できる」必要がある。
- **Sources**: `apps/backend/src/routes/ai.ts`, `services/ai-usage.ts`, `packages/shared/src/types.ts`（CharacterProfile）
- **Findings**: CharacterProfile 型に goal フィールドはない。saveCharacterProfile は Genesis 時に profile オブジェクトをそのまま JSON で保存している。generateCharacter の戻り値に goal を含め、保存時に profile に goal を入れる拡張が可能。既存ユーザーは profile に goal が無いため、オプショナルとして扱う。
- **Implications**: CharacterProfile に `goal?: string` を追加。Genesis 保存時に `profile.goal = data.goal` をセット。GET /ai/character は既に profile を返すため、goal もそのまま返る。

### トリガーと目標更新 UI

- **Context**: ユーザー指示「Genesis 完了直後に提案ステップを挟む」「ダッシュボードで目標を更新する UI を用意し、目標変更時をトリガー（その際、既存タスクはリセット）」。
- **Sources**: `App.tsx`（Genesis フロー）, `Dashboard.tsx`, `QuestBoard.tsx`
- **Findings**: Genesis は INTRO → QUESTIONS → LOADING → RESULT → handleCompleteGenesis で Dashboard へ。ResultStep の次に「タスクを提案」ステップを挟むと、RESULT の次に SUGGEST を追加し、提案採用/却下後に Dashboard へ遷移する形にできる。目標更新は Dashboard 上に「目標を変更」UIを配置し、変更確定時に (1) 目標を 1 日 2 回制限で更新、(2) 当該ユーザーの全クエスト削除、(3) 提案フローを開始（suggest-quests 呼び出し）とする。
- **Implications**: フローに SUGGEST ステップを追加。目標更新用 API は「goal 更新 + クエスト全削除」を行い、1 日 2 回制限を ai_daily_usage の新列で管理する。

### 目標変更 1 日 2 回とクエストリセット

- **Context**: ユーザー指示「目標変更は 1 日 2 回」「目標変更時は前の自身のタスクはリセットする」。
- **Sources**: `ai_daily_usage` スキーマ、既存の narrativeCount / partnerCount 等の日次制限パターン。
- **Findings**: ai_daily_usage に goal_update_count を追加し、1 日 2 回まで許可する。目標更新時にそのユーザーの quests を一括 DELETE する。既存 quests ルートに DELETE / はないため、新規に「当該ユーザーの全クエスト削除」をサービス層に追加し、目標更新 API から呼ぶ。
- **Implications**: ai_daily_usage に goalUpdateCount を追加。同一 (userId, dateUtc) で 2 未満なら許可しインクリメント、2 以上なら 429。マイグレーション必要。クエスト一括削除は quests サービスまたは ai-usage から D1 で DELETE FROM quests WHERE user_id = ? を実行する関数を追加。

### 複数クエスト登録（バッチ）

- **Context**: ユーザー指示「複数クエスト登録は新設したほうが良さそう」。
- **Sources**: `apps/backend/src/routes/quests.ts`（POST / は 1 件）, `createQuestSchema`
- **Findings**: 提案タスクを複数件まとめて登録するため、POST /api/quests/batch を新設する。リクエストは CreateQuestRequest の配列。バリデーション後にループで INSERT し、作成されたクエスト一覧を返す。既存 createQuestSchema を流用し、配列用スキーマを shared に追加する。
- **Implications**: バッチ用スキーマ（createQuestBatchSchema）、questsRouter に POST /batch、フロントは useQuests に addQuestsBatch または api-client に createQuestsBatch を追加。

---

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存拡張中心 | AI サービス・ai ルート・QuestBoard を拡張、目標はクライアントのみ | 変更ファイル少 | 目標の永続化がなく、再入力が必要 | ユーザー方針で採用せず |
| 新規コンポーネント中心 | 提案専用サービス・ルート・モーダルを新規 | 責務分離が明確 | ファイル数増加 | バッチのみ新設、他は拡張で十分 |
| ハイブリッド（採用） | プロフィールに goal 保存、AI/ルート拡張、提案 UI 新規、バッチ新設、目標更新 API 新設 | 目標の永続化と 2 トリガーを満たしつつ既存パターンに沿う | 目標更新の 1 日 2 回とリセットの組み合わせを設計で明示 | 本設計で採用 |

---

## Design Decisions

### Decision 1: プロフィール JSON に goal を保存する

- **Context**: 要件 1.1, 4.1。目標をクエスト自動生成の入力として参照可能にする必要がある。
- **Alternatives Considered**:
  1. 目標を永続化せず、Genesis 直後のみクライアントの formData で API に渡す。
  2. プロフィール JSON に goal を追加し、Genesis 保存時と目標更新時に書き込む。
- **Selected Approach**: CharacterProfile 型に `goal?: string` を追加する。Genesis 時に saveCharacterProfile に渡す profile に goal を含める。GET /ai/character は既存どおり profile を返すため goal も含まれる。目標更新 API で profile の goal を更新する。
- **Rationale**: ダッシュボードで「この目標でタスクを提案」を 1 クリックで出しやすくし、目標変更時トリガーと整合する。
- **Trade-offs**: 既存ユーザーは goal が無いため、オプショナルとして扱い、未設定時は目標入力フォームを表示する。
- **Follow-up**: 既存 CharacterProfile を返している箇所で goal が undefined の場合の表示を実装で確認する。

### Decision 2: トリガーは Genesis 直後の提案ステップと、ダッシュボードの目標更新時

- **Context**: 要件 1.2。2 種類のトリガーを用意する。
- **Alternatives Considered**:
  1. Genesis 直後のみ。
  2. ダッシュボードの空状態 CTA のみ。
  3. 両方（Genesis 直後 + 目標更新 UI で変更時）。
- **Selected Approach**: (1) Genesis 完了直後に「タスクを提案」ステップ（SUGGEST）を挟む。ResultStep の次に SUGGEST を表示し、提案表示・採用/却下後に Dashboard へ。(2) ダッシュボードに目標を表示・編集する UI を用意し、目標を変更して確定したら「1 日 2 回」をチェックしたうえで目標を更新し、既存クエストを全削除してから提案フローを開始する。
- **Rationale**: 初回オンボーディングと、その後の目標変更の両方に対応する。
- **Trade-offs**: フローと画面が増えるが、要件とユーザー指示に沿う。
- **Follow-up**: 目標更新 UI の配置（StatusPanel 付近や設定風モーダルなど）は実装時に決定する。

### Decision 3: 目標変更は 1 日 2 回

- **Context**: 要件 5.3。目標変更の濫用防止とリソース保護。
- **Alternatives Considered**:
  1. 無制限。
  2. 1 アカウント 1 回のみ（初回のみ）。
  3. 1 日 1 回。
  4. 1 日 2 回。
- **Selected Approach**: 1 日 2 回（UTC 日付で集計）。ai_daily_usage に goal_update_count を追加し、目標更新 API でインクリメント。2 未満なら許可してインクリメント、2 以上なら 429 を返す。
- **Rationale**: ユーザー指示どおり（1 日 2 回制限）。既存の narrative/partner 等の日次制限と統一感がある。
- **Trade-offs**: マイグレーションが必要。既存 ai_daily_usage の primary key は (userId, dateUtc) のため、新列の追加で対応可能。
- **Follow-up**: マイグレーションで goal_update_count を 0 デフォルトで追加する。

### Decision 4: 複数クエスト登録はバッチ API を新設する

- **Context**: 要件 3.2。採用した提案タスクを一括で Quest Board に登録する。
- **Alternatives Considered**:
  1. 既存 POST /api/quests をループで複数回呼ぶ。
  2. POST /api/quests/batch を新設し、配列で受け取って一括 INSERT する。
- **Selected Approach**: POST /api/quests/batch を新設。リクエストは CreateQuestRequest の配列。各要素を createQuestSchema で検証し、トランザクションまたは順次 INSERT で登録し、作成されたクエスト一覧を返す。
- **Rationale**: 往復回数削減と一貫性（全件成功 or 失敗の扱いを実装で決められる）。ユーザー指示に合致。
- **Trade-offs**: 新エンドポイントとスキーマの追加が必要。
- **Follow-up**: バッチの最大件数（例: 20 件）をスキーマで制限するか検討する。

---

## Risks & Mitigations

- **AI 出力の揺れ**: 目標→タスクの JSON 配列で type/difficulty が enum 外になる可能性。→ プロンプトで enum 値を明示し、バリデーションで不正な要素はスキップまたはフォールバック値に正規化する。
- **既存ユーザーに goal が無い**: GET /ai/character で goal が undefined になる。→ フロントで goal が無い場合は目標入力フォームを表示し、入力後に suggest-quests を呼ぶ。
- **目標更新とクエスト削除の順序**: 目標更新 API 内で「1 日 1 回チェック → goal 更新 → クエスト全削除」の順で実行し、クエスト削除失敗時はロールバックまたはエラー返却とする。

---

## References

- 既存 AI 設計: `docs/architecture/06_AI設計.md`
- 既存利用制限: `apps/backend/src/services/ai-usage.ts`, `ai_daily_usage` テーブル
- 既存クエスト API: `apps/backend/src/routes/quests.ts`, `createQuestSchema`
