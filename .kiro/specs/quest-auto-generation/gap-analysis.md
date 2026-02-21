# Gap Analysis: quest-auto-generation

## 1. Current State Investigation

### 1.1 ドメイン関連アセット

| 領域 | 場所 | 内容 |
|------|------|------|
| 目標入力 | `apps/frontend/src/components/GenesisStep.tsx` | `QuestionStep` で name / goal / genre を入力。`onNext` で `handleGenerate` が呼ばれキャラ生成へ。 |
| Genesis フロー | `apps/frontend/src/App.tsx` | INTRO → QUESTIONS → LOADING（generateCharacter）→ RESULT → `handleCompleteGenesis` で `justCompletedProfile` をセットし Dashboard へ遷移。 |
| キャラ・目標の永続化 | `apps/backend/src/routes/ai.ts`, `services/ai-usage.ts` | `genesisFormDataSchema`（name, goal, genre）で受信。`saveCharacterProfile` で `user_character_profile.profile`（JSON）に保存。**CharacterProfile 型に goal フィールドはなく、prologue にのみ目標が含まれる場合あり。** |
| クエスト API | `apps/backend/src/routes/quests.ts` | GET /, POST /（1件作成）, PUT /:id, DELETE /:id, PATCH /:id/complete, PATCH /:id/status。一括作成 API はない。 |
| クエスト作成スキーマ | `packages/shared/src/schemas.ts` | `createQuestSchema`: title, type（TaskType）, difficulty（Difficulty）, skillId?, scenario?, winCondition?。 |
| AI サービス | `apps/backend/src/services/ai.ts` | `generateCharacter`, `generateNarrative`, `generatePartnerMessage`, `generateGrimoire`。目標→タスクリスト生成は未実装。 |
| AI ルート | `apps/backend/src/routes/ai.ts` | POST /generate-character, /generate-narrative, /generate-partner-message, /chat。目標からタスク提案するエンドポイントはない。 |
| フロント API クライアント | `apps/frontend/src/lib/api-client.ts` | `generateCharacter`, `generateTaskNarrative`, `generatePartnerMessage`。クエスト提案用 API 呼び出しはない。 |
| Quest Board UI | `apps/frontend/src/components/QuestBoard.tsx` | タスク追加フォーム（手動 1 件）、Kanban 3 列。空状態は「タスクなし」のみ。CTA や提案フローはない。 |
| ダッシュボード | `apps/frontend/src/components/Dashboard.tsx` | `useQuests` で一覧取得、`addQuest` で 1 件追加。クエスト提案モーダルやオンボーディング分岐はない。 |
| AI 利用制限 | `apps/backend/src/services/ai-usage.ts` | `ai_daily_usage`: narrativeCount, partnerCount, chatCount, grimoireCount。クエスト提案用のカウントはない。 |

### 1.2 コンベンション・パターン

- **バックエンド**: ルートは薄く、サービス層で AI・D1 を呼ぶ。`zValidator('json', schema)` で検証。認証は `authMiddleware` で `c.get('user')`。
- **AI 呼び出し**: `createAiService(env)` で `AiService` を取得。プロンプト構築 → `runWithLlama31_8b` → JSON 抽出・型ガード・フォールバック。
- **フロント**: API は `lib/api-client.ts` に集約。TanStack Query で一覧・mutation。`useQuests` の `addQuest` は 1 件ずつ POST。
- **共有型**: `@skill-quest/shared` の `CreateQuestRequest`, `Task`, `TaskType`, `Difficulty` をフロント・バックで共有。

### 1.3 インテグレーション面

- **目標の参照**: Genesis 完了後 Dashboard に遷移する時点で、**goal は App の formData にのみ存在し、永続化されていない**。プロフィール JSON に goal を追加保存するか、クエスト提案を「Genesis 直後の 1 回だけ」に限定し、そのタイミングでクライアントが保持している goal を渡す必要がある。
- **クエスト登録**: 既存は 1 件ずつ `POST /api/quests`。提案タスクを複数登録するには、ループで POST するか、`POST /api/quests/batch` のような一括作成を新設するか選ぶ必要がある。
- **レート制限**: クエスト自動生成を「1 アカウント 1 回」にするか「1 日 N 回」にするかポリシー未定。既存の `ai_daily_usage` に列を足すか、別テーブルで 1 回限りを管理するかは設計で決定する。

