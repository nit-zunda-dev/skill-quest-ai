# Snykセキュリティスキャン設定手順

本ドキュメントでは、Skill Quest AIプロジェクトにSnykを導入し、SAST（Static Application Security Testing）とSCA（Software Composition Analysis）によるセキュリティスキャンを設定する手順を説明します。

## 概要

Snykは、以下のセキュリティチェックを提供します：

- **SAST（Static Application Security Testing）**: コード内の脆弱性を静的解析で検出
- **SCA（Software Composition Analysis）**: 依存関係パッケージの既知の脆弱性を検出

本プロジェクトでは、**Snyk IDE拡張機能**と**Snyk WebUI（ダッシュボード）**を使用してセキュリティスキャンを実施します。

## 前提条件

- インターネット接続
- GitHubアカウント（推奨）
- メールアドレス（Snykアカウント作成用）
- Cursor（またはVisual Studio Code）がインストールされていること

## 手順

### 1. Snykアカウントの作成

1. [Snyk公式サイト](https://snyk.io/)にアクセスします
2. 右上の「Sign Up」または「Get Started」ボタンをクリックします
3. GitHubアカウントでサインアップするか、メールアドレスでアカウントを作成します
   - **推奨**: GitHubアカウントでサインアップ（GitHubリポジトリとの連携が簡単になります）
4. メールアドレスに送信された確認メールを開き、アカウントを有効化します

### 2. Snyk IDE拡張機能のインストール

Cursor（またはVisual Studio Code）にSnyk拡張機能をインストールします。

#### Cursorでのインストール

1. Cursorを開きます
2. 左サイドバーの拡張機能アイコン（または `Ctrl+Shift+X`）をクリックします
3. 検索バーに「Snyk」と入力します
4. 「Snyk Security - Code, Open Source Dependencies」を選択します
5. 「Install」をクリックしてインストールします

#### Visual Studio Codeでのインストール

1. Visual Studio Codeを開きます
2. 左サイドバーの拡張機能アイコン（または `Ctrl+Shift+X`）をクリックします
3. 検索バーに「Snyk」と入力します
4. 「Snyk Security - Code, Open Source Dependencies」を選択します
5. 「Install」をクリックしてインストールします

### 3. Snyk IDE拡張機能の認証

1. Cursor（またはVisual Studio Code）で、プロジェクトを開きます
2. 左サイドバーにSnykアイコンが表示されます（インストール後、自動的に表示されます）
3. Snykアイコンをクリックします
4. 「Sign in to Snyk」をクリックします
5. ブラウザが開き、Snykアカウントへのログインを求められます
6. Snykアカウントでログインします
7. 認証が完了すると、Cursor（またはVisual Studio Code）に戻り、自動的にスキャンが開始されます

### 4. GitHubリポジトリとの連携（推奨）

Snyk WebUIでGitHubリポジトリを連携すると、自動的にスキャンが実行され、結果がダッシュボードに表示されます。

1. [Snykダッシュボード](https://app.snyk.io/)にログインします
2. 左メニューから「Integrations」を選択します
3. 「GitHub」を選択します
4. 「Connect GitHub」をクリックします
5. GitHubの認証画面で、連携するリポジトリへのアクセス権限を付与します
6. 連携が完了すると、自動的にリポジトリがスキャンされます

### 5. Snyk WebUIでのプロジェクト確認

1. [Snykダッシュボード](https://app.snyk.io/)にログインします
2. 左メニューから「Projects」を選択します
3. 連携したGitHubリポジトリ（`skill-quest-ai`）が表示されます
4. プロジェクトをクリックすると、検出された脆弱性の詳細が表示されます

## 使用方法

### Snyk IDE拡張機能の使用

#### 脆弱性の確認

1. Cursor（またはVisual Studio Code）でプロジェクトを開きます
2. 左サイドバーのSnykアイコンをクリックします
3. 以下の情報が表示されます：
   - **Security**: コード内の脆弱性（SAST）
   - **Open Source**: 依存関係パッケージの脆弱性（SCA）
   - **Code Quality**: コード品質の問題

#### 脆弱性の詳細確認

1. Snykパネルで脆弱性をクリックします
2. エディタ内で該当するコードがハイライト表示されます
3. 脆弱性の説明、影響範囲、修正方法が表示されます

#### 修正提案の確認

1. 脆弱性をクリックすると、「Fix suggestion」が表示されます
2. 修正方法を確認し、必要に応じてコードを修正します
3. 依存関係の脆弱性の場合は、パッケージのアップグレード方法が表示されます

### Snyk WebUIの使用

#### プロジェクトのスキャン結果確認

1. [Snykダッシュボード](https://app.snyk.io/)にログインします
2. 「Projects」からプロジェクトを選択します
3. 検出された脆弱性の一覧が表示されます
4. 各脆弱性について、以下の情報が表示されます：
   - **Severity**: 重大度（Critical、High、Medium、Low）
   - **Package**: 影響を受けるパッケージ
   - **Vulnerability**: 脆弱性の説明
   - **Fix**: 修正方法

#### 脆弱性の修正

1. 脆弱性をクリックして詳細を確認します
2. 「Fix this vulnerability」をクリックします
3. 修正方法が表示されます：
   - **Upgrade**: パッケージのアップグレード
   - **Patch**: セキュリティパッチの適用
   - **Ignore**: 脆弱性を無視（慎重に使用）

#### プロジェクト設定

1. プロジェクトの「Settings」タブを開きます
2. 以下の設定が可能です：
   - **Alert settings**: 脆弱性検出時の通知設定
   - **Ignore settings**: 除外ルールの管理
   - **Test frequency**: スキャンの実行頻度

## ベストプラクティス

1. **定期的な確認**: Snyk WebUIで定期的に脆弱性を確認します
2. **重大度の管理**: 重大度が「Critical」または「High」の脆弱性は即座に対応します
3. **IDE拡張機能の活用**: 開発中にリアルタイムで脆弱性を確認します
4. **依存関係の更新**: 定期的に依存関係を更新し、最新のセキュリティパッチを適用します
5. **除外ルールの慎重な使用**: 除外ルールは、正当な理由がある場合のみ使用します

## トラブルシューティング

### Snyk IDE拡張機能が動作しない場合

1. Cursor（またはVisual Studio Code）を再起動します
2. Snyk拡張機能が最新バージョンか確認します
3. 認証を再実行します（Snykパネルで「Sign in to Snyk」をクリック）

### プロジェクトが検出されない場合

1. Snyk WebUIでGitHubリポジトリが正しく連携されているか確認します
2. リポジトリのルートディレクトリに`package.json`が存在するか確認します
3. モノレポの場合は、各パッケージの`package.json`が正しく配置されているか確認します

### スキャン結果が更新されない場合

1. Snyk WebUIで手動スキャンを実行します（プロジェクトの「Re-test now」ボタン）
2. GitHubリポジトリへの変更が正しく反映されているか確認します

## 参考リンク

- [Snyk公式ドキュメント](https://docs.snyk.io/)
- [Snyk IDE拡張機能](https://docs.snyk.io/ide-tools/visual-studio-code-extension)
- [Snyk WebUI](https://app.snyk.io/)
- [GitHub統合](https://docs.snyk.io/integrations/git-repository-scm-integrations/github-integration)
