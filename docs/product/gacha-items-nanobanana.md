# ガチャアイテム画像：Nano Banana 作成手順

EP-26「ガチャ機能の実装」で必要となるコレクションアイテムの画像を、Gemini Nano Banana を用いて作成するためのプロンプトと手順をまとめたドキュメントです。

**関連**: [202602計画](../planning/202602計画.md) EP-26「ガチャ機能の実装」／ [AIパートナービジュアル](./ai-partner-visual-nanobanana.md) ／ [ペルソナプロンプト](./personaprompt.md)

---

## 1. 目的と世界観の接続

### 1.1 EP-26 の概要

| 項目 | 内容 |
|------|------|
| **機能** | アイテムテーブル設計と、コモン〜レジェンドの抽選アルゴリズム実装 |
| **体験** | クエスト（タスク）完了時にアイテムがドロップし、コレクションが増えていく |
| **ハイライト** | 「何が出るか」のワクワク感。レアアイテムの獲得による達成感 |

### 1.2 世界観とトーン

アイテムは **サイバーパンクの都市のバー** という既存の世界観に統合する。

| 方針 | 説明 |
|------|------|
| **世界観の一貫性** | AIパートナー（バーのスタッフ）と同じサイバーパンク都市のバーが舞台 |
| **コレクション欲** | レアリティによる視覚的な差別化で「集めたくなる」デザイン |
| **画風の統一** | EP-25 と同様のピクセルアート・ドット絵スタイル（ヴァルハラ風） |
| **アイコン映え** | コレクション画面やドロップ演出でアイコンとして映えるサイズ感 |

---

## 2. レアリティ体系

5段階のレアリティを設け、視覚的に明確に差別化する。

| レアリティ | コード | 排出率（目安） | 視覚の差別化 |
|-----------|--------|---------------|-------------|
| **コモン** | `common` | 50% | シンプルな描写、落ち着いた色味、装飾なし |
| **レア** | `rare` | 30% | やや精緻な描写、ブルー系のアクセント光 |
| **スーパーレア** | `super-rare` | 13% | 細かい装飾、パープル系のネオン光、輝きエフェクト |
| **ウルトラレア** | `ultra-rare` | 5% | 複雑なデザイン、ゴールド系の光、オーラ・パーティクル |
| **レジェンド** | `legend` | 2% | 最高の精緻さ、虹色・多色のネオン、圧倒的な存在感 |

### 2.1 レアリティ別の色・光のガイドライン

| レアリティ | ベース色味 | 光・エフェクト | 背景 |
|-----------|----------|--------------|------|
| コモン | グレー、くすんだ色 | なし | 透過 or 暗い単色 |
| レア | ブルー、シアン | 薄い発光 | 透過 or ブルー系グロー |
| スーパーレア | パープル、マゼンタ | ネオングロー | パープル系グラデーション |
| ウルトラレア | ゴールド、アンバー | 強いオーラ、パーティクル | ゴールド系グラデーション |
| レジェンド | 虹色、ホログラフィック | 多色ネオン、波動エフェクト | ホログラフィック背景 |

---

## 3. アイテムカテゴリ

サイバーパンクのバーを拠点とした冒険者が集める「戦利品」をテーマにカテゴリを設計する。

### 3.1 カテゴリ一覧

| カテゴリ | コード | 説明 | アイテム例 |
|---------|--------|------|-----------|
| **ドリンク** | `drink` | バーで手に入る飲み物。クエストの報酬としてバーテンダーが出してくれる | エナジードリンク、ネオンカクテル、伝説のエリクサー |
| **チップ** | `chip` | サイバーパンク世界のデータチップ。知識やスキルの象徴 | メモリーチップ、暗号キー、量子コアチップ |
| **バッジ** | `badge` | 冒険の証。達成を示す紋章やマーク | ブロンズバッジ、ネオンクレスト、レジェンドエンブレム |
| **ツール** | `tool` | 冒険に使う道具やガジェット | ホロペン、ドローン、ニューラルリンク |
| **アーティファクト** | `artifact` | 稀少な遺物。コレクションの目玉 | 古代のデータクリスタル、ホログラム地図、失われたAIコア |
| **アンドロイド** | `android` | バーや街で出会う人型ロボット。相棒やコレクション | 雑用アンドロイド、アシストユニット、覚醒アンドロイド |
| **神話生物** | `mythical` | 神話や伝説に登場する生き物。サイバーパンク世界に蘇った姿 | 小精霊、水竜の子、虹の守護竜 |

### 3.2 カテゴリ × レアリティのアイテムマトリクス

