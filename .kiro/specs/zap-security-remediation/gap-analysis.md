# 実装ギャップ分析

## エグゼクティブサマリー

本分析は、ZAPセキュリティ対策要件と既存コードベースの間のギャップを評価し、実装戦略の選択肢を提示します。

**主要な発見：**
- バックエンドにセキュリティヘッダー（X-Content-Type-Options, X-Frame-Options, CSP, HSTS）が未設定
- フロントエンド（Vite開発サーバー・Cloudflare Pages本番）にも同様のヘッダーが未設定
- CORS は `hono/cors` で設定済みだが、`origin || '*'` により本番で許可リスト検証が不十分になり得る
- Better Auth の Cookie 属性（HttpOnly, Secure, SameSite）は auth.ts で環境に応じて設定済み
- Hono には `hono/secure-headers` の組み込みミドルウェアが存在し、要件の大半を満たせる

**推奨アプローチ：**
- オプション A（既存コンポーネントの拡張）をベースとしたハイブリッド
- バックエンド: ミドルウェア拡張で secureHeaders を追加、CORS の origin 検証を強化
- フロントエンド: Vite の server 設定と Cloudflare Pages の `_headers` で対応

---

## 1. 現状調査

### 1.1 関連アセットと構造

#### バックエンド（apps/backend）

| ファイル / モジュール | 役割 | セキュリティ関連 |
|---------------------|------|-----------------|
| `src/middleware/index.ts` | CORS、ロギング、エラーハンドリング | CORS のみ。セキュリティヘッダー未設定 |
| `src/auth.ts` | Better Auth 初期化 | trustedOrigins、Cookie 属性（SameSite, Secure）設定済み |
| `src/index.ts` | アプリケーションエントリ | setupMiddleware でミドルウェア適用 |
| `wrangler.toml` | Cloudflare Workers 設定 | FRONTEND_URL を vars で管理、preview/production で分離 |

#### フロントエンド（apps/frontend）

| ファイル / モジュール | 役割 | セキュリティ関連 |
|---------------------|------|-----------------|
| `vite.config.ts` | Vite 設定 | server.headers 未設定。port 3000 |
| `index.html` | エントリHTML | 外部CDN（Tailwind, Google Fonts, esm.sh）を利用。SRI 未設定 |
| `public/` | 静的アセット | 現状フォルダなし。`_headers` 配置先候補 |

#### デプロイ構成

- **バックエンド**: Cloudflare Workers（Hono）。プレビュー/本番で HTTPS
- **フロントエンド**: Cloudflare Pages。ビルド出力 `apps/frontend/dist`。静的サイト
- **ドキュメント**: `docs/setup/04_production_environment_setup.md` に CORS・Cookie の注意あり

### 1.2 既存パターンと制約

**ミドルウェア適用順序（middleware/index.ts）：**
```
CORS → ロギング → エラーハンドリング
```

**CORS 現状：**
- `origin: (origin) => origin || '*'` — オリジン未指定時に `*` を返す。credentials: true と組み合わせると本番で問題になる可能性
- `credentials: true` のため、`Access-Control-Allow-Origin: *` は不可（ブラウザ制約）
- `allowHeaders`, `exposeHeaders` は最小限

**認証・Cookie（auth.ts）：**
- `isSecure = baseURL.startsWith('https')` で HTTPS 判定
- `defaultCookieAttributes`: HTTPS 時は `sameSite: 'none'`, `secure: true`。HTTP 時は `sameSite: 'lax'`, `secure: false`
- Better Auth のデフォルトでセッション Cookie は HttpOnly が設定される（ライブラリ仕様）
- `trustedOrigins` に FRONTEND_URL および localhost 系を含む

**FRONTEND_URL の不一致：**
- wrangler.toml のローカル vars は `http://localhost:5173`
- 実際の開発時は Vite が port 3000 で動作（vite.config.ts）
- auth.ts の trustedOrigins に `localhost:8787` は含むが、`localhost:3000` は明示なし。開発時に 3000 を使う場合は要確認

### 1.3 統合ポイント

- ミドルウェアチェーン: `setupMiddleware` 経由で全ルートに適用
- CORS は認証ルート（`/api/auth/*`）にも適用され、credentials 付きリクエストを許可
- フロントエンドとバックエンドは別オリジン（Pages と Workers）で稼働する構成