---

## 2. Requirements Feasibility Analysis

### 2.1 要件ごとの技術ニーズとギャップ

| Req | 技術ニーズ | 現状 | ギャップ |
|-----|------------|------|----------|
| **1. 目標入力と生成トリガー** | 目標をクエスト生成の入力として利用可能にする | 目標は Genesis で formData にあり、プロフィールには明示的には保存されていない | **Missing**: 目標の参照方法（プロフィールに goal を追加するか、クライアントで保持して API に渡すか）の決定と実装 |
| | トリガー（Genesis 直後 or 専用 CTA）の提供 | Genesis 完了後は即 Dashboard。Quest Board に空状態 CTA なし | **Missing**: トリガー UI（例: ResultStep 直後の「タスクを提案」ステップ、または Dashboard/QuestBoard の空状態 CTA） |
| **2. AI による目標分解** | 目標を AI に渡しタスクリストを生成 | AI サービスに目標→タスク生成がない | **Missing**: `generateSuggestedQuests(goal, genre?)` 相当の関数とプロンプト、JSON 出力形式（title, type, difficulty の配列） |
| | 既存クエスト形式との整合 | createQuestSchema / Task 型と一致 | **Constraint**: AI 出力を TaskType / Difficulty の enum にマッピングする必要あり（文字列の場合はバリデーションで正規化） |
| | 3〜7 件の妥当な件数 | プロンプトで指示可能 | 実装で対応 |
| | 空・極端に短い目標のスキップ/エラー | バリデーション未実装 | **Missing**: 目標の長さ・内容のバリデーション（既存 `prepareUserPrompt` の流用可否は要確認） |
| **3. 提案タスクの確認と登録** | 提案一覧の表示・採用/却下 | 該当 UI なし | **Missing**: 提案タスク一覧コンポーネント、採用時の登録、却下時の何もしない |
| | 採用タスクの Quest Board 登録 | addQuest は 1 件ずつ | **Missing**: 複数件の登録方法（ループ POST または batch エンドポイント） |
| | 登録前の編集（オプション） | なし | **Missing**: 編集 UI はスコープ次第 |
| **4. オンボーディング統合** | Genesis の目標を利用 | 上記のとおり目標の参照方法が未確定 | **Missing**（1 と同様） |
| | 生成中のローディング表示 | 他 AI 呼び出しと同様のパターンで可能 | 既存パターンに合わせて実装 |
| | 登録完了後の Quest Board 表示 | Dashboard が既に Quest Board を表示。invalidate で再取得 | 採用後に invalidate すれば足りる |
| **5. エラー処理と制約** | AI 失敗・タイムアウト時のメッセージ | 他 AI と同様に try/catch とフォールバック or エラー返却 | 既存パターンに合わせて実装 |
| | 目標の制約未達時 | バリデーション | **Missing**: 文字数・ポリシー（2 と重複） |
| | レート制限・AI 利用量ポリシー | 新規「クエスト提案」の制限が未定義 | **Missing**: 制限ポリシー（1 回/アカウント or 1 日 N 回）と ai_usage または別テーブルでの記録 |

### 2.2 非機能・制約

- **セキュリティ**: 既存と同様に認証必須、`prepareUserPrompt` による入力サニタイズを目標にも適用可能か要確認。
- **パフォーマンス**: AI 1 回呼び出し + 複数クエスト登録。バッチ登録を用意すれば往復回数削減可能。
- **スケーラビリティ**: 既存 Workers AI・D1 の枠内。新規 AI 1 種追加程度。

### 2.3 複雑さのサイン

- **ワークフロー**: Genesis 完了 → 提案表示 → 採用/却下 → 登録、という一連のフローが必要。
- **外部連携**: Workers AI 既存パターンで対応可能。新規 DB テーブルは「1 回限り」を管理する場合のみ検討。

---

## 3. Implementation Approach Options

### Option A: 既存コンポーネントの拡張中心

