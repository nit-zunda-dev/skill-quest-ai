# Postman Collection & Environment

このディレクトリには、Skill Quest AIバックエンドAPIのテスト用Postmanコレクションと環境設定ファイルが含まれています。

## ファイル構成

- `Skill-Quest-AI.postman_collection.json` - APIエンドポイントのコレクション
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

- `Health Check > Root`: APIの基本動作確認
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

### AI生成（AI）

**認証必須**です。先に `Auth > Sign In (Email/Password)` でログインしてください。未認証では 401 が返ります。  
Workers AI（Llama 3.1 8B）で実装され、利用制限ポリシー（06_AI設計.md）に従い制限があります。

| エンドポイント | 制限 | 超過時 |
|----------------|------|--------|
| キャラクター生成 | 1アカウント1回限り | 429 |
| ナラティブ生成 | 1日1回 | 429 |
| パートナーメッセージ | 1日1回 | 429 |
| チャット | 1日10回 | 429 |

1. **キャラクター生成**
   - `AI > Generate Character` を実行
   - エンドポイント: `POST /api/ai/generate-character`
   - 必須: `name`, `goal`, `genre`（FANTASY | CYBERPUNK | MODERN | HORROR | SCI_FI）
   - レスポンス: CharacterProfile（name, className, stats, prologue など）
   - 2回目以降は 429 Too Many Requests

2. **ナラティブ生成**
   - `AI > Generate Narrative` を実行
   - エンドポイント: `POST /api/ai/generate-narrative`
   - 必須: `taskId`, `taskTitle`, `taskType`（DAILY | HABIT | TODO）, `difficulty`（EASY | MEDIUM | HARD）
   - 任意: `userComment`
   - レスポンス: `narrative`, `rewardXp`, `rewardGold`
   - 同一日に2回目は 429

3. **パートナーメッセージ生成**
   - `AI > Generate Partner Message` を実行
   - エンドポイント: `POST /api/ai/generate-partner-message`
   - すべて任意: `progressSummary`, `timeOfDay`, `currentTaskTitle`, `context`
   - レスポンス: `message`（文字列）
   - 同一日に2回目は 429

4. **チャット（ストリーミング）**
   - `AI > Chat (Streaming)` を実行
   - エンドポイント: `POST /api/ai/chat`
   - 必須: `message`（1〜2000文字）
   - 任意: `context`（オブジェクト）
   - レスポンス: `text/plain` のストリーム（逐次テキスト）
   - 1日10回を超えると 429

## 注意事項

- 認証が必要なエンドポイント（**Profile、Quests、AI、** Protected Endpoints、Delete Account）を使用する前に、必ずサインアップまたはログインを実行してください
- AI エンドポイントは**認証必須**です。利用制限（キャラ1回/ナラティブ・パートナー1日1回/チャット1日10回）を超えると 429 が返ります
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
