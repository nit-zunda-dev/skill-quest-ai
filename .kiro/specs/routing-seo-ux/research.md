# 調査・設計判断: routing-seo-ux

---
**目的**: 技術設計に反映するための調査結果と判断根拠を記録する。

## Summary

- **Feature**: routing-seo-ux
- **Discovery Scope**: Extension（既存フロントのルーティング・認証・Genesis フローを URL 駆動に拡張）
- **Key Findings**:
  - React Router v7 は既存で `BrowserRouter` + `Routes` を利用。`createBrowserRouter` によるルートオブジェクト化でガード・loader との統合が容易。
  - Cloudflare Pages はトップレベルに `404.html` が無い場合、SPA として全パスをルートにマッピングする既定動作を持つ。明示的にする場合は `_redirects` で `/* /index.html 200` を指定可能。
  - メタタグはクライアント側で `document.title` と `<meta>` の差し替えで対応。JS 非実行クローラー向けのサーバー側メタは Pages Functions やプリレンダーが必要で、本スコープでは「クライアントメタ＋公開ルートの正規化」を優先し、3.3 の完全充足は将来検討とする。

## Research Log

### React Router v7 とガード・レイアウト

- **Context**: トップレベル単一路由（Option B）で、認証／Genesis 未完了時のリダイレクトをルート階層で表現する必要がある。
- **Sources Consulted**: [createBrowserRouter - React Router](https://reactrouter.com/api/data-routers/createBrowserRouter), [Route Object](https://reactrouter.com/start/data/route-object)
- **Findings**:
  - `createBrowserRouter(routes, opts)` でルート配列と `basename` 等を指定可能。既存の `<BrowserRouter>` + `<Routes>` も継続利用可能。
  - ガードは「レイアウトルートの element で `useAuth` / `useGenesisOrProfile` を参照し、条件不満なら `<Navigate to="..." replace />` を返す」ラッパーコンポーネントで実現できる。
  - データローダー（loader）はルート単位で非同期データ取得に使えるが、認証状態は既存 `useAuth` に依存するため、ガードはコンポーネント内で行う形が既存コードと整合する。
- **Implications**: ルート定義を配列で一元管理し、`RequireAuth` / `RequireGenesis` をレイアウト要素として配置。既存の `AuthenticatedApp` は「ダッシュボード用レイアウト＋ProfileProvider＋子ルート」に縮小し、ルーターは `main.tsx` 直下に配置する。

### Cloudflare Pages と SPA フォールバック

- **Context**: 未定義パス（例: `/app/quests`）への直接アクセスやリロードで index.html が返る必要がある。
- **Sources Consulted**: [Redirects - Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/redirects/), [Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- **Findings**:
  - トップレベルに `404.html` が無い場合、Pages は SPA とみなし、すべてのパスをルート（/）にマッピングする。
  - 明示的にする場合は、ビルド出力（例: `dist`）の `public` に `_redirects` を置き、`/* /index.html 200` と記述する。
- **Implications**: 現状で 404.html を配っていなければ追加設定なしで SPA 動作する。明示化する場合は Vite の `publicDir` に `_redirects` を追加する設計でよい。

### メタタグとクローラビリティ（要件 3.3）

- **Context**: ランディング等のメタを JS 非実行クローラーに届ける要件 3.3。
- **Sources Consulted**: ギャップ分析、Cloudflare Pages のドキュメント。
- **Findings**:
  - 静的 SPA では初回 HTML にメタが無く、クローラーが JS を実行しない場合タイトル・description を読めない。
  - 対応案: (1) Cloudflare Pages Functions で特定パス（例: `/`, `/login`）のリクエストに合わせて HTML を返す、(2) ビルド時プリレンダーで HTML を生成、(3) 当面はクライアントメタのみとし、主要検索・OG は多くのクローラーが JS 実行する前提で対応。
- **Implications**: 設計では「ルート別メタをクライアントで設定するコンポーネント／フック」を必須とし、3.3 のサーバー／プリレンダー配信は「将来検討」として research に記載。実装 Phase 1 ではクライアントメタで 3.1, 3.2, 3.4 を満たす。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Option A | App.tsx 拡張で URL と状態を同期 | 変更ファイル少 | App 肥大化、ガード・メタが分散 | 要件 1〜5 を一括で整理しづらい |
| **Option B** | **トップレベル単一路由＋ガード** | ルート・ガード・メタを一箇所で管理、テストしやすい | 新規ファイルと App リファクタ | **採用**。要件 1〜5 を満たしやすい |
| Option C | Phase 1 で A 寄り、Phase 2 で B へ | 段階的リスク分散 | 二段階変更の手間 | B で一括実装する場合不要 |

## Design Decisions

### Decision: Option B（トップレベル単一路由＋ガード）の採用

- **Context**: ギャップ分析で Option B を推奨。ユーザー指示で Option B で進行。
- **Alternatives Considered**: Option A（App 拡張）、Option C（段階的移行）。
- **Selected Approach**: `main.tsx` 直下に単一の `BrowserRouter`（または `createBrowserRouter`）を配置。全画面をルートツリーで定義。認証必須領域は `RequireAuth`、Genesis 完了必須領域は `RequireGenesis` のラッパーでガードし、未満なら `Navigate` でリダイレクト。404 はキャッチオールルートで専用コンポーネントを表示。
- **Rationale**: ルートとガードの責任が明確になり、行き先保持（returnUrl）・メタ・404 の追加が自然。既存の `useAuth` / `useGenesisOrProfile` をそのままガード内で利用できる。
- **Trade-offs**: 新規にルート定義・ガード・404・メタ用コンポーネントが必要。既存 `App.tsx` は「画面オーガナイザー」に縮小し、Genesis の状態は URL パラメータ（例: `/genesis/:step`）と同期させる。
- **Follow-up**: 実装時に `AuthenticatedApp` の ProfileProvider とダッシュボード子ルートの受け渡しを維持する。

### Decision: URL 設計（正規形とパス）

- **Context**: 要件 1.1（一意 URL）、5.2（正規 URL）。ランディングとダッシュボードの同一パス衝突を避ける。
- **Alternatives Considered**: (1) `/` を認証状態で出し分け → 同一 URL で内容が変わるためブックマーク・SEO に不向き。(2) ダッシュボードを `/` 配下にしランディングを `/welcome` に → 既存ユーザーの `/` が変わる。(3) ランディングを `/`、ダッシュボードを `/app` 配下に。
- **Selected Approach**: `/` = ランディング（公開）、`/login` = ログイン/サインアップ、`/genesis` = Genesis イントロ（または `/genesis/intro` にリダイレクト）、`/genesis/:step` = intro|questions|loading|result|suggest、`/app` = ダッシュボードレイアウト、`/app/`（index）、`/app/quests`、`/app/grimoire`、`/app/partner`、`/app/items`。未定義パスは `*` で 404。
- **Rationale**: 公開と認証領域をパスで分離し、正規形を明確にできる。既存のダッシュボード子パス（quests, grimoire 等）は `/app` 配下に移すだけなので、コンポーネントの流用が容易。
- **Trade-offs**: 既存ブックマークの `/quests` 等は `/app/quests` に変わる。移行時にリダイレクトをかけるかは実装で判断。
- **Follow-up**: 必要なら `/quests` → `/app/quests` などのリダイレクトルートを追加する。

### Decision: 行き先保持（returnUrl）

- **Context**: 要件 4.1。未認証で保護ルートにアクセスした際、ログイン/サインアップ後に元の URL へ遷移する。
- **Alternatives Considered**: (1) クエリ `?returnUrl=/app/quests`、(2) sessionStorage、(3) 状態管理（グローバル）。
- **Selected Approach**: クエリパラメータ `returnUrl` を使用。未認証で保護ルートに飛んだら `/login?returnUrl=<encodeURIComponent(currentPath)}` にリダイレクト。ログイン/サインアップ成功後、`returnUrl` が存在し有効（同一オリジン・アプリ内パス）ならその URL へ `navigate(returnUrl)`、無効または無ければ `/app` へ。
- **Rationale**: URL に含まれるためブックマークや共有時も意図が残らないが、ログイン直後の 1 回限りの遷移には十分。実装が単純でテストしやすい。
- **Trade-offs**: returnUrl の改ざん・オープンリダイレクトに注意。許可するパスをアプリ内パスのみに制限する。
- **Follow-up**: 実装で許可リストまたはパスプレフィックス（例: `/app`）を検証する。

### Decision: メタタグ実装方針（要件 3.1, 3.2, 3.4）

- **Context**: ルート別タイトル・description・OG。非公開ルートは機密を含めず noindex 等で対応。
- **Alternatives Considered**: (1) react-helmet-async、(2) 自前で useEffect で document.title と meta を更新、(3) 各ページで個別に設定。
- **Selected Approach**: ルートメタ情報を定数または設定オブジェクトで持たせ、共通の `PageMeta` コンポーネント（または `usePageMeta` フック）で `document.title` と `<meta name="description">`、必要なら `og:title` 等を設定。非公開ルート（`/app/*`, `/genesis/*`）では汎用タイトル（例: "Skill Quest AI"）と `meta name="robots" content="noindex, nofollow"` を設定。
- **Rationale**: 依存を増やさず、既存スタックで実装可能。3.3（サーバー/プリレンダー）は本スコープでは「クライアントで可能な範囲」とし、将来 Cloudflare Functions 等で対応する余地を残す。
- **Trade-offs**: JS 非実行クローラーには初回 HTML のメタしか見えない。ランディング・ログインは index.html のデフォルトタイトルに依存する。
- **Follow-up**: インデックス重要度が高くなったら、Pages Functions で `/` と `/login` 用にメタ付き HTML を返す検討。

## Risks & Mitigations

- **リスク**: 既存ユーザーが `/quests` 等をブックマークしている場合、`/app/quests` に変わるため 404 になる。  
  **対策**: キャッチオールの前に `/quests` → `/app/quests` 等のリダイレクトルートを定義するか、設計で「移行期のみリダイレクト」をタスクに含める。

- **リスク**: returnUrl のオープンリダイレクト。  
  **対策**: 遷移先を同一オリジンかつアプリ内パス（例: `/app` で始まる）に制限し、無効な場合は `/app` へフォールバック。

- **リスク**: Genesis の step を URL と同期させる過程で、LOADING 等の一過性状態が URL に残る。  
  **対策**: LOADING は `/genesis/loading` として許容する。RESULT/SUGGEST 完了後は `/app` へ遷移するため、リロードではダッシュボードが表示される。

## References

- [createBrowserRouter - React Router](https://reactrouter.com/api/data-routers/createBrowserRouter)
- [Redirects - Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Serving Pages - Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- ギャップ分析: `.kiro/specs/routing-seo-ux/gap-analysis.md`
