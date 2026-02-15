# 独自ドメイン（カスタムドメイン）のセットアップ

本ドキュメントでは、**AWS Route 53 でドメインを取得するところから**、Skill Quest AI のフロントエンド（Cloudflare Pages）とバックエンド（Cloudflare Workers）に独自ドメインを設定する手順を説明します。`*.pages.dev` および `*.workers.dev` の代わりに、取得したドメイン（例: `app.skill-quest-ai.com`、`api.skill-quest-ai.com`）でサービスを提供できるようになります。

## 前提条件

- [Cloudflareアカウント設定](./01_cloudflare_account_setup.md) が完了していること
- [本番環境・プレビュー環境の設定](./04_production_environment_setup.md) が完了し、Pages と Workers がデプロイ済みであること
- **Route 53 でドメインを取得する場合**: AWS アカウントがあり、Route 53 の「ドメインの登録」が利用可能であること
- **既にドメインを持っている場合**: 他レジストラで取得済みのドメインでも、後述の「ネームサーバー切り替え」から実施できます

## 概要

| 対象           | デフォルトURL例                          | カスタムドメイン例                 |
|----------------|------------------------------------------|------------------------------------|
| フロントエンド | `https://skill-quest-ai.pages.dev`       | `https://app.skill-quest-ai.com`   |
| バックエンド   | `https://skill-quest-backend.xxx.workers.dev` | `https://api.skill-quest-ai.com`   |

同一ルートドメインでサブドメインを分けると、Cookie の `SameSite` や CORS の管理がしやすくなります。

**本手順の流れ**: Route 53 でドメイン取得 → Cloudflare にサイト追加 → Route 53 のネームサーバーを Cloudflare に変更 → Pages / Workers にカスタムドメイン設定 → アプリ設定更新

### 取得するドメイン名の例

Skill Quest AI 用に、次のようなドメイン名の候補を検討できます。Route 53 の「ドメインの登録」で利用可能性を検索してから決めてください。

| 候補ドメイン | 用途のイメージ | 本手順でのサブドメイン例 |
|--------------|----------------|---------------------------|
| `skill-quest-ai.com` | サービス名そのまま。汎用的で分かりやすい | 本番: `app.` / `api.`、プレビュー: `develop.` / `api-develop.`（下表参照） |
| `skillquest.io` | 短く、テック系サービス向けの .io | 本番: `app.skillquest.io` / `api.skillquest.io` |
| `skillquest-app.com` | アプリであることが伝わる | 本番: `app.skillquest-app.com` / `api.skillquest-app.com` |

**本番とプレビューのサブドメイン例**（ルートドメインを `skill-quest-ai.com` とした場合）:

| 環境 | フロントエンド（Pages） | バックエンド（Workers） |
|------|-------------------------|-------------------------|
| **本番** | `app.skill-quest-ai.com` | `api.skill-quest-ai.com` |
| **プレビュー** | `develop.skill-quest-ai.com` | `api-develop.skill-quest-ai.com` |

- **ルートドメイン**を 1 つ取得し、上記のように **サブドメイン**で本番とプレビューを振り分ける運用を推奨します。
- 本ドキュメントでは、以降の手順例として **`skill-quest-ai.com`** を用います（取得できない場合は別の候補で同様に設定してください）。

---

## 1. Route 53 でドメインを取得する

AWS Route 53 でドメインを新規登録します。登録完了後、Route 53 にホストゾーンが自動作成され、ネームサーバーも割り当てられます（後で Cloudflare に切り替えます）。

### 1.1 ドメインの検索と登録

