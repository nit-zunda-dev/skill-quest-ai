# Research & Design Decisions: persona-landing-page

---
**Purpose**: ランディングページ機能の技術調査と設計判断の根拠を記録する。
---

## Summary

- **Feature**: persona-landing-page
- **Discovery Scope**: Extension（既存フロントにランディングビューと shadcn/ui を追加）
- **Key Findings**:
  - shadcn/ui は Vite + React 19 を公式サポート。`npx shadcn@latest init` で Tailwind とパスエイリアスを整備できる。React 19 利用時は peer dependency 警告が出る場合があり、`--force` または `--legacy-peer-deps` で対応可能。
  - Tailwind は CDN から npm 移行時、Vite では `@tailwindcss/vite` プラグインと CSS の `@import "tailwindcss"` が推奨。v4 では設定が CSS の `@theme` に移るが、shadcn の推奨手順に従えば既存ユーティリティクラスは維持しやすい。
  - 未認証フローはルーターがないため、App 内の state（ランディング表示 / フォーム表示）で切替える方式が既存パターンと整合する。

## Research Log

### shadcn/ui 導入（Vite + React 19）

- **Context**: 要件 1.2 で shadcn/ui または準拠コンポーネントが必須。既存は Vite + React 19。
- **Sources Consulted**: shadcn/ui 公式（Vite インストール、React 19 チャングログ）、第三者チュートリアル。
- **Findings**:
  - `npx shadcn@latest init` で Tailwind・TypeScript・パスエイリアスを自動設定可能。
  - React 19 は公式にサポート済み。peer dependency 警告は CLI の `--force` / `--legacy-peer-deps` で回避可能。
  - コンポーネントは `npx shadcn@latest add button` のように個別追加。`components.json` でスタイル（New York / Default）やベースカラーを選択。
- **Implications**: 設計では「apps/frontend に shadcn を init し、ランディングで利用する Button, Card 等を追加する」と明記する。既存の `@/` エイリアスはそのまま利用可能。

### Tailwind CSS の CDN から npm への移行

- **Context**: 現状は index.html で Play CDN を読み込み。shadcn 導入には Tailwind のビルド時処理が必要。
- **Sources Consulted**: Tailwind 公式（Vite プラグイン、アップグレードガイド）、v4 移行の解説。
- **Findings**:
  - Vite では `tailwindcss` + `@tailwindcss/vite` を入れ、`vite.config.ts` にプラグイン追加。CSS は `@import "tailwindcss"` に統一。
  - v4 では `tailwind.config.js` が不要になり `@theme` で設定する方式もあるが、shadcn のデフォルトは従来の content スキャンと設定ファイルを前提にしているため、公式の「Vite 用インストール」手順に従う。
  - 既存の Tailwind ユーティリティクラス（例: `min-h-screen`, `bg-slate-900`, `flex`）はそのまま利用可能。CDN スクリプト削除と CSS インポートの追加で移行できる。
- **Implications**: 設計で「Tailwind を npm パッケージ化し、Vite プラグインでバンドルに組み込む。index.html の CDN 参照は削除する」と記載。既存画面の見た目は変更しないことを前提に、実装時にビルド結果を確認する。

### 未認証時の表示フロー（ランディング → CTA → フォーム）

- **Context**: ギャップ分析で「ルーティングなし・同一画面内の表示切替が自然」と結論。
- **Sources Consulted**: 既存 App.tsx、gap-analysis.md。
- **Findings**:
  - 未認証時は現在 `!isAuthenticated` で即座に LoginSignupForm を表示している。
  - ランディングを追加するには「未認証かつランディング表示中」と「未認証かつフォーム表示中」の 2 状態を App の state で持つ形が最小変更で済む。
  - CTA は「冒険を始める」等のボタンとし、クリックで state を切り替え、同一ツリー内で LoginSignupForm を表示する。
- **Implications**: 設計で「未認証分岐内で `showAuthForm` のような boolean state を導入し、false のとき LandingPage、true のとき LoginSignupForm を表示する」と定義する。URL は変わらない。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 新規 Landing コンポーネント + App state 分岐 | ランディング専用コンポーネントを新設し、未認証時は state でランディング or フォームを切替 | 責務分離、既存 App の分岐パターンと一致、URL 変更不要 | ルーティングがないため深いリンクは不可（今回スコープ外で許容） | ギャップ分析 Option B に相当 |
| App 内にランディングを直書き | 未認証時の return にヒーロー・CTA を直接記述 | 変更ファイルが少ない | 肥大化、要件 1.2 の shadcn 全面採用と相性が悪い | Option A に相当、不採用 |
| 同一ページ内でランディング + フォームをスクロール | 1 ページにランディングとフォームの両方を含め、CTA でフォームへスクロール | 1 画面で完結、SEO 的には有利な場合あり | フォームが常に DOM に存在し、ペルソナの「短時間で価値把握」と CTA 発見の優先度を両立させる設計が必要 | 代替案として言及のみ |

