# Research & Design Decisions

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:
- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.
---

## Summary
- **Feature**: `test-strategy-implementation`
- **Discovery Scope**: Complex Integration
- **Key Findings**:
  - Vitestカバレッジはv8プロバイダーが推奨され、モノレポではルートレベル設定が必要
  - Playwrightは標準版を使用し、プレビュー環境でE2Eテストを実行可能
  - D1ローカルバインディングはCIでも`wrangler d1 execute --local`で使用可能
  - テストユーティリティの集約により、テストの保守性が向上

## Research Log

### Vitestカバレッジ設定

- **Context**: 要件6でテストカバレッジの測定とレポート生成が必要
- **Sources Consulted**: 
  - https://vitest.dev/guide/coverage.html
  - https://vitest.dev/config/coverage
- **Findings**: 
  - v8プロバイダーがデフォルトで推奨（高速、低メモリ使用、Istanbulと同等の精度）
  - モノレポではルートレベルで`vitest.config.ts`を設定し、`vitest.workspace.ts`でパッケージを指定
  - `coverage.include`でソースファイルパターンを指定する必要がある（デフォルトはテストでインポートされたファイルのみ）
  - `coverage.exclude`で除外パターンを指定可能
  - 初期段階では閾値なしでレポートのみ取得、後で閾値を設定可能
- **Implications**: 
  - ルートレベルと各パッケージレベルでカバレッジ設定を追加
  - `@vitest/coverage-v8`パッケージをインストール
  - CIでカバレッジレポートを成果物として保存

### PlaywrightとCloudflare Workersの統合

- **Context**: 要件11, 12でE2Eテストの自動化とCI/CD統合が必要
- **Sources Consulted**: 
  - https://playwright.dev/docs/intro
  - https://playwright.dev/docs/test-configuration
  - https://developers.cloudflare.com/browser-rendering/playwright/
- **Findings**: 
  - Cloudflareは`@cloudflare/playwright`という特別なフォークを提供しているが、これはWorkers内でPlaywrightを実行するためのもの
  - 通常の`@playwright/test`を使用してプレビュー環境に対してE2Eテストを実行可能
  - TypeScriptをネイティブサポート、モノレポでは`projects`機能で複数プロジェクトを管理
  - ヘッドレスモードでCI実行、UIモードまたはヘッドフルモードでローカル実行
  - スクリーンショット、動画、トレースファイルを自動保存可能
- **Implications**: 
  - 標準の`@playwright/test`を使用してプレビュー環境でE2Eテストを実行
  - `playwright.config.ts`でプロジェクト設定、タイムアウト、リトライを設定
  - CIではヘッドレスモード、ローカルではUIモードをサポート

### D1ローカルバインディングのCI設定

- **Context**: 要件4で統合テストにD1ローカルバインディングが必要
- **Sources Consulted**: 
  - https://developers.cloudflare.com/d1/best-practices/local-development
  - https://developers.cloudflare.com/d1/wrangler-commands/
- **Findings**: 
  - `wrangler d1 execute --local`でローカルD1データベースにSQLを実行可能
  - CIでも同じコマンドを使用してテスト実行前にマイグレーション適用とテストデータ投入が可能
  - ローカルデータは`.wrangler/state`フォルダに保存され、本番データに影響しない
  - Miniflareを使用した統合テストも可能（オプション）
- **Implications**: 
  - CIワークフローで`wrangler d1 execute --local`を使用してマイグレーション適用
  - 各統合テスト前にデータベースをリセットし、必要なテストデータのみ投入
  - テストの独立性を保証するためのヘルパー関数が必要

### テストユーティリティの設計パターン

- **Context**: 要件8でテストデータとモックの管理が必要
- **Sources Consulted**: 
  - 既存コードベースのモックパターン分析
  - https://vitest.dev/guide/mocking.html
- **Findings**: 
  - 既存のテストファイルに`createMockD1`、`createMockD1ForAiUsage`などのモック関数が分散している
  - テストデータは各テストファイル内にインラインで定義されている
  - 共通のテストユーティリティが未整備
- **Implications**: 
  - `tests/utils/`ディレクトリに共通モック関数を集約
  - `tests/fixtures/`ディレクトリにテストデータファクトリを集約
  - 既存のモック関数を共通ユーティリティに移行

### E2Eテストのプレビュー環境統合

- **Context**: 要件12でmainブランチマージ後のプレビュー環境でE2Eテスト実行が必要
- **Sources Consulted**: 
  - GitHub Actionsのworkflow設定パターン
  - Cloudflare Workersのデプロイメントフロー
