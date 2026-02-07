# Workers AI有効化手順

本ドキュメントでは、Skill Quest AIプロジェクトでAI機能（キャラクター生成、ナラティブ生成、パートナーメッセージ、チャットなど）を使用するためのCloudflare Workers AIの有効化手順を説明します。

## 前提条件

- Cloudflareアカウントが作成済みであること（[Cloudflareアカウント設定手順](./01_cloudflare_account_setup.md)を参照）
- Wrangler CLIがインストールされ、認証済みであること
- プロジェクトの`apps/backend`にWorkerが設定済みであること（`wrangler.toml`が存在すること）

## 手順

### 1. Cloudflare DashboardでWorkers AIが利用可能であることを確認する

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログインします
2. 左メニューから **Workers & Pages** を選択します
3. 既存のWorker（`skill-quest-backend`）を選択するか、新規Workerを作成します
4. **Settings** タブを開き、**Bindings** セクションを確認します
5. **Workers AI** のバインディングを追加できる状態であれば、Workers AIはアカウントで利用可能です

**別の確認方法**: [Workers AI Playground](https://playground.ai.cloudflare.com/) にアクセスし、ログインした状態でモデルを選択して推論を試すことができます。Playgroundが利用できれば、Workers AIは有効です。

### 2. wrangler.tomlでWorkers AIバインディングを有効化する

既存のWorkerにWorkers AIを追加するには、`apps/backend/wrangler.toml` にAIバインディングを追加します。

1. `apps/backend/wrangler.toml` を開きます
2. 次のようにWorkers AIバインディングを定義します（未設定の場合に追加）：

```toml
[ai]
binding = "AI"
remote = true
```

3. プレビュー環境や本番環境でもAIを使う場合は、各環境セクションに同様のバインディングを追加します（必要に応じて）。  
   多くの場合、ルートの `[ai]` だけで全環境に適用されます。

**補足**: バインディング名は `AI` である必要があります。バックエンドコードでは `env.AI` として参照しています。

### 3. ローカルでの動作確認

1. バックエンドディレクトリで開発サーバーを起動します：

**バックエンドディレクトリから実行**：

```bash
cd apps/backend
pnpm dev
```

**ルートディレクトリから実行**：

```bash
pnpm --filter @skill-quest/backend dev
```

2. AIエンドポイント（例: `POST /api/ai/generate-character`）にリクエストを送信し、エラーが返らないことを確認します。  
   Workers AIが無効な場合や未設定の場合、該当エンドポイントは 503 や 500 を返す可能性があります。

3. Cloudflareにデプロイして確認する場合：

```bash
cd apps/backend
pnpm exec wrangler deploy
```

デプロイ後、本番のAPI URLに対して同じAIエンドポイントを呼び出して動作を確認します。

### 4. Cloudflare上で利用状況を確認する

「接続はできているが、本当にCloudflareのWorkers AIで動いているか」を確認する方法です。

#### Workers AI の利用量（Neurons）で確認する（推奨）

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログインします
2. 左メニューから **Workers & Pages** を選択し、続けて **Workers AI**（または **AI** > **Workers AI**）を開きます  
   直接URL: <https://dash.cloudflare.com/?to=/:account/ai/workers-ai>
3. **使用量（Neurons）** や **モデル別の消費** が表示されます
4. **確認のしかた**: ローカルで `pnpm dev` した状態で、AIエンドポイント（例: `POST http://127.0.0.1:8787/api/ai/generate-character`）を1回呼び出します。  
   Workers AI は常にリモートで実行されるため、数十秒〜数分以内にダッシュボードの利用量が増えていれば、Cloudflare上で利用できている証拠です。

**ポイント**: `wrangler dev` はWorker本体をローカルで動かしていますが、**AIの推論だけはCloudflare側**で行われるため、この利用量に反映されます。

#### Worker のリクエスト数で確認する（デプロイ後）

Workerをデプロイしている場合：

1. **Workers & Pages** → 対象のWorker（例: `skill-quest-backend`）を選択
2. **Metrics** タブでリクエスト数やエラー数を確認
3. **Logs**（Real-time Logs や Logpush）で `/api/ai/*` へのリクエストが出ていれば、そのWorker経由でAIが呼ばれています

※ `wrangler dev` のリクエストはローカル処理のため、このWorkerのMetricsにはカウントされません。あくまでデプロイ済みWorkerの確認用です。

### 5. 利用モデルの確認

本プロジェクトでは、以下のWorkers AIモデルを利用します（実装状況に応じて参照してください）。

| 用途           | モデル名                           |
|----------------|------------------------------------|
| 通常の会話・生成 | `@cf/meta/llama-3.1-8b-instruct`   |
| 複雑な推論     | `@cf/meta/llama-3.3-70b-instruct`（利用可能な場合） |

利用可能なモデル一覧は、[Cloudflare Workers AI モデルドキュメント](https://developers.cloudflare.com/workers-ai/models/)で確認できます。

## 料金プランと制限事項

- **無料枠**: Workers AIには1日あたり **10,000 Neurons** の無料枠があります（Workers Free / Paid 共通）。リセットは毎日 00:00 UTC です。
- **有料**: 無料枠を超えると **$0.011 / 1,000 Neurons** で課金されます。無料枠を超えて利用するには Workers Paid プランが必要です。
- **Neurons**: 推論の負荷（トークン数・モデルなど）に応じて消費され、モデルごとの料金は [Workers AI 料金](https://developers.cloudflare.com/workers-ai/platform/pricing/) で確認できます。
- **レート制限**: タスク種類ごとにレート制限があります（例: テキスト生成はベースで 300 リクエスト/分など）。詳細は [Workers AI 制限](https://developers.cloudflare.com/workers-ai/platform/limits/) を参照してください。

開発時は無料枠内で収まる場合が多く、本番利用時はダッシュボードでNeurons使用量を確認することを推奨します。

## トラブルシューティング

### Workers AIが利用できない / 403 や 503 が出る

- CloudflareアカウントでWorkers AIが有効になっているか、[Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages) から確認してください
- 一部のアカウントやリージョンでは制限がある場合があります。その場合は [Cloudflare サポート](https://support.cloudflare.com/) または [Workers AI ドキュメント](https://developers.cloudflare.com/workers-ai/) を参照してください
- `wrangler.toml` の `[ai]` と `binding = "AI"` の記述に誤りがないか確認してください

### ローカルで env.AI が undefined になる

- `wrangler dev` 実行時も、`wrangler.toml` に `[ai]` が定義されていれば `env.AI` は利用可能です。定義を保存し直し、`wrangler dev` を再起動してください
- 別の環境（例: `wrangler dev --env preview`）を使っている場合は、その環境のセクションに `[ai]` があるか確認してください

### モデル名やエンドポイントのエラー

- 使用しているモデル名（例: `@cf/meta/llama-3.1-8b-instruct`）が [サポートされているモデル一覧](https://developers.cloudflare.com/workers-ai/models/) と一致しているか確認してください
- モデル名のタイポやバージョン違いがないか確認してください

## 次のステップ

Workers AIの有効化が完了したら、次の手順に進みます：

- AIサービス基盤の実装（タスク7.1）
- キャラクター生成・ナラティブ生成・パートナーメッセージの実装（タスク7.2〜7.4）
- ストリーミングチャットの実装（タスク7.6）

## 参考情報

- [Cloudflare Workers AI 入門](https://developers.cloudflare.com/workers-ai/get-started/)
- [Workers AI バインディング設定](https://developers.cloudflare.com/workers-ai/configuration/bindings/)
- [Workers AI モデル一覧](https://developers.cloudflare.com/workers-ai/models/)
- [Workers AI 料金](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Workers AI 制限](https://developers.cloudflare.com/workers-ai/platform/limits/)