## Design Decisions

### Decision: ランディングと認証フォームの表示切替を App の state で行う

- **Context**: クライアントルーターがなく、未認証時は現在 1 ビューのみ。ランディングを追加する導線の実現方法。
- **Alternatives Considered**:
  1. 同一ページにランディング + フォームを並べ、CTA でフォームへスクロール
  2. 未認証時に「ランディング表示」と「フォーム表示」を state で切替
- **Selected Approach**: state による切替。未認証時、初期はランディングを表示し、CTA クリックでフォーム表示に切り替える。
- **Rationale**: 既存の分岐型 App に合わせられ、変更範囲が明確。ペルソナ向けに「まず価値を見せてからフォーム」の流れを保証しやすい。
- **Trade-offs**: URL が変わらないため、フォーム直リンクは不可。今回は未認証エントリの改善が目的のため許容。
- **Follow-up**: 実装時に CTA のラベルと配置を 5.1・5.2 に合わせて検証する。

### Decision: Tailwind を npm 化し shadcn/ui を導入する

- **Context**: 要件 1.1・1.2 を満たし、今後の UI 統一にも使うため。
- **Alternatives Considered**:
  1. CDN のままにして、ランディングのみ手書き Tailwind クラスで実装（shadcn は使わない）
  2. Tailwind を npm 化し、shadcn を init してランディングと今後の画面で利用
- **Selected Approach**: Tailwind を npm 化し、shadcn を init。ランディングでは Button, Card 等の shadcn コンポーネントを使用する。
- **Rationale**: 要件を満たしつつ、ステアリングの「UI: Lucide React, Recharts」を shadcn で補強する形にできる。既存コンポーネントは Tailwind クラスをそのまま使うため、移行後の見た目は維持可能。
- **Trade-offs**: 依存関係と設定ファイルが増える。React 19 の peer 警告は実装時に CLI オプションで対処する。
- **Follow-up**: 既存画面のビルド結果とスタイルの差分確認をタスクに含める。

### Decision: ビジュアルトーンは既存世界観を踏襲する

- **Context**: 要件 3.1 で「デジタルネイティブ・ゲーム・サブカルに親和性が高く、コーポレート風ではない」ことが必要。既存は Chronicle のスレート・インディゴ・Cinzel 等。
- **Alternatives Considered**:
  1. 既存のダークテーマ・フォントをそのままランディングにも適用
  2. ランディングだけ別トーン（例: よりポップ）に差別化
- **Selected Approach**: 既存の Chronicle 世界観（スレート/インディゴのダーク、Cinzel・Zen Kaku Gothic、グラデーション）をランディングでも踏襲する。ヒーローと CTA で「ゲーム感覚で自己研鑽」を前面に出すコピーとレイアウトで差別化する。
- **Rationale**: 製品全体の一貫性を保ちつつ、ペルソナ向けメッセージはコンテンツと構成で満たす。デザインの大幅変更はスコープ外とする。
- **Trade-offs**: ビジュアルの「ゲーム・サブカル寄り」は既存以上にしすぎない。必要に応じて色や軽いアニメーションで補強する程度に留める。
- **Follow-up**: 実装時に 3.2・3.3 のヒーローと体験要素の有無を確認する。

## Risks & Mitigations

- **CDN 廃止による既存スタイルのずれ** — 移行後に全画面のビルド結果を目視確認し、必要なら Tailwind の content やテーマを調整する。
- **React 19 と shadcn の peer dependency 警告** — `pnpm add` 時に `--legacy-peer-deps` や shadcn CLI の推奨オプションを使用する。動作に問題なければ警告のみ許容する。
- **ランディングのみ重くなり離脱が増える** — 画像・アニメーションは軽量にし、LCP を意識した構成にする（設計では「軽いアニメーション」とし、実装で具体化）。

## References

- [shadcn/ui – Vite インストール](https://ui.shadcn.com/docs/installation/vite) — 公式の Vite 向け手順
- [shadcn/ui – React 19](https://ui.shadcn.com/docs/react-19) — React 19 対応の記載
- [Tailwind CSS – Vite プラグイン](https://tailwindcss.com/docs/installation) — Vite での Tailwind 導入
- プロジェクト: `.kiro/steering/`（product.md, structure.md, tech.md）、`apps/frontend/src/App.tsx`、`.kiro/specs/persona-landing-page/gap-analysis.md`
