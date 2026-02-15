# リサーチ & 設計決定

---
**目的**: ZAPセキュリティ対策の設計に必要な発見事項と技術的調査を記録する。
---

## Summary

- **Feature**: zap-security-remediation
- **Discovery Scope**: Extension（既存ミドルウェア・フロントエンド設定の拡張）
- **Key Findings**:
  - Hono の `hono/secure-headers` が X-Content-Type-Options, X-Frame-Options, HSTS, CSP 等をデフォルトで提供。環境別（HSTS の有効/無効）の設定が可能
  - Cloudflare Pages は `_headers` ファイルで静的アセットにカスタムヘッダーを付与可能。`public/_headers` を配置しビルド出力に含める
  - CORS の origin コールバックは `(origin, c) => string | undefined` 形式で、`c.env.FRONTEND_URL` をリクエスト時に参照可能
  - index.html は esm.sh, cdn.tailwindcss.com, fonts.googleapis.com を利用。CSP の script-src, style-src にこれらのドメインを許可する必要あり

## Research Log

### Hono secure-headers ミドルウェア

- **Context**: バックエンドにセキュリティヘッダーを追加する手段を調査
- **Sources**: https://hono.dev/docs/middleware/builtin/secure-headers
- **Findings**:
  - `strictTransportSecurity` を `false` にすることで HSTS を無効化可能（開発環境用）
  - `xFrameOptions`, `xContentTypeOptions` はデフォルトで有効。カスタム値に上書き可能
  - CSP は `contentSecurityPolicy` オプションでオブジェクト形式で指定
  - Cloudflare Workers を含む複数ランタイムで動作
- **Implications**: 本番のみ HSTS を有効にするため、baseURL または環境変数で HTTPS 判定が必要

### Cloudflare Pages _headers

- **Context**: フロントエンド本番配信時のヘッダー設定方法を調査
- **Sources**: https://developers.cloudflare.com/pages/configuration/headers/
- **Findings**:
  - `public/_headers` に配置すると Vite ビルドで `dist/` にコピーされる
  - 構文: パスパターンとインデント付きヘッダー名: 値
  - Pages Functions や Workers が先にレスポンスを返す場合は `_headers` は適用されない（静的アセット向け）
- **Implications**: SPA の HTML/JS/CSS には適用可能。本番ビルド出力構造に合わせてパスを指定

### Vite server.headers

- **Context**: 開発サーバーにヘッダーを付与する方法を調査
- **Sources**: Vite 公式ドキュメント
- **Findings**:
  - `server.headers` でオブジェクト形式（ヘッダー名: 値）を指定可能
  - 開発時のみ有効。本番は別途対応
- **Implications**: vite.config.ts に X-Frame-Options, X-Content-Type-Options を追加

### CORS origin と Bindings

- **Context**: CORS の許可リストに FRONTEND_URL を動的に反映する方法を調査
- **Sources**: Hono cors ミドルウェア、gap-analysis.md
- **Findings**:
  - Hono cors の origin は `(origin: string, c: Context) => string | undefined` をサポート
  - `c.env.FRONTEND_URL` は Cloudflare Workers ではリクエスト時に利用可能
  - 開発時: localhost:3000, localhost:5173, localhost:8787 を許可リストに含める必要あり
- **Implications**: origin コールバックで許可リストを組み立て、一致した場合に origin を返す

### CSP と index.html の外部リソース

- **Context**: フロントエンドの CSP で許可するドメインを特定
- **Sources**: index.html
- **Findings**:
  - script: cdn.tailwindcss.com, esm.sh（import map 経由）
  - style: fonts.googleapis.com（@import）, 同一オリジン
  - font: fonts.gstatic.com
- **Implications**: CSP の script-src, style-src, font-src にこれらのドメインを明示。'unsafe-inline' は Tailwind CDN 等で必要になる可能性あり

### SRI と外部 CDN

