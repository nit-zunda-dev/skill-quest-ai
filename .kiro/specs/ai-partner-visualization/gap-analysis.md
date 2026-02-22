# Gap Analysis: ai-partner-visualization

## 1. Current State Investigation

### 1.1 ドメイン関連アセット

| 種別 | 現状 | 備考 |
|------|------|------|
| **パートナーUI** | `PartnerPage.tsx`, `PartnerWidget.tsx` が存在 | チャットのみ。パートナー画像・アバター・表情表示は未実装 |
| **画像参照** | フロントエンドに `/images/partner` または `partner` 画像の参照なし | 静的アセットの `<img>` 利用は LandingPage の backgroundImage 程度 |
| **バリアント・表情** | 概念がコードに存在しない | `variant` は UI の button variant 等にのみ使用。パートナー用の型・定数なし |
| **アセット配置** | 仕様上のパス `public/images/partner/<variant>/` | 既存コードからは未参照。アセット実体は別管理またはこれから配置の想定 |

**主要ファイル・レイアウト**

- `apps/frontend/src/pages/PartnerPage.tsx` — フルページのパートナーチャット（テキストのみ）
- `apps/frontend/src/components/PartnerWidget.tsx` — 浮動チャットウィジェット（開閉ボタンは MessageCircle / X アイコンのみ）
- `apps/frontend/src/lib/api-client.ts` — `generatePartnerMessage`（progressSummary, timeOfDay, currentTaskTitle, context を送信）
- `packages/shared` — `partnerMessageRequestSchema` / `PartnerMessageRequest` あり。パートナー「見た目」用のスキーマ・型なし
- `apps/frontend/src/contexts/ProfileContext.tsx` — `CharacterProfile` を保持。プロフィールにパートナーバリアント用フィールドなし
- `packages/shared/src/types.ts` — `CharacterProfile` に name, className, title, prologue, themeColor, level, xp, gold, goal のみ。`partnerVariant` 等なし
- `packages/shared/src/schemas.ts` — `updateProfileSchema` は name, themeColor のみ。バリアント保存の拡張なし

### 1.2  conventions

- **命名**: コンポーネント PascalCase、フック `use*`、パスは `@/` で `src/` 参照。
- **レイヤー**: ページ → コンポーネント / フック / lib（api-client）。Context は Profile, Genesis 等で利用。
- **静的アセット**: Vite の `public/` 配下はルート相対で参照（`/images/...`）。現状、パートナー画像用の利用パターンはコードベースにない。
- **テスト**: 対象と同階層に `*.test.ts(x)`。PartnerWidget にテストあり（表示・送信・エラー等）。画像表示のテストなし。

### 1.3 統合ポイント

- **データモデル**: バックエンドのプロフィール取得・更新 API と `CharacterProfile`。ここに `partnerVariant` を追加するか、フロントのみの設定（localStorage 等）にするかは未決定。
- **API**: パートナーは `generate-partner-message` のみ。画像配信は静的ファイル想定で API 不要。
- **文脈の供給元**: `generatePartnerMessage` に渡している `progressSummary`, `currentTaskTitle` 等は、表情切り替えの「文脈」として流用可能。一方、タスク完了直後のナラティブ結果（`QuestBoardPage` の `narrativeResult`）は現状パートナー表示に渡しておらず、表情「喜び」との連携は未実装。

---

## 2. Requirements Feasibility Analysis

### 2.1 要件ごとの技術ニーズとギャップ

| Req | 技術ニーズ | 現状 | ギャップ | タグ |
|-----|------------|------|----------|------|
| **1. アセット配置・参照** | パス定数、variant 型、`/images/partner/<variant>/<file>.png` の組み立て | 参照コードなし | パス組み立てロジック・定数・型の追加 | Missing |
| **2. 立ち絵・表情表示** | 画像表示コンポーネント、アスペクト比・レイアウト、透過合成 | パートナー画像表示なし | 表示コンポーネントの新規作成、配置場所の決定 | Missing |
| **3. 表情の文脈切り替え** | 文脈→表情のマッピング、状態管理、ナラティブ/チャットとの連携 | 文脈は API に渡しているが表情に未連携 | 文脈の定義（通常/応援/喜び/困り）、切り替えロジック、必要に応じた画面間の状態共有 | Missing |
| **4. ペルソナUI/UX** | 責めない・ゲーム感・親しみやすさを満たすレイアウト・コピー・ビジュアル一貫性 | チャットUIのトーンはあるがビジュアル方針の明文化なし | デザイン判断・コンポーネント配置・文言の見直し | Missing / Constraint |
| **5. バリアント選択** | バリアントの決定（デフォルト/ユーザー選択）、永続化の有無 | プロフィールに項目なし、設定UIなし | 永続化先の決定（プロフィールAPI vs フロントのみ）と実装 | Missing |
| **6. 欠損・エラー時** | 画像 onError、フォールバック表示、バリアント不在時の代替 | 画像表示がないためフォールバック未実装 | フォールバック方針と実装（プレースホルダー/テキストのみ/非表示） | Missing |

