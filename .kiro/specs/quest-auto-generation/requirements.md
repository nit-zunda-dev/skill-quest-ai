# Requirements Document

## Project Description (Input)
目標入力から初期タスクをAIが提案するオンボーディング機能の実装したいです。

## Introduction

本機能は、ユーザーが入力した目標（例：「英語力を上げる」）をAIが分解し、実行可能な初期クエスト（タスク）として提案する。提案されたタスクをユーザーが確認・採否したうえで Quest Board に登録し、初回利用時のゼロ状態からの心理的ハードルを下げるオンボーディングを実現する。計画書 EP-22「クエスト自動生成機能」および「サンプルクエスト自動生成（目標→タスクリスト）」に相当する。

---

## Requirements

### 1. 目標入力と生成トリガー

**Objective:** As a 新規ユーザー, I want 目標を入力したタイミングで初期タスクの提案を促される, so that 何をすればよいか迷わずに冒険を始められる。

#### Acceptance Criteria
1. When ユーザーが Genesis フローで目標（goal）を入力し次へ進む（または Genesis 完了時）, the system shall その目標をクエスト自動生成の入力として利用可能にする。
2. Where クエスト自動生成機能が有効である, the system shall 目標に基づく初期タスク提案を開始するトリガー（例：Genesis 完了直後、または専用ボタン）を提供する。
3. When ユーザーがまだクエストを1件も持っていない状態で Quest Board を初めて表示する, the system shall 目標からタスクを生成する案内または CTA を表示する（オプション）。

---

### 2. AI による目標分解とタスク提案

**Objective:** As a ユーザー, I want AI が目標を具体的で実行可能なタスクに分解してくれる, so that 自分でタスクを考えずにすぐ取りかかれる。

#### Acceptance Criteria
1. When 目標がトリガーとして渡されたとき, the system shall その目標を AI に渡し、実行可能な初期タスク（タイトル・種別・難易度等）のリストを生成する。
2. The system shall 生成されるタスクが、既存の Quest Board のクエスト形式（title, type, difficulty 等）と整合した形で返却される。
3. When AI が目標からタスクを生成する, the system shall 妥当な件数（例：3〜7件程度）のタスクを提案する。
4. If 目標が空または極端に短い場合, the system shall 生成をスキップするか、エラーとして扱いユーザーに再入力を促す。

---

### 3. 提案タスクの確認と Quest Board への登録

**Objective:** As a ユーザー, I want 提案されたタスクを確認してから Quest Board に追加できる, so that 不要なタスクを省いたり編集したりできる。

#### Acceptance Criteria
1. When AI がタスクリストを返したとき, the system shall 提案タスク一覧をユーザーに表示する。
2. When ユーザーが提案タスクの一部または全てを「採用」する, the system shall 採用されたタスクを Quest Board 用のクエストとして登録する。
3. When ユーザーが提案を「却下」またはスキップする, the system shall いずれのタスクも Quest Board に追加せず、通常の空状態（または既存クエストのみ）を表示する。
4. Where 編集がサポートされる場合, the system shall 登録前にタスクのタイトル・種別・難易度等をユーザーが編集できるようにする（実装スコープで許容する場合）。

---

### 4. オンボーディングフローとの統合

**Objective:** As a プロダクトオーナー, I want 本機能が Genesis または初回利用フローに自然に組み込まれる, so that 離脱を減らし Quest Board の初回価値を高められる。

#### Acceptance Criteria
1. The system shall Genesis で入力された目標を、クエスト自動生成の入力として利用できる（同一セッションまたはプロフィール保存後の参照）。
2. When オンボーディング中にクエスト自動生成を実行する, the system shall 生成中であることを示すフィードバック（ローディング等）を表示する。
3. When 提案タスクの登録が完了したとき, the system shall Quest Board に遷移するか、Quest Board 上で新規タスクが表示される状態にする。

---

### 5. エラー処理と制約

**Objective:** As a ユーザー, I want AI 失敗時や不正入力時に分かりやすい feedback がある, so that 何をすればよいか分かる。

#### Acceptance Criteria
1. If AI の呼び出しが失敗した、またはタイムアウトした, the system shall ユーザーにエラーであることを伝え、再試行または後で再度試す案内を表示する。
2. If 目標がシステムの制約（文字数・ポリシー等）を満たさない, the system shall 生成を実行せず、入力の修正を促すメッセージを表示する。
3. While クエスト自動生成の API を呼び出している間, the system shall 既存のレート制限・AI 利用量ポリシーに従う。
