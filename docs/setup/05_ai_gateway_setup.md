# Cloudflare AI Gatewayセットアップ手順

本ドキュメントでは、Skill Quest AIプロジェクトでCloudflare AI Gatewayを設定し、Workers AIの呼び出しを監視・制御・最適化するための手順を説明します。

## 概要

Cloudflare AI Gatewayは、AIアプリケーションへの一元化された可視性と制御を提供します。以下の機能が利用できます：

- **監視**: プロンプト、API呼び出し、エラー、トークン使用量、コストの可視化
- **レート制限**: 過剰なリクエストの防止
- **キャッシング**: コスト削減とレイテンシの改善
- **コスト管理**: 使用状況の統計とコスト分析

## 前提条件

- Cloudflareアカウントが作成済みであること
- Workers AIが有効になっていること（[Workers AIセットアップ手順](./03_workers_ai_setup.md)を参照）
- プロジェクトの`apps/backend`にWorkerが設定済みであること

## 手順

### 1. CloudflareダッシュボードでAI Gatewayを作成する

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログインします
2. 左メニューから **AI** > **AI Gateway** を選択します
3. **Create Gateway** ボタンをクリックします
4. **「新しいゲートウェイを作成する」** 画面で以下の設定を行います：

#### 1.1 基本設定

- **ゲートウェイ名**: ゲートウェイ名を入力します（例: `skill-quest-ai-gateway`、64文字以内）
  - この名前はゲートウェイの識別子として使用されます

#### 1.2 機能設定

以下の機能を有効/無効に設定できます：

##### ログを収集（デフォルト: **有効**）

- **説明**: プロンプト、レスポンス、プロバイダー、タイムスタンプ、リクエストのステータスなどのリクエストとレスポンスのペイロードを保存します
- **デフォルト設定**: 有効
- **ログ制限**: 10,000,000件（変更可能）
- **自動削除ポリシー**: 最も古いログを自動的に削除
- **推奨**: 監視とトラブルシューティングのために有効のままにしておくことを推奨します

##### キャッシュレスポンス（デフォルト: **無効**）

- **説明**: 元のプロバイダーではなく当社のキャッシュからリクエストを処理することで、コストを削減し、ユーザーへの応答を高速化できます
- **デフォルト設定**: 無効
- **推奨**: コスト削減とパフォーマンス向上が必要な場合は有効化を検討してください

##### レート制限リクエスト（デフォルト: **無効**）

- **説明**: アプリケーションが取得するトラフィックを制御して、支出を制限したり、リクエストを制限して不審なアクティビティを防止したりします
- **デフォルト設定**: 無効
- **推奨**: 過剰なリクエストやコストを制御したい場合は有効化を検討してください

##### 認証済みゲートウェイ（デフォルト: **有効**）

- **説明**: このゲートウェイの認証を有効にするには、各リクエストヘッダーに認証トークンが必要です
- **デフォルト設定**: 有効
- **認証トークンの作成**: 「認証トークンの作成」リンクから認証トークンを生成できます
- **推奨**: セキュリティのために有効のままにしておくことを推奨します（認証トークンを使用する場合は、Workerコードでヘッダーに追加する必要があります）

#### 1.3 ゲートウェイの作成

5. 設定が完了したら、**作成** ボタンをクリックしてゲートウェイを作成します
6. 作成されたゲートウェイの **Gateway ID** をコピーします（後で使用します）
   - **Gateway IDの確認方法**:
     - ゲートウェイの一覧ページで、ゲートウェイ名の下に表示されるIDをコピー
     - または、ゲートウェイの詳細ページ（**概要**タブ）のURLから確認
     - Gateway IDは通常、UUID形式（例: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）または英数字の文字列です
   - **注意**: URLに含まれる `d9b67085ab39fb54974b83669e90d52f` のような値はAccount IDであり、Gateway IDではありません
   - Gateway IDは、ゲートウェイ名とは異なる識別子です