### 2.2 制約・不明点

- **永続化**: パートナーバリアントをユーザー設定として保存する場合、`CharacterProfile` および `updateProfileSchema` の拡張とバックエンドのプロフィール保存API・DB スキーマの変更が必要。設計フェーズで「プロフィールに含めるか / フロントのみか」を決定する必要あり。
- **文脈の境界**: 「励まし・応援」「喜び」「心配」をどこで判定するか（チャットAPIの応答メタデータ、フロントの画面状態、タスク完了フロー等）。Research Needed。
- **表示箇所**: パートナー画像を「パートナー専用ページのみ」「ウィジェットにも」「ダッシュボード/クエストボード等にも」のどれで表示するか。要件では「パートナーが表示される画面」とあるため、設計で一覧化する。Constraint。

### 2.3 複雑さのシグナル

- **ワークフロー**: 文脈に応じた表情切り替えは、画面・API・状態の複数ソースを扱うため中程度の複雑さ。
- **外部連携**: 静的アセットのみで、新規APIは不要。低。
- **既存変更**: PartnerPage / PartnerWidget の拡張または新コンポーネントの挿入。Profile/API 拡張はオプション。中程度。

---

## 3. Implementation Approach Options

### Option A: 既存コンポーネントの拡張

**概要**: `PartnerPage` と `PartnerWidget` の内部に、パートナー画像表示と表情切り替えを直接追加する。

- **変更対象**: `PartnerPage.tsx`, `PartnerWidget.tsx`。必要に応じ `useChat` や api-client に渡す context を拡張。
- **メリット**: 新ファイルを増やさず、既存のパートナー画面にそのまま載せられる。
- **デメリット**: 両方に同じ表示・パス組み立て・フォールバック邏輯が重複する。画像表示・表情ロジックがページ/ウィジェットに埋まり、単一責任が崩れやすい。
- **適合度**: 小規模なら可。表情マッピング・バリアント・フォールバックを共通化するなら、共通モジュールを切る必要があり、実質 Option C に近づく。

**Trade-offs**: ✅ 変更箇所が少ない ✅ 既存パターンに乗る / ❌ 重複 ❌ 肥大化しやすい

---

### Option B: 新規コンポーネントの作成

**概要**: パートナー画像表示専用のコンポーネント（例: `PartnerAvatar` または `PartnerVisual`）と、パス組み立て・表情名定数用のユーティリティ/定数ファイルを新規作成。PartnerPage / PartnerWidget はそれらを利用するだけにする。

- **新規**: 例) `components/PartnerAvatar.tsx`（または `PartnerVisual.tsx`）、`lib/partner-assets.ts`（パス組み立て・表情型・フォールバック）。
- **既存との接続**: PartnerPage / PartnerWidget で `<PartnerAvatar variant={...} expression={...} />` をレンダー。表情は props または Context で渡す。
- **責任境界**: 画像表示・アスペクト比・onError フォールバックは PartnerAvatar、バリアント・表情の「決定」は呼び出し側または専用フック（例: `usePartnerExpression`）で行う。
- **メリット**: 表示ロジックが一箇所にまとまり、テスト・仕様変更がしやすい。パートナー画像以外の画面（例: クエスト完了モーダル）からも再利用可能。
- **デメリット**: ファイル数・インターフェース設計が増える。

**Trade-offs**: ✅ 責務分離 ✅ テストしやすい ✅ 再利用 / ❌ ファイル増 ❌ インターフェース設計が必要

---

### Option C: ハイブリッド（推奨の方向性）

