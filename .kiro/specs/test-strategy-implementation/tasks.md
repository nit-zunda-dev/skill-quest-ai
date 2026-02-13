# Implementation Plan

## Task Format Template

Use whichever pattern fits the work breakdown:

### Major task only
- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}} *(Include details only when needed. If the task stands alone, omit bullet items.)*
  - _Requirements: {{REQUIREMENT_IDS}}_

### Major + Sub-task structure
- [ ] {{MAJOR_NUMBER}}. {{MAJOR_TASK_SUMMARY}}
- [ ] {{MAJOR_NUMBER}}.{{SUB_NUMBER}} {{SUB_TASK_DESCRIPTION}}{{SUB_PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - {{DETAIL_ITEM_2}}
  - _Requirements: {{REQUIREMENT_IDS}}_ *(IDs only; do not add descriptions or parentheses.)*

> **Parallel marker**: Append ` (P)` only to tasks that can be executed in parallel. Omit the marker when running in `--sequential` mode.
>
> **Optional test coverage**: When a sub-task is deferrable test work tied to acceptance criteria, mark the checkbox as `- [ ]*` and explain the referenced requirements in the detail bullets.

---

- [ ] 1. テストユーティリティとフィクスチャの整備
- [x] 1.1 (P) 共通テストユーティリティディレクトリの作成
  - `tests/utils/`ディレクトリを作成
  - 既存のモック関数（`createMockD1`、`createMockD1ForAiUsage`など）を共通ユーティリティに移行
  - D1データベースのモック関数を`tests/utils/mock-d1.ts`に集約
  - Workers AIのスタブ関数を`tests/utils/mock-ai.ts`に実装
  - 認証のモック関数を`tests/utils/mock-auth.ts`に実装
  - APIクライアントのモック関数を`tests/utils/mock-api.ts`に実装
  - _Requirements: 1.6, 2.3, 2.5, 3.4, 4.5, 8.3, 8.4_

- [x] 1.2 (P) テストデータファクトリの作成
  - `tests/fixtures/`ディレクトリを作成
  - テストユーザーのファクトリ関数を実装
  - テストクエストのファクトリ関数を実装
  - テストキャラクタープロフィールのファクトリ関数を実装
  - テストグリモワールエントリのファクトリ関数を実装
  - ファクトリ関数が型安全であることを確認
  - _Requirements: 8.1_

- [ ] 2. カバレッジ設定の追加
- [x] 2.1 Vitestカバレッジプロバイダーのインストールと設定
  - `@vitest/coverage-v8`パッケージをルートレベルにインストール
  - 各パッケージ（frontend, backend, shared）の`vitest.config.ts`にカバレッジ設定を追加
  - v8プロバイダーを使用するように設定
  - `coverage.include`でソースファイルパターンを指定
  - `coverage.exclude`で除外パターンを指定（必要に応じて）
  - 初期段階では閾値なしでレポートのみ取得する設定
  - _Requirements: 6.1, 6.3, 6.5_

- [x] 2.2 CIでのカバレッジレポート生成とアップロード
  - `.github/workflows/check.yml`にカバレッジレポート生成ステップを追加
  - `--coverage`フラグを使用してテスト実行時にカバレッジを収集
  - カバレッジレポートを成果物としてアップロードする設定を追加
  - パッケージ単位でカバレッジを測定できることを確認
  - _Requirements: 6.2, 7.5_

- [ ] 3. 共有パッケージのテスト実装
- [x] 3.1 (P) packages/sharedにVitest設定を追加
  - `packages/shared/vitest.config.ts`を作成
  - node環境で実行するように設定
  - `*.test.ts`ファイルを対象とする設定を追加
  - `package.json`に`test`スクリプトを追加
  - _Requirements: 5.2, 9.2, 10.1, 10.5_

- [x] 3.2 (P) Zodスキーマのバリデーションテストを実装
  - `packages/shared/src/schemas.test.ts`を作成
  - 各スキーマ（`createQuestSchema`、`updateQuestSchema`、`genesisFormDataSchema`など）の`parse`テストを実装
  - 各スキーマの`safeParse`テストを実装
  - バリデーションエラー時のエラーメッセージとエラーオブジェクトの構造を検証するテストを実装
  - 正常系と異常系の両方をテスト
  - _Requirements: 1.2, 5.1, 5.3_

- [ ] 4. 単体テストの拡充
- [x] 4.1 (P) 未テストのビジネスロジック関数のテストを追加
  - 既存のコードベースを分析し、未テストのビジネスロジック関数を特定
  - 各関数に対して単体テストファイル（`*.test.ts`）を作成
  - 入力と出力の関係を検証するテストを実装
  - 外部依存がある場合はモックを使用
  - テストの独立性を保証
  - _Requirements: 1.1, 1.4, 1.5, 1.6_

- [x] 4.2 (P) 未テストのミドルウェア関数のテストを追加
  - 既存のミドルウェア関数を分析し、未テストのものを特定
  - 各ミドルウェアに対して単体テストファイルを作成
  - リクエスト/レスポンスの振る舞いを検証するテストを実装
  - 認証ミドルウェアの場合は成功時と失敗時（401 Unauthorized）の両方をテスト
  - _Requirements: 1.3, 3.3_

- [x] 4.3 (P) 未テストのReactコンポーネントのテストを追加
  - 既存のコンポーネントを分析し、未テストのものを特定
  - `@testing-library/react`を使用したコンポーネント単体テストを実装
  - UIの振る舞いを検証するテストを追加
  - 外部APIに依存する場合はAPIレスポンスをモック
  - jsdom環境でDOM操作をシミュレート
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 4.4 (P) 未テストのカスタムフックのテストを追加
  - 既存のカスタムフック（`use*`）を分析し、未テストのものを特定
  - 各フックの振る舞いを検証するテストを実装
  - APIクライアントを使用する場合はモックを利用
  - _Requirements: 2.2, 2.3_

- [x] 4.5 (P) 未テストのバックエンドルートハンドラのテストを追加
  - 既存のルートハンドラを分析し、未テストのものを特定
  - Honoルートハンドラのリクエスト/レスポンス検証を行う単体テストを実装
  - Workers AIを使用するルートはAIレスポンスをスタブしてテスト
  - `env.AI`が未定義の場合はスキップする条件を追加
  - node環境で実行
  - _Requirements: 3.1, 3.4, 3.5_

- [x] 4.6 (P) 未テストのサービス層関数のテストを追加
  - 既存のサービス層関数を分析し、未テストのものを特定
  - ビジネスロジックの振る舞いを検証する単体テストを実装
  - 外部依存がある場合はモックを使用
  - AI Gateway ID経由の呼び出しテストを追加（`createAiService`, `runWithLlama31_8b`, `runWithLlama33_70b`, `generateCharacter`, `generateNarrative`, `generatePartnerMessage`, `generateGrimoire`）
  - _Requirements: 3.2_

- [ ] 5. 統合テストの実装
- [x] 5.1 D1ローカルバインディングの設定とヘルパー関数の実装
  - D1ローカルバインディングを使用した統合テスト環境を設定
  - テスト実行前にデータベースをリセットするヘルパー関数を実装
  - マイグレーション適用のヘルパー関数を実装
  - テストデータ投入のヘルパー関数を実装
  - `wrangler d1 execute --local`を使用する設定を確認
  - _Requirements: 4.2, 4.4, 8.2_

- [x] 5.2 (P) 認証フローの統合テストを実装
  - `apps/backend/src/routes/auth.integration.test.ts`を作成
  - ログインからログアウトまでの一連の操作を検証する統合テストを実装
  - D1データベースを使用した認証フローのテスト
  - テスト前にデータベースをリセット
  - _Requirements: 4.1, 4.4_

- [x] 5.3 (P) クエストCRUD操作の統合テストを実装
  - `apps/backend/src/routes/quests.integration.test.ts`を作成
  - クエストの作成、取得、更新、削除の統合テストを実装
  - D1データベース操作を含むテスト
  - テスト前にデータベースをリセットし、必要なテストデータのみを投入
  - _Requirements: 4.3, 4.4_

- [x] 5.4 (P) AIエンドポイントの統合テストを実装
  - AIエンドポイントの統合テストファイルを作成
  - Workers AIをスタブして実行する統合テストを実装
  - コストとレイテンシを避けるため、本番AIを呼び出さない
  - _Requirements: 4.5_

- [ ] 6. E2Eテストの導入
- [x] 6.1 Playwrightのインストールと基本設定
  - `@playwright/test`パッケージをルートレベルにインストール
  - `playwright.config.ts`をプロジェクトルートに作成
  - Chromium、Firefox、WebKitの3つのブラウザプロジェクトを設定
  - ヘッドレスモード（CI用）とUIモード（ローカル用）の設定を追加
  - タイムアウト設定（デフォルト: 30分）を追加
  - リトライ設定（最大3回）を追加
  - スクリーンショット、動画、トレースファイルの保存設定を追加
  - _Requirements: 9.6, 9.7, 9.8, 11.1, 12.2, 12.6, 12.7_

- [x] 6.2 E2Eテストディレクトリの作成とテストデータセットアップ
  - プロジェクトルートに`e2e/`ディレクトリを作成
  - E2Eテスト用のテストデータセットアップ関数を実装
  - テスト実行前のデータセットアップとテスト後のクリーンアップ関数を実装
  - テスト間で状態を共有しないようにする設定を確認
  - _Requirements: 10.6, 11.8, 11.9_

- [x] 6.3 (P) 認証フローのE2Eテストを実装
  - `e2e/auth.e2e.test.ts`を作成
  - ログインからログアウトまでの一連の操作を検証するE2Eテストを実装
  - プレビュー環境またはスタブされたAIレスポンスを使用
  - スクリーンショットと動画を保存する設定を確認
  - _Requirements: 11.2, 11.6, 11.7, 11.10_

- [x] 6.4 (P) クエスト操作のE2Eテストを実装
  - `e2e/quests.e2e.test.ts`を作成
  - クエストの作成、編集、完了、削除の操作を検証するE2Eテストを実装
  - プレビュー環境で実行
  - _Requirements: 11.3, 11.6, 11.7_

- [ ] 6.5 (P) AIチャット機能のE2Eテストを実装
  - `e2e/chat.e2e.test.ts`を作成
  - チャット入力からストリーミングレスポンス表示までの操作を検証するE2Eテストを実装
  - プレビュー環境またはスタブされたAIレスポンスを使用
  - _Requirements: 11.4, 11.6, 11.7, 11.10_

- [ ] 6.6 (P) キャラクター生成フローのE2Eテストを実装
  - `e2e/genesis.e2e.test.ts`を作成
  - サインアップからキャラクター生成完了までの操作を検証するE2Eテストを実装
  - プレビュー環境またはスタブされたAIレスポンスを使用
  - _Requirements: 11.5, 11.6, 11.7, 11.10_

- [ ] 7. CI/CDパイプラインへの統合
- [ ] 7.1 既存CIワークフローの確認と拡張
  - `.github/workflows/check.yml`の現在の設定を確認
  - Lint → 型チェック → ビルド → 単体テストの順序が正しいことを確認
  - Turboによる並列実行が機能していることを確認
  - テスト失敗時にPRマージがブロックされることを確認
  - _Requirements: 7.1, 7.3, 7.4_

- [ ] 7.2 mainブランチマージ時のテスト実行設定
  - mainブランチへのマージ時に全チェック（Lint、型チェック、ビルド、テスト）が実行されることを確認
  - 既存のワークフロー設定を確認し、必要に応じて調整
  - _Requirements: 7.2_

- [ ] 7.3 E2EテストのCI統合
  - `.github/workflows/check.yml`にE2Eテストステップを追加
  - mainブランチへのPR時にE2Eテストを実行する条件を追加
  - プレビュー環境へのデプロイ完了を待機するステップを追加
  - デプロイ完了の確認方法を実装（ヘルスチェックエンドポイントまたは`wrangler deployments list`）
  - Playwrightのヘッドレスモードで実行する設定を追加
  - E2Eテスト失敗時にスクリーンショット、動画、トレースファイルを成果物として保存
  - タイムアウト設定（30分）を追加
  - リトライ機能（最大3回）を追加（オプション）
  - E2Eテスト失敗時の通知設定を追加（オプション）
  - _Requirements: 7.6, 7.7, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 8. テスト実行環境の最終確認
- [ ] 8.1 フロントエンドテスト環境の確認
  - `apps/frontend/vitest.config.ts`でjsdom環境が設定されていることを確認
  - ウォッチモード（`test:watch`）が機能することを確認
  - CIでヘッドレスモードで実行されることを確認
  - _Requirements: 9.1, 9.3, 9.4_

- [ ] 8.2 バックエンドテスト環境の確認
  - `apps/backend/vitest.config.ts`でnode環境が設定されていることを確認
  - ウォッチモードが機能することを確認
  - CIでヘッドレスモードで実行されることを確認
  - _Requirements: 9.2, 9.3, 9.4_

- [ ] 8.3 E2Eテスト環境の確認
  - Playwrightの設定でブラウザ環境（Chromium、Firefox、WebKit）が正しく設定されていることを確認
  - ローカルでUIモード（`--ui`）またはヘッドフルモードが機能することを確認
  - CIでヘッドレスモードで実行されることを確認
  - _Requirements: 9.6, 9.7, 9.8_

- [ ] 8.4 Miniflare設定の確認（オプション）
  - 統合テストでMiniflareを使用する場合の設定を確認
  - Workers環境のローカルエミュレーションが機能することを確認
  - _Requirements: 9.5_

- [ ] 9. テストファイルの命名規則と配置の確認
- [ ] 9.1 テストファイル命名規則の確認
  - 単体テスト: `*.test.ts`または`*.test.tsx`の命名規則に従っていることを確認
  - 統合テスト: `*.integration.test.ts`の命名規則に従っていることを確認
  - E2Eテスト: `*.e2e.test.ts`の命名規則に従っていることを確認
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 9.2 テストファイル配置の確認
  - Co-located pattern（対象ファイルと同階層）に従っていることを確認
  - E2Eテストファイルが`e2e/`ディレクトリに配置されていることを確認
  - Vitestの設定で`include`パターンが正しく定義されていることを確認
  - _Requirements: 10.4, 10.5, 10.6_

- [ ] 10. 既存テストのリファクタリング（段階的）
- [ ] 10.1 既存テストファイルで共通ユーティリティを使用するように更新
  - 既存のテストファイルを分析し、共通ユーティリティを使用できる箇所を特定
  - 段階的に既存のモック関数を共通ユーティリティに置き換え
  - テストの動作が変わらないことを確認
  - _Requirements: 8.3, 8.4_

- [ ] 10.2 既存テストファイルでテストデータファクトリを使用するように更新
  - 既存のテストファイルでインライン定義されているテストデータをファクトリ関数に置き換え
  - テストの意図が明確になるようにリファクタリング
  - テストの動作が変わらないことを確認
  - _Requirements: 8.1_
