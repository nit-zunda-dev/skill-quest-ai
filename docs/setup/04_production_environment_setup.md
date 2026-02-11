# 本番環境・プレビュー環境のCloudflare設定手順

本ドキュメントでは、Skill Quest AIプロジェクトの本番環境およびプレビュー環境をCloudflare上に構築するための手順を説明します。環境ごとにD1データベースを分離し、環境変数とシークレットを設定したうえで、Cloudflare Pages（フロントエンド）とCloudflare Workers（バックエンド）を連携させます。

## 前提条件

- Cloudflareアカウントが作成済みであること（[Cloudflareアカウント設定手順](./01_cloudflare_account_setup.md)を参照）
- Wrangler CLIがインストールされ、認証済みであること（`pnpm --filter @skill-quest/backend exec wrangler whoami` で確認）
- ローカルでマイグレーションが生成済みであること（タスク4.2、4.3を参照）

## 概要

| 環境     | 用途                         | D1データベース名（例）     |
|----------|------------------------------|-----------------------------|
| プレビュー | PR時・ステージング検証用     | `skill-quest-db-preview`    |
| 本番     | 本番トラフィック用           | `skill-quest-db-production` |

---

## 1. 本番環境用D1データベースの作成

1. プロジェクトルートで、バックエンドのWranglerを使って本番用D1を作成します。

**バックエンドディレクトリから実行**：

```bash
cd apps/backend
pnpm exec wrangler d1 create skill-quest-db-production
```

**ルートディレクトリから実行**：

```bash
pnpm --filter @skill-quest/backend exec wrangler d1 create skill-quest-db-production
```

2. 成功すると、次のような出力が表示されます。

```
✅ Successfully created DB 'skill-quest-db-production' in region APAC

[[d1_databases]]
binding = "DB"
database_name = "skill-quest-db-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

3. 表示された **database_id** を控え、後述の「4. wrangler.toml の環境分離」で本番用に設定します。

---

## 2. プレビュー環境用D1データベースの作成

1. 同様に、プレビュー用のD1データベースを作成します。

**バックエンドディレクトリから実行**：

```bash
cd apps/backend
pnpm exec wrangler d1 create skill-quest-db-preview
```

**ルートディレクトリから実行**：

```bash
pnpm --filter @skill-quest/backend exec wrangler d1 create skill-quest-db-preview
```

2. 出力された **database_id** を控え、後述の「4. wrangler.toml の環境分離」でプレビュー用に設定します。

---

## 3. 環境変数・シークレットの設定

本番・プレビューともに、次のシークレットを設定します。**機密情報のため、`wrangler secret put` を使用し、リポジトリにはコミットしません。**

### 3.1 BETTER_AUTH_SECRET の生成と設定

Better Authのセッション・Cookie署名に使用する秘密鍵です。推測困難なランダム文字列を生成して設定します。

**生成例（Node.js）**：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**本番環境に設定**：

```bash
cd apps/backend
pnpm exec wrangler secret put BETTER_AUTH_SECRET --env production
# プロンプトが表示されたら、上記で生成した文字列を貼り付けてEnter
```

**プレビュー環境に設定**：

```bash
cd apps/backend
pnpm exec wrangler secret put BETTER_AUTH_SECRET --env preview
# 本番と別の値を使うことを推奨（開発用の別文字列を生成して設定）
```

### 3.2 BETTER_AUTH_BASE_URL（任意）

Better Authがリダイレクト先などを決めるためのベースURLです。本番・プレビューで異なるURLを使う場合は、環境ごとに設定します。

**本番の例**：

```bash
cd apps/backend
pnpm exec wrangler secret put BETTER_AUTH_BASE_URL --env production
# 例: https://your-app.pages.dev または https://your-domain.com
```

**プレビューの例**：

```bash
pnpm exec wrangler secret put BETTER_AUTH_BASE_URL --env preview
# 例: https://preview-xxx.pages.dev
```

設定しない場合は、WorkerのリクエストURLから自動判定される場合があります。必要に応じてドキュメントを参照してください。

---

## 4. wrangler.toml の環境分離

1. `apps/backend/wrangler.toml` を開きます。
2. 本番用・プレビュー用のD1の **database_id** を、手順1・2で控えた値に置き換えます。
3. **重要**: `[vars]` と `[ai]` はルートから継承されないため、各環境セクションに明示的に追加する必要があります。

**例**：

```toml
# プレビュー環境設定
[env.preview]
vars = { FRONTEND_URL = "https://preview-xxx.pages.dev" }  # フロントエンドデプロイ後に実際のURLに更新
[env.preview.ai]
binding = "AI"
remote = true
[[env.preview.d1_databases]]
binding = "DB"
database_name = "skill-quest-db-preview"
database_id = "プレビュー用に発行されたUUID"