**参考**: [Cloudflare AI Gateway ドキュメント](https://developers.cloudflare.com/ai-gateway/)

### 2. 環境変数の設定

**重要**: `wrangler.toml` はGit管理されているため、AI Gateway IDを直接書き込むことは避けてください。環境ごとに適切な方法で設定します。

#### 2.1 ローカル開発環境（`.dev.vars`）

`apps/backend/.dev.vars` ファイルに以下を追加します（オプショナル）：

```env
AI_GATEWAY_ID=your-gateway-id-here
```

**Gateway IDの取得方法**:
1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログインします
2. **AI** > **AI Gateway** を選択します
3. 対象のゲートウェイを選択します
4. **概要**タブまたは**設定**タブで、Gateway IDを確認します
   - Gateway IDは通常、UUID形式（例: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）または英数字の文字列です
   - **重要**: URLに含まれる `d9b67085ab39fb54974b83669e90d52f` のような値はAccount IDであり、Gateway IDではありません
   - Gateway IDは、ゲートウェイ名（例: `skill-quest-ai-gateway`）とは異なる識別子です
   - Gateway IDは、ゲートウェイの一覧ページでゲートウェイ名の下に表示されることもあります

**注意**: 
- `.dev.vars` ファイルは `.gitignore` に含まれているため、Gitにコミットされません
- このファイルは各開発者のローカル環境でのみ使用されます
- チームメンバーごとに異なるGateway IDを使用することも可能です
   - Gateway IDが正しく設定されているか確認するには、CloudflareダッシュボードのAI Gatewayの**ログ**タブでリクエストが記録されているか確認してください

#### 2.2 プレビュー/本番環境

**重要**: プレビュー/本番環境では、Cloudflareダッシュボードの環境変数を使用します。`wrangler.toml` には設定しません。

Cloudflareダッシュボードで環境変数を設定します：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログインします
2. **Workers & Pages** > 対象のWorker（`skill-quest-backend`）を選択します
3. **Settings** タブを開きます
4. **Variables** セクションまでスクロールします
5. **Environment Variables** で適切な環境（Preview または Production）を選択します
6. **Add variable** をクリックします
7. 以下の変数を追加します：
   - **Variable name**: `AI_GATEWAY_ID`
   - **Value**: ステップ1でコピーしたGateway ID（Account IDではなく、Gateway IDを使用してください）
8. **Save** をクリックします

**注意**: 
- プレビュー環境と本番環境で異なるAI Gatewayを使用することも可能です
- Cloudflareダッシュボードで設定した環境変数は、`wrangler.toml` の設定を上書きします
- この方法により、機密情報をGitリポジトリに含めることなく、環境ごとに適切なGateway IDを設定できます

### 3. `wrangler.toml`の確認

`apps/backend/wrangler.toml` は以下のようになっています：

```toml
[vars]
FRONTEND_URL = "http://localhost:5173"
# AI_GATEWAY_ID は .dev.vars ファイルで設定（Git管理外）
# プレビュー/本番環境では Cloudflare ダッシュボードの環境変数で設定

[env.preview]
vars = { FRONTEND_URL = "https://skill-quest-ai-preview.pages.dev/" }
# AI_GATEWAY_ID は Cloudflare ダッシュボードの環境変数で設定（Git管理外）

[env.production]
vars = { FRONTEND_URL = "https://skill-quest-ai.pages.dev/" }
# AI_GATEWAY_ID は Cloudflare ダッシュボードの環境変数で設定（Git管理外）
```

**重要**: 
- `wrangler.toml` には `AI_GATEWAY_ID` を設定しません（Git管理されているため）
- ローカル開発: `.dev.vars` ファイルで設定（Git管理外）
- プレビュー/本番環境: Cloudflareダッシュボードの環境変数で設定
- Cloudflareダッシュボードで設定した環境変数は、`wrangler.toml` の設定を上書きします

### 4. 動作確認

#### 4.1 ローカルでの確認

1. バックエンドディレクトリで開発サーバーを起動します：

```bash
cd apps/backend
pnpm dev
```

2. AIエンドポイント（例: `POST /api/ai/generate-character`）にリクエストを送信します
3. エラーが返らないことを確認します
4. CloudflareダッシュボードのAI Gatewayの**ログ**タブで、リクエストが記録されているか確認します
   - ログにリクエストが表示されれば、AI Gateway経由で正常に処理されています
   - ログに表示されない場合は、Gateway IDが正しく設定されていない可能性があります

#### 4.2 Cloudflare上での確認

1. Workerをデプロイします：

```bash
cd apps/backend
pnpm exec wrangler deploy --env preview  # プレビュー環境
# または
pnpm exec wrangler deploy --env production  # 本番環境
```

2. デプロイ後、本番のAPI URLに対してAIエンドポイントを呼び出します
3. 正常に動作することを確認します
4. CloudflareダッシュボードのAI Gatewayの**ログ**タブで、リクエストが記録されているか確認します

### 5. AI Gatewayダッシュボードで監視・ログを確認する

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログインします
2. **AI** > **AI Gateway** を選択します
3. 作成したゲートウェイを選択します
4. 以下の情報を確認できます：
   - **概要**: リクエスト数、トークン数、コスト、エラー数などの概要
   - **Analytics**: リクエスト数、エラー率、レイテンシなど
   - **ログ**: プロンプト、レスポンス、エラーなどの詳細ログ
   - **Usage**: トークン使用量、コストなど

### 6. AI Gatewayの機能設定（作成後の変更）

ゲートウェイ作成後も、AI Gatewayダッシュボードで以下の機能を変更できます：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログインします
2. **AI** > **AI Gateway** を選択します
3. 対象のゲートウェイを選択します
4. **Settings** タブで以下の設定を変更できます：

#### 6.1 ログ設定

- **ログ収集の有効/無効**: ログ収集をオン/オフに切り替え
- **ログ制限**: 保存するログの最大件数を変更（デフォルト: 10,000,000件）
- **自動削除ポリシー**: 最も古いログを自動削除する設定

#### 6.2 キャッシング設定

- **キャッシュの有効化**: キャッシュレスポンス機能をオン/オフに切り替え
- **キャッシュ設定**: キャッシュの有効期限や条件を設定

#### 6.3 レート制限設定

- **レート制限の有効化**: レート制限機能をオン/オフに切り替え
- **レート制限ルール**: リクエスト数や時間単位の制限を設定

#### 6.4 認証設定

- **認証トークンの管理**: 認証トークンの作成、削除、更新
- **認証の有効/無効**: 認証済みゲートウェイ機能をオン/オフに切り替え

#### 6.5 その他の設定

- **Retry**: リクエスト再試行の設定
- **Fallback**: フォールバックモデルの設定

詳細は [Cloudflare AI Gateway ドキュメント](https://developers.cloudflare.com/ai-gateway/) を参照してください。

## トラブルシューティング

### AI Gatewayが動作しない / エラーが発生する

- **Gateway IDの確認**: `AI_GATEWAY_ID` 環境変数が正しく設定されているか確認してください
- **ゲートウェイの状態**: Cloudflareダッシュボードでゲートウェイが有効になっているか確認してください
- **Workers AIの有効化**: Workers AIが有効になっているか確認してください（[Workers AIセットアップ手順](./03_workers_ai_setup.md)を参照）

### 環境変数が反映されない

- **Cloudflareダッシュボードでの設定**: プレビュー/本番環境では、Cloudflareダッシュボードで設定した環境変数が優先されます
- **Workerの再デプロイ**: 環境変数を変更した後は、Workerを再デプロイする必要があります
- **`.dev.vars`の確認**: ローカル開発では、`apps/backend/.dev.vars` ファイルが正しい場所にあるか確認してください
- **`wrangler dev`の再起動**: `.dev.vars` を変更した後は、`wrangler dev` を再起動してください

### AI Gateway経由で呼び出されない / ログに表示されない

#### Gateway IDの確認

1. **Gateway IDが正しいか確認**:
   - `.dev.vars` またはCloudflareダッシュボードで設定した `AI_GATEWAY_ID` が正しいGateway IDであることを確認してください
   - **重要**: URLに含まれる `d9b67085ab39fb54974b83669e90d52f` のような値は**Account ID**であり、Gateway IDではありません
   - Gateway IDは、ゲートウェイの一覧ページまたは詳細ページで確認できます
   - Gateway IDは通常、UUID形式（例: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）または英数字の文字列です
   - Gateway IDは、ゲートウェイ名（例: `skill-quest-ai-gateway`）とは異なる識別子です

2. **環境変数の確認**:
   - `.dev.vars` ファイルが正しい場所（`apps/backend/.dev.vars`）にあるか確認してください
   - `wrangler dev` を再起動して、環境変数が読み込まれるか確認してください
   - CloudflareダッシュボードのAI Gatewayの**ログ**タブで、リクエストが記録されているか確認してください
   - ログに表示されない場合、環境変数が正しく読み込まれていない可能性があります

3. **Gateway IDの形式**:
   - Workers AIバインディングで `gateway` オプションを使用する場合、Gateway ID（UUID形式）を使用する必要があります
   - Gateway名（例: `skill-quest-ai-gateway`）ではなく、Gateway IDを使用してください

#### その他の確認事項

- **後方互換性**: `AI_GATEWAY_ID` が設定されていない場合、従来通り直接Workers AIを呼び出します
- **コードの確認**: `apps/backend/src/services/ai.ts` と `apps/backend/src/routes/ai.ts` でAI Gateway経由の呼び出しが実装されているか確認してください
- **認証済みゲートウェイ**: 認証済みゲートウェイが有効になっている場合、Workers AIバインディングを使用する場合は自動的に認証が処理されますが、問題が発生する場合は認証を無効にしてみてください
- **Workerの再デプロイ**: 環境変数を変更した後は、Workerを再デプロイする必要があります（ローカル開発の場合は `wrangler dev` を再起動）

### 認証エラーが発生する

- **認証トークンの確認**: 認証済みゲートウェイが有効になっている場合、リクエストヘッダーに認証トークンが必要です
- **認証トークンの設定**: 現在の実装では認証トークンを使用していないため、認証済みゲートウェイを無効にするか、Workerコードで認証トークンを追加する必要があります
- **Workers AIバインディング**: Workers AIバインディングを使用する場合、認証は自動的に処理されるはずですが、問題が発生する場合は認証を無効にしてみてください

## 後方互換性

AI Gatewayはオプショナルな機能として実装されています。`AI_GATEWAY_ID` が設定されていない場合、従来通り直接Workers AIを呼び出します。既存のコードは変更なしで動作し続けます。

## 参考情報

- [Cloudflare AI Gateway ドキュメント](https://developers.cloudflare.com/ai-gateway/)
- [AI Gateway と Workers AI の統合](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding)
- [Workers AIセットアップ手順](./03_workers_ai_setup.md)
- [本番環境設定手順](./04_production_environment_setup.md)