各カテゴリにつき、レアリティごとに 1〜2 種のアイテムを用意する（初期セット）。

#### ドリンク（drink）

| レアリティ | アイテム名 | ID | 説明 |
|-----------|----------|-----|------|
| コモン | エナジーウォーター | `drink-common-01` | 基本的な回復飲料。薄い青色 |
| レア | ネオンソーダ | `drink-rare-01` | 青く光るソーダ。泡がネオンに光る |
| スーパーレア | サイバーカクテル | `drink-sr-01` | 紫に輝くカクテル。グラスにデジタル紋様 |
| ウルトラレア | ゴールデンエリクサー | `drink-ur-01` | 金色に輝く特別な一杯。瓶が浮遊している |
| レジェンド | レインボーアムリタ | `drink-legend-01` | 虹色に変化する伝説の霊薬。ホログラフィック |

#### チップ（chip）

| レアリティ | アイテム名 | ID | 説明 |
|-----------|----------|-----|------|
| コモン | メモリーチップ | `chip-common-01` | 基本的なデータチップ。灰色 |
| レア | 暗号キーチップ | `chip-rare-01` | 青い回路が浮き出たチップ |
| スーパーレア | ニューラルプロセッサ | `chip-sr-01` | 紫の光を放つ高性能チップ |
| ウルトラレア | 量子コアチップ | `chip-ur-01` | 金色の量子回路が浮かぶチップ |
| レジェンド | ゼロデイチップ | `chip-legend-01` | 虹色のデータが渦巻く伝説級チップ |

#### バッジ（badge）

| レアリティ | アイテム名 | ID | 説明 |
|-----------|----------|-----|------|
| コモン | ブロンズバッジ | `badge-common-01` | シンプルな銅の紋章 |
| レア | シルバークレスト | `badge-rare-01` | 青い光を帯びた銀の紋章 |
| スーパーレア | ネオンシールド | `badge-sr-01` | 紫に発光するデジタル紋章 |
| ウルトラレア | ゴールドエンブレム | `badge-ur-01` | 金色に輝くエリートの証 |
| レジェンド | ホログラムスター | `badge-legend-01` | 虹色に変化する最高位の星章 |

#### ツール（tool）

| レアリティ | アイテム名 | ID | 説明 |
|-----------|----------|-----|------|
| コモン | ホロペン | `tool-common-01` | 基本的なデジタルペン。メモ用 |
| レア | スキャナードローン | `tool-rare-01` | 青い光の小型偵察ドローン |
| スーパーレア | ハックグローブ | `tool-sr-01` | 紫のネオンが走るハッキング用手袋 |
| ウルトラレア | ニューラルリンク | `tool-ur-01` | 金色のインターフェースデバイス |
| レジェンド | ファントムバイザー | `tool-legend-01` | 虹色に輝く万能ARバイザー |

#### アーティファクト（artifact）

| レアリティ | アイテム名 | ID | 説明 |
|-----------|----------|-----|------|
| コモン | 古びた回路基板 | `artifact-common-01` | 過去の時代の電子基板 |
| レア | データクリスタル | `artifact-rare-01` | 青く透き通る結晶状のデータ媒体 |
| スーパーレア | ホログラム地図 | `artifact-sr-01` | 紫に浮かぶ都市の3Dホログラム |
| ウルトラレア | 黄金のコード断片 | `artifact-ur-01` | 金色に輝く失われたプログラムコード |
| レジェンド | AIコア「プロメテウス」 | `artifact-legend-01` | 虹色に脈動する古代のAI中枢 |

#### アンドロイド（android）

| レアリティ | アイテム名 | ID | 説明 |
|-----------|----------|-----|------|
| コモン | 雑用アンドロイド | `android-common-01` | シンプルな雑用ロボット。灰色のボディ |
| レア | アシストユニット | `android-rare-01` | 青い光を帯びた補助用アンドロイド |
| スーパーレア | ネオンドロイド | `android-sr-01` | 紫のネオンが走る高機能アンドロイド |
| ウルトラレア | ゴールドアンドロイド | `android-ur-01` | 金色に輝くプレミアムアンドロイド |
| レジェンド | 覚醒アンドロイド | `android-legend-01` | 虹色に脈動する伝説の自我覚醒体 |

#### 神話生物（mythical）

