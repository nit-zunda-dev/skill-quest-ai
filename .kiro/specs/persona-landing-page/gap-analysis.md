# Gap Analysis: persona-landing-page

## 1. Current State Investigation

### 1.1 フロントエンド構成（apps/frontend）

| 項目 | 現状 |
|------|------|
| **ルーティング** | クライアントルーターなし。`App.tsx` が認証状態・Genesis 状態で分岐し、単一エントリで未認証時はログイン/サインアップ画面のみ表示。 |
| **未認証時の表示** | タイトル「Chronicle」＋ `LoginSignupForm` ＋ フッターのみ。ランディング用の説明的コンテンツ・ヒーロー・CTA は存在しない。 |
| **Tailwind CSS** | **CDN のみ**（`index.html` で `https://cdn.tailwindcss.com` を読み込み）。`tailwind.config.*` や PostCSS は未導入。 |
| **shadcn/ui** | **未導入**。`package.json` に `@radix-ui/*` や `class-variance-authority` 等はなく、`components/ui` も存在しない。 |
| **UI ライブラリ** | Lucide React、Recharts のみ。コンポーネントは自前の Tailwind ユーティリティクラスでスタイル。 |
| **既存の世界観** | `GenesisStep`（IntroStep）で「毎日の習慣をRPGに変えよう」等のコピーと、スレート/インディゴのダークテーマ・Cinzel/Zen Kaku Gothic のフォントが使われている。 |

### 1.2 関連アセット

- **エントリ**: `main.tsx` → `App.tsx`
- **認証**: `useAuth`（AuthProvider）、`auth-client`。未認証時は `App.tsx` 内で `LoginSignupForm` を表示。
- **コンポーネント配置**: `src/components/`（PascalCase、1ファイル1コンポーネント）。`@/` で `src` を参照。
- **スタイル**: `index.html` 内インラインスタイル（body 背景・フォント・スクロールバー）、`/index.css` を参照（存在確認は未実施）。Tailwind は CDN 経由のため JIT は有効だが、カスタムテーマ・プラグインは未使用。

### 1.3 統合ポイント

- **CTA 遷移先**: サインアップ/ログインは同一画面の `LoginSignupForm`（mode 切替）。別 URL のサインアップ専用ページは現状ない。ランディングの CTA は「この画面内でフォームを表示する」または「フォームへスクロール/表示切替」で実現可能。
- **認証フロー**: Better Auth を利用。ランディングから「始める」等の CTA → 既存 `LoginSignupForm` 表示（または表示領域の切替）で整合する。

---

## 2. Requirements Feasibility Analysis

### 2.1 Requirement-to-Asset Map

| Req | 技術ニーズ | 現状 | ギャップ |
|-----|-------------|------|----------|
| **1.1** Tailwind でレイアウト・ビジュアル | Tailwind 利用 | CDN のみで設定ファイルなし | **Constraint**: shadcn 導入時は npm + PostCSS + `tailwind.config` が一般的に必要。CDN のままでもランディング単体のスタイルは実装可能だが、1.2 と併せると npm Tailwind への移行が望ましい。 |
| **1.2** 再利用 UI は shadcn/ui または準拠 | ボタン・カード等の共通コンポーネント | shadcn 未導入 | **Missing**: shadcn 用の Tailwind 設定・`components.json`・`src/components/ui` および利用するコンポーネント（Button, Card 等）の追加。 |
| **1.3** 未認証訪問者向け単一エントリページ | 未認証時はログイン画面のみ | ランディング画面がない | **Missing**: 未認証時の「ランディング」ビューと、CTA 後のログイン/サインアップ表示の流れ（同一画面内の状態/表示切替で対応可能）。 |
| **2.x** ペルソナに沿ったメッセージ・コンテンツ | コピー・価値提案の配置 | 類似トーンは Genesis の IntroStep にあり流用可能 | **Missing**: ランディング専用のセクション構成とコピー。既存の「RPG・ゲーミフィケーション」の表現は参照可能。 |
| **3.x** ビジュアル・体験 | ヒーロー、ビジュアルフック、色・イラスト・アニメーション | ダークテーマ・グラデーションは App/Genesis で使用 | **Missing**: ランディング用ヒーロー・セクション・必要に応じたイラスト/アニメーション。デザイン方針は設計フェーズで具体化。 |
| **4.x** 反応性・アクセシビリティ | レスポンシブ・コントラスト・フォーカス・セマンティクス | 既存画面は Tailwind でレスポンシブ対応の可能性あり | **Constraint**: 新規コンポーネントでレスポンシブと a11y を満たす必要あり。shadcn は a11y を考慮したコンポーネントを提供。 |
| **5.x** CTA・コンバージョン | 明確な CTA、ファーストビュー付近、サインアップ/ログインへの導線 | 現状はフォームがそのまま表示 | **Missing**: ランディング上での CTA 配置と、クリック時に `LoginSignupForm` を表示する（またはスクロール/モーダル等）導線。 |

### 2.2 技術的ギャップまとめ

- **Missing**
  - ランディング用のビュー（コンポーネント）と、未認証時の表示フロー（ランディング → CTA → ログイン/サインアップ）。
  - shadcn/ui の導入（Tailwind を npm 化、`tailwind.config`、`components.json`、`src/components/ui`、必要なプリミティブの追加）。
  - ペルソナ向けのランディング用コピー・セクション・ヒーロー・オプションでイラスト/アニメーション。