1. [AWS マネジメントコンソール](https://console.aws.amazon.com/) にログインし、**サービス** から **Route 53** を開きます。
2. 左メニューで **「ドメインの登録」**（Register domain）をクリックします。
3. **ドメイン名** に取得したいドメイン（例: `skill-quest-ai.com`）を入力し、**チェック** をクリックして利用可能性を確認します。
4. 利用可能なドメインを選択し、**「カートに追加」** をクリックします。
5. **続行** をクリックし、登録年数（1年〜）と **自動更新** の有無を選択します。
6. **連絡先の詳細** を入力します（登録者情報。WHOIS に公開されるため、プライバシー保護を有効にできる TLD では有効化を推奨）。
7. **利用規約に同意** にチェックを入れ、**続行** → **注文の確定** で支払いを完了します。

### 1.2 登録完了の確認

1. Route 53 の **「登録済みドメイン」** を開き、対象ドメインの **ステータス** を確認します。
2. 初回登録時は **「保留中のリクエスト」** のままです。登録者メールアドレスに届く **確認メール** のリンクをクリックして認証すると、数分〜最大 20〜30 分で **「成功」** に変わります。
3. 登録が成功すると、同じドメイン名の **ホストゾーン** が Route 53 に自動作成され、デフォルトの NS レコードと SOA レコードが入ります。この時点では DNS は Route 53 のネームサーバーで解決されています。

> **料金**: ドメイン登録は年額課金です。TLD により異なります（例: .com はおおよそ 12〜15 USD/年）。料金は [Route 53 の料金ページ](https://aws.amazon.com/jp/route53/pricing/) で確認してください。

---

## 2. ドメインを Cloudflare に追加し、ネームサーバーを切り替える

Pages と Workers のカスタムドメインで SSL を自動作成するには、**ドメインの DNS を Cloudflare で管理する**必要があります。Cloudflare にドメインをオンボードし、Route 53（または他レジストラ）でネームサーバーを Cloudflare のものに切り替えます。

### 2.1 Cloudflare にドメインをオンボードする

> **今、Cloudflare の「ドメイン」一覧画面（既存ドメインのリスト）にいる場合**: 画面上部の青い **「+ ドメインのオンボード」** ボタンをクリックすると、次のステップに進めます。

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログインします。
2. **「+ ドメインのオンボード」** をクリックします。  
   - 場所: 左サイドバー **「ドメイン」** → **「ドメイン」** タブの一覧画面で、青い **「+ ドメインのオンボード」**（Onboard Domain）。  
   - トップページから始める場合は **「サイトを追加」** / **「Add a site」** でも同じオンボード手順に進めます。
3. **ドメイン名** に Route 53 で取得したドメイン（例: `skill-quest-ai.com`）を入力し、**続行** をクリックします。
4. **プランを選択** で **Free** を選び、**続行** します。
5. Cloudflare が既存の DNS レコードをスキャンします。Route 53 で新規取得しただけのドメインでは **「見つかったレコード: 0」** と表示されることがあります。その場合は **レコードを追加せず**、そのまま **「アクティベーションに進む」** をクリックしてください。  
   - MX（メール）・www・ルートドメインの警告は、本手順では無視してかまいません。`app.` / `api.` / `develop.` 用のレコードは、後で Pages・Workers にカスタムドメインを追加したときに Cloudflare が自動作成します。  
   - 既存レコードが読み込まれた場合は、内容を確認・編集してから **続行** します。
6. **ネームサーバーの変更案内** が表示されます。表示された **2 つのネームサーバー**（例: `xxx.ns.cloudflare.com` と `yyy.ns.cloudflare.com`）を控えます。次の手順（2.2）で Route 53 にこの 2 つを設定します。

### 2.2 Route 53 で登録したドメインのネームサーバーを Cloudflare に切り替える

ドメインの権威 DNS を Route 53 から Cloudflare に移します。Route 53 の「登録済みドメイン」でネームサーバーを編集します。

1. **AWS マネジメントコンソール** で **Route 53** を開き、左メニューから **「登録済みドメイン」** を選択します。
2. 対象のドメイン（例: `skill-quest-ai.com`）を選択し、**「アクション」** → **「ネームサーバーの編集」** をクリックします。
3. 表示されているネームサーバー（Route 53 の 4 つの NS）を **削除** し、Cloudflare から案内された **2 つのネームサーバー** を 1 行に 1 つずつ入力します。
   - 例: `xxx.ns.cloudflare.com`、`yyy.ns.cloudflare.com`
4. **「更新」** をクリックして保存します。
5. 反映には **数分〜最大 24 時間** かかることがあります。Cloudflare Dashboard の **「概要」** でドメインのステータスが **「アクティブ」** になれば、DNS は Cloudflare で解決されています。

> **注意**: ネームサーバーを Cloudflare に切り替えた後は、**DNS レコードの管理は Cloudflare のダッシュボード**で行います。Route 53 のホストゾーンを残すと月額料金がかかるため、DNS を Cloudflare に移した後は **不要ならホストゾーンを削除** することを推奨します。

### 2.3 他レジストラで取得したドメインの場合

お名前.com、Google Domains、Cloudflare Registrar など、Route 53 以外でドメインを取得している場合は、そのレジストラの管理画面で **ネームサーバー（DNS サーバー）** を、Cloudflare から案内された 2 つに **置き換え** して保存してください。

### 2.4 DNSSEC について

ドメインで **DNSSEC** を有効にしている場合（Route 53 や他プロバイダで設定している場合）、ネームサーバーを Cloudflare に切り替える前に **一旦無効化** するか、Cloudflare の DS レコードに合わせて再設定してください。設定不整合だと名前解決に失敗することがあります。

---

## 3. フロントエンド（Cloudflare Pages）にカスタムドメインを設定する

### 3.1 カスタムドメインの追加

1. Cloudflare Dashboard で **Workers & Pages** を開きます。
2. **Pages** の一覧から、フロントエンド用プロジェクト（例: `skill-quest-ai`）を選択します。
3. **「カスタムドメイン」** または **「Custom domains」** タブを開きます。
4. **「ドメインを設定」** / **「Set up a domain」** をクリックします。
5. 使用するドメインを入力します。
   - **サブドメイン**: `app.skill-quest-ai.com`（推奨）
   - **apex ドメイン**: `skill-quest-ai.com`（ルートドメイン。Cloudflare にゾーンがある場合は利用可能）

   > **サブドメインの事前設定は不要です。** セクション 2 でネームサーバーを Cloudflare に切り替えていれば、`skill-quest-ai.com` のゾーンはすでに Cloudflare で管理されています。ここで `app.skill-quest-ai.com` を入力して続行すると、Cloudflare が **`app` 用の DNS レコード（CNAME など）を自動作成**します。DNS 管理画面で先にレコードを追加する必要はありません。

6. **続行** をクリックします。
7. DNS が Cloudflare で管理されている場合、必要な **CNAME** または **A/AAAA** レコードは Cloudflare が自動作成します。他プロバイダで DNS を管理している場合は、画面の指示に従い **CNAME** を手動で追加します（ターゲットは Pages から案内された値、例: `skill-quest-ai.pages.dev`）。
8. **SSL/TLS** 証明書は Cloudflare が自動発行するため、数分待つと「アクティブ」になります。

### 3.2 複数ドメイン（本番・プレビュー）を使う場合

- **本番**: 例として `app.skill-quest-ai.com` を Production ブランチ（例: `main`）に紐づけます。
- **プレビュー**: プレビュー用サブドメイン（例: `develop.skill-quest-ai.com`）を Preview ブランチ（例: `develop`）に紐づけます。同じ「カスタムドメイン」画面から追加し、環境で **Preview** を選択します。

---

## 4. バックエンド（Cloudflare Workers）にカスタムドメインを設定する

### 4.1 ダッシュボードでカスタムドメインを追加（推奨）

1. Cloudflare Dashboard で **Workers & Pages** を開きます。
2. **Workers** の一覧から、バックエンド用 Worker（例: `skill-quest-backend`）を選択します。
3. **「設定」** → **「ドメインとルート」** / **「Domains & Routes」** を開きます。
4. **「カスタムドメインを追加」** / **「Add Custom Domain」** をクリックします。
5. API 用のホスト名を入力します。
   - **本番**（Production）用のデプロイには `api.skill-quest-ai.com` を追加します。
   - **プレビュー**（Preview）用のデプロイにもカスタムドメインを使う場合は、同じ Worker のプレビュー側に `api-develop.skill-quest-ai.com` を追加します（Workers の環境が本番・プレビューで分かれている場合、プレビュー用のデプロイを選んでから「カスタムドメインを追加」を行います）。

   > サブドメイン（`api.` など）の事前設定は不要です。ゾーンが Cloudflare にあれば、ここでホスト名を入力すると **DNS レコードと証明書が自動作成**されます。

6. **「カスタムドメインを追加」** をクリックします。
7. ドメインのゾーンが Cloudflare に存在する場合、DNS レコードと証明書が自動作成されます。他プロバイダの場合は、表示された **CNAME** のターゲットを DNS に追加します。

### 4.2 wrangler.toml でカスタムドメインを指定する（オプション）

コードでルートを管理したい場合は、`apps/backend/wrangler.toml` の環境ごとに `[[routes]]` を追加します。**カスタムドメインを使う場合は `custom_domain = true` を指定** します。

```toml
# 本番環境の例
[env.production]
vars = { FRONTEND_URL = "https://app.example.com" }
# ... 既存の ai, d1_databases など ...

[[env.production.routes]]
pattern = "api.skill-quest-ai.com"
custom_domain = true
```

- 複数ホストを同じ Worker に紐づける場合は、`[[env.production.routes]]` を複数行追加します。
- ダッシュボードで既にカスタムドメインを追加している場合は、wrangler 側に同じパターンを書いても重複設定になるだけなので、**どちらか一方で管理** する形で問題ありません。

---

## 5. アプリケーション設定の更新

カスタムドメインを有効にしたら、次の設定を **すべて** 更新してください。

### 5.1 バックエンド: wrangler.toml の FRONTEND_URL

`apps/backend/wrangler.toml` の各環境の `vars` で、フロントエンドのカスタムドメインを指定します。

```toml
[env.preview]
vars = { FRONTEND_URL = "https://develop.skill-quest-ai.com" }  # プレビュー用ドメイン

[env.production]
vars = { FRONTEND_URL = "https://app.skill-quest-ai.com" }     # 本番用ドメイン
```

末尾のスラッシュの有無は、フロントエンドで実際に利用している URL に合わせてください（Better Auth と CORS で参照されます）。

### 5.2 フロントエンド: Cloudflare Pages の環境変数 VITE_API_URL

1. Cloudflare Dashboard の **Workers & Pages** → フロントエンド用 **Pages** プロジェクトを開きます。
2. **「設定」** → **「環境変数」** を開きます。
3. **Production** および **Preview** で、`VITE_API_URL` をバックエンドのカスタムドメインに変更します。
   - 本番（Production）: `https://api.skill-quest-ai.com`
   - プレビュー（Preview）: `https://api-develop.skill-quest-ai.com`
4. 変更後、**再デプロイ** するとビルド時に新しい API URL が埋め込まれます。

### 5.3 バックエンド: BETTER_AUTH_BASE_URL（推奨）

Better Auth のリダイレクト先などを正しくするため、本番・プレビューでフロントの URL をシークレットに設定します。

```bash
cd apps/backend
# 本番: フロントのカスタムドメイン
pnpm exec wrangler secret put BETTER_AUTH_BASE_URL --env production
# 入力例: https://app.skill-quest-ai.com

# プレビュー: プレビュー用フロントURL
pnpm exec wrangler secret put BETTER_AUTH_BASE_URL --env preview
# 入力例: https://develop.skill-quest-ai.com
```

### 5.4 GitHub OAuth のコールバック URL

GitHub で OAuth App を使用している場合、**Authorization callback URL** を Worker のカスタムドメインに合わせて変更します。

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** で対象アプリを開きます。
2. **Authorization callback URL** を、バックエンドのカスタムドメインに変更します。
   - 例: `https://api.skill-quest-ai.com/api/auth/callback/github`
3. **Update application** で保存します。

本番とプレビューで別の OAuth App を使う場合は、それぞれのコールバック URL を対応する API ドメインに設定してください。

### 5.5 デプロイの反映

- **Worker**: `wrangler.toml` やシークレットを変更したら、本番・プレビューそれぞれデプロイします。
  - 例: `pnpm --filter @skill-quest/backend exec wrangler deploy --env production`
- **Pages**: 環境変数を変更したら、該当ブランチを再デプロイするか、手動で「Retry deployment」を実行します。

---

## 6. 動作確認

1. **フロントエンド**: ブラウザで `https://app.skill-quest-ai.com`（本番）にアクセスし、表示とログイン画面が開くことを確認します。
2. **API**: フロントからログイン・クエスト一覧など API を利用し、`https://api.skill-quest-ai.com` へリクエストが送られていること、エラーにならないことを確認します。
3. **認証**: サインアップ・サインイン・GitHub OAuth が完了し、リダイレクト後もセッションが維持されることを確認します。
4. **CORS**: ブラウザの開発者ツールのネットワークタブで、API レスポンスに `Access-Control-Allow-Origin` がフロントのオリジン（例: `https://app.skill-quest-ai.com`）になっていることを確認します。

---

## 7. トラブルシューティング

### 証明書が「保留中」のままになる

- DNS の反映を待ってください（最大 24 時間）。Cloudflare のゾーンで **CNAME** や **A/AAAA** が正しく指しているか確認します。
- 他プロバイダで DNS を管理している場合、CNAME のターゲットが Pages/Workers の指示どおりか確認します。

### サインイン後にログイン画面に戻る / 401 になる

- **FRONTEND_URL** と **BETTER_AUTH_BASE_URL** が、実際にユーザーがアクセスしているフロントの URL と一致しているか確認します（スラッシュの有無を含む）。
- **VITE_API_URL** がバックエンドのカスタムドメイン（例: `https://api.skill-quest-ai.com`）になっているか確認します。
- 同一ルートドメイン（例: `skill-quest-ai.com`）で `app` と `api` のサブドメインにしている場合、Cookie の `SameSite` は `Lax` でも送信されます。別ドメインの場合は、バックエンドで `sameSite: 'none'` と `secure: true` が設定されていることを確認してください（[本番環境設定](./04_production_environment_setup.md) の「認証でリダイレクトループや 401 になる」を参照）。

### GitHub OAuth で「Redirect URI mismatch」

- GitHub の OAuth App の **Authorization callback URL** が、**バックエンドの実際の URL**（例: `https://api.skill-quest-ai.com/api/auth/callback/github`）と完全に一致しているか確認します。末尾スラッシュの有無も一致させる必要があります。

### CORS エラーが出る

- バックエンドの `FRONTEND_URL` に、フロントのオリジン（スキーム＋ホスト、例: `https://app.skill-quest-ai.com`）が含まれているか確認します。
- 変更後は Worker を再デプロイしてください。

---

## 8. 参考情報

- [AWS - Route 53 でドメイン名を登録する](https://aws.amazon.com/jp/getting-started/hands-on/get-a-domain/)
- [AWS - Route 53 に登録されているドメインのネームサーバーを更新する](https://repost.aws/ja/knowledge-center/route-53-update-name-servers-registrar)
- [Cloudflare Pages - カスタムドメイン](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Workers - Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare - サイトの追加（フルセットアップ）](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [本番環境・プレビュー環境のCloudflare設定手順](./04_production_environment_setup.md)