| レアリティ | アイテム名 | ID | 説明 |
|-----------|----------|-----|------|
| コモン | 小精霊 | `mythical-common-01` | シンプルな精霊。くすんだ色の小さな存在 |
| レア | 水竜の子 | `mythical-rare-01` | 青い光を帯びた小さな水竜 |
| スーパーレア | 紫電の雷獣 | `mythical-sr-01` | 紫のネオンが走る雷獣 |
| ウルトラレア | 黄金の不死鳥 | `mythical-ur-01` | 金色に輝く不死鳥 |
| レジェンド | 虹の守護竜 | `mythical-legend-01` | 虹色に脈動する伝説の守護竜 |

---

## 4. 画像仕様

### 4.1 基本仕様

| 項目 | 仕様 |
|------|------|
| **画風** | ピクセルアート・ドット絵（ヴァルハラ風） |
| **サイズ** | 正方形（1:1）、128×128px 相当のドット感 |
| **背景** | 透過推奨。レアリティ別グロー演出はフロントエンドで重ねる |
| **構図** | アイテム単体、正面〜やや斜め。アイコンとしての視認性を優先 |
| **色数** | ドット絵として限られた色数（レアリティが上がるにつれ微増は可） |

### 4.2 生成後の加工指針

- 生成画像はドット絵「風」になりがちなため、必要に応じてピクセルアートツール（Aseprite等）で仕上げる
- 背景の透過処理は生成後に行う（remove.bg またはエディタ）
- レアリティ別のグロー・オーラ演出はCSS/Canvas（フロントエンド側）で実装し、画像自体はアイテム本体のみとする
- 最終的に `64×64px` 〜 `128×128px` に縮小してドット感を保つ

---

## 5. ファイル名と配置ルール

### 5.1 ファイル名規則

EP-25 と同様、英小文字・数字・ハイフンのみ。拡張子は `.png`。

**パターン**: `{category}-{rarity}-{number}.png`

例:
- `drink-common-01.png`
- `chip-legend-01.png`
- `badge-sr-01.png`

### 5.2 フォルダ構成

```
public/images/items/
├── drink/
│   ├── drink-common-01.png
│   ├── drink-rare-01.png
│   ├── drink-sr-01.png
│   ├── drink-ur-01.png
│   └── drink-legend-01.png
├── chip/
│   ├── chip-common-01.png
│   ├── chip-rare-01.png
│   ├── chip-sr-01.png
│   ├── chip-ur-01.png
│   └── chip-legend-01.png
├── badge/
│   ├── badge-common-01.png
│   ├── badge-rare-01.png
│   ├── badge-sr-01.png
│   ├── badge-ur-01.png
│   └── badge-legend-01.png
├── tool/
│   ├── tool-common-01.png
│   ├── tool-rare-01.png
│   ├── tool-sr-01.png
│   ├── tool-ur-01.png
│   └── tool-legend-01.png
├── artifact/
│   ├── artifact-common-01.png
│   ├── artifact-rare-01.png
│   ├── artifact-sr-01.png
│   ├── artifact-ur-01.png
│   └── artifact-legend-01.png
├── android/
│   ├── android-common-01.png
│   ├── android-rare-01.png
│   ├── android-sr-01.png
│   ├── android-ur-01.png
│   └── android-legend-01.png
└── mythical/
    ├── mythical-common-01.png
    ├── mythical-rare-01.png
    ├── mythical-sr-01.png
    ├── mythical-ur-01.png
    └── mythical-legend-01.png
```

### 5.3 アプリでの参照

```
/images/items/{category}/{category}-{rarity}-{number}.png
```

例: `/images/items/drink/drink-rare-01.png`

### 5.4 制作用の候補ファイル

本番用に選ぶ前の候補は `item-assets/` ディレクトリで `drink-common-01_draft01.png` のように接尾辞で区別する。決定後に正式名でコピーする。

---

## 6. Nano Banana プロンプト例

### 6.1 共通のベースプロンプト

すべてのアイテムに共通する画風指定。各アイテムのプロンプトの先頭に付与する。

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on transparent/dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite aesthetic. Cyberpunk themed.
```

**日本語版**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵で描く。アイテム単体、透過または暗い背景。正方形構図（1:1）。はっきりしたドットの輪郭、限られた色数、ゲームのアイテムスプライトの美しさ。サイバーパンクテーマ。
```

### 6.2 レアリティ別の追加指定

ベースプロンプトに加えて、レアリティに応じた追加指定を付与する。

