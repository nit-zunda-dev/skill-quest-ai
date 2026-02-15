# ZAP セキュリティ対策状況

ZAP（OWASP Zed Attack Proxy）で検出された対象アラート種別の対策状況および例外を記載する。検証手順（curl によるヘッダー確認、ZAP 再スキャン）も本ドキュメントで案内する。

## 対象アラート種別と対策状況

| 種別 | 対策状況 | 備考 |
|------|----------|------|
| **CSP** (Content-Security-Policy) | 実装済み（report-only） | フロントエンド本番は `public/_headers` で Content-Security-Policy-Report-Only を設定。script-src / style-src / font-src に index.html で利用する外部（cdn.tailwindcss.com, esm.sh, fonts.googleapis.com, fonts.gstatic.com）を許可。 |
| **X-Frame-Options** | 実装済み | バックエンド: Hono secure-headers で SAMEORIGIN。フロント: Vite 開発時は server.headers、本番は `_headers` で SAMEORIGIN。 |
| **X-Content-Type-Options** | 実装済み | バックエンド: secure-headers で nosniff。フロント: 開発・本番ともに nosniff。 |
| **SRI** (Subresource Integrity) | 文書化のみ（外部 CDN）/ 実質対応済み（同一オリジン） | 下記「SRI 方針」を参照。 |
| **CORS** | 実装済み | バックエンドで Origin を許可リスト（FRONTEND_URL + localhost:3000/5173/8787）で検証。credentials 利用時は `*` を返さない。 |
| **HSTS** | 実装済み（本番のみ） | バックエンド: HTTPS の場合のみ Strict-Transport-Security。フロント本番: `_headers` で max-age=31536000; includeSubDomains。開発（localhost）では HSTS 無効。 |
| **Cookie 属性** | 対象外（既存で充足） | Better Auth により HttpOnly / Secure（本番HTTPS時）/ SameSite を適切に設定済み。本機能での変更なし。 |

## SRI 方針

### 外部 CDN（Tailwind CDN 等）— 未適用の方針

- **理由**: Tailwind CDN（cdn.tailwindcss.com）はバージョン非固定のため、integrity ハッシュが変動しやすく、SRI を適用するとビルド・デプロイのたびにハッシュ不一致で読み込み失敗するリスクがある。
- esm.sh はバージョン指定で利用しているが、ビルド時ごとに integrity を生成・埋め込む仕組みは現状未導入。必要に応じて将来的に検討する。
- 外部 CDN の SRI は「文書化」で対応し、リスクを認識した上で運用する。

### 同一オリジンリソース — 実質対応済み

- フロントエンドの同一オリジンから読み込むスクリプト・スタイルは **Vite ビルド** によりハッシュ付きファイル名（例: `assets/index-xxxxx.js`）で出力される。
- 配信パスが固定でなくハッシュ付きのため、改ざん検知の観点では SRI と同様の効果が得られる。明示的な `integrity` 属性の付与は優先度低として省略している。

## 検証手順

### curl によるヘッダー確認

レスポンスヘッダーにセキュリティヘッダーが付与されていることを確認する。

**フロントエンド（開発サーバー）**

```bash
curl -I http://localhost:3000/
```

確認するヘッダー例: `X-Frame-Options`, `X-Content-Type-Options`。

**バックエンド（API）**

```bash
curl -I http://localhost:8787/
```

確認するヘッダー例: `X-Content-Type-Options`, `X-Frame-Options`。HTTPS でアクセスした場合は `Strict-Transport-Security` も確認可能。

**本番デプロイ後**

- フロント: デプロイ先 URL に対して `curl -I https://<frontend-url>/` で `_headers` の内容（X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Content-Security-Policy-Report-Only）を確認する。
- バックエンド: `curl -I https://<api-url>/` で同様にヘッダーを確認する。

### ZAP 再スキャン手順

対策実施後、ZAP で再スキャンし、対象アラートの解消を確認する。