---

## 2. 要件実現可能性分析

### 2.1 要件と既存アセットのマッピング

| 要件 | 既存実装 | ギャップ | タグ |
|------|---------|---------|------|
| **1. セキュリティヘッダー（バックエンド）** | なし | X-Content-Type-Options, X-Frame-Options, CSP が未設定 | Missing |
| **2. セキュリティヘッダー（フロントエンド）** | なし | Vite/Pages でヘッダー未設定 | Missing |
| **3. SRI** | なし | index.html の外部スクリプトに integrity 未設定。同一オリジンは Vite ビルド出力 | Constraint |
| **4. CORS・クロスドメイン** | CORS 設定あり | origin の許可リスト検証が弱い。本番で `*` になる可能性 | Constraint |
| **5. HSTS** | なし | 開発環境では不要。本番では Workers/Pages で設定可能 | Missing |
| **6. Cookie属性** | Better Auth で設定済み | HttpOnly は Better Auth デフォルト。Secure/SameSite は auth.ts で環境別設定済み | ほぼ充足 |
| **7. 検証と追跡** | ドキュメント一部あり | ZAP 対策状況の文書化フォーマット未整備 | Missing |

### 2.2 ギャップ詳細

#### 要件 1: セキュリティヘッダー（バックエンド）

- **ギャップ**: いずれのヘッダーも未設定
- **解消方針**: Hono の `hono/secure-headers` ミドルウェアを導入。デフォルトで X-Content-Type-Options, X-Frame-Options, Referrer-Policy 等を付与。HSTS は本番のみ有効化する設定が可能
- **制約**: バックエンドは主に JSON API。HTML 配信は限定的なため、CSP は report-only または最小限で検討

#### 要件 2: セキュリティヘッダー（フロントエンド）

- **ギャップ**: Vite の server にヘッダー設定なし。Cloudflare Pages の `_headers` も未配置
- **解消方針**:
  - 開発: Vite の `server.headers` で X-Frame-Options, X-Content-Type-Options を付与
  - 本番: `public/_headers` を配置し、ビルド出力に含める。Cloudflare Pages が `_headers` を解釈

#### 要件 3: SRI

- **ギャップ**: index.html の cdn.tailwindcss.com, fonts.googleapis.com, esm.sh に integrity 属性なし
- **制約**: Tailwind CDN はバージョン非固定でハッシュが変動するため SRI 導入が難しい。esm.sh はバージョン指定でハッシュ取得可能だが、ビルド時に動的生成が必要
- **方針**: 同一オリジン由来のスクリプト・スタイル（Vite ビルド出力）については、本番ビルドでハッシュ付きファイル名になるため、CDN 経由で配信しない限り SRI の優先度は低い。外部 CDN は要件「文書化」に従い方針を記載

#### 要件 4: CORS

- **ギャップ**: `origin || '*'` により、Origin ヘッダーがないリクエスト（Postman 等）では `*` を返す。credentials: true の場合、ブラウザは `*` を拒否するため実害は限定的だが、明示的な許可リスト検証が望ましい
- **解消方針**: `origin` コールバックで `env.FRONTEND_URL` および trustedOrigins 相当のリストと照合。開発時は localhost:3000, localhost:5173 を許可

#### 要件 5: HSTS

- **ギャップ**: 未設定
- **解消方針**:
  - バックエンド: secureHeaders で strictTransportSecurity を本番のみ有効化（開発では false）
  - フロントエンド: Cloudflare Pages の `_headers` で本番パスに設定。開発環境（localhost）では設定しない

#### 要件 6: Cookie属性

- **現状**: Better Auth が HttpOnly をデフォルト設定。auth.ts で Secure, SameSite を環境に応じて設定済み
- **ギャップ**: 特になし。設計フェーズで Better Auth の Cookie 設定を再確認する程度

#### 要件 7: 検証と追跡

- **ギャップ**: ZAP 対策状況をまとめた文書が未整備
- **解消方針**: docs に `ZAP_REMEDIATION.md` または既存セキュリティドキュメントへ追記

### 2.3 調査が必要な項目（Research Needed）