| レアリティ | 追加プロンプト（English） | 追加プロンプト（日本語） |
|-----------|------------------------|----------------------|
| コモン | `Simple design, muted gray tones, no glow effects, basic item.` | `シンプルなデザイン、くすんだグレー系の色味、光るエフェクトなし、基本的なアイテム。` |
| レア | `Slightly detailed, blue/cyan accent glow, subtle luminescence.` | `やや精緻なデザイン、青／シアン系のアクセント光、かすかな発光。` |
| スーパーレア | `Detailed design, purple/magenta neon glow, sparkle effects, ornamental details.` | `精緻なデザイン、紫／マゼンタのネオングロー、輝きエフェクト、装飾的なディテール。` |
| ウルトラレア | `Highly detailed, golden/amber aura, particle effects, floating elements, premium feel.` | `高精緻なデザイン、ゴールド／アンバーのオーラ、パーティクルエフェクト、浮遊する要素、プレミアム感。` |
| レジェンド | `Maximum detail, rainbow/holographic glow, multi-color neon, radiating energy, legendary aura, awe-inspiring.` | `最高の精緻さ、虹色／ホログラフィックの光、多色ネオン、エネルギー放射、伝説のオーラ、圧倒的な存在感。` |

### 6.3 全アイテムプロンプト一覧（英語）

各アイテムのプロンプトはコピー＆ペーストでそのまま AI Studio または API に使用できる。ファイル名は `{ID}.png` に対応（例: `drink-common-01.png`）。

---

#### ドリンク（drink）

**drink-common-01 — エナジーウォーター**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A simple energy water bottle, plain and utilitarian, muted gray and pale blue tones, no glow effects. Basic glass bottle with clear liquid. Simple design, basic item.
```

**drink-rare-01 — ネオンソーダ**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A neon soda in a tall glass, blue carbonated drink with cyan glowing bubbles. Blue/cyan accent glow, subtle luminescence from the liquid. Slightly detailed, bar drink aesthetic.
```

**drink-sr-01 — サイバーカクテル**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A cyber cocktail in a fancy glass, purple glowing liquid with digital pattern engravings on the glass. Purple/magenta neon glow, sparkle effects. Detailed design, ornamental cyberpunk style.
```

**drink-ur-01 — ゴールデンエリクサー**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A golden elixir in an ornate bottle, the bottle floats slightly with golden/amber aura. Particle effects and energy wisps around it. Highly detailed, premium feel, legendary bar reward.
```

**drink-legend-01 — レインボーアムリタ**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A legendary rainbow amrita elixir in an ornate crystal flask. The liquid shifts through rainbow/holographic colors. Multi-color neon glow radiates from the bottle. Floating particles and energy wisps surround it. Maximum detail, legendary aura, awe-inspiring.
```

---

#### チップ（chip）

**chip-common-01 — メモリーチップ**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A simple gray memory chip, basic circuit board design, muted tones, no glow. Small rectangular data chip. Simple design, utilitarian.
```

**chip-rare-01 — 暗号キーチップ**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. An encryption key chip with blue circuit patterns visible on the surface. Blue/cyan accent glow, subtle luminescence. Slightly detailed, data security aesthetic.
```

**chip-sr-01 — ニューラルプロセッサ**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A neural processor chip emitting purple light, intricate circuit design with ornamental details. Purple/magenta neon glow, sparkle effects. Detailed, high-performance tech aesthetic.
```

**chip-ur-01 — 量子コアチップ**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A quantum core chip with golden circuit patterns floating above the surface. Golden/amber aura and particle effects. Intricate quantum circuit design, premium feel, highly detailed pixel art.
```

**chip-legend-01 — ゼロデイチップ**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A zero-day chip with rainbow/holographic data streams swirling inside. Multi-color neon circuits, radiating energy, legendary rarity. Maximum detail, awe-inspiring, mythical hacker artifact.
```

---

#### バッジ（badge）

**badge-common-01 — ブロンズバッジ**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A simple bronze badge, plain circular or shield-shaped emblem. Muted copper and gray tones, no glow. Basic achievement marker.
```

**badge-rare-01 — シルバークレスト**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A silver crest badge with blue tint and subtle blue glow along the edges. Blue/cyan accent, slight luminescence. Slightly detailed emblem design.
```

**badge-sr-01 — ネオンシールド**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A neon shield badge with digital crest design. Purple/magenta neon glow, sparkle effects around the edges. Ornamental cyberpunk patterns, shield-shaped emblem with circuit motifs.
```

**badge-ur-01 — ゴールドエンブレム**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A gold emblem badge, elite symbol with golden/amber aura and floating particle effects. Highly detailed, premium elite achievement. Radiating prestige.
```

