# Requirements Document

## Introduction

本ドキュメントは、ペルソナに刺さるランディングページの要件を定義する。Tailwind CSS と shadcn/ui を用い、RPG風タスク管理アプリ（Skill Quest）の価値提案を、20代〜30代のデジタルネイティブでゲーム・サブカルに親和性が高く「続かない自分」に悩むユーザーに届けることを目的とする。

## Project Description (Input)

ランディングページをTailwind CSSとshadcn/uiで作成する。本アプリのペルソナに刺さるページにしたい。

**ペルソナ（参照: docs/product/personaprompt.md）**
- 特徴: 20代〜30代の知識労働者、学生、フリーランサー。デジタルネイティブであり、ゲームやサブカルチャーに親和性が高い。
- 性格: 新しいもの好きだが、ルーチンワークを極端に嫌う。ADHD傾向（診断の有無に関わらず）を持ち、報酬の遅延割引が強い。
- 現状の悩み: 「やる気はあるが続かない自分」に対して自己嫌悪を抱いている。
- アプリを使う目的: 資格習得やITエンジニアの学習を進めたいが、単純なToDoでは続かず、楽しくゲーム感覚で自己研鑽を進めたい。

---

## Requirements

### 1. 技術スタック・スコープ

**Objective:** As a 開発者, I want ランディングページがTailwind CSSとshadcn/uiで実装されている, so that スタイルとコンポーネントの一貫性を保ちつつ効率的に開発できる。

#### Acceptance Criteria

1. The Landing Page shall use Tailwind CSS for all layout and visual styling.
2. Where a reusable UI component is used (e.g. button, card, section), the Landing Page shall use shadcn/ui or components consistent with shadcn/ui design.
3. The Landing Page shall be implemented as a single entry page (or a clearly scoped set of views) for unauthenticated visitors.

---

### 2. ペルソナに沿ったメッセージ・コンテンツ

**Objective:** As a ペルソナユーザー, I want アプリの価値が「ゲーム感覚で自己研鑽を続けられる」と伝わる, so that 自分ごと化し、興味を持てる。

#### Acceptance Criteria

1. The Landing Page shall present the product value proposition（RPG風タスク管理、クエスト・AI物語・ゲーミフィケーション）を、ペルソナが求める「楽しくゲーム感覚で自己研鑽を進めたい」という目的に紐づけて表示する。
2. The Landing Page shall communicate that the app supports 資格習得やITエンジニア学習などの自己研鑽を、単純なToDoではなくゲーム感覚で続けられること。
3. When displaying messaging about "続かない" or motivation, the Landing Page shall use 自己嫌悪を助長しない、励まし・共感・前向きなトーンとする。

---

### 3. ビジュアル・体験（ペルソナ適合）

**Objective:** As a ペルソナユーザー, I want 見た目と体験がデジタルネイティブ・ゲーム好きに刺さる, so that 離脱せずに価値を理解し、興味を持てる。

#### Acceptance Criteria

1. The Landing Page shall have a visual style that デジタルネイティブおよびゲーム・サブカルに親和性が高く、汎用的なコーポレート風ではない、現代的で特徴的なデザインとする。
2. The Landing Page shall provide ヒーローまたは主要なビジュアル・コピーにより、短時間で価値が把握できる情報のフックを提供する（注意の持続が限られるユーザーを考慮する）。
3. Where appropriate, the Landing Page shall use 色・イラスト・軽いアニメーション等により、報酬感・没入感を補強する体験要素を含めることができる。

---

### 4. 反応性・アクセシビリティ

**Objective:** As a 訪問者, I want 様々なデバイスと能力でランディングページを利用できる, so that 誰でも情報にアクセスし、CTAを実行できる。

#### Acceptance Criteria

1. The Landing Page shall be responsive and モバイル・タブレット・デスクトップ等の一般的なビューポートで利用可能であること。
2. The Landing Page shall meet 最低限のアクセシビリティ（十分なコントラスト、フォーカス順序、セマンティックな構造等）を満たし、異なる能力のユーザーが利用できること。

---

### 5. コンバージョン・CTA

**Objective:** As a 訪問者, I want サインアップまたは製品体験への明確な導線がある, so that 興味を持った際にすぐ次のアクションを取れる。

#### Acceptance Criteria

1. The Landing Page shall display at least one clear call-to-action (CTA) that サインアップまたは製品体験（トライアル）へ誘導する。
2. The primary CTA shall be 過度なスクロールなしで発見可能（ファーストビューまたは直後に表示）であること。
3. When the user chooses the CTA, the Landing Page shall サインアップ/ログイン画面または製品の入口へ遷移する導線を提供する。