- **Findings**: 
  - GitHub Actionsで`wrangler deploy --env preview`後にE2Eテストを実行
  - デプロイ完了の確認には`wrangler deployments list`またはヘルスチェックエンドポイントを使用可能
  - E2Eテストのタイムアウトは30分がデフォルト推奨
  - リトライ機能はPlaywrightの`retries`設定で実現可能
- **Implications**: 
  - CIワークフローでプレビュー環境デプロイ後にE2Eテストジョブを実行
  - デプロイ完了を待機するステップを追加
  - 失敗時のスクリーンショット、動画、トレースファイルを成果物として保存

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Co-located Tests | テストファイルを対象ファイルと同階層に配置 | 既存パターンと整合、発見しやすい | テストユーティリティが分散 | 既存パターンを維持 |
| Centralized Test Utils | 共通テストユーティリティを`tests/utils/`に集約 | 再利用性向上、保守性向上 | 既存テストのリファクタリングが必要 | 推奨アプローチ |
| Separate E2E Directory | E2Eテストを`e2e/`ディレクトリに配置 | Playwrightの推奨構成、明確な分離 | プロジェクトルートが複雑化 | Playwrightの推奨に従う |

## Design Decisions

### Decision: テストユーティリティの集約

- **Context**: 既存のモック関数とテストデータが分散しており、保守性が低い
- **Alternatives Considered**:
  1. 既存の分散パターンを維持 — 変更不要だが保守性が低い
  2. 共通ユーティリティを新規作成 — 既存テストのリファクタリングが必要
- **Selected Approach**: `tests/utils/`と`tests/fixtures/`ディレクトリを作成し、既存のモック関数を段階的に移行
- **Rationale**: テストの保守性と再利用性を向上させつつ、既存テストへの影響を最小化
- **Trade-offs**: 
  - メリット: テストの保守性向上、モック関数の再利用性向上
  - デメリット: 既存テストのリファクタリングが必要、移行期間中の二重管理
- **Follow-up**: 既存テストファイルを段階的に共通ユーティリティを使用するように更新

### Decision: E2Eテストの配置場所

- **Context**: Playwrightの推奨構成とプロジェクト構造のバランスを取る必要がある
- **Alternatives Considered**:
  1. プロジェクトルートに`e2e/`ディレクトリ — Playwrightの推奨構成
  2. `tests/e2e/`ディレクトリ — テスト関連ファイルを一元管理
- **Selected Approach**: プロジェクトルートに`e2e/`ディレクトリを作成（Playwrightの推奨に従う）
- **Rationale**: Playwrightの標準構成に従うことで、設定の複雑性を低減し、コミュニティのベストプラクティスに準拠
- **Trade-offs**: 
  - メリット: Playwrightの標準構成、設定が簡潔
  - デメリット: プロジェクトルートが複雑化
- **Follow-up**: `playwright.config.ts`で適切なプロジェクト設定を行う

### Decision: Vitestカバレッジプロバイダー

- **Context**: v8とistanbulの選択が必要
- **Alternatives Considered**:
  1. v8プロバイダー — デフォルト、高速、低メモリ使用
  2. istanbulプロバイダー — より広く使用されているが、実行速度が遅い
- **Selected Approach**: v8プロバイダーを使用（デフォルト）
- **Rationale**: Vitestのデフォルトで、高速かつ低メモリ使用、Istanbulと同等の精度
- **Trade-offs**: 
  - メリット: 高速実行、低メモリ使用、Istanbulと同等の精度
  - デメリット: V8エンジンが必要（Node.js環境では問題なし）
- **Follow-up**: `@vitest/coverage-v8`パッケージをインストール

## Risks & Mitigations

- **E2Eテストのプレビュー環境統合の複雑性** — デプロイ完了の検知とタイムアウト処理を適切に実装
- **D1統合テストの設定複雑性** — `wrangler d1 execute --local`の使用方法を文書化し、ヘルパースクリプトを作成
- **テストユーティリティの移行リスク** — 段階的に移行し、既存テストを壊さないよう注意
- **カバレッジ閾値の設定タイミング** — 初期は閾値なしでレポートのみ取得、プロジェクト成熟度に応じて閾値を設定

## References

- [Vitest Coverage Guide](https://vitest.dev/guide/coverage.html) — カバレッジ設定の詳細
- [Playwright Documentation](https://playwright.dev/docs/intro) — E2Eテストフレームワークの使用方法
- [Cloudflare D1 Local Development](https://developers.cloudflare.com/d1/best-practices/local-development) — D1ローカルバインディングの設定
- [Cloudflare Workers Testing](https://developers.cloudflare.com/workers/development-testing) — Workers環境でのテスト方法
