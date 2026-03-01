# Postman Collection & Environment

このディレクトリには、Skill Quest AIバックエンドAPIの**テスト用**および**運用者向け**Postmanコレクションと環境設定が含まれています。  
**運用者は Postman で API を呼び出し、稼働確認・AI利用量・ユーザー数などを確認する想定です。**

## ファイル構成

- `Skill-Quest-AI.postman_collection.json` - APIエンドポイントのコレクション（一般API ＋ 運用者向け Ops API）
- `Skill-Quest-AI.postman_environment.json` - ローカル開発環境用の環境設定
- `Skill-Quest-AI-Preview.postman_environment.json` - プレビュー環境用の環境設定
- `Skill-Quest-AI-Production.postman_environment.json` - 本番環境用の環境設定

## ローカルでの動作確認（推奨手順）

1. **バックエンドのD1マイグレーションを適用**
   ```bash
   cd apps/backend
   pnpm db:migrate:local
   ```
2. **バックエンドを起動**
   ```bash
   pnpm dev
   # または モノレポルートから: pnpm --filter @skill-quest/backend dev
   ```
   → `http://localhost:8787` でAPIが有効になります。

3. **Postmanで環境を選択**
   - 環境ドロップダウンで `Skill-Quest-AI (Local)` などを選択
   - `base_url` が `http://localhost:8787` であることを確認

4. **認証してからAPIを呼ぶ**
   - **Auth > Sign In (Email/Password)** を実行（未登録なら先に Sign Up）
   - 以降、Quests や AI のリクエストでセッションCookieが送信され、200 が返ります。

## セットアップ手順

