# Requirements Document

## Introduction

本要件は EP-26「ガチャ機能の実装」に基づく。クエスト（タスク）完了時にアイテムが1つドロップし、ユーザーのコレクションが増えていく体験の基盤を実現する。アイテムマスタの設計と、コモン〜レジェンドの5段階レアリティに基づく抽選アルゴリズムを定義する。アイテム獲得演出やフロントエンドの詳細な表示は EP-27 のスコープとする。

## Project Description (Input)

EP-26 ガチャ機能の実装。アイテムテーブル設計と、コモン〜レジェンドの抽選アルゴリズムを実装する。クエスト（タスク）完了時にアイテムがドロップし、コレクションが増えていく体験の基盤となる。レアリティは common / rare / super-rare / ultra-rare / legend の5段階。アイテムカテゴリは drink, chip, badge, tool, artifact, android, mythical を想定。関連: docs/product/gacha-items-nanobanana.md（画像・アイテム仕様）、docs/planning/202602計画.md、docs/planning/CONCEPT_DEFINITION.md。

---

## Requirements

### 1. アイテムマスタとデータ構造

**Objective:** As a 開発者, I want アイテムを一意に識別しカテゴリ・レアリティ・表示情報で管理できる, so that 抽選結果の付与とコレクション表示が一貫して行える。

#### Acceptance Criteria

1. The system shall maintain a master set of items, each uniquely identified and associated with exactly one category and one rarity.
2. The system shall store for each item at least: stable identifier, display name, category code, rarity code, and optional description.
3. Where an item has an image asset, the system shall allow resolving its path from category and identifier so that clients can display it consistently (e.g. `/images/items/{category}/{id}.png`).
4. The system shall support the categories drink, chip, badge, tool, artifact, android, mythical and the rarities common, rare, super-rare, ultra-rare, legend as defined in the product specification.

---

### 2. 抽選アルゴリズム

**Objective:** As a ユーザー, I want クエスト完了ごとにレアリティに応じた確率で1個のアイテムが決まる, so that 「何が出るか」のワクワク感とレアアイテムの希少性が保たれる。

#### Acceptance Criteria

1. When a draw is requested, the system shall select exactly one item from the item master according to a defined probability distribution by rarity.
2. The system shall use a rarity-based probability distribution that approximates: common 50%, rare 30%, super-rare 13%, ultra-rare 5%, legend 2% (exact values may be configurable or tuned; the relative ordering common &gt; rare &gt; super-rare &gt; ultra-rare &gt; legend shall hold).
3. When selecting an item, the system shall choose only among items that exist in the master and are enabled for drops.
4. If the item master is empty or has no droppable items for the requested context, the system shall behave in a defined way (e.g. no item granted or fallback) and shall not fail silently in an undefined manner.

---

### 3. クエスト完了時のアイテム付与

**Objective:** As a ユーザー, I want クエスト（タスク）を完了したタイミングで1個のアイテムが付与される, so that 習慣化の報酬としてコレクションが増えていく。

#### Acceptance Criteria

1. When a user completes a quest (task), the system shall run the gacha draw once and assign the resulting item to that user.
2. When the system assigns an item to a user, it shall record the assignment with the user, the item, and the time of acquisition so that it can be listed later.
3. The system shall perform the draw and assignment in a way that is idempotent or otherwise well-defined with respect to duplicate completion events (e.g. same quest completed twice in error).
4. Where the requester is not authenticated or not the quest owner, the system shall not grant items and shall respond with an appropriate error.

---

### 4. ユーザー所持アイテムの永続化と一覧

**Objective:** As a ユーザー, I want 獲得したアイテムが永続的に記録され一覧できる, so that コレクションの成長を確認できる。

#### Acceptance Criteria

1. The system shall persist each item granted to a user so that the same user can later retrieve a list of acquired items.
2. When a user requests their acquired items, the system shall return a list that includes at least item identifier, acquisition time, and information needed to display the item (e.g. name, category, rarity).
3. The system shall associate acquired items with the authenticated user only and shall not expose or modify another user's items.
4. Where a user has acquired the same item multiple times, the system shall represent that in a defined way (e.g. duplicate entries or quantity) so that collection state is unambiguous.

---

### 5. レアリティ・カテゴリの仕様準拠

**Objective:** As a プロダクトオーナー, I want レアリティとカテゴリが仕様どおりに扱われる, so that 世界観とバランスがプロダクトドキュメントと一致する。

#### Acceptance Criteria

1. The system shall treat rarity as an ordered set: common &lt; rare &lt; super-rare &lt; ultra-rare &lt; legend for purposes of display or sorting when required.
2. The system shall treat category as a closed set aligned with the product specification (drink, chip, badge, tool, artifact, android, mythical) so that new categories are added only through a defined change process.
3. Where item master data or drop rates are configurable, the system shall document or constrain allowed values so that production data stays within product expectations.
