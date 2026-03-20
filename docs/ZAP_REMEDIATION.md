# ZAP セキュリティスキャン対策メモ

## 対象アラート種別と状況

| 種別 | 対策 |
|------|------|
| **CSP** | `Content-Security-Policy` を Cloudflare Pages の `_headers` および Workers ミドルウェアで設定 |
| **X-Frame-Options** | `SAMEORIGIN` を `_headers` / レスポンスヘッダーで付与 |
| **X-Content-Type-Options** | `nosniff` を付与 |
| **SRI** | 同一オリジンは Vite ビルドのハッシュ付きファイル名で実質カバー。外部は下記方針 |
| **CORS** | 許可オリジンをホワイトリストで制限 |
| **HSTS** | HTTPS 時に `Strict-Transport-Security` を付与 |
| **Cookie** | Better Auth の `SameSite` / `Secure` を環境に応じて設定 |

## 外部 CDN と SRI（Subresource Integrity）

`index.html` の importmap で esm.sh 等を参照する場合、**バージョンが固定されにくく SRI を付与しづらい**ため、方針として **Tailwind は CDN ではなく npm バンドル**に寄せる。外部スクリプトを増やす場合はバージョン固定と `integrity` の検討が必要。

## 同一オリジンと Vite ビルド

同一オリジンで配信する JS/CSS は **Vite ビルドのハッシュ付きファイル名**により改ざん検知に近い性質を持つ。

## ヘッダー確認（curl）

```bash
curl -sI https://example.com | grep -iE "content-security|x-frame|x-content-type|strict-transport"
```

## ZAP 再スキャン

設定変更後は OWASP ZAP で同一スコープを再スキャンし、**再スキャン**結果と本書を突き合わせる。