1. **Postmanをインストール**
   - [Postman公式サイト](https://www.postman.com/downloads/)からダウンロードしてインストール

2. **コレクションをインポート**
   - Postmanを開く
   - 「Import」ボタンをクリック
   - `Skill-Quest-AI.postman_collection.json`を選択してインポート

3. **環境設定をインポート**
   - 「Import」ボタンをクリック
   - 使用する環境ファイル（例: `Skill-Quest-AI.postman_environment.json`）を選択してインポート
   - 環境ドロップダウンから適切な環境を選択

4. **環境変数のカスタマイズ**
   - 環境設定で以下の変数を必要に応じて変更：
     - `base_url`: APIのベースURL（デフォルト: `http://localhost:8787`）
     - `test_email`: テスト用のメールアドレス
     - `test_password`: テスト用のパスワード
     - `test_name`: テスト用のユーザー名
     - **`ops_api_key`**: **運用者向けAPI用**。バックエンドの環境変数 `OPS_API_KEY` と同じ値を設定してください。未設定のまま Ops API を呼ぶと 401 になります。本番・プレビューでは wrangler secret で設定したキーを入れます。
   - コレクション変数（Quests 用）：
     - `quest_id`: PUT/Delete Quest で使用するID（Get Quests または Create Quest のレスポンスから自動設定されます。手動で設定することも可能）

## 使用方法

### 認証フロー

1. **サインアップ**
   - `Auth > Sign Up (Email/Password)`リクエストを実行
   - エンドポイント: `/api/auth/sign-up/email`
   - 新しいユーザーアカウントが作成されます
   - セッションCookieが自動的に保存されます

2. **ログイン**
   - `Auth > Sign In (Email/Password)`リクエストを実行
   - セッションCookieが自動的に保存されます

3. **セッション確認**
   - `Auth > Get Session`リクエストを実行
   - 現在のセッション情報が返されます

4. **ログアウト**
   - `Auth > Sign Out`リクエストを実行
   - セッションCookieが削除されます

5. **アカウント削除**
   - 先に `Profile > Get Profile` で `id` を確認し、Postmanの `user_id` 変数に設定
   - `Auth > Delete Account` リクエストを実行（`DELETE /api/users/:userId`）
   - 指定したユーザーIDのアカウントと関連する全データ（セッション・進捗・AI利用履歴など）が削除されます。本人のIDのみ指定可能です
   - **注意:** この操作は取り消せません

### ヘルスチェック

- **`Health Check > Health (API)`**: **運用・外形監視向け**。`GET /api/health` で稼働状態と D1 健全性を取得。認証不要。200 + `{ status: "ok", checks?: { db: "ok" | "unhealthy" } }`
- `Health Check > Root`: APIの基本動作確認（`GET /`）
- `Health Check > Test Bindings`: Cloudflare Workersのバインディング確認
- `Health Check > Test CORS`: CORS設定の確認
- `Health Check > Test Error`: エラーハンドリングの確認

### プロフィール（Profile）

いずれも**認証必須**です。先に `Auth > Sign In (Email/Password)` でログインしてください。

1. **取得**
   - `Profile > Get Profile` を実行
   - エンドポイント: `GET /api/profile`
   - レスポンス: `id`, `email`, `name`, `image`

2. **更新**
   - `Profile > Update Profile` を実行
   - エンドポイント: `PATCH /api/profile`
   - 任意: `name`（1〜256文字）, `image`（URL または null）

### クエスト管理（Quests）

いずれも**認証必須**です。先に `Auth > Sign In (Email/Password)` でログインしてください。

1. **一覧取得**
   - `Quests > Get Quests` を実行
   - エンドポイント: `GET /api/quests`
   - レスポンスの先頭クエストIDがコレクション変数 `quest_id` に自動保存されます

2. **作成**
   - `Quests > Create Quest` を実行
   - エンドポイント: `POST /api/quests`
   - 必須: `title`, `type`（DAILY | HABIT | TODO）, `difficulty`（EASY | MEDIUM | HARD）
   - 任意: `skillId`, `scenario`, `winCondition`（オブジェクト）
   - 作成されたクエストのIDが `quest_id` に自動保存されます

3. **更新**
   - `Quests > Update Quest` を実行
   - エンドポイント: `PUT /api/quests/{{quest_id}}`
   - `quest_id` は Get Quests または Create Quest の実行で自動設定されます

4. **削除**
   - `Quests > Delete Quest` を実行
   - エンドポイント: `DELETE /api/quests/{{quest_id}}`

5. **一括作成**
   - `Quests > Create Quest Batch` を実行
   - エンドポイント: `POST /api/quests/batch`
   - 必須: `quests`（1〜20件の配列。各要素に `title`, `type`, `difficulty` 必須）
   - レスポンス: 作成されたクエストの配列（201）

6. **完了**
   - `Quests > Complete Quest` を実行
   - エンドポイント: `PATCH /api/quests/{{quest_id}}/complete`
   - 指定IDのクエストを完了にし、報酬アイテム（`grantedItem`）が返る場合あり

7. **ステータス更新**
   - `Quests > Update Quest Status` を実行
   - エンドポイント: `PATCH /api/quests/{{quest_id}}/status`
   - 必須: `status`（todo | in_progress | done）。`done` にすると完了扱いで報酬付与

### グリモワール（Grimoire）

いずれも**認証必須**です。

1. **一覧取得**
   - `Grimoire > Get Grimoire` を実行
   - エンドポイント: `GET /api/grimoire`
   - レスポンス: グリモワールエントリの配列（id, date, taskTitle, narrative, rewardXp, rewardGold）

2. **生成（1日1回）**
   - `Grimoire > Generate Grimoire` を実行
   - エンドポイント: `POST /api/grimoire/generate`
   - 完了したタスクを元にグリモワールを生成。完了タスクが無い場合は 400、同一日に2回目は 429

### 所持アイテム（Items）

いずれも**認証必須**です。

1. **所持一覧取得**
   - `Items > Get Items` を実行
   - エンドポイント: `GET /api/items`
   - レスポンス: `items`（取得時刻の降順）

2. **アイテムマスタ取得**
   - `Items > Get Item Master` を実行
   - エンドポイント: `GET /api/items/master`
   - レスポンス: `items`（コレクション図鑑用マスタ全件）

### パートナー（Partner）

いずれも**認証必須**です。

1. **好感度取得**
   - `Partner > Get Favorability` を実行
   - エンドポイント: `GET /api/partner/favorability`
   - レスポンス: `favorability`

2. **最後にペットに渡したレアリティ**
   - `Partner > Get Last Pet Rarity` を実行
   - エンドポイント: `GET /api/partner/last-pet-rarity`
   - レスポンス: `lastPetRarity`

3. **アイテムを渡す**
   - `Partner > Give Item` を実行
   - エンドポイント: `POST /api/partner/give-item`
   - 必須: `itemId`, `target`（partner | pet）。記録のみで所持は消費しない。所持していない場合は 400

### AI生成（AI）

**認証必須**です。先に `Auth > Sign In (Email/Password)` でログインしてください。未認証では 401 が返ります。  
Workers AI（Llama 3.1 8B）で実装され、利用制限ポリシー（06_AI設計.md）に従い制限があります。

| エンドポイント | 制限 | 超過時 |
|----------------|------|--------|
| キャラクター生成 | 1アカウント1回限り | 429 |
| ナラティブ生成 | 1日1回 | 429 |
| パートナーメッセージ | 1日1回 | 429 |
| チャット | 1日10回 | 429 |
| グリモワール生成 | 1日1回 | 429 |
| 目標更新 | 1日2回 | 429 |

1. **利用状況取得**
   - `AI > Get Usage` を実行
   - エンドポイント: `GET /api/ai/usage`
   - レスポンス: `characterGenerated`, `narrativeRemaining`, `partnerRemaining`, `chatRemaining`, `grimoireRemaining`, `limits`

2. **キャラクター取得**
   - `AI > Get Character` を実行
   - エンドポイント: `GET /api/ai/character`
   - 保存済みキャラクタープロフィールを取得。未生成時は 404

3. **キャラクター生成**
   - `AI > Generate Character` を実行
   - エンドポイント: `POST /api/ai/generate-character`
   - 必須: `name`（1〜50文字）, `goal`（1〜500文字）
   - レスポンス: CharacterProfile（name, className, stats, prologue など）
   - 2回目以降は 429 Too Many Requests

4. **ナラティブ生成**
   - `AI > Generate Narrative` を実行
   - エンドポイント: `POST /api/ai/generate-narrative`
   - 必須: `taskId`, `taskTitle`, `taskType`（DAILY | HABIT | TODO）, `difficulty`（EASY | MEDIUM | HARD）
   - 任意: `userComment`
   - レスポンス: `narrative`, `rewardXp`, `rewardGold`
   - 同一日に2回目は 429

5. **パートナーメッセージ生成**
   - `AI > Generate Partner Message` を実行
   - エンドポイント: `POST /api/ai/generate-partner-message`
   - すべて任意: `progressSummary`, `timeOfDay`, `currentTaskTitle`, `context`
   - レスポンス: `message`（文字列）
   - 同一日に2回目は 429

6. **クエスト提案**
   - `AI > Suggest Quests` を実行
   - エンドポイント: `POST /api/ai/suggest-quests`
   - 必須: `goal`（1〜500文字）
   - レスポンス: `suggestions`（title, type, difficulty の配列）。AI失敗時は 502/503

7. **目標更新**
   - `AI > Update Goal` を実行
   - エンドポイント: `PATCH /api/ai/goal`
   - 必須: `goal`（1〜500文字）。1日2回まで。更新時にクエストは全削除。キャラ未生成時は 404

8. **チャット（ストリーミング）**
   - `AI > Chat (Streaming)` を実行
   - エンドポイント: `POST /api/ai/chat`
   - 必須: `message`（1〜2000文字）
   - 任意: `context`（オブジェクト）
   - レスポンス: `text/plain` のストリーム（逐次テキスト）
   - 1日10回を超えると 429

### 運用者向け API（Ops）

**対象**: 運用者が稼働確認・AI利用量・ユーザー数を Postman で確認するためのエンドポイントです。  
**前提**: 環境変数 `ops_api_key` に、バックエンドの `OPS_API_KEY`（wrangler secret または環境変数）と同じ値を設定してください。未設定または一致しないと 401、バックエンドで OPS_API_KEY が未設定の環境では 404 が返ります。

1. **稼働・D1 健全性**
   - **`Health Check > Health (API)`** を実行
   - `GET /api/health` — 認証不要。`status: "ok"` と `checks.db`（D1 が利用可能なら `"ok"`）を確認

2. **ユーザー数**
   - **`運用者向け API (Ops) > Get Stats (ユーザー数)`** を実行
   - エンドポイント: `GET /api/ops/stats`
   - ヘッダ: `X-Ops-API-Key: {{ops_api_key}}`
   - レスポンス: `totalUsers`（登録ユーザー数）、`activeUsers`（直近30日セッションありのユーザー数）

3. **AI利用量集計**
   - **`運用者向け API (Ops) > Get AI Usage (利用量集計)`** を実行
   - エンドポイント: `GET /api/ops/ai-usage?from=YYYY-MM-DD&to=YYYY-MM-DD`
   - ヘッダ: `X-Ops-API-Key: {{ops_api_key}}`
   - クエリ: `from` / `to` は YYYY-MM-DD。**日付範囲は最大90日**。超過時は 400
   - レスポンス: `byDate`（日別 Neurons 概算）、`totalNeuronsEstimate`

**運用時の流れ（例）**: 環境を選択 → `ops_api_key` を設定 → `Health (API)` で稼働確認 → 必要に応じて `Get Stats` / `Get AI Usage` で数値を確認

## 注意事項

- **運用者向け API（Ops）** を使う場合は、環境の **`ops_api_key`** を必ず設定してください。キーは Cloudflare の wrangler secret やダッシュボードで設定した `OPS_API_KEY` と同じ値にします。
- 認証が必要なエンドポイント（**Profile、Quests、Grimoire、Items、Partner、AI、** Protected Endpoints、Delete Account）を使用する前に、必ずサインアップまたはログインを実行してください
- AI エンドポイントは**認証必須**です。利用制限（キャラ1回/ナラティブ・パートナー・グリモワール1日1回/チャット1日10回）を超えると 429 が返ります
- セッションはCookieに保存されるため、PostmanのCookie管理が有効になっていることを確認してください
- Quests の PUT/DELETE では、コレクション変数 `quest_id` が使われます。Get Quests または Create Quest を先に実行すると自動で設定されます

## トラブルシューティング

### Cookieが保存されない

- Postmanの設定で「Send cookies」が有効になっているか確認してください
- 環境変数の`base_url`が正しく設定されているか確認してください

### 認証エラーが発生する

- 環境変数の`test_email`と`test_password`が正しく設定されているか確認してください
- データベースが正しく初期化されているか確認してください（`pnpm db:migrate:local` を `apps/backend` で実行）
- AI エンドポイントは認証必須のため、先に **Auth > Sign In** を実行してから呼び出してください

### CORSエラーが発生する

- `base_url`が`http://localhost:8787`になっているか確認してください
- バックエンドのCORS設定を確認してください

### 運用者向け API で 401 / 404 になる

- **401**: ヘッダ `X-Ops-API-Key` が未設定、または環境の `ops_api_key` がバックエンドの `OPS_API_KEY` と一致していません。環境編集で `ops_api_key` を正しい値に設定してください。
- **404**: その環境のバックエンドに `OPS_API_KEY` が設定されていません。運用者 API はキーが設定されている環境でのみ有効です。