1. **アプリの起動**: ルートで `pnpm dev` を実行し、フロント（例: http://localhost:3000）とバックエンド（例: http://localhost:8787）を起動する。
2. **ZAP でのスキャン**: [OWASP ZAP セットアップ手順](setup/08_owasp_zap_setup.md) に従い、ZAP Desktop で「Automated Scan」または「Manual Explore」の後に「Active Scan」を実行する。URL to attack に `http://localhost:3000` を指定し、必要に応じて API の URL も対象に含める。
3. **結果確認**: スキャン完了後、**Alerts** タブで CSP・X-Frame-Options・X-Content-Type-Options・SRI・CORS・HSTS・Cookie 関連のアラートが減少していることを確認する。残存アラートは本ドキュメントの「対象アラート種別と対策状況」「SRI 方針」および例外に照らして許容するか判断する。

詳細な ZAP の使い方は [setup/08_owasp_zap_setup.md](setup/08_owasp_zap_setup.md) を参照すること。

---

## 対策後レポート分析 (2026-02-15)

レポート: `tests/reports/2026-02-15-ZAP-Report-.html`（ZAP 2.17.0、日 15 2月 2026 13:00:39 生成）に基づく分析。

### サマリー

| 対象 | アラート数（サイト別） | 判定 |
|------|------------------------|------|
| **http://localhost:8787**（バックエンド） | **0**（サイト別集計に未掲載 = 該当アラートなし） | **対策完了** |
| **http://localhost:3000**（フロントエンド） | 高 0 / 中 2 / 低 3 / 情報 4（計 9） | **許容範囲**（下記のとおり） |
| 第三者ドメイン（bing.com, fonts.googleapis.com, cdn.tailwindcss.com, Microsoft 系など） | 多数 | **対象外**（本機能のスコープ外） |

### バックエンド (localhost:8787)

- レポートの「Alert Counts by Site and Risk」に **localhost:8787 は登場していない**。すなわち、当該サイトに対するリスク付きアラートは **0 件**。
- X-Content-Type-Options・X-Frame-Options・CORS 許可リスト・HSTS（HTTPS 時）は実装済みであり、スキャン結果とも整合している。

### フロントエンド (localhost:3000) の残存アラート

レポート上、localhost:3000 のレスポンスにはすでに **X-Frame-Options: SAMEORIGIN** および **X-Content-Type-Options: nosniff** が含まれており、ヘッダー対策は有効。

- **中リスク 2 件**
  - **CSP ヘッダーが設定されていない**: 対象は `GET http://localhost:3000/index.css`（Vite 開発サーバーが返す HTML）。設計どおり、**開発環境では CSP は付与していない**（本番は `_headers` で Content-Security-Policy-Report-Only を設定済み）。→ **許容**。
  - **Sub Resource Integrity Attribute Missing**: 同一レスポンス（index.css 要求で返る HTML）が外部スクリプト（cdn.tailwindcss.com, esm.sh 等）を参照しているため ZAP が検出。**外部 CDN の SRI は文書化により未適用の方針**として記載済み。→ **許容**。
- **低・情報**
  - アプリケーションエラーの露見、クロスドメイン JS インクルージョン、タイムスタンプ露見、Cache-control、Content-Type、セッション管理の特定、モダン Web アプリ等。多くは開発時の挙動や ZAP の汎用ルールに起因し、本対策の対象外。必要に応じて個別に検討可能。

### 第三者ドメインに紐づくアラート

- **クロスドメイン設定ミス（CORS）**: 例として **https://fonts.googleapis.com** が該当。当方の CORS 設定ではなく、Google のレスポンス（`Access-Control-Allow-Origin: *`）に起因。→ **対象外**。
- **X-Content-Type-Options がない / HSTS が無効**: **nav-edge.smartscreen.microsoft.com** 等、Microsoft 系・Bing・その他外部サイトに紐づく。→ **対象外**。
- **Cookie 属性（HttpOnly, SameSite, Secure）**: レポート上の該当は主に第三者ドメイン。自サイトのセッション Cookie は Better Auth で適切に設定済み（本機能の対象外として記載済み）。

### 結論

- **自サイト（localhost:8787 / localhost:3000）に対する対策は有効**であり、バックエンドはアラート 0、フロントエンドは X-Frame-Options・X-Content-Type-Options が付与されていることがレポートから確認できる。
- フロントエンドに残る中リスク 2 件は、**開発環境で CSP を意図的に付けていないこと**と**外部 CDN の SRI を文書化のみで対応していること**に起因し、いずれも本ドキュメントの対策状況・SRI 方針と一致している。
- その他のアラートは第三者ドメインに紐づくため、本機能のスコープ外として許容してよい。