- **Constraint**
  - ルーティングがなく状態分岐のみのため、ランディングとログイン/サインアップは「同一 App 内の表示切替またはセクション」で実現する形が自然。
  - Tailwind を CDN から npm+PostCSS に移行する場合、既存画面のクラスがそのまま動くか確認が必要（JIT とデフォルトテーマなら多くの場合は互換）。
- **Research Needed**
  - shadcn/ui を Vite + React 19 で導入する手順と、既存 CDN Tailwind からの移行パス（公式ドキュメント・互換性）。
  - デザイン：ペルソナ「ゲーム・サブカル親和」を満たす具体的なビジュアルトーン（既存 Chronicle のファンタジー寄りと統一するか、差別化するか）は設計フェーズで決定。

---

## 3. Implementation Approach Options

### Option A: Extend Existing Components

- **内容**: 未認証時の `App.tsx` の return を拡張し、その中にランディング用のセクション（ヒーロー・価値提案・CTA）を追加。`LoginSignupForm` は CTA クリックで表示するか、ランディング下部にそのまま配置。shadcn は最小限（例: Button のみ）を手元で実装し、既存 Tailwind（CDN）のままにする。
- **拡張対象**: `App.tsx`（未認証時のブロック）、必要なら `LoginSignupForm` をラップする軽いレイアウトコンポーネント。
- **トレードオフ**
  - メリット: 変更範囲が小さい。既存パターンに合わせやすい。
  - デメリット: 要件 1.2（shadcn または準拠コンポーネント）を十分に満たさない。Tailwind は CDN のままのため、将来的な shadcn 全面採用との整合で二度手間の可能性。

### Option B: Create New Components（推奨）

- **内容**: ランディング専用の新規コンポーネント（例: `LandingPage.tsx` または `Landing/` 配下のセクションコンポーネント）を追加。未認証時は `App.tsx` で `<LandingPage />` を表示し、CTA で「ログイン/サインアップ」表示に切替（状態または同一ページ内のセクション表示）。あわせて **Tailwind を npm 化し、shadcn/ui を導入**（`tailwind.config`、`components.json`、`src/components/ui` に Button, Card 等）。ランディングは shadcn ベースのコンポーネントで構成。
- **統合**: `App.tsx` の未認証分岐で「ランディング表示中か / フォーム表示中か」の state を追加し、`LandingPage` の CTA で state を更新して `LoginSignupForm` を表示。
- **トレードオフ**
  - メリット: 責務の分離が明確。要件 1.1・1.2 を満たしやすい。今後の画面追加でも shadcn を流用可能。
  - デメリット: Tailwind 移行と shadcn 導入の作業が発生。ファイル数・設定が増える。

### Option C: Hybrid

- **内容**: まず Option A のように、既存 CDN Tailwind のまま `App.tsx` 内にランディング用の簡易セクションと CTA を追加してリリース可能にする。その後、設計で決めた範囲で Tailwind を npm 化し、shadcn を導入したうえで、ランディングを `LandingPage` として切り出し、shadcn コンポーネントに置き換える。
- **トレードオフ**
  - メリット: 短期で「ランディングらしきもの」を出し、後から品質を揃えられる。
  - デメリット: 二段階の実装と、CDN → npm 移行時のスタイルの揺れを吸収する手間が発生。

---

## 4. Implementation Complexity & Risk

| 項目 | 評価 | 理由 |
|------|------|------|
| **Effort** | **M（3–7日）** | shadcn + Tailwind npm の新規導入、ランディング用コンポーネントの新規作成、未認証フローの状態追加。既存画面への Tailwind 移行の影響が小さければ S に近づく。 |
| **Risk** | **Medium** | 技術はドキュメントが豊富だが、CDN → npm Tailwind 移行で既存 UI の見た目が変わらないかの確認が必要。React 19 と shadcn の互換性は設計前に軽く確認することを推奨。 |

---

## 5. Recommendations for Design Phase

- **推奨アプローチ**: **Option B（新規コンポーネント + shadcn 導入）**。要件 1.1・1.2 を満たしつつ、今後のフロント全体の UI 統一にも使える。
- **設計で決めること**
  - 未認証時のフロー: ランディングのみ表示 → CTA で「ログイン/サインアップ」を同一ページ内で表示するか、スクロールでフォームセクションを表示するか、モーダルにするか。
  - Tailwind 移行: CDN 廃止と `tailwind.config` の配置（プロジェクトルートか `apps/frontend` か）、既存クラスとの互換性確認手順。
  - shadcn の導入範囲: ランディングで使うコンポーネント（Button, Card 等）のリストと、`components.json` の設定（スタイル・Tailwind パス等）。
  - ペルソナ向けビジュアル: 既存の Chronicle 世界観（スレート・インディゴ・Cinzel）を踏襲するか、ゲーム・サブカル寄りに差別化するか。ヒーロー・イラスト・アニメーションの有無と方針。
- **Research として持ち込む項目**
  - shadcn/ui を Vite + React 19 で導入する手順と、既存 CDN Tailwind からの移行手順。
  - （必要なら）React 19 と Radix UI / shadcn の互換性情報。

---

## 6. Output Checklist

- [x] Requirement-to-Asset Map with gaps tagged (Missing / Constraint / Research Needed)
- [x] Options A / B / C with rationale and trade-offs
- [x] Effort (M) and Risk (Medium) with one-line justification
- [x] Recommendations for design phase and research items
