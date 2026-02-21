# E2E テストの実行と CI 準備

Playwright を使った E2E テストの実行方法と、CI で E2E を通すために必要な準備をまとめます。

## 概要

- **ツール**: `@playwright/test`
- **対象**: 認証フロー、テストデータセットアップ、Playwright 設定の検証
- **環境変数**:
  - `E2E_BASE_URL`: ブラウザで開くフロントエンドの URL（未設定時はサーバー依存のテストはスキップ）
  - `E2E_API_URL`: API のベース URL（フロントと API が別ポートのときのみ指定。未設定時は `E2E_BASE_URL` を使用）

## ローカルでの実行

### 1. サーバーを起動する（任意）

`pnpm test:e2e:local` は **E2E_BASE_URL が localhost のとき**、フロント・バックを自動起動します。未起動なら Playwright の webServer で起動し、既に `pnpm dev` で起動済みの場合はそのまま再利用します。

手動で起動する場合:

```bash
# ルートでフロント・バック両方を起動
pnpm dev
```

- **フロントエンド**: 既定で `http://localhost:3000`（Vite の port 設定）
- **バックエンド（API）**: 既定で `http://localhost:8787`（Wrangler dev）

### 2. E2E を実行する

```bash
# サーバー不要のテストのみ（設定のスモークなど）。E2E_BASE_URL 未設定のテストはスキップ
pnpm test:e2e

# ローカルサーバー向け（E2E_BASE_URL=3000, E2E_API_URL=8787 を設定。未起動時は自動起動）
pnpm test:e2e:local

# UI モードで実行（デバッグ用）
pnpm test:e2e:local:ui
```

### 3. ポートが異なる場合

フロントや API を別ポートで動かしている場合は、環境変数を明示します。

```bash
# 例: フロント 5173、API 8787
E2E_BASE_URL=http://localhost:5173 E2E_API_URL=http://localhost:8787 pnpm test:e2e
```

## CI での実行（現状と準備）

### 現状

- **CI に E2E ジョブが含まれている場合**、`check` ジョブ成功後に `e2e` ジョブが実行されます。
- `e2e` ジョブ: Playwright ブラウザインストール → プレビュー待機（`E2E_BASE_URL` 設定時）→ `pnpm run test:e2e`（CI 時はヘッドレス）。失敗時は playwright-report と e2e/test-results を成果物としてアップロードします。
- プレビュー URL を渡すには、リポジトリの GitHub Secrets に `E2E_BASE_URL`（と必要なら `E2E_API_URL`）を設定してください。未設定の場合はサーバー依存の E2E テストはスキップされ、ジョブは成功します。

### CI で E2E を通すために必要な準備

1. **実行対象の環境を用意する**
   - E2E は「動いているアプリ」に対してブラウザでアクセスするため、CI 上で **プレビュー環境へデプロイ** するか、**一時的にフロント・API を立ち上げる** 必要があります。
   - 推奨: main ブランチへの PR 時にプレビュー環境へデプロイし、その URL を E2E に渡す。

2. **環境変数を CI に設定する**
   - `E2E_BASE_URL`: プレビュー環境のフロント URL（例: `https://xxx.pages.dev` や Cloudflare Workers のプレビュー URL）
   - `E2E_API_URL`: プレビュー環境の API URL（フロントと同一オリジンの場合は未設定でよい）

3. **Playwright のブラウザを CI でインストールする**
   - ジョブ内で `pnpm exec playwright install --with-deps`（または `npx playwright install --with-deps`）を実行する。

4. **ワークフローに E2E ステップを追加する**
   - プレビューデプロイ完了後に E2E ジョブを実行する。
   - デプロイ完了の待機（ヘルスチェックや `wrangler deployments list` の確認など）を入れると安定します。
   - 失敗時にスクリーンショット・動画・トレースを成果物としてアップロードする設定を入れるとデバッグしやすくなります。

5. **タイムアウト・リトライ**
   - `playwright.config.ts` でタイムアウト 30 分・CI 時リトライ 3 回は既に設定済みです。必要に応じてジョブの `timeout-minutes` も調整してください。

CI でサーバー依存の E2E を通すには、上記の準備のほか、`.github/workflows/` にプレビューデプロイ後の E2E ステップを追加する必要があります。

## 環境変数一覧

| 変数名 | 説明 | ローカル例 | CI 例 |
|--------|------|------------|--------|
| `E2E_BASE_URL` | フロントのベース URL | `http://localhost:3000` | プレビュー環境の URL |
| `E2E_API_URL` | API のベース URL（省略時は `E2E_BASE_URL` を使用） | `http://localhost:8787` | プレビュー API URL（同一オリジンなら省略可） |

## テストのスキップ条件

- `E2E_BASE_URL` が未設定の場合、認証フローやテストデータセットアップのテストは **スキップ** されます。
- 「ログイン後ダッシュボードでログアウト」では、キャラクター生成 API が失敗した場合（スタブやプレビュー AI が無い場合）も **スキップ** されます。
- そのため、`pnpm test:e2e` を CI でそのまま実行すると、`E2E_BASE_URL` 未設定時はサーバー依存のテストはスキップされ、設定のスモークなどだけが実行されてジョブは成功します。CI でサーバー依存の E2E まで通すには、上記の準備とワークフローへの E2E ステップ追加が必要です。