# 本番環境設定
[env.production]
vars = { FRONTEND_URL = "https://your-app.pages.dev" }  # フロントエンドデプロイ後に実際のURLに更新
[env.production.ai]
binding = "AI"
remote = true
[[env.production.d1_databases]]
binding = "DB"
database_name = "skill-quest-db-production"
database_id = "本番用に発行されたUUID"
```

4. フロントエンドをCloudflare Pagesにデプロイしたら、`FRONTEND_URL` を実際のPagesのURLに更新してください（CORS・認証リダイレクト用）。シークレットは `wrangler secret put` で設定済みであれば、ここに書く必要はありません。

---

## 5. マイグレーションの適用

**重要**: デプロイされたWorkerは**リモート**（Cloudflare上）のD1に接続します。ローカル開発用のD1（`wrangler dev` 使用時）とは別です。本番・プレビュー環境でAPIを利用するには、**リモートD1**にマイグレーションを適用する必要があります。

`wrangler d1 migrations apply` および `wrangler d1 execute` は、**デフォルトでローカル**を参照します。リモート（デプロイ済みWorkerが接続するDB）に適用するには、**`--remote` を付けて**実行してください。

### 5.1 プレビュー環境への適用

```bash
cd apps/backend
pnpm exec wrangler d1 migrations apply skill-quest-db-preview --env preview --remote
```

### 5.2 本番環境への適用

```bash
cd apps/backend
pnpm exec wrangler d1 migrations apply skill-quest-db-production --env production --remote
```

成功すると、適用されたマイグレーションファイル名が表示されます。

### 5.3 リモートへの適用確認

マイグレーションがリモートに正しく適用されているか確認するには、**`--remote` を付けて**テーブル一覧を取得します（`--remote` がないとローカルDBを参照します）。

```bash
# プレビュー環境のリモートD1を確認
pnpm exec wrangler d1 execute skill-quest-db-preview --env preview --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# 本番環境のリモートD1を確認
pnpm exec wrangler d1 execute skill-quest-db-production --env production --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

`user`、`account`、`session`、`verification` などのテーブルが表示されれば、マイグレーションは正しく適用されています。`_cf_KV` のみの場合は未適用です。

---

## 6. Cloudflare Pages と Workers の統合設定

- **バックエンド（API）**: Cloudflare Workers にデプロイし、`wrangler deploy`（本番）または `wrangler deploy --env preview`（プレビュー）で公開します。
- **フロントエンド**: Cloudflare Pages にデプロイし、Pagesの「設定」で **Environment variables** に `VITE_API_URL`（またはプロジェクトで使用している変数名）を設定し、対応するWorkerのURL（例: `https://skill-quest-backend.<your-subdomain>.workers.dev`）を指定します。

### 6.1 Workers のデプロイ

**本番**：

```bash
cd apps/backend
pnpm exec wrangler deploy --env production
```

**プレビュー**：

```bash
pnpm exec wrangler deploy --env preview
```

デプロイ後、ダッシュボードの **Workers & Pages** からURLを確認し、フロントエンドの `VITE_API_URL` をそのURLに合わせます。

### 6.2 Pages のデプロイ

- Cloudflare Dashboard の **Workers & Pages** から、フロントエンド用のPagesプロジェクトを作成または選択します。
- ビルドコマンド・出力ディレクトリをモノレポ構成に合わせて設定します（例: `pnpm --filter @skill-quest/frontend build`、出力: `apps/frontend/dist`）。
- 本番・プレビューで別の **VITE_API_URL** を使う場合は、Pagesの **Environment** で「Production」と「Preview」を分けて変数を設定します。

### 6.3 CORS と Cookie（認証）

