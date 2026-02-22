# ギャップ分析: routing-seo-ux

要件と現行コードベースの差分を整理し、実装方針の選択肢を提示する。

---

## 1. 現状の把握（Current State Investigation）

### 1.1 対象ディレクトリと主要ファイル

| 役割 | パス | 備考 |
|------|------|------|
| 認証・Genesis / 認証済み分岐 | `apps/frontend/src/App.tsx` | ルーターは認証済み＋Genesis 完了時のみマウント。ランディング・ログイン・Genesis は URL なしで状態駆動 |
| 認証済みルート定義 | `App.tsx` 内 `AuthenticatedApp` | `BrowserRouter` + `Routes`。`/`, `/quests`, `/grimoire`, `/partner`, `/items` のみ URL 対応 |
| レイアウト・ナビ | `apps/frontend/src/layouts/AppLayout.tsx` | `Outlet`, `NavLink` でダッシュボード内遷移。パスベース |
| 認証状態 | `apps/frontend/src/hooks/useAuth.ts` | Better Auth セッション。ルートガードには未使用 |
| キャラ有無・プロフィール | `apps/frontend/src/hooks/useGenesisOrProfile.ts` | `GET /api/ai/usage`（characterGenerated）, `getCharacterProfile`。分岐に使用 |
| ページコンポーネント | `apps/frontend/src/pages/*.tsx` | HomePage, QuestBoardPage, GrimoirePage, PartnerPage, ItemsPage |
| エントリ・HTML | `apps/frontend/index.html`, `main.tsx` | 単一 `<title>Skill Quest AI</title>`。メタは viewport のみ |
| バックエンド API | `apps/backend/src/routes/*.ts` | Hono ルーター。HTML 配信は行わず API のみ |
| 共有型 | `packages/shared/src/*.ts` | ルート定義・メタ用の型はなし |

### 1.2 既存パターンと制約

- **ルーティング**: React Router v7（`react-router-dom`）を利用。**認証済み＋Genesis 完了後のみ** `BrowserRouter` がマウントされ、`/` ～ `/items` が有効。ランディング・ログイン・Genesis は **URL を持たず**、`showAuthForm` / `genesisStep` / `genesisOrProfile` の状態で描画が切り替わる。
- **未認証時の URL**: ランディングで「始める」クリック時に `?auth=form` を `pushState` で付与し、`popstate` でフォーム表示を同期。パス（例: `/login`）は未使用。
- **ガード**: 明示的なリダイレクトコンポーネントはない。`App.tsx` の条件分岐で「認証済みかつ Genesis 完了」のときだけ `AuthenticatedApp`（＝ルーター）を描画する**構造的ガード**。
- **SEO**: `index.html` の固定タイトルと viewport のみ。ルート別タイトル・description・OG タグ・サーバーサイド/プリレンダーは未実装。
- **404**: 未定義パス用のルートや 404 画面なし。キャッチオール未設定。
- **デプロイ**: フロントは Cloudflare Pages。`_headers` はあり。SPA 用フォールバック（全パス → index.html）の明示設定は未確認（**要調査**）。

### 1.3 統合ポイント

- **認証**: `useAuth()`（Better Auth）。リダイレクト先保持やガードでの利用は未実装。
- **Genesis 完了判定**: `useGenesisOrProfile()` → `GET /api/ai/usage`（`characterGenerated`）。ルート層でのリダイレクトには未使用。
- **フロント API**: `lib/api-client.ts`（`getCharacterProfile` 等）。既存のまま利用可能。

---

## 2. 要件充足とギャップ（Requirements Feasibility）

### 2.1 要件 ↔ 資産マップ

