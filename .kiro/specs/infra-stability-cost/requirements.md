# Requirements Document

## Project Description (Input)
フェーズ3: インフラ安定化とコスト管理。ユーザー増加に備えたインフラコストの管理と安定稼働の仕組みを整備する。主な対象: EP-31（AI利用量の可視化）、EP-32（フォールバック機能）、EP-33（セキュリティ強化）、EP-34（ヘルスチェックAPI）、EP-35（ログ構造化とAnalytics連携）、EP-44（ユーザー数可視化）。計画書: docs/planning/202603計画.md 参照。

---

## Introduction

本要件は、フェーズ3「インフラ安定化とコスト管理」の範囲を定義する。AI利用量の可視化・フォールバック、セキュリティ、ヘルスチェック、ログ・Analytics、ユーザー数可視化について、検証可能な要件として記述する。実装の詳細ではなく「何を満たすか」に焦点を当てる。

---

## Requirements

### 1. AI利用量の可視化（EP-31）

**Objective:** 運用者として、AI利用量（Neurons）を正確に計測しダッシュボードで確認できるようにしたい。コスト管理と無料枠の把握を可能にするため。

#### Acceptance Criteria
1. When Workers AI が呼び出される, the system shall 利用量（Neurons 相当）を計測し記録する。
2. The system shall 計測したAI利用量を集計可能な形で保持する（日次・ユーザー単位等、集計軸は設計で定義）。
3. Where ダッシュボードが提供される, the system shall 指定期間のAI利用量を表示する。
4. The system shall 利用量の計測ロジックを、実際の Workers AI 課金単位（Neurons）に整合させる。

---

### 2. フォールバック機能（EP-32）

**Objective:** 運用者として、無料枠上限到達時に自動でスタブ応答に切り替えたい。意図しない課金やサービス停止を防ぐため。

#### Acceptance Criteria
1. When 無料枠の上限に到達したと判定される, the system shall 以降のAI呼び出しをスタブ応答に切り替える。
2. The system shall フォールバック時に、ユーザーに対してスタブであることが分かる応答（またはエラーメッセージ）を返す。
3. If 無料枠上限に達している, the system shall 実際の Workers AI を呼び出さない。
4. The system shall 無料枠の判定条件（日次上限等）を設定可能にする（設定手段は設計で定義）。

---

### 3. セキュリティ強化（EP-33）

**Objective:** 運用者として、本番運用に耐えるCORS設定と機密情報の取り扱いを整備したい。不正アクセスと情報漏洩を防ぐため。

#### Acceptance Criteria
1. The system shall 本番環境で許可するオリジンを明示したCORS設定を適用する。
2. The system shall 環境変数およびAPIキー等の機密情報を、コードやクライアントに露出しない形で扱う。
3. Where 複数環境が存在する, the system shall 環境ごとに適切なCORS・機密の設定が可能である。
4. The system shall 機密情報の参照をランタイム（Bindings/環境変数）に限定し、リポジトリにハードコードしない。

---

### 4. ヘルスチェックと監視（EP-34）

**Objective:** 運用者として、APIの稼働状態を確認するエンドポイントと外形監視の受け口を用意したい。障害の早期検知のため。

#### Acceptance Criteria
1. The system shall `/api/health` エンドポイントを提供する。
2. When `/api/health` にリクエストされる, the system shall 稼働状態を示すレスポンス（例: 200 と簡易ステータス）を返す。
3. The system shall 外形監視ツールが HTTP で `/api/health` を叩けるようにする（認証要件は設計で定義）。
4. Where 依存リソース（D1等）の健全性を報告する, the system shall ヘルス応答にその結果を含め得る（オプション）。

---

### 5. ログ構造化とAnalytics連携（EP-35）

**Objective:** 運用者として、構造化ログとCloudflare Analyticsで障害追跡と利用傾向を把握したい。運用・改善のため。

#### Acceptance Criteria
1. The system shall 重要な操作・エラーについて構造化されたログを出力する（形式・フィールドは設計で定義）。
2. The system shall 構造化ログにより、障害発生時刻・リクエスト・ユーザー等の追跡が可能である。
3. Where Cloudflare Analytics を利用する, the system shall 必要な設定を行い、利用状況の把握を可能にする。
4. The system shall ログに機密情報（トークン、パスワード等）を含めない。

---

### 6. ユーザー数可視化（EP-44）

**Objective:** 運用者として、登録ユーザー数・アクティブユーザー数等を可視化したい。成長指標の把握のため。

#### Acceptance Criteria
1. The system shall 登録ユーザー数（総数）を集計・取得可能にする。
2. The system shall アクティブユーザー数（定義は設計で行う。例: 一定期間内にアクションしたユーザー）を集計・取得可能にする。
3. Where ダッシュボードが提供される, the system shall 上記指標を表示する。
4. The system shall 集計結果の取得を、認可された運用者または内部APIに限定する。