- **拡張候補**:
  - **AI サービス** (`services/ai.ts`): `generateSuggestedQuests(goal, genre?)` を追加。プロンプトで「3〜7 件、title/type/difficulty の JSON 配列」を返す。
  - **AI ルート** (`routes/ai.ts`): `POST /suggest-quests` を追加。body: `{ goal: string, genre?: string }`。認証・レート制限・バリデーションを既存スタイルで実装。
  - **QuestBoard**: 空状態（`tasks.length === 0`）のときに「目標からタスクを提案」CTA を表示。クリックでモーダルまたはインラインで目標入力 → API 呼び出し → 提案一覧表示。
  - **useQuests**: `addQuest` をループで複数回呼ぶ（batch は作らない）。
- **目標の受け渡し**: プロフィールに goal を保存しない案。**トリガーを「Dashboard の空状態 CTA」に限定**し、その時点でユーザーに目標を再入力させるか、**プロフィール取得 API のレスポンスに goal を追加**（保存時に profile に goal を含める）して CTA から「この目標で提案」を 1 クリックにできるようにする。
- **互換性**: 既存 API・DB スキーマを変えずに済む（profile に goal を入れる場合は JSON の追加フィールドのみ）。
- **トレードオフ**:
  - ✅ 新規ファイルを最小にできる
  - ❌ QuestBoard や App の責務が増える
  - ❌ 「Genesis 直後に自動で提案」をする場合は、ResultStep の次にステップを挟むか、Dashboard 初回表示時にモーダルを出すなど、フロー変更がやや複雑

---

### Option B: 新規コンポーネント中心

- **新規作成候補**:
  - **バックエンド**: `services/quest-suggestions.ts`（目標→タスク生成ロジック＋プロンプト）、`routes/quest-suggestions.ts` または `ai.ts` 内の `POST /suggest-quests`。一括登録用に `POST /api/quests/batch` を新設。
  - **フロント**: `SuggestedQuestsModal.tsx`（提案一覧・採用/却下・ローディング・エラー表示）、`useSuggestQuests.ts`（提案 API 呼び出し＋採用時に batch または複数 addQuest）。
- **既存拡張**: AI サービスに `generateSuggestedQuests` を 1 関数追加。ai-usage に「クエスト提案」の利用記録を追加（列 or 別テーブル）。
- **責任の分離**: 提案フローはモーダルとフックに閉じ込め、QuestBoard は「空なら CTA を表示してモーダルを開く」だけにする。
- **トレードオフ**:
  - ✅ 責務が明確でテストしやすい
  - ✅ 一括登録 API で登録処理が簡潔
  - ❌ ファイル数・エンドポイントが増える

---

### Option C: ハイブリッド

- **拡張する部分**: `services/ai.ts` に `generateSuggestedQuests`、`routes/ai.ts` に `POST /suggest-quests`、`api-client.ts` に `suggestQuests(goal, genre?)`、`useQuests` はそのまま（複数件はループで addQuest）。プロフィール保存時に `goal` を profile JSON に含める（オプション）。
- **新規作成する部分**: フロントのみ `SuggestedQuestsModal.tsx`（または `OnboardingQuestSuggest.tsx`）と `useSuggestQuests`。QuestBoard の空状態には「目標からタスクを提案」CTA を追加し、クリックでモーダルを開く。Genesis 直後は、ResultStep の「冒険を始める」の前に「タスクを提案する」ステップを挟むか、Dashboard 初回表示時に「目標 ○○ でタスクを提案しますか？」モーダルを出す。
- **段階**: Phase 1 で「空状態 CTA → 目標入力 → 提案 → 採用/却下」まで実装。Phase 2 で「Genesis 直後の自動トリガー」や「プロフィールに goal 保存」を検討。
- **トレードオフ**:
  - ✅ 既存 AI/API は最小変更で済む
  - ✅ 提案 UI は独立コンポーネントで保守しやすい
  - ❌ トリガーを 2 か所（Genesis 直後と Quest Board 空状態）にすると、フロー設計の調整が必要

---

## 4. Implementation Complexity & Risk