- バックエンドの `wrangler.toml` の `vars`（またはシークレット）で、各環境の `FRONTEND_URL` を正しく設定してください。Better Auth とCORSミドルウェアが、このオリジンを信頼するために使用します。
- フロントエンドとバックエンドが同一ドメインでない場合（例: `xxx.pages.dev` と `yyy.workers.dev`）は、Cookieの `SameSite` や `Secure` の設定を確認し、Better Authの `trustedOrigins` にフロントエンドのURLを含めてください。

---

## 7. 動作確認

1. **プレビュー**  
   - `pnpm exec wrangler deploy --env preview ` でWorkerをデプロイし、プレビュー用のPages URLからフロントにアクセスします。  
   - ログイン・API（クエスト一覧など）が期待どおり動作するか確認します。

2. **本番**  
   - `pnpm exec wrangler deploy --env production` でWorkerをデプロイし、本番のPages URLから同様に確認します。  
   - 本番用D1にのみデータが入り、プレビューと分離されていることを確認します。

---

## トラブルシューティング

### サインアップ・ログインで 500 エラーになる

- **原因**: デプロイされたWorkerが接続する**リモート**D1にマイグレーションが適用されていない可能性があります。
- **確認**: 上記 5.3 のコマンドでリモートD1のテーブル一覧を確認し、`user` テーブルが存在するか確認してください。
- **対処**: `user` が無い場合は、セクション5の `migrations apply` を **`--remote` を付けて**実行してください。

### `d1 execute` / `d1 migrations apply` でローカルとリモートを間違える

- `wrangler d1 execute ...` と `wrangler d1 migrations apply ...` は**デフォルトでローカル**を参照します。
- デプロイ済みWorkerが使うDBに適用・確認するには、必ず **`--remote`** を付けて実行してください。

### マイグレーションが「No migrations to apply」のまま

- 対象環境の `database_name` と `database_id` が、`migrations apply` で指定した名前と `wrangler.toml` の一致しているか確認してください。
- 別のD1を指していると、既に適用済みの別DBに対して「適用するマイグレーションなし」になることがあります。

### 503「Worker exceeded resource limits」（Error 1102）になる

- **原因**: Workers **Free プラン**は CPU 時間が **10ms** に制限されています。Better Auth のデフォルトのパスワードハッシュアルゴリズム（scrypt）は CPU 集約型で、単体で 5〜15ms+ かかるため、10ms を超えやすいです。
- **対処（実施済み）**:
  - パスワードハッシュを **scrypt → PBKDF2（Web Crypto API, SHA-256, 100,000 iterations）** に変更しました（`apps/backend/src/lib/password.ts`）。PBKDF2 は Cloudflare Workers にネイティブ対応しており、CPU 消費が大幅に少ないです。
  - 変更後も 503 が出る場合は、**Workers Paid プラン**（$5/月〜）へのアップグレードを検討してください。Paid プランでは `wrangler.toml` に `[limits] cpu_ms = 30_000` を追加することで CPU 制限を引き上げられます。
  - **注意**: Free プランでは `[limits]` セクションはデプロイエラーになるため使用できません。

### 認証でリダイレクトループや 401 になる

- `BETTER_AUTH_BASE_URL` が、実際にユーザーがアクセスしているフロントのオリジンと整合しているか確認してください。
- `FRONTEND_URL` と Better Auth の `trustedOrigins` に、フロントのURL（末尾スラッシュの有無を含む）が含まれているか確認してください。

### GitHub OAuth で「Redirect URI mismatch」

- GitHubのOAuth Appの **Authorization callback URL** が、Workerの実際のURL（例: `https://skill-quest-backend.xxx.workers.dev/api/auth/callback/github`）と完全に一致しているか確認してください。

---

## 次のステップ

- **タスク13.1**: wrangler.tomlの環境分離を設定する（本手順で取得した database_id を反映）
- **タスク13.2**: GitHub Actionsワークフローを実装する（PR時のチェック、mainマージ時の本番デプロイ・マイグレーション）
- **タスク13.3**: [Cloudflare WAF設定を確認する](./05_waf_setup.md)（手順書はタスク13.3で作成）

## 参考情報

- [Cloudflare D1 - 本番利用](https://developers.cloudflare.com/d1/)
- [Wrangler - 環境別設定](https://developers.cloudflare.com/workers/wrangler/configuration/#environments)
- [Wrangler - Secrets](https://developers.cloudflare.com/workers/wrangler/commands/#secret)
- [Better Auth - デプロイ](https://www.better-auth.com/docs/deployment)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app)
