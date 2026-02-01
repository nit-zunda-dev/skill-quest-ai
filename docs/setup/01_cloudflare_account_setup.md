# Cloudflareアカウント設定手順

本ドキュメントでは、Skill Quest AIプロジェクトでCloudflare WorkersとD1データベースを使用するためのCloudflareアカウントの作成と設定手順を説明します。

## 前提条件

- インターネット接続
- メールアドレス（アカウント作成用）

## 手順

### 1. Cloudflareアカウントの作成

1. [Cloudflare公式サイト](https://www.cloudflare.com/)にアクセスします
2. 右上の「Sign Up」ボタンをクリックします
3. メールアドレスとパスワードを入力してアカウントを作成します
4. メールアドレスに送信された確認メールを開き、アカウントを有効化します

### 2. Wrangler CLIの確認とインストール

Wrangler CLIは、Cloudflare WorkersとD1データベースを管理するためのコマンドラインツールです。

#### 既存プロジェクトでのWranglerの状況

このプロジェクトでは、**Wranglerは既に`apps/backend`パッケージの`devDependencies`にインストールされています**（バージョン: `^4.0.0`、実際のインストールバージョン: `4.61.1`）。

依存関係をインストールするには、プロジェクトのルートディレクトリで以下のコマンドを実行します：

```bash
pnpm install
```

#### Wranglerの実行方法

このプロジェクトでは、以下の方法でWranglerコマンドを実行できます：

**方法1: バックエンドディレクトリで直接実行（推奨）**

```bash
cd apps/backend
pnpm exec wrangler <command>
```

例：
```bash
cd apps/backend
pnpm exec wrangler login
pnpm exec wrangler d1 create skill-quest-db --local
```

**方法2: ルートディレクトリからフィルターを使用**

```bash
pnpm --filter @skill-quest/backend exec wrangler <command>
```

例：
```bash
pnpm --filter @skill-quest/backend exec wrangler login
pnpm --filter @skill-quest/backend exec wrangler d1 create skill-quest-db --local
```

**方法3: package.jsonのスクリプトを使用**

`apps/backend/package.json`に定義されているスクリプトを使用：

```bash
# 開発サーバー起動
cd apps/backend
pnpm dev

# またはルートから
pnpm --filter @skill-quest/backend dev
```

#### グローバルインストール（オプション）

グローバルにインストールしたい場合：

```bash
# npmを使用する場合
npm install -g wrangler

# pnpmを使用する場合
pnpm add -g wrangler
```

グローバルにインストールした場合、`wrangler`コマンドを直接実行できます。

### 3. Wrangler CLIの認証

1. ターミナルで以下のコマンドを実行します：

**バックエンドディレクトリから実行（推奨）**：

```bash
cd apps/backend
pnpm exec wrangler login
```

**ルートディレクトリから実行**：

```bash
pnpm --filter @skill-quest/backend exec wrangler login
```

**グローバルにインストールしている場合**：

```bash
wrangler login
```

2. ブラウザが自動的に開き、Cloudflareアカウントへのログインを求められます
3. ログイン後、ターミナルに「Successfully logged in」と表示されれば認証完了です

### 4. 認証状態の確認

以下のコマンドで認証状態を確認できます：

**バックエンドディレクトリから実行**：

```bash
cd apps/backend
pnpm exec wrangler whoami
```

**ルートディレクトリから実行**：

```bash
pnpm --filter @skill-quest/backend exec wrangler whoami
```

**グローバルにインストールしている場合**：

```bash
wrangler whoami
```

認証済みの場合、アカウント情報が表示されます。

## トラブルシューティング

### 認証エラーが発生する場合

- Cloudflareアカウントが正しく作成されているか確認してください
- メールアドレスの確認が完了しているか確認してください
- ブラウザのポップアップブロッカーが有効になっていないか確認してください

### Wranglerコマンドが見つからない場合

- プロジェクトの依存関係がインストールされているか確認してください（`pnpm install`を実行）
- `apps/backend`ディレクトリで`pnpm exec wrangler`を使用してください
- または、ルートディレクトリから`pnpm --filter @skill-quest/backend exec wrangler`を使用してください
- グローバルにインストールした場合、PATHが正しく設定されているか確認してください

## 次のステップ

Cloudflareアカウントの設定が完了したら、次の手順に進みます：

- [D1データベース作成手順](./02_d1_database_setup.md)
