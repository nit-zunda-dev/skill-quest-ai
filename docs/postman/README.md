# Postman Collection & Environment

このディレクトリには、Skill Quest AIバックエンドAPIのテスト用Postmanコレクションと環境設定ファイルが含まれています。

## ファイル構成

- `Skill-Quest-AI.postman_collection.json` - APIエンドポイントのコレクション
- `Skill-Quest-AI.postman_environment.json` - ローカル開発環境用の環境設定
- `Skill-Quest-AI-Preview.postman_environment.json` - プレビュー環境用の環境設定
- `Skill-Quest-AI-Production.postman_environment.json` - 本番環境用の環境設定

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
   - `Auth > Delete Account`リクエストを実行
   - エンドポイント: `/api/account/delete`
   - 現在ログイン中のユーザーアカウントが完全に削除されます
   - **注意:** この操作は取り消せません

### ヘルスチェック

- `Health Check > Root`: APIの基本動作確認
- `Health Check > Test Bindings`: Cloudflare Workersのバインディング確認
- `Health Check > Test CORS`: CORS設定の確認
- `Health Check > Test Error`: エラーハンドリングの確認

## 注意事項

- 認証が必要なエンドポイントを使用する前に、必ずサインアップまたはログインを実行してください
- セッションはCookieに保存されるため、PostmanのCookie管理が有効になっていることを確認してください

## トラブルシューティング

### Cookieが保存されない

- Postmanの設定で「Send cookies」が有効になっているか確認してください
- 環境変数の`base_url`が正しく設定されているか確認してください

### 認証エラーが発生する

- 環境変数の`test_email`と`test_password`が正しく設定されているか確認してください
- データベースが正しく初期化されているか確認してください（`wrangler d1 migrations apply --local`）

### CORSエラーが発生する

- `base_url`が`http://localhost:8787`になっているか確認してください
- バックエンドのCORS設定を確認してください