- **Vite 本番 preview**: `vite preview` で配信する際のヘッダー設定方法（E2E や手動確認で使用する場合）
- **Cloudflare Pages の _headers の優先順位**: Pages Functions や Workers と併用する場合の挙動
- **CSP と esm.sh / import map**: index.html で esm.sh を利用しているため、CSP の script-src に `https://esm.sh` を許可する必要あり。ディレクティブ設計は設計フェーズで詳細化

---

## 3. 実装アプローチの選択肢

### オプション A: 既存コンポーネントの拡張

**概要**: 既存の middleware/index.ts と vite.config.ts を拡張し、セキュリティヘッダーと CORS を追加・強化する。

**変更対象：**
- `apps/backend/src/middleware/index.ts`: secureHeaders ミドルウェアの追加、CORS の origin 検証強化
- `apps/backend/src/index.ts`: 環境変数（FRONTEND_URL）をミドルウェアに渡す必要がある場合は Bindings 経由で利用
- `apps/frontend/vite.config.ts`: server.headers の追加
- `apps/frontend/public/_headers`: 新規作成（本番用）

**メリット:**
- 新規ファイルが少なく、既存パターンに沿った変更
- Hono の secureHeaders は実績ありで学習コストが低い
- フロントエンドは `_headers` のみ新規で、設定が単純

**デメリット:**
- middleware/index.ts の責務が増える
- 環境（dev/preview/production）に応じた分岐が増える可能性

### オプション B: 新規ミドルウェア・モジュールの作成

**概要**: セキュリティヘッダー専用のミドルウェアを新規作成し、既存 middleware から呼び出す。

**変更対象：**
- `apps/backend/src/middleware/security-headers.ts`: 新規。secureHeaders のラッパーと環境別設定
- `apps/backend/src/middleware/index.ts`: security-headers ミドルウェアの適用
- フロントエンドはオプション A と同様

**メリット:**
- セキュリティ関連の設定が一箇所に集約される
- 単体テストでヘッダー内容を検証しやすい

**デメリット:**
- 新規ファイルが増える
- 実質的には Hono の secureHeaders をラップするだけになり、オプション A と差分が小さい

### オプション C: ハイブリッド（推奨）

**概要**: バックエンドはオプション A（ミドルウェア拡張）で進め、CORS の origin 検証は専用ユーティリティまたは auth.ts の trustedOrigins と共通化する。フロントエンドは Vite + `_headers` で対応。SRI と検証文書は設計フェーズで詳細化。

**組み合わせ:**
- バックエンド: middleware/index.ts に secureHeaders を追加。CORS の origin を `c.env.FRONTEND_URL` および開発用 localhost リストで検証
- フロントエンド: vite.config の server.headers と public/_headers
- ドキュメント: docs に ZAP 対策状況を追記

**メリット:**
- 既存構成を活かしつつ、必要な変更を最小限に抑えられる
- 段階的に対応可能（ヘッダー → CORS → 文書化）

**デメリット:**
- バックエンドとフロントエンドで設定箇所が分かれるが、これは構成上やむを得ない

---

## 4. 実装の複雑度とリスク

| 項目 | 評価 | 理由 |
|------|------|------|
| **工数** | S（1〜3日） | Hono secureHeaders の導入、CORS 修正、Vite/Pages のヘッダー設定はいずれも既知のパターン。CSP の設計に多少時間がかかる可能性 |
| **リスク** | Low | 既存の Hono / Vite / Cloudflare の機能を利用。CSP の厳格化で動作不良が出る可能性はあるが、report-only で検証可能 |

---

## 5. 設計フェーズへの推奨事項

1. **採用アプローチ**: オプション C（ハイブリッド）を推奨。既存 middleware の拡張とフロントエンドの `_headers` 追加で要件の大部分を満たせる。
2. **優先実装順序**:
   - バックエンド: secureHeaders の導入（HSTS は本番のみ）
   - CORS: origin の許可リスト検証に変更
   - フロントエンド: Vite server.headers と public/_headers
   - ドキュメント: ZAP 対策状況の文書化
3. **設計フェーズで詳細化する項目**:
   - CSP の具体的なディレクティブ（script-src に esm.sh, cdn.tailwindcss.com, fonts.googleapis.com をどう含めるか）
   - SRI の外部 CDN への適用可否と文書化フォーマット
   - FRONTEND_URL と localhost:3000 / localhost:5173 の開発時統一方針