| 要件 | 現状 | ギャップ | タグ |
|------|------|----------|------|
| **1.1** 各主要画面に一意 URL | ダッシュボード 5 ルートのみ URL あり。ランディング・ログイン・Genesis 各ステップは URL なし | ログイン/サインアップ・Genesis（INTRO/QUESTIONS/LOADING/RESULT/SUGGEST）用のパス設計とルート定義が不足 | Missing |
| **1.2** 未認証で認証必須ルート → ログイン URL へリダイレクト | 認証前はルーター未マウントのため「見えない」が、URL を導入すると必要 | 認証ガードとリダイレクト、できれば行き先保持 | Missing |
| **1.3** 認証済み・Genesis 未完了でダッシュボード等 → Genesis へ | 同上。現状は構造で到達不可 | ガード＋リダイレクト（例: `/genesis` またはステップ URL） | Missing |
| **1.4** 認証済み・Genesis 完了で Genesis URL → ダッシュボードへ | 同上 | リダイレクトまたは代替表示 | Missing |
| **1.5** 単一のルーティング方式で URL と画面一致 | 認証済み側はパスベースで一貫。全体では未認証・Genesis が URL 外 | 全体をパスベースに統一する URL 設計が必要 | Constraint |
| **2.1** 画面遷移で URL 更新（フルリロードなし） | ダッシュボード内は React Router で達成。Genesis/ランディングは未対応 | Genesis/ランディングの遷移をルート＋ナビゲーションに紐づける | Missing |
| **2.2** 戻る・進むで URL と画面・状態の一致 | 認証側はブラウザ履歴と連動。Genesis は状態のみで履歴に残らない | 全画面をルート化すれば解消 | Missing |
| **2.3** リロード・新規タブで正しい画面 or リダイレクト | 認証＋Genesis 完了時はプロフィール再取得で復元。他は URL が無いため現状のままでは不可 | URL 導入後、ルート＋ガードで実現 | Missing |
| **2.4** モーダル閉じ後の URL が無効にならない | クエスト報告モーダル等は URL 未使用。現状は問題なし | モーダルを URL に載せる場合は閉じた後の正規化が必要 | Unknown |
| **3.1** 公開ルートごとの一意なページタイトル | 全ルートで `index.html` の固定タイトルのみ | ルート別タイトル設定（クライアント or サーバー） | Missing |
| **3.2** インデックス対象ルートの meta description / OG 等 | 未実装 | メタタグのルート別付与 | Missing |
| **3.3** ランディング等のメタをサーバー or プリレンダーで配信 | クライアントのみ。静的 HTML は単一 | SSR またはプリレンダー／Edge でのメタ注入の要否と方式 | Research Needed |
| **3.4** 非公開ルートのメタで機密を出さない／インデックス制御 | 未対応 | 汎用タイトル・description または noindex 等 | Missing |
| **4.1** 未認証時のリダイレクト＋行き先保持とログイン後の遷移 | 未実装 | リダイレクト＋クエリ/state で returnUrl 保持 | Missing |
| **4.2** Genesis 未完了時のダッシュボード等 → Genesis へ | 未実装 | ガード＋リダイレクト | Missing |
| **4.3** Genesis 完了後のダッシュボード URL 更新とリロード復元 | 現状は `justCompletedProfile` で初回のみ。URL は `/` 等のまま | 完了時に `/` または `/quests` 等へナビゲートし、リロードでプロフィール再取得 | Missing |
| **4.4** サインアウト時のクリアとリダイレクト | サインアウトは実装済み。リダイレクト先は未指定（状態でランディング表示） | ログイン/サインアップの URL へ明示リダイレクト | Missing |
| **5.1** 未定義パスで 404 画面と HTTP/タイトル | 404 ルート・画面なし | キャッチオールルートと 404 コンポーネント | Missing |
| **5.2** ルート/ランディングの正規 URL | 未定義 | 正規形（例: `/` または `/home`）の決定とリダイレクト | Missing |
| **5.3** クエリ/ハッシュの不正値の扱い | `?auth=form` のみ。無効値の明示的フォールバックなし | デフォルト（例: ログイン）への正規化 | Constraint |

### 2.2 技術的な不足・前提

- **URL 設計**: ランディング `/`、ログイン `/login`（または `/auth`）、Genesis `/genesis`, `/genesis/intro` 等のパス案を設計フェーズで確定する必要あり。
- **ルーターの配置**: 現状は「認証済み＋Genesis 完了」のときだけルーターがマウント。要件を満たすには**アプリ最上位で単一のルーター**を置き、未認証・Genesis 未完了は「ルートでガード＋リダイレクト」に寄せる形が自然。
- **メタ配信**: Cloudflare Pages は静的／SPA が主。JS 非実行クローラー向けにメタを届けるには、**SSR やプリレンダー、または Cloudflare の機能（例: Functions での HTML 書き換え）** の調査が必要（Research Needed）。

---

## 3. 実装方針の選択肢（Implementation Approach Options）

### Option A: 既存コンポーネントの拡張

**概要**: `App.tsx` を拡張し、その中でルートを増やす。ルーターは現状どおり `AuthenticatedApp` 内に置いたまま、ランディング・ログイン・Genesis 用の「擬似ルート」を URL と同期させる（例: `useEffect` で `location.pathname` に応じて `setShowAuthForm` / `setGenesisStep` を更新し、逆に遷移時に `navigate` または `history.pushState` で URL を更新）。