- **Context**: 要件 3 の SRI 適用可否を調査
- **Sources**: gap-analysis.md
- **Findings**:
  - Tailwind CDN はバージョン非固定で integrity ハッシュが変動しにくい
  - esm.sh はバージョン指定でハッシュ取得可能だが、ビルド時生成が必要
  - 同一オリジン（Vite ビルド出力）はハッシュ付きファイル名で配信されるため、CDN 経由でなければ SRI の優先度は低い
- **Implications**: 外部 CDN の SRI は「文書化」で対応。同一オリジンは実装上ほぼ自動で整合性が保たれる

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks | Notes |
|--------|-------------|-----------|-------|-------|
| ミドルウェア拡張 | middleware/index.ts に secureHeaders を追加 | 既存パターンに沿う、変更箇所が少ない | 責務が増える | gap-analysis のオプション A/C |
| 専用モジュール | middleware/security-headers.ts を新規作成 | 関心の分離 | 薄いラッパーになる | 本機能では過剰 |

**採用**: ミドルウェア拡張。Hono secureHeaders を直接利用し、環境判定は middleware 内で行う。

## Design Decisions

### Decision: バックエンドの secureHeaders と HSTS の環境別制御

- **Context**: 要件 5.3 — 開発環境で HSTS を設定しない
- **Alternatives**:
  1. baseURL のプロトコルで判定（auth.ts と同様）
  2. 環境変数 `ENVIRONMENT` や `NODE_ENV` で判定
- **Selected Approach**: リクエスト URL の `request.url` からプロトコルを取得。`https` のときのみ HSTS を有効化
- **Rationale**: Workers では環境変数が env にあり、BETTER_AUTH_BASE_URL や request.url で HTTPS 判定が可能。auth.ts と一貫性がある
- **Trade-offs**: プロキシやエッジで URL が書き換わる環境では要検証。Cloudflare Workers では通常問題なし

### Decision: CORS origin の許可リスト

- **Context**: 要件 4.1, 4.2 — Origin の許可リスト検証、credentials 時は `*` 不可
- **Selected Approach**: `c.env.FRONTEND_URL` と開発用 localhost リスト（http://localhost:3000, http://localhost:5173, http://localhost:8787）を結合。リクエストの Origin がリストに含まれる場合のみその値を返す。含まれない場合は undefined（拒否）
- **Rationale**: auth.ts の trustedOrigins と整合。開発時は wrangler の vars が localhost:5173 だが、Vite は 3000 で動作するため両方許可
- **Follow-up**: wrangler.toml の FRONTEND_URL を localhost:3000 に統一するか、両方許可リストに含めるかは運用判断

### Decision: CSP の適用範囲

- **Context**: 要件 1.3（バックエンド）, 2.3（フロントエンド）
- **Selected Approach**:
  - バックエンド: 主に JSON API のため、CSP は report-only または省略。HTML を返すエンドポイントが将来増えた場合は要検討
  - フロントエンド: 本番用 `_headers` に CSP を設定。script-src, style-src, font-src に index.html で使用するドメインを許可
- **Rationale**: バックエンドは HTML をほとんど返さない。フロントエンドは SPA で XSS リスクが高いため CSP を必須

## Risks & Mitigations

- **CSP による動作不良**: script-src が厳格すぎると esm.sh や Tailwind がブロックされる → 初回は Content-Security-Policy-Report-Only で検証し、問題なければ本番 CSP に移行
- **開発時の CORS 拒否**: localhost:3000 が許可リストに含まれていない場合、ブラウザからの API 呼び出しが失敗する → 許可リストに localhost:3000, 5173, 8787 を明示的に含める
- **_headers の配置ミス**: public/ に配置しないと dist にコピーされない → ビルド後に dist/_headers の存在を確認する手順をドキュメントに記載

## References

- [Hono secure-headers](https://hono.dev/docs/middleware/builtin/secure-headers)
- [Cloudflare Pages Headers](https://developers.cloudflare.com/pages/configuration/headers/)
- [Vite server options](https://vite.dev/config/server-options.html)