| 項目 | 評価 | 理由 |
|------|------|------|
| **Effort** | **M (3–7 日)** | 既存 AI/クエスト/認証パターンの流用が主。新規は「目標→タスク」プロンプト、1 エンドポイント、提案 UI・フック、空状態 CTA。batch やプロフィール goal 保存を入れるとやや増える。 |
| **Risk** | **Medium** | AI 出力の安定性（件数・enum の揺れ）はプロンプトとバリデーションで吸収可能。目標の参照方法（永続化するかクライアントのみか）とレート制限ポリシーを設計で決めれば、技術的には既存スタックの範囲。 |

---

## 5. Requirement-to-Asset Map（ギャップタグ付き）

| 要件 | 既存アセット | ギャップ |
|------|--------------|----------|
| 1.1 目標をクエスト生成の入力に | Genesis formData, profile（prologue） | **Missing**: 目標の永続化または API 入力としての渡し方 |
| 1.2 トリガー提供 | なし | **Missing**: ResultStep 直後 or 空状態 CTA |
| 1.3 空状態で案内/CTA（オプション） | QuestBoard の「タスクなし」 | **Missing**: 案内文言と CTA |
| 2.1 目標を AI に渡してタスクリスト生成 | ai.ts（他生成はある） | **Missing**: generateSuggestedQuests とプロンプト |
| 2.2 既存クエスト形式で返却 | createQuestSchema, Task 型 | **Constraint**: AI 出力を enum にマッピング |
| 2.3 3〜7 件 | なし | プロンプトで対応 |
| 2.4 空・極端に短い目標の扱い | prepareUserPrompt 等 | **Missing**: 目標専用バリデーション |
| 3.1 提案一覧表示 | なし | **Missing**: 提案一覧 UI |
| 3.2 採用時に登録 | useQuests.addQuest（1 件） | **Missing**: 複数登録（ループ or batch） |
| 3.3 却下時は追加しない | 既存のまま | 実装で対応 |
| 3.4 編集（オプション） | なし | **Missing**: スコープ次第 |
| 4.1 Genesis の目標を利用 | 上記 1.1 に同じ | **Missing** |
| 4.2 生成中ローディング | 既存パターン | 既存パターンに合わせる |
| 4.3 登録後の表示 | useQuests invalidate | 既存で足りる |
| 5.1 AI 失敗時のメッセージ | 他 AI と同様 | 既存パターンに合わせる |
| 5.2 目標制約未達 | なし | **Missing**: バリデーション（2.4 と同一） |
| 5.3 レート制限・AI ポリシー | ai_daily_usage | **Missing**: クエスト提案の制限と記録 |

---

## 6. Design Phase への推奨事項

- **方針**: **Option C（ハイブリッド）** を推奨。AI とルートは既存ファイルに「目標→タスク提案」を足し、フロントは提案用モーダルとフックを新規作成して、Quest Board の空状態 CTA と組み合わせる。Genesis 直後のトリガーは、設計で「ResultStep の次ステップ」か「Dashboard 初回モーダル」のどちらにするか決める。
- **設計で決めること**:
  1. **目標の参照**: プロフィール JSON に `goal` を保存するか（`saveCharacterProfile` で Genesis 時に保存）。保存する場合は GET /ai/character で返し、空状態 CTA で「この目標で提案」を 1 クリックにできる。
  2. **トリガー**: Genesis 完了直後に提案ステップを挟むか、Dashboard の Quest Board が空のときの CTA のみにするか。
  3. **クエスト提案の利用制限**: 1 アカウント 1 回 / 1 日 1 回 など。`ai_daily_usage` に `questSuggestCount` を足すか、`user_character_generated` と同様の「1 回限り」テーブルにするか。
  4. **複数クエスト登録**: ループで `POST /api/quests` するか、`POST /api/quests/batch` を新設するか。
- **Research Needed**:
  - Llama 3.1 8B で「3〜7 件のタスクを JSON 配列で返す」プロンプトの安定性（件数・enum 値の揺れ）。既存の `extractJson` や配列パースでどこまで吸収できるか。
  - プロフィールに goal を追加する場合、既存 `CharacterProfile` 型と `user_character_profile.profile` の後方互換性（既存ユーザーには goal が無い）。

---

*Gap analysis completed. Proceed to `/kiro/spec-design quest-auto-generation` to produce the technical design.*
