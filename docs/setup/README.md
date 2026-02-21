# セットアップガイド

Skill Quest AI の開発環境・本番環境構築手順の一覧です。記載順に実施することを推奨します。

## 開発環境（初回）

| 順序 | ドキュメント | 内容 |
|------|-------------|------|
| 1 | [01_cloudflare_account_setup.md](./01_cloudflare_account_setup.md) | Cloudflare アカウント作成・Wrangler 認証 |
| 2 | [02_d1_database_setup.md](./02_d1_database_setup.md) | D1 データベース作成・ローカルマイグレーション |
| 3 | [03_workers_ai_setup.md](./03_workers_ai_setup.md) | Workers AI 有効化・バインディング |
| 4 | [04_データベース確認方法.md](./04_データベース確認方法.md) | テーブル一覧・件数確認の方法 |

## 本番・プレビュー・E2E

| ドキュメント | 内容 |
|-------------|------|
| [04_production_environment_setup.md](./04_production_environment_setup.md) | 本番・プレビュー環境の D1・Pages・Workers 設定 |
| [05_ai_gateway_setup.md](./05_ai_gateway_setup.md) | AI Gateway（オプション） |
| [06_snyk_setup.md](./06_snyk_setup.md) | Snyk 脆弱性スキャン（オプション） |
| [07_e2e_test_setup.md](./07_e2e_test_setup.md) | Playwright E2E の実行方法・CI 準備 |
| [08_owasp_zap_setup.md](./08_owasp_zap_setup.md) | OWASP ZAP セキュリティスキャン（オプション） |
| [09_custom_domain_setup.md](./09_custom_domain_setup.md) | 独自ドメイン（Route 53 + Cloudflare） |

## 関連

- [アーキテクチャ設計書](../architecture/README.md) — システム構成・データベース設計・デプロイ戦略
- [Postman](../postman/README.md) — API テスト用コレクション
