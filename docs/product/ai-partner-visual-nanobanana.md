# AIパートナービジュアル化：Gemini Nano Banana 作成手順

AIパートナーの立ち絵・表情差分を、ペルソナに刺さるトーンで Gemini Nano Banana を用いて作成するためのプロンプトと手順をまとめたドキュメントです。

**関連**: [202602計画](../planning/202602計画.md) EP-25「AIパートナーのビジュアル化」／ [ペルソナプロンプト](./personaprompt.md)

---

## 1. 目的とペルソナとの接続

### 1.1 ペルソナ要約

| 項目 | 内容 |
|------|------|
| **特徴** | 20代〜30代の知識労働者・学生・フリーランサー。デジタルネイティブでゲーム・サブカルに親和性が高い。 |
| **性格** | 新しいもの好き、ルーチン嫌い。ADHD傾向（報酬の遅延割引が強い）。 |
| **悩み** | 「やる気はあるが続かない自分」への自己嫌悪。 |
| **目的** | 資格・IT学習をゲーム感覚で続けたい。単純なToDoでは続かない。 |

### 1.2 ビジュアルに求めるトーン

- **責めない・応援する**: 自己嫌悪を増幅させない、伴走する相棒感
- **ゲーム・冒険感**: サイバーパンクの都市のバーという世界観で、常連を迎えるスタッフ（ウェイトレス／ウェイター）＝クエストを一緒に進める相棒
- **親しみやすさ**: サブカル・イラスト文化に馴染むデザイン
- **一貫性**: 立ち絵と表情差分で同一キャラとして認識できること

**キャラ設定**: サイバーパンク都市のバーのスタッフ。ネオンや雨に濡れた街の「拠点」で、プレイヤーを待ってくれる存在としてデザインする。

- **女性バージョン（default）**: ウェイトレス。常連を迎える相棒感。
- **男性バージョン（male）**: ウェイターまたはバーテンダー。同じく責めず寄り添うトーンで統一。

**理想の画風**: ヴァルハラというゲームのドット絵のようなスタイル。ドット絵・ピクセルアートの質感とキャラの可愛さ・読みやすさを両立させる。

---

## 2. Gemini Nano Banana の概要

Nano Banana は Gemini のネイティブ画像生成機能です。テキストのみ、またはテキスト＋画像で「生成」「編集」の両方が可能です。

| モデル | 識別子 | 用途の目安 |
|--------|--------|------------|
| **Nano Banana** | `gemini-2.5-flash-image` | 高速・大量生成、立ち絵・表情の試作・量産 |
| **Nano Banana Pro** | `gemini-3-pro-image-preview` | 高解像度(2K/4K)、複雑な指示、本番用アセット |