**badge-legend-01 — ホログラムスター**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A hologram star badge that shifts through rainbow colors, highest rank emblem. Multi-color neon, radiating energy, legendary aura. Maximum detail, awe-inspiring.
```

---

#### ツール（tool）

**tool-common-01 — ホロペン**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A simple holographic pen for memos, slim digital stylus. Muted gray and gray-blue tones, no glow. Basic utility tool.
```

**tool-rare-01 — スキャナードローン**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A small scanner drone, compact hovering robot with blue/cyan accent lights. Subtle luminescence from its sensor eye. Slightly detailed mechanical design.
```

**tool-sr-01 — ハックグローブ**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A hacking glove with purple neon lines running along the fingers and palm. Purple/magenta glow, sparkle effects on the circuits. Detailed cyberpunk gadget.
```

**tool-ur-01 — ニューラルリンク**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A neural link interface device, headset or implant with golden/amber aura and floating holographic elements. Particle effects, premium feel. Highly detailed.
```

**tool-legend-01 — ファントムバイザー**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A Phantom Visor, ultimate AR eyewear with rainbow/holographic display. Multi-color neon, radiating energy, legendary all-in-one device. Maximum detail, awe-inspiring.
```

---

#### アーティファクト（artifact）

**artifact-common-01 — 古びた回路基板**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. An old weathered circuit board from a past era, faded green and brown, dusty. Muted tones, no glow. Simple relic aesthetic.
```

**artifact-rare-01 — データクリスタル**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A data crystal, translucent crystalline data storage with blue inner glow. Blue/cyan accent, subtle luminescence. Slightly detailed, precious data medium.
```

**artifact-sr-01 — ホログラム地図**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A hologram map of the city floating in purple 3D projection. Purple/magenta neon glow, sparkle effects, ornamental frame. Detailed cyberpunk artifact.
```

**artifact-ur-01 — 黄金のコード断片**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A golden code fragment, lost program source code glowing in gold, floating character strings. Golden/amber aura, particle effects, premium legendary relic.
```

**artifact-legend-01 — AIコア「プロメテウス」**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. An ancient AI core named Prometheus, a pulsating orb with rainbow/holographic energy. Multi-color neon circuits spiral around it. Radiating legendary energy, floating fragments orbit the core. Maximum detail, awe-inspiring ancient technology.
```

---

#### アンドロイド（android）

**android-common-01 — 雑用アンドロイド**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A simple service android, small humanoid robot with muted gray metal body. No glow effects. Basic utility bot design, minimal details.
```

**android-rare-01 — アシストユニット**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. An assist unit android with blue/cyan accent lights on its visor and joints. Subtle luminescence. Slightly detailed, friendly helper robot aesthetic.
```

**android-sr-01 — ネオンドロイド**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A neon android with purple/magenta neon lines along its body and visor. Purple neon glow, sparkle effects. Detailed design, high-spec android with ornamental circuit patterns.
```

**android-ur-01 — ゴールドアンドロイド**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A gold android, premium humanoid with golden/amber aura and floating particle effects around it. Highly detailed, elite companion robot. Radiating prestige.
```

**android-legend-01 — 覚醒アンドロイド**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. An awakened android, legendary self-aware unit with rainbow/holographic energy flowing through its body. Multi-color neon, radiating energy, legendary aura. Maximum detail, awe-inspiring sentient machine.
```

---

#### 神話生物（mythical）

**mythical-common-01 — 小精霊**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A little spirit, small mythical creature like a tiny fairy or wisp. Muted gray and pale tones, no glow effects. Simple design, minimal details.
```

**mythical-rare-01 — 水竜の子**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A young water dragon, small dragon creature with blue/cyan scales and subtle luminescence. Blue accent glow. Slightly detailed, cute mythical beast.
```

**mythical-sr-01 — 紫電の雷獣**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A thunder beast with purple lightning running along its body. Purple/magenta neon glow, sparkle effects. Detailed design, fierce mythical creature with ornamental patterns.
```

**mythical-ur-01 — 黄金の不死鳥**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A golden phoenix, legendary bird with golden/amber aura and floating ember particles. Highly detailed, premium mythical creature. Radiating prestige and rebirth.
```

**mythical-legend-01 — 虹の守護竜**

```
Pixel art icon, dot art style like VA-11 Hall-A game. Single item on dark background. Square composition (1:1). Clear pixel outlines, limited color palette, game item sprite. Cyberpunk themed. A rainbow guardian dragon, legendary serpentine creature with rainbow/holographic scales and multi-color neon energy. Radiating legendary aura, floating runes or particles. Maximum detail, awe-inspiring mythical guardian.
```

---

### 6.4 全アイテムプロンプト一覧（日本語）

