# Requirements Document

## Introduction

本要件定義は、`docs/architecture/11_テスト戦略.md` で定義されたテスト戦略を既存のコードベースに対して自動テストとして実現するための要件を定義します。モノレポ構成（apps/frontend, apps/backend, packages/shared）において、単体テスト（70-80%）、統合テスト（15-25%）、E2Eテスト（5-10%）のテストピラミッドを構築し、CI/CDパイプラインに統合します。E2EテストはPlaywrightを使用して自動化し、ユーザー操作と画面遷移を検証します。

## Requirements

### Requirement 1: 単体テストの実装とカバレッジ

**Objective:** As a 開発者, I want 既存のコードに対して単体テストを実装し、テストピラミッドの70-80%を占めるようにする, so that ビジネスロジック、ユーティリティ、スキーマ、ミドルウェアの振る舞いを確実に検証できる

#### Acceptance Criteria
1. When ビジネスロジック関数が実装されている場合, the Test Strategy Implementation shall 対応する単体テストファイル（`*.test.ts`）を作成する
2. When Zodスキーマが定義されている場合, the Test Strategy Implementation shall `parse` および `safeParse` のバリデーションテストを実装する
3. When ミドルウェア関数が存在する場合, the Test Strategy Implementation shall リクエスト/レスポンスの振る舞いを検証する単体テストを実装する
4. When ユーティリティ関数が存在する場合, the Test Strategy Implementation shall 入力と出力の関係を検証する単体テストを実装する
5. While テストを実行中, the Test Strategy Implementation shall 各テストが独立して実行可能であることを保証する（テスト間の依存関係を排除）
6. If テスト対象が外部依存（API、DB、Workers AI）を持つ場合, the Test Strategy Implementation shall モックまたはスタブを使用して外部依存を排除する

### Requirement 2: フロントエンドコンポーネントとフックのテスト

**Objective:** As a フロントエンド開発者, I want Reactコンポーネントとカスタムフックに対してテストを実装する, so that UIの振る舞いと状態管理ロジックを検証できる

#### Acceptance Criteria
1. When Reactコンポーネントが存在する場合, the Test Strategy Implementation shall `@testing-library/react` を使用したコンポーネント単体テストを実装する
2. When カスタムフック（`use*`）が存在する場合, the Test Strategy Implementation shall フックの振る舞いを検証するテストを実装する
3. When APIクライアント関数が存在する場合, the Test Strategy Implementation shall API呼び出しをモックし、クライアントの振る舞いを検証する
4. While コンポーネントテストを実行中, the Test Strategy Implementation shall `jsdom` 環境でDOM操作をシミュレートする
5. If コンポーネントが外部APIに依存する場合, the Test Strategy Implementation shall APIレスポンスをモックしてテストする

### Requirement 3: バックエンドルートハンドラとサービスのテスト

**Objective:** As a バックエンド開発者, I want ルートハンドラとサービス層に対してテストを実装する, so that APIエンドポイントの入力・出力とビジネスロジックを検証できる

#### Acceptance Criteria
1. When Honoルートハンドラが存在する場合, the Test Strategy Implementation shall リクエスト/レスポンスの検証を行う単体テストを実装する
2. When サービス層関数が存在する場合, the Test Strategy Implementation shall ビジネスロジックの振る舞いを検証する単体テストを実装する
3. When 認証が必要なエンドポイントが存在する場合, the Test Strategy Implementation shall 認証成功時と失敗時（401 Unauthorized）の両方を検証する
4. If Workers AIを使用するルートが存在する場合, the Test Strategy Implementation shall AIレスポンスをスタブしてテストする（`env.AI` が未定義の場合はスキップ）
5. While テストを実行中, the Test Strategy Implementation shall `node` 環境で実行する

### Requirement 4: 統合テストの実装

**Objective:** As a 開発者, I want API・DB・外部サービス境界を検証する統合テストを実装する, so that システム間の連携が正しく動作することを確認できる

#### Acceptance Criteria
1. When 認証フローが実装されている場合, the Test Strategy Implementation shall 認証の統合テスト（`*.integration.test.ts`）を実装する
2. When D1データベースを使用するエンドポイントが存在する場合, the Test Strategy Implementation shall ローカルD1バインディング（`wrangler d1 execute --local`）またはMiniflareを使用した統合テストを実装する
3. When クエストCRUD操作が存在する場合, the Test Strategy Implementation shall データベース操作を含む統合テストを実装する
4. While 統合テストを実行中, the Test Strategy Implementation shall 各テスト前にデータベースをリセットし、必要なテストデータのみを投入する
5. If AIエンドポイントの統合テストを実行する場合, the Test Strategy Implementation shall Workers AIをスタブして実行する（コストとレイテンシを避けるため）