- **拡張対象**: `App.tsx`（分岐ロジックに URL 読み取りとナビゲーション呼び出しを追加）、必要に応じて `AuthenticatedApp` の外側で `BrowserRouter` を巻き、`Routes` でランディング／ログイン／Genesis／認証済みアプリを並べる。
- **メリット**: 新規ファイルをあまり増やさず、既存の状態フローに URL を乗せられる。
- **デメリット**: `App.tsx` がさらに肥大化する。ルート定義が `App.tsx` と `AuthenticatedApp` に分散し、ガードとリダイレクトの責任が分かりにくくなる。
- **適合度**: 小規模な URL 追加には向くが、ガード・リダイレクト・メタ・404 まで含めると複雑になりやすい。

### Option B: 新規ルート階層の追加（トップレベルルーター）

**概要**: アプリ最上位で単一の `BrowserRouter`（または `createBrowserRouter`）を配置し、全画面をルートとして定義。ランディング・ログイン・Genesis・ダッシュボード・404 をルートツリーで表現し、認証／Genesis 完了は**レイアウトまたはラッパーコンポーネント**でガードし、未満なら `Navigate` でリダイレクトする。

- **新規**: ルート定義（例: `routes.tsx` または `router.tsx`）、ガード用ラッパー（例: `RequireAuth`、`RequireGenesis`）、必要なら 404 ページ・メタ用コンポーネント/フック。
- **既存利用**: `App.tsx` は「ルートツリーから参照される画面のオーガナイザー」に縮小。`useAuth` / `useGenesisOrProfile` はガード内でそのまま利用。
- **メリット**: ルートとガードが一箇所にまとまり、テスト・保守がしやすい。404 やメタの追加も自然。
- **デメリット**: 新規ファイルと既存 `App.tsx` のリファクタが発生。既存の状態（`genesisStep` 等）をルートパラメータと同期させる設計が必要。
- **適合度**: 要件 1〜5 を満たすにはこの形が最も整理しやすい。

### Option C: ハイブリッド（段階導入）

**概要**: まず Option A に近い形で「URL の付与と最小限のガード」だけ導入し、その後、ルート定義とガードを Option B のように切り出してリファクタする。

- **Phase 1**: `App.tsx` の外側に `BrowserRouter` を置き、`/`, `/login`, `/genesis`, `/genesis/:step`, `/dashboard/*` のような粗いルートを定義。`App.tsx` は `location.pathname` に応じて従来どおりランディング／ログイン／Genesis／`AuthenticatedApp` を出し分け、遷移時に `navigate` で URL を更新。行き先保持はクエリ `?returnUrl=` のみ実装。
- **Phase 2**: ルート定義を細かくし、`RequireAuth` / `RequireGenesis` を導入。メタ・404 を追加。必要なら `createBrowserRouter` に移行。
- **メリット**: リスクを分けられ、まず「URL が付く・戻るで復元できる」を実現し、その後で設計をきれいにできる。
- **デメリット**: 二段階の変更になり、一時的に責務が分散する。

---

## 4. 実装の複雑度とリスク

| 観点 | 評価 | 理由 |
|------|------|------|
| **工数** | **M（3〜7 日）～ L（1〜2 週間）** | URL 設計・ルートとガードの実装・メタ・404・テスト。SSR/プリレンダーに手を入れる場合は L に寄る。 |
| **リスク** | **Medium** | React Router と既存 hooks は把握済み。Cloudflare Pages 上での SPA フォールバックと、JS 非実行クローラー向けメタの実現方法は要調査。 |

---

## 5. 設計フェーズへの推奨事項

- **推奨方針**: **Option B（トップレベルで単一ルーター＋ガード）** を基本にし、必要なら **Option C の Phase 1 を短期目標** にして、まずは「全画面に URL が付き・戻る・リロードで復元できる」までを Option A 寄りで実装し、その後 Option B に寄せてリファクタする、という段階も検討する。
- **設計で決めること**:
  - パス設計の確定（`/`, `/login`, `/genesis`, `/genesis/:step`, `/dashboard` または `/` 配下の `/quests` 等）。
  - 認証ガードでの「行き先保持」の方法（クエリ `returnUrl` 等）。
  - メタタグの実装方式（クライアントのみでよいか、SSR/プリレンダー/Edge でメタを返すか）。
- **研究項目（Research Needed）**:
  - Cloudflare Pages で SPA のフォールバック（未定義パス → index.html）がどう設定されているか、または `_redirects` 等の要否。
  - ランディング等のメタを JS 非実行クローラーに届ける方法（Cloudflare Pages Functions、プリレンダー、別ドメインの静的 HTML 等）。

---

## 6. 出力チェックリスト

- [x] 要件と資産のマップにギャップをタグ（Missing / Unknown / Constraint / Research Needed）付きで記載
- [x] Option A / B / C の概要・メリット・デメリット・適合度を記載
- [x] 工数（M～L）とリスク（Medium）と理由を記載
- [x] 設計フェーズでの推奨と研究項目を記載
