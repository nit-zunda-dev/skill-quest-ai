# Workers Observability（ログ取り込み）の有効化

Cloudflare Workers の **Observability** を有効にすると、構造化ログ（`console.log` の JSON 出力）が Cloudflare 側で取り込まれ、ダッシュボードで検索・集計できます。障害追跡や利用傾向の把握に利用します。

**デフォルトでは無効**です。必要なタイミング（本番の障害調査時や運用開始時など）で有効化してください。有効化するとログ量に応じた課金の対象になる場合があります（[Workers Logs 料金](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#pricing) 参照）。

## 有効化するタイミングの例

- 本番環境で障害調査やメトリクス確認が必要になったとき
- プレビュー環境でデプロイ後の挙動をログで確認したいとき
- 運用を開始し、構造化ログを継続的に参照する方針にしたとき

## 手順

バックエンドの `apps/backend/wrangler.toml` を編集し、**有効にしたい環境**に応じて以下のいずれかを追加してから、該当環境へ再デプロイします。

### 全環境で有効にする場合

トップレベル（`[env.preview]` の前など）に追加します。

```toml
[observability]
enabled = true
head_sampling_rate = 1
```

### 本番環境のみ有効にする場合（推奨）

本番だけログを取り込み、プレビュー・ローカルは無効のままにします。`[env.production]` セクションの直後に追加します。

```toml
[env.production.observability]
enabled = true
head_sampling_rate = 1
```

### プレビュー環境のみ有効にする場合

プレビューで検証したいときだけ有効にします。`[env.preview]` セクションの直後に追加します。

```toml
[env.preview.observability]
enabled = true
head_sampling_rate = 1
```

### サンプリングでログ量を抑える

トラフィックが多い場合は `head_sampling_rate` で取り込むリクエストの割合を下げられます（0〜1。1 で 100%、0.01 で 1%）。

```toml
[env.production.observability]
enabled = true
head_sampling_rate = 0.1
```

## デプロイ

設定を追加した環境に対してデプロイします。

```bash
cd apps/backend
pnpm run deploy:production   # 本番で有効にした場合
# または
pnpm run deploy:preview      # プレビューで有効にした場合
```

## ログの確認

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → **Workers & Pages**
2. **Observability** を選択
3. 対象の Worker（skill-quest-backend）を選択してログを表示

構造化ログ（`level`, `msg`, `path`, `method`, `status`, `durationMs` など）はフィールドごとにフィルタ・検索できます。