Nano Banana は日本語プロンプトにも対応している。AI Studio で手軽に試す場合はこちらを使用する。

---

#### ドリンク（drink）

**drink-common-01 — エナジーウォーター**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。サイバーパンクのバーで出される基本的なエナジーウォーター。シンプルなガラス瓶に透明〜薄い青の液体。くすんだグレーと淡い青の色味、光るエフェクトなし。シンプルなデザイン。
```

**drink-rare-01 — ネオンソーダ**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ネオンソーダ。背の高いグラスに青い炭酸飲料、泡がシアン色に光る。青／シアン系のアクセント光、かすかな発光。やや精緻なデザイン。
```

**drink-sr-01 — サイバーカクテル**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。サイバーカクテル。紫に輝く液体が入ったおしゃれなグラス、グラスにデジタル紋様の彫刻。紫／マゼンタのネオングロー、輝きエフェクト。精緻なデザイン、装飾的なサイバーパンク風。
```

**drink-ur-01 — ゴールデンエリクサー**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ゴールデンエリクサー。装飾された瓶に金色の霊薬が入っている。瓶がわずかに浮遊し、ゴールド／アンバーのオーラとパーティクルが周囲を包む。高精緻、プレミアム感。
```

**drink-legend-01 — レインボーアムリタ**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。伝説のレインボーアムリタ。豪華なクリスタルのフラスコに、虹色／ホログラフィックに変化する液体。多色ネオンが瓶から放射され、浮遊する粒子が周囲を囲む。最高の精緻さ、伝説のオーラ、圧倒的な存在感。
```

---

#### チップ（chip）

**chip-common-01 — メモリーチップ**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。シンプルなメモリーチップ。基本的な回路基板デザイン、灰色のくすんだトーン、光なし。小さな長方形のデータチップ。シンプルなデザイン。
```

**chip-rare-01 — 暗号キーチップ**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。暗号キーチップ。表面に青い回路パターンが浮かぶチップ。青／シアン系のアクセント光、かすかな発光。やや精緻なデザイン。
```

**chip-sr-01 — ニューラルプロセッサ**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ニューラルプロセッサチップ。紫色のネオン光を放つ高性能チップ。精緻な回路、装飾的なディテール。紫／マゼンタのネオングロー、輝きエフェクト。
```

**chip-ur-01 — 量子コアチップ**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。量子コアチップ。表面に金色の量子回路パターンが浮かぶ。ゴールド／アンバーのオーラとパーティクル。高精緻な量子回路デザイン、プレミアム感。
```

**chip-legend-01 — ゼロデイチップ**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ゼロデイチップ。虹色／ホログラフィックのデータストリームが内側で渦巻く伝説級チップ。多色ネオン回路、エネルギー放射、伝説のオーラ。最高の精緻さ、神話的なハッカー遺物。
```

---

#### バッジ（badge）

**badge-common-01 — ブロンズバッジ**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。シンプルなブロンズバッジ。無地の円形または盾型の紋章。くすんだ銅とグレーのトーン、光なし。基本的な達成マーカー。
```

**badge-rare-01 — シルバークレスト**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。シルバークレスト。青みを帯びた銀の紋章、縁に沿ってかすかな青い光。青／シアン系のアクセント、わずかな発光。やや精緻な紋章デザイン。
```

**badge-sr-01 — ネオンシールド**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ネオンシールドバッジ。デジタルクレスト風の盾型紋章。紫／マゼンタのネオングロー、縁に輝きエフェクト。装飾的なサイバーパンク模様、回路モチーフ。
```

**badge-ur-01 — ゴールドエンブレム**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ゴールドエンブレム。エリートの証である金色の紋章。ゴールド／アンバーのオーラと浮遊するパーティクル。高精緻、プレミアムな達成バッジ。
```

**badge-legend-01 — ホログラムスター**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ホログラムスター。虹色に変化する最高位の星章バッジ。多色ネオン、エネルギー放射、伝説のオーラ。最高の精緻さ、圧倒的な存在感。
```

---

#### ツール（tool）

**tool-common-01 — ホロペン**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。シンプルなホロペン。メモ用の細身のデジタルペン。くすんだグレーと青みがかったグレーのトーン、光なし。基本的なユーティリティツール。
```

**tool-rare-01 — スキャナードローン**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。スキャナードローン。青／シアンのアクセントライトを持つ小型の偵察用ホバーロボット。センサーアイからかすかに発光。やや精緻なメカニカルデザイン。
```

**tool-sr-01 — ハックグローブ**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ハックグローブ。指と手のひらに紫のネオンラインが走るハッキング用手袋。紫／マゼンタの光、回路に輝きエフェクト。精緻なサイバーパンクガジェット。
```