### Requirement 5: 共有パッケージ（packages/shared）のテスト

**Objective:** As a 開発者, I want 共有パッケージの型定義とZodスキーマに対してテストを実装する, so that 型安全性とバリデーションロジックを検証できる

#### Acceptance Criteria
1. When Zodスキーマが `packages/shared` に定義されている場合, the Test Strategy Implementation shall 各スキーマの `parse` と `safeParse` のテストを実装する
2. When 型エクスポートが存在する場合, the Test Strategy Implementation shall 型定義が正しくエクスポートされることを検証する（型チェックで間接的に検証）
3. When バリデーションエラーが発生する場合, the Test Strategy Implementation shall エラーメッセージとエラーオブジェクトの構造を検証する

### Requirement 6: テストカバレッジの測定とレポート

**Objective:** As a 開発チーム, I want テストカバレッジを測定し、レポートを生成する, so that テストの網羅性を可視化し、改善点を特定できる

#### Acceptance Criteria
1. When テストを実行する場合, the Test Strategy Implementation shall Vitestのカバレッジ機能を使用してカバレッジレポートを生成する
2. When CIでテストを実行する場合, the Test Strategy Implementation shall カバレッジレポートを成果物として保存する
3. While プロジェクトの初期段階, the Test Strategy Implementation shall カバレッジ閾値は設定せず、レポートのみを取得する
4. If プロジェクトが成熟した場合, the Test Strategy Implementation shall 最低カバレッジライン（例: 60%）を設定できるようにする
5. When カバレッジレポートを生成する場合, the Test Strategy Implementation shall パッケージ単位（frontend, backend, shared）でカバレッジを測定する

### Requirement 7: CI/CDパイプラインへの統合

**Objective:** As a DevOpsエンジニア, I want テストをCI/CDパイプラインに統合する, so that PR作成時とmainブランチマージ時に自動的にテストが実行される

#### Acceptance Criteria
1. When PRが作成される場合, the CI/CD Pipeline shall Lint → 型チェック → ビルド → 単体テストの順序で実行する
2. When mainブランチにマージされる場合, the CI/CD Pipeline shall 全チェック（Lint、型チェック、ビルド、テスト）を実行する
3. While テストを実行中, the CI/CD Pipeline shall Turboにより依存関係のないパッケージを並列実行する
4. If テストが失敗する場合, the CI/CD Pipeline shall PRマージをブロックする
5. When テストが成功する場合, the CI/CD Pipeline shall カバレッジレポートを成果物としてアップロードする
6. When mainブランチへのPRが作成される場合, the CI/CD Pipeline shall プレビュー環境へのデプロイ完了後にE2Eテストを自動実行する
7. If E2Eテストが失敗する場合, the CI/CD Pipeline shall デプロイメントのロールバックまたは通知をトリガーする（オプション）

### Requirement 8: テストデータとモックの管理

**Objective:** As a 開発者, I want テストデータとモックを適切に管理する, so that テストの保守性と再現性を確保できる

#### Acceptance Criteria
1. When テストデータが必要な場合, the Test Strategy Implementation shall ファクトリ関数またはフィクスチャを使用してテストデータを生成する
2. When データベースを使用するテストを実行する場合, the Test Strategy Implementation shall 各テスト前にデータベースをリセットし、テストの独立性を保証する
3. When Workers AIをモックする場合, the Test Strategy Implementation shall 期待されるJSONレスポンス構造を模倣したスタブを実装する
4. When 認証をモックする場合, the Test Strategy Implementation shall テスト用トークンを生成し、認証が必要なエンドポイントのテストで使用する
5. While テストを実行中, the Test Strategy Implementation shall 外部サービス（Workers AI、D1本番環境）を呼び出さない

### Requirement 9: テスト実行環境の設定

**Objective:** As a 開発者, I want 各パッケージに適切なテスト実行環境を設定する, so that ローカル開発とCIの両方で一貫してテストを実行できる

#### Acceptance Criteria
1. When フロントエンドのテストを実行する場合, the Test Strategy Implementation shall `jsdom` 環境でDOM操作をシミュレートする
2. When バックエンドのテストを実行する場合, the Test Strategy Implementation shall `node` 環境で実行する
3. When テストをローカルで実行する場合, the Test Strategy Implementation shall ウォッチモード（`test:watch`）をサポートする
4. When テストをCIで実行する場合, the Test Strategy Implementation shall ヘッドレスモードで実行する
5. If Miniflareを使用する場合, the Test Strategy Implementation shall Workers環境のローカルエミュレーションを提供する（統合テスト用、オプション）
6. When E2Eテストを実行する場合, the Test Strategy Implementation shall Playwrightを使用してブラウザ環境で実行する
7. When E2EテストをCIで実行する場合, the Test Strategy Implementation shall Playwrightのヘッドレスモードで実行する
8. When E2Eテストをローカルで実行する場合, the Test Strategy Implementation shall UIモード（`--ui`）またはヘッドフルモードをサポートする