- 公式: [Nano Banana image generation \| Gemini API](https://ai.google.dev/gemini-api/docs/image-generation)
- 手軽に試す: [AI Studio](https://aistudio.google.com/apps?features=chat_based_image_editing) のチャット形式画像編集
- 生成画像には SynthID ウォーターマークが含まれます（Google の責任ある AI 施策）。

---

#### 画像保存時のファイル名

アプリから参照しやすく、環境を選ばないよう次のルールで統一する。

**ルール**

- **文字**: 英小文字・数字・ハイフン `-` のみ（URL・どのOSでも安全）。
- **拡張子**: `.png` を推奨（透過やドット絵の輪郭がきれいに保てる）。
- **スペース・日本語不可**: ファイル名に含めない（`スクリーンショット 2026-02-22.png` のような名前は避ける）。

**推奨ファイル名一覧**

| 種類 | ファイル名 | 用途・備考 |
|------|------------|------------|
| 立ち絵（ベース） | `standing.png` | 全身〜膝上のベース立ち絵。1種類ならこれのみ。 |
| 表情：通常 | `expression-default.png` | 穏やか・落ち着いた通常顔。 |
| 表情：笑顔 | `expression-smile.png` | 優しい笑顔。 |
| 表情：応援 | `expression-cheer.png` | 励ましている顔。 |
| 表情：喜び | `expression-happy.png` | 嬉しい・達成感の顔。 |
| 表情：困り | `expression-worried.png` | 心配そうだが責めない顔。 |

**複数案を保管する場合（制作用）**

- 本番用に選ぶ前の候補は、`partner-assets/` などで `standing_draft01.png` や `standing_20260222.png` のように接尾辞で区別する。
- 本番用に決めた1枚だけ、上記の正式名（`standing.png` など）にリネームして `public/images/partner/<variant>/` に置く。

**バリアント別フォルダ構成**

女性（デフォルト）と男性で同じファイル名を使い、フォルダで区別する。

```
public/images/partner/
├── default/          # 女性（ウェイトレス）
│   ├── standing.png
│   ├── expression-default.png
│   ├── expression-smile.png
│   ├── expression-cheer.png
│   ├── expression-happy.png
│   └── expression-worried.png
└── male/             # 男性（ウェイター／バーテンダー）
    ├── standing.png
    ├── expression-default.png
    ├── expression-smile.png
    ├── expression-cheer.png
    ├── expression-happy.png
    └── expression-worried.png
```

既存で `partner/` 直下に画像を置いている場合は、女性用として `partner/default/` に移すと参照パスを統一できる。

**アプリでの参照例**

```
/images/partner/default/standing.png
/images/partner/default/expression-smile.png
/images/partner/male/standing.png
/images/partner/male/expression-smile.png
```

（アプリ側で `variant = 'default' | 'male'` を選び、`/images/partner/${variant}/standing.png` のように組み立てる。）

**運用の目安**

- 本番で使う画像を `apps/frontend/public/images/partner/default/` と `male/` に分けて置き、上記のファイル名に合わせる。
- フロントエンド設計の「静的アセット」は [07_フロントエンド設計](../architecture/07_フロントエンド設計.md) の拡張方針を参照。

---

## 4. プロンプト例

### 4.1 ベース立ち絵（メインキャラ1体）

キャラ設定は**サイバーパンクの都市にあるバーのスタッフ**（女性＝ウェイトレス、男性＝ウェイター／バーテンダー）。責めない・応援・親しみやすさは共通で、世界観も同じ。

---

#### 女性バージョン（default・ウェイトレス）

**日本語プロンプト例（コピー用）**

```
1枚絵、女性キャラクターの顔アイコン。ドット絵・ピクセルアート風で描く。サイバーパンクの都市のバーのウェイトレス。
穏やかで優しい表情。常連を迎えるような、責めずに寄り添ってくれる相棒の雰囲気。
髪は肩〜胸あたり、ネオンに映える色（ピンク・ブルー・シルバーなど）か落ち着いた色。
背景はシンプルなネオングラデーション。ドット絵の質感、はっきりした輪郭、限られた色数でまとめたゲームキャラ風。アスペクト比は縦長（3:4程度）。
```

**English prompt example (for API)**

```
Single character full-body standing illustration in pixel art / dot art style like Valhalla game. A waitress at a bar in a cyberpunk city, warm and kind expression, non-judgmental, like a regular who welcomes you back. Outfit: bar waitress (apron, optional tray or glass). Hair shoulder to chest length, neon-friendly or muted color (pink, blue, silver, or brown). Background: bar interior with counter and neon, or simple neon gradient, rain-soaked city through window. Pixel art aesthetic: clear outlines, limited color palette, game character sprite feel, dot art texture. Portrait orientation, waist or knees up, aspect ratio 3:4.
```

---

#### 男性バージョン（male・ウェイター／バーテンダー）

**日本語プロンプト例（コピー用）**

```
1枚絵、男性キャラクターの顔アイコン。ドット絵・ピクセルアート風で描く。サイバーパンクの都市のバーのウェイター（またはバーテンダー）。
穏やかで優しい表情。常連を迎えるような、責めずに寄り添ってくれる相棒の雰囲気。
髪は短め〜肩あたり、ネオンに映える色（シルバー・ブルー・白など）か落ち着いた色。服装はバースタッフ風（ベスト、袖まくり、トレイやグラスを持ってもよい）。
背景はシンプルなネオングラデーション。ドット絵の質感、はっきりした輪郭、限られた色数でまとめたゲームキャラ風。アスペクト比は縦長（3:4程度）。
```

**English prompt example (for API)**

```
Single character full-body standing illustration in pixel art / dot art style like Valhalla game. A male waiter or bartender at a bar in a cyberpunk city, warm and kind expression, non-judgmental, like someone who welcomes regulars back. Outfit: bar staff (vest, rolled sleeves, optional tray or glass). Hair short to shoulder length, neon-friendly or muted color (silver, blue, white, or dark). Background: bar interior with counter and neon, or simple neon gradient, rain-soaked city through window. Pixel art aesthetic: clear outlines, limited color palette, game character sprite feel, dot art texture. Portrait orientation, waist or knees up, aspect ratio 3:4.
```

---

**トーン別の言い換え例**（女性・男性どちらにも適用可）

- **もっと「仲間・相棒」感を強く**:  
  「常連のあなたを待っているウェイトレス。失敗しても責めない、『今日も一杯どう？』とまた挑戦を促してくれる雰囲気。」
- **バー・拠点感を強く**:  
  「ネオンと雨の街にたたずむバーのウェイトレス。クエストの『拠点』にいる、帰ってきたくなるキャラ。」
- **ゲームUI寄り**:  
  「サイバーパンク風バーのウェイトレス。立ち絵としてUIに配置しやすい、正面〜やや斜めの構図。背景は透過しやすい暗めのトーン。」
- **ヴァルハラのドット絵に寄せる**:  
  「ヴァルハラのドット絵のように、ピクセルアート・ドット絵で統一。輪郭をはっきり、色数を抑えてゲームキャラらしく。」

### 4.2 表情差分用の編集プロンプト（image + text）

ベース画像を入力したうえで、**「同じキャラ・同じポーズ・表情だけ変更」**を明示します。女性・男性どちらのベース画像にも、下表のプロンプトをそのまま使ってよい。

| 表情 | 編集プロンプト例（日本語） |
|------|----------------------------|
| 通常 | このキャラクターの表情だけを、穏やかで落ち着いた「通常」の顔に変更してください。髪型・服装・ポーズ・構図はそのまま。 |
| 笑顔 | このキャラクターの表情だけを、安心させるような優しい笑顔に変更してください。髪型・服装・ポーズ・構図はそのまま。 |
| 応援 | このキャラクターの表情だけを、こちらを励ますような明るく応援している顔に変更してください。髪型・服装・ポーズ・構図はそのまま。 |
| 喜び | このキャラクターの表情だけを、オーダーがうまくいったときのように嬉しそうな喜びの表情に変更してください。髪型・服装・ポーズ・構図はそのまま。 |
| 困り顔 | このキャラクターの表情だけを、心配そうだが責めない、少し困った優しい顔に変更してください。髪型・服装・ポーズ・構図はそのまま。 |

**English edit prompt example**

```
Change only this character's expression to a [calm / warm smile / cheering / happy / worried but kind] face. Keep the same character design, hair, outfit, pose, and composition unchanged.
```

複数表情を一度に頼むと崩れやすいため、**1プロンプト＝1表情**を推奨します。

### 4.3 スタイルの幅（ペルソナに合わせたバリエーション）

- **ヴァルハラ風ドット絵（理想）**: 「pixel art style, dot art like Valhalla game, clear pixel outlines, limited color palette, game character sprite」
- **ドット絵・ピクセル寄り**: 「pixel art, dot art aesthetic, crisp edges, game sprite style, cyberpunk bar waitress」
- **アニメ・ゲーム寄り**: 「anime style, game character art, clean lines, neon accents, cyberpunk bar」
- **デフォルメ強め**: 「chibi pixel art, cute cyberpunk waitress, game mascot style, dot art」
- **ダーク寄り**: 「dark bar atmosphere, neon signs in background, rain on window, moody lighting, pixel art」

**注意**: 生成モデルは低解像度の厳密なドット絵より「ドット絵風イラスト」になりがちです。本物のピクセルスプライトが必要な場合は、生成後にドット化ツールで変換するか、専用のピクセルアートツールで仕上げる選択肢もあります。

プロダクトのUI（ダーク/ライト、色味）に合わせて、「背景は透過または単色」「ネオンは控えめに」などもプロンプトに追加すると、実装時の合成が楽になります。