**tool-ur-01 — ニューラルリンク**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ニューラルリンク。ゴールド／アンバーのオーラと浮遊するホログラフィック要素を持つヘッドセット型インターフェース。パーティクルエフェクト、プレミアム感。高精緻。
```

**tool-legend-01 — ファントムバイザー**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ファントムバイザー。虹色／ホログラフィックのディスプレイを持つ万能ARバイザー。多色ネオン、エネルギー放射、伝説のオールインワンデバイス。最高の精緻さ、圧倒的な存在感。
```

---

#### アーティファクト（artifact）

**artifact-common-01 — 古びた回路基板**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。古びた回路基板。過去の時代の電子基板、色あせた緑と茶、ほこりっぽい。くすんだトーン、光なし。シンプルな遺物の雰囲気。
```

**artifact-rare-01 — データクリスタル**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。データクリスタル。青く透き通る結晶状のデータ媒体、内側に青い光。青／シアン系のアクセント、かすかな発光。やや精緻、貴重なデータ媒体。
```

**artifact-sr-01 — ホログラム地図**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ホログラム地図。都市の3D投影が紫に浮かぶホログラム。紫／マゼンタのネオングロー、輝きエフェクト、装飾的なフレーム。精緻なサイバーパンク遺物。
```

**artifact-ur-01 — 黄金のコード断片**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。黄金のコード断片。失われたプログラムのソースコードが金色に輝いて浮かび上がっている。ゴールド／アンバーのオーラ、パーティクルエフェクト、浮遊する文字列。プレミアムな伝説の遺物。
```

**artifact-legend-01 — AIコア「プロメテウス」**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。古代のAIコア「プロメテウス」。虹色／ホログラフィックのエネルギーで脈動するオーブ。多色ネオン回路が周囲を螺旋状に取り巻く。伝説のエネルギーを放射し、断片がコアの周りを浮遊。最高の精緻さ、古代技術とサイバーパンクの融合。
```

---

#### アンドロイド（android）

**android-common-01 — 雑用アンドロイド**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。雑用アンドロイド。シンプルな人型ロボット、くすんだグレーの金属ボディ。光るエフェクトなし。基本的な雑用ボットのデザイン、最小限のディテール。
```

**android-rare-01 — アシストユニット**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。アシストユニット。バイザーと関節に青／シアン系のアクセントライトを持つ補助用アンドロイド。かすかな発光。やや精緻、親しみやすいヘルパーロボットの雰囲気。
```

**android-sr-01 — ネオンドロイド**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ネオンドロイド。ボディとバイザーに紫のネオンラインが走る高機能アンドロイド。紫／マゼンタのネオングロー、輝きエフェクト。精緻なデザイン、装飾的な回路パターンを持つ高性能アンドロイド。
```

**android-ur-01 — ゴールドアンドロイド**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。ゴールドアンドロイド。ゴールド／アンバーのオーラと周囲に浮遊するパーティクルを持つプレミアム人型アンドロイド。高精緻、エリート相棒ロボット。威厳を放つ。
```

**android-legend-01 — 覚醒アンドロイド**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。覚醒アンドロイド。虹色／ホログラフィックのエネルギーがボディを流れる伝説の自我覚醒体。多色ネオン、エネルギー放射、伝説のオーラ。最高の精緻さ、圧倒的な存在感の意思を持つ機械。
```

---

#### 神話生物（mythical）

**mythical-common-01 — 小精霊**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。小精霊。小さな精霊やウィスプのような神話の生き物。光るエフェクトなし。シンプルなデザイン、最小限のディテール。
```

**mythical-rare-01 — 水竜の子**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。水竜の子。青／シアン系の鱗とかすかな発光を持つ小さな水竜。青いアクセント光。やや精緻、かわいらしい神話の獣。
```

**mythical-sr-01 — 紫電の雷獣**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。紫電の雷獣。体に紫の雷が走る雷獣。紫／マゼンタのネオングロー、輝きエフェクト。精緻なデザイン、装飾的な模様を持つ獰猛な神話の獣。
```

**mythical-ur-01 — 黄金の不死鳥**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。黄金の不死鳥。ゴールド／アンバーのオーラと浮遊する焔のパーティクルを持つ伝説の鳥。高精緻、プレミアムな神話生物。威厳と再生を放つ。
```

**mythical-legend-01 — 虹の守護竜**