### Requirement 10: テストファイルの命名規則と配置

**Objective:** As a 開発者, I want テストファイルの命名規則と配置ルールを統一する, so that テストファイルを容易に発見し、保守できる

#### Acceptance Criteria
1. When 単体テストファイルを作成する場合, the Test Strategy Implementation shall `*.test.ts` または `*.test.tsx` の命名規則に従う
2. When 統合テストファイルを作成する場合, the Test Strategy Implementation shall `*.integration.test.ts` の命名規則に従う
3. When E2Eテストファイルを作成する場合, the Test Strategy Implementation shall `*.e2e.test.ts` の命名規則に従う
4. When テストファイルを配置する場合, the Test Strategy Implementation shall 対象ファイルと同階層に配置する（co-located pattern）
5. While テストファイルを管理する場合, the Test Strategy Implementation shall Vitestの設定（`vitest.config.ts`）で `include` パターンを定義する
6. When E2Eテストファイルを配置する場合, the Test Strategy Implementation shall `tests/e2e/` ディレクトリまたはプロジェクトルートの `e2e/` ディレクトリに配置する（Playwrightの推奨構成）

### Requirement 11: E2Eテストの自動化実装

**Objective:** As a QAエンジニア/開発者, I want Playwrightを使用してE2Eテストを自動化する, so that ユーザー操作と画面遷移を自動的に検証し、リグレッションを早期に発見できる

#### Acceptance Criteria
1. When E2Eテストフレームワークを導入する場合, the Test Strategy Implementation shall Playwrightをプロジェクトに追加する
2. When 認証フローをテストする場合, the Test Strategy Implementation shall ログインからログアウトまでの一連の操作を検証するE2Eテストを実装する
3. When クエスト操作をテストする場合, the Test Strategy Implementation shall クエストの作成、編集、完了、削除の操作を検証するE2Eテストを実装する
4. When AIチャット機能をテストする場合, the Test Strategy Implementation shall チャット入力からストリーミングレスポンス表示までの操作を検証するE2Eテストを実装する
5. When キャラクター生成フローをテストする場合, the Test Strategy Implementation shall サインアップからキャラクター生成完了までの操作を検証するE2Eテストを実装する
6. While E2Eテストを実行中, the Test Strategy Implementation shall 実際のブラウザ（Chromium、Firefox、WebKit）で実行する
7. If E2Eテストが失敗する場合, the Test Strategy Implementation shall スクリーンショットと動画を保存してデバッグを支援する
8. When E2Eテストを実行する場合, the Test Strategy Implementation shall テスト前にテストデータをセットアップし、テスト後にクリーンアップする
9. When 複数のE2Eテストを実行する場合, the Test Strategy Implementation shall テスト間で状態を共有せず、各テストが独立して実行できるようにする
10. If Workers AIを使用する機能をE2Eテストする場合, the Test Strategy Implementation shall プレビュー環境またはスタブされたAIレスポンスを使用する（本番AIの呼び出しを避ける）

### Requirement 12: E2EテストのCI/CD統合

**Objective:** As a DevOpsエンジニア, I want E2EテストをCI/CDパイプラインに統合する, so that mainブランチへのPR時に自動的にE2Eテストが実行される

#### Acceptance Criteria
1. When mainブランチへのPRが作成される場合, the CI/CD Pipeline shall プレビュー環境へのデプロイ完了後にE2Eテストを実行する
2. When E2EテストをCIで実行する場合, the CI/CD Pipeline shall Playwrightのヘッドレスモードで実行する
3. When E2Eテストが失敗する場合, the CI/CD Pipeline shall スクリーンショット、動画、トレースファイルを成果物として保存する
4. If E2Eテストが失敗する場合, the CI/CD Pipeline shall 失敗を通知し、必要に応じてデプロイメントのロールバックを検討する（オプション）
5. While E2Eテストを実行中, the CI/CD Pipeline shall プレビュー環境が利用可能になるまで待機する（デプロイ完了の確認）
6. When E2Eテストを実行する場合, the CI/CD Pipeline shall テスト実行時間を記録し、タイムアウトを設定する（デフォルト: 30分）
7. If E2Eテストが不安定な場合, the CI/CD Pipeline shall リトライ機能を提供する（オプション、最大3回まで）

