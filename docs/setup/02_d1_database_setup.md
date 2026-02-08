# D1データベース作成手順

本ドキュメントでは、Skill Quest AIプロジェクトで使用するローカル開発用D1データベースの作成手順を説明します。

## 前提条件

- Cloudflareアカウントが作成済みであること（[Cloudflareアカウント設定手順](./01_cloudflare_account_setup.md)を参照）
- Wrangler CLIがインストールされ、認証済みであること
- プロジェクトの`apps/backend`ディレクトリに`wrangler.toml`が存在すること

## 手順

### 1. ローカル開発用D1データベースの設定

**重要**: `wrangler d1 create`コマンドには`--local`フラグは存在しません。ローカル開発用のD1データベースは、`wrangler.toml`に`database_id = "local"`を設定するだけで、`wrangler dev`を実行したときに自動的に作成されます。

このプロジェクトでは、既に`apps/backend/wrangler.toml`に以下の設定が含まれています：

```toml
[[d1_databases]]
binding = "DB"
database_name = "skill-quest-db"
database_id = "local"
```

**ローカル開発用のD1データベースを使用する場合**：

1. `apps/backend/wrangler.toml`を確認し、`database_id = "local"`が設定されていることを確認します（既に設定済みです）
2. `wrangler dev`を実行すると、自動的にローカルD1データベースが作成されます

```bash
cd apps/backend
pnpm dev
```

または、ルートディレクトリから：

```bash
pnpm --filter @skill-quest/backend dev
```

### 2. リモートD1データベースの作成（オプション）

本番環境やプレビュー環境で使用するリモートD1データベースを作成する場合：

1. 以下のコマンドを実行します（`--local`フラグは不要です）：

**バックエンドディレクトリから実行**：

```bash
cd apps/backend
pnpm exec wrangler d1 create skill-quest-db
```

**ルートディレクトリから実行**：

```bash
pnpm --filter @skill-quest/backend exec wrangler d1 create skill-quest-db
```

2. コマンドが成功すると、以下のような出力が表示されます：

```
✅ Successfully created DB 'skill-quest-db' in region APAC
Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via snapshots to R2.

[[d1_databases]]
binding = "DB"
database_name = "skill-quest-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

3. `apps/backend/wrangler.toml`の該当する環境セクション（`[env.preview]`または`[env.production]`）の`database_id`を更新します：

```toml
[env.preview]
[[env.preview.d1_databases]]
binding = "DB"
database_name = "skill-quest-db-preview"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # コマンド出力からコピーしたID
```

**注意**: ローカル開発用の場合は、`database_id = "local"`のままにしておきます。本番環境やプレビュー環境では、実際のデータベースIDが必要です。

### 3. データベースの確認

**リモートD1データベースの一覧を確認する場合**：

以下のコマンドで、Cloudflareアカウント内のリモートD1データベースの一覧を確認できます：

**バックエンドディレクトリから実行**：

```bash
cd apps/backend
pnpm exec wrangler d1 list
```

**ルートディレクトリから実行**：

```bash
pnpm --filter @skill-quest/backend exec wrangler d1 list
```

**注意**: `wrangler d1 list`コマンドには`--local`フラグは存在しません。このコマンドはリモートD1データベースの一覧を表示します。ローカルD1データベースは`wrangler dev`を実行したときに自動的に作成され、`wrangler.toml`の設定に基づいて管理されます。

### 4. データベースへの接続テスト

以下のコマンドで、データベースに接続してSQLクエリを実行できます：

**バックエンドディレクトリから実行**：

```bash
cd apps/backend
pnpm exec wrangler d1 execute skill-quest-db --local --command "SELECT 1;"
```

**ルートディレクトリから実行**：

```bash
pnpm --filter @skill-quest/backend exec wrangler d1 execute skill-quest-db --local --command "SELECT 1;"
```

**グローバルにインストールしている場合**：

```bash
wrangler d1 execute skill-quest-db --local --command "SELECT 1;"
```

正常に動作する場合、以下のような出力が表示されます：

```
✅ Executed on skill-quest-db (local)
┌─────────┐
│ ?column? │
├─────────┤
│ 1       │
└─────────┘
```

## トラブルシューティング

### データベース作成エラーが発生する場合

**ローカル開発用の場合**：

- `wrangler.toml`に`database_id = "local"`が設定されているか確認してください（既に設定済みです）
- `wrangler dev`を実行すると、自動的にローカルD1データベースが作成されます
- `--local`フラグを使用したコマンドは存在しないため、使用しないでください

**リモートD1データベースを作成する場合**：

- Wrangler CLIが正しく認証されているか確認してください（`pnpm --filter @skill-quest/backend exec wrangler whoami`で確認）
- Cloudflareアカウントが有効であるか確認してください
- データベース名が既に使用されていないか確認してください
- `apps/backend`ディレクトリでコマンドを実行しているか確認してください
- `--local`フラグは使用しないでください（`wrangler d1 create`コマンドには`--local`フラグは存在しません）

### wrangler.tomlが見つからない場合

- `apps/backend`ディレクトリに`wrangler.toml`が存在するか確認してください
- ファイルが存在しない場合は、プロジェクトの初期設定を確認してください

### データベースIDが正しく設定されていない場合

- `wrangler.toml`の`database_id`が正しく設定されているか確認してください
- ローカル開発の場合は`database_id = "local"`でも動作しますが、実際のIDを使用することを推奨します

### 5. データベース内のデータを確認する

テーブル一覧や中身の確認方法は [データベース確認方法](./04_データベース確認方法.md) を参照してください。

## 次のステップ

ローカル開発用D1データベースの作成が完了したら、次の手順に進みます：

- データベーススキーマの定義（タスク4.1）
- マイグレーションの生成と適用（タスク4.2、4.3）

## 参考情報

- [Cloudflare D1公式ドキュメント](https://developers.cloudflare.com/d1/)
- [Wrangler CLIリファレンス](https://developers.cloudflare.com/workers/wrangler/)