```
ピクセルアートのアイコン。ヴァルハラ（VA-11 Hall-A）風のドット絵。アイテム単体、暗い背景。正方形（1:1）。はっきりしたドットの輪郭、限られた色数。虹の守護竜。虹色／ホログラフィックの鱗と多色ネオンのエネルギーを持つ伝説の守護竜。伝説のオーラを放射し、ルーンやパーティクルが浮遊。最高の精緻さ、圧倒的な存在感の神話の守護者。
```

---

## 7. 画像生成のワークフロー

### 7.1 推奨手順

1. **AI Studio で試作**: [AI Studio](https://aistudio.google.com/apps?features=chat_based_image_editing) でプロンプトを調整し、方向性を確認
2. **レアリティの低い方から着手**: コモン → レア → スーパーレア → ウルトラレア → レジェンドの順で生成し、段階的にリッチにする
3. **カテゴリは1つずつ**: 同じカテゴリのアイテムを全レアリティ分まとめて生成すると、デザインの一貫性を保ちやすい
4. **候補の保管**: 気に入った候補を `item-assets/` に一時保存（例: `drink-common-01_draft01.png`）
5. **仕上げ**: 必要に応じて Aseprite 等でドット絵として仕上げ、背景透過処理
6. **正式配置**: 本番用を `public/images/items/{category}/` に正式名で配置

### 7.2 使用モデルの選択

| フェーズ | モデル | 理由 |
|---------|--------|------|
| 試作・方向性確認 | `gemini-2.5-flash-image` (Nano Banana) | 高速・大量に候補を出せる |
| 本番用アセット | `gemini-3-pro-image-preview` (Nano Banana Pro) | 高解像度で精緻な出力 |

### 7.3 注意事項

- 1プロンプト＝1アイテムで生成する（複数アイテムをまとめると品質が落ちる）
- ドット絵「風」のイラストになりがちなので、純粋なピクセルスプライトが必要な場合は生成後にドット化ツールで仕上げる
- 生成画像には SynthID ウォーターマークが含まれる（Google の責任ある AI 施策）
- 同じプロンプトでも生成ごとに結果が異なるため、良い結果が出たら即保存する

---

## 8. 初期リリースの優先順位

全 35 アイテム（7カテゴリ × 5レアリティ）を一度に作成する必要はない。以下の優先度で進める。

### 優先度 1（MVP — 最低限のガチャ体験に必要）

全カテゴリのコモンとレアを各1枚（計14枚）。ガチャの基本的な「回す→出る」体験が成立する最小セット。

### 優先度 2（差別化 — レアリティの楽しさを感じるために必要）

全カテゴリのスーパーレアを各1枚（計7枚）。「ちょっといいのが出た」体験が加わる。

### 優先度 3（コレクション欲 — 長期リテンションのために必要）

全カテゴリのウルトラレアとレジェンドを各1枚（計14枚）。「伝説を引いた！」のハイライト体験。

---

## 9. データベースとの接続（実装参考）

画像アセットが用意できたら、EP-26 の実装フェーズでアイテムテーブルと紐づける。

### 9.1 アイテムテーブル設計（案）

```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY,          -- 例: 'drink-common-01'
  name TEXT NOT NULL,           -- 例: 'エナジーウォーター'
  category TEXT NOT NULL,       -- 'drink' | 'chip' | 'badge' | 'tool' | 'artifact' | 'android' | 'mythical'
  rarity TEXT NOT NULL,         -- 'common' | 'rare' | 'super-rare' | 'ultra-rare' | 'legend'
  description TEXT,             -- アイテムの説明文
  image_path TEXT NOT NULL,     -- '/images/items/drink/drink-common-01.png'
  drop_weight INTEGER NOT NULL  -- 抽選の重み（排出率に影響）
);
```

### 9.2 ユーザーアイテム所持テーブル（案）

```sql
CREATE TABLE user_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  obtained_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT               -- 'quest_clear' | 'gacha' | 'event'
);
```

---

## 10. 関連ドキュメント

- [202602計画](../planning/202602計画.md) — EP-26 の位置づけ
- [AIパートナービジュアル化](./ai-partner-visual-nanobanana.md) — 画風・トーンの参照元（EP-25）
- [ペルソナプロンプト](./personaprompt.md) — ターゲットユーザー像
- [データベース設計](../architecture/04_データベース設計.md) — 既存テーブル構成
- [フロントエンド設計](../architecture/07_フロントエンド設計.md) — 静的アセットの配置方針
- [コンセプト定義](../planning/CONCEPT_DEFINITION.md) — 世界観・コア体験との整合
