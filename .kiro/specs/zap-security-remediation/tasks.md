# 実装計画: ZAP セキュリティ対策

## 対象外・実装不要

- **6.1, 6.2, 6.3** — Cookie 属性（HttpOnly, Secure, SameSite）は Better Auth で既に適切に設定済みのため、本機能での実装は不要

## タスク一覧

---

- [ ] 1. バックエンドにセキュリティヘッダーとCORS許可リストを実装する
- [x] 1.1 (P) セキュリティヘッダー用ミドルウェアを追加し、全レスポンスに X-Content-Type-Options と X-Frame-Options を付与する
  - 既存のミドルウェアチェーンに secureHeaders を適用する（CORS の直後）
  - バックエンドは主に JSON API のため CSP は省略可。将来 HTML を返す場合は report-only を検討する
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.2 (P) HTTPS の場合のみ HSTS を有効化し、開発環境（localhost）では無効にする
  - リクエスト URL のプロトコルで HTTPS を判定する
  - 開発時は HSTS を設定しない
  - _Requirements: 5.1, 5.3_

- [x] 1.3 CORS の origin を許可リストで検証する
  - 許可リストに FRONTEND_URL および localhost 系（3000, 5173, 8787）を含める
  - リクエストの Origin が許可リストに含まれる場合のみその値を返す
  - credentials 利用時は `*` を返さない
  - exposeHeaders は既存の Content-Length のみ維持する
  - _Requirements: 4.1, 4.2, 4.3_

---

- [ ] 2. フロントエンドにセキュリティヘッダーを実装する
- [x] 2.1 (P) Vite 開発サーバーに X-Frame-Options と X-Content-Type-Options を付与する
  - server.headers に設定を追加する
  - _Requirements: 2.1, 2.2_

- [x] 2.2 (P) 本番配信用の _headers ファイルを作成する
  - public 配下に _headers を配置し、ビルド出力に含める
  - X-Frame-Options, X-Content-Type-Options, HSTS, CSP を設定する
  - CSP は index.html で使用する外部リソース（cdn.tailwindcss.com, esm.sh, fonts.googleapis.com, fonts.gstatic.com）を許可する
  - 初回は CSP を report-only で検証することを推奨
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

---

- [ ] 3. (P) ZAP 対策状況を文書化する
- [x] 3.1 docs/ZAP_REMEDIATION.md を作成し、対象アラート種別の対策状況と例外を記載する
  - 対象種別: CSP, X-Frame-Options, X-Content-Type-Options, SRI, CORS, HSTS, Cookie 属性
  - 外部 CDN の SRI 方針（Tailwind CDN 等はバージョン非固定のため未適用、理由を記載）
  - 同一オリジンリソースの SRI は Vite ビルドでハッシュ付きファイル名により実質対応済みであることを記載
  - curl によるヘッダー確認手順と ZAP 再スキャン手順を記載する
  - _Requirements: 3.1, 3.2, 7.1, 7.2_

---

- [ ] 4. 実装の検証を行う
- [x] 4.1 バックエンドのセキュリティヘッダーと CORS を検証する
  - バックエンドへのリクエストで X-Content-Type-Options, X-Frame-Options がレスポンスに含まれることを単体または統合テストで確認する
  - CORS origin コールバックが許可リストに含まれる / 含まれない Origin で正しく動作することを確認する
  - _Requirements: 7.1_

- [x] 4.2 E2E テストでフロント・バック間の API 呼び出しが正常に動作することを確認する
  - 既存 E2E が CORS 変更後もパスすることを検証する
  - _Requirements: 7.1_