**概要**: 「表示」は新規コンポーネント＋アセット用ユーティリティ、「配置・文脈」は既存ページ/ウィジェットの拡張。

- **新規**:  
  - パートナー画像表示コンポーネント（上記と同様）。  
  - パス・表情名の定数/型（`partner-assets.ts` 等）。  
  - 文脈→表情のマッピング（フックまたは小さなモジュール）。  
  - （必要なら）バリアント選択用の設定UI・永続化。
- **拡張**:  
  - `PartnerPage` / `PartnerWidget`: 上記コンポーネントを組み込み、表示位置・レイアウトをペルソナに合わせて調整。  
  - タスク完了フロー（`QuestBoardPage` の narrativeResult）から「喜び」表情に繋げる場合は、状態の受け渡しまたは共有コンテキストの検討。  
  - バリアントをプロフィールに載せる場合は、`CharacterProfile`・`updateProfileSchema`・API・DB の拡張。
- **段階**:  
  - Phase 1: パス組み立て＋表示コンポーネント＋フォールバック。固定バリアント・固定表情で表示できるようにする。  
  - Phase 2: 文脈に応じた表情切り替え（通常/応援/喜び/困り）の接続。  
  - Phase 3: バリアント選択と永続化（必要に応じて）。

**Trade-offs**: ✅ 責務分離と既存画面の活用の両立 ✅ 段階リリース可能 / ❌ 設計・調整がやや増える

---

## 4. Requirement-to-Asset Map（ギャップタグ付き）

| 要件 | 必要なアセット/変更 | ギャップ | タグ |
|------|---------------------|----------|------|
| 1. アセット配置・参照 | パス定数、variant 型、組み立て関数 | 未実装 | Missing |
| 2. 立ち絵・表情表示 | PartnerAvatar（または同等）コンポーネント、レイアウト | 未実装 | Missing |
| 3. 表情の文脈切り替え | 文脈→表情マッピング、状態/コンテキスト、narrativeResult 等との接続 | 未実装 | Missing |
| 4. ペルソナUI/UX | レイアウト・コピー・デザイン方針の明文化と実装 | 一部のみ（チャットトーン） | Missing / Constraint |
| 5. バリアント選択 | 永続化先の決定、プロフィール or フロントのみ、設定UI | 未実装 | Missing |
| 6. 欠損・エラー時 | 画像 onError、フォールバック表示、バリアント不在時の代替 | 未実装 | Missing |

**Research Needed**

- 文脈（通常/応援/喜び/困り）を「どこで・どの情報で」判定するかの統一ルール（API メタデータ vs 画面状態 vs ハイブリッド）。
- バリアント永続化をプロフィールに含める場合の、バックエンド・DB スキーマ・マイグレーションの影響範囲。

---

## 5. Implementation Complexity & Risk

| 項目 | 評価 | 理由（1行） |
|------|------|-------------|
| **Effort** | **M (3–7日)** | 新規表示コンポーネント・パス/表情の共通化・既存2画面への組み込み・文脈連携。バリアント永続化をプロフィールに含めると +1〜2日。 |
| **Risk** | **Medium** | 既存パターン（React, Vite public, Context）の範囲内。文脈判定の仕様が未確定な部分と、永続化先の決定が設計に影響。 |

---

## 6. Design Phase への推奨事項

- **推奨アプローチ**: **Option C（ハイブリッド）**。表示は新規コンポーネント＋アセット用ユーティリティに集約し、既存の PartnerPage / PartnerWidget はそれを利用する形で拡張する。
- **設計で決めること**:
  - パートナー画像を表示する画面の一覧（`/app/partner` のみか、ウィジェット・クエスト完了時等も含むか）。
  - バリアントの永続化先（プロフィールAPI拡張 vs localStorage 等のフロントのみ）。
  - 文脈→表情のマッピングルールと、入力ソース（チャット状態、タスク完了、ナラティブ結果等）。
  - フォールバックの具体的な表現（プレースホルダー画像 / アイコン / テキストのみ / 非表示のどれをどこで使うか）。
- **研究の引き継ぎ**:
  - 文脈判定の責務配置（API がメタデータを返すか、フロントで画面状態からだけ判定するか）。
  - プロフィールスキーマに `partnerVariant` を追加する場合の、バックエンド・マイグレーション・既存クライアントとの互換性。
