# Research & Design Decisions: ai-partner-visualization

---
**Purpose**: 発見内容・アーキテクチャ検討・設計判断の根拠を記録し、design.md を補足する。
---

## Summary

- **Feature**: ai-partner-visualization
- **Discovery Scope**: Extension（既存 PartnerPage / PartnerWidget へのビジュアル追加、新規表示コンポーネント・ユーティリティ）
- **Key Findings**:
  - パートナー画像は静的アセット（Vite public）のみで賄え、新規 API 不要。パス組み立てと型はフロントで完結。
  - バリアント永続化は初版でフロントのみ（localStorage または React state + 将来のプロフィール拡張に備えたインターフェース）とし、バックエンド・DB 変更を避ける。
  - 文脈→表情のマッピングはフロントの画面状態（チャット待機/送信中、タスク完了モーダル表示中など）から判定する。API のメタデータ返却は今回スコープ外。

## Research Log

### Extension Point: Partner UI

- **Context**: どこにパートナー画像を組み込むか。
- **Sources**: gap-analysis.md、PartnerPage.tsx、PartnerWidget.tsx、structure.md。
- **Findings**:
  - PartnerPage はフルページのチャット（ヘッダ＋メッセージ一覧＋フォーム）。PartnerWidget は浮動ボタン＋開いたパネル内のチャット。
  - 両方とも useChat / useAiUsage のみ参照。画像表示用の共通コンポーネントを両方で利用する形が一貫する。
  - 表示箇所は「パートナーが表示される画面」＝ PartnerPage と PartnerWidget のチャット領域。クエスト完了モーダルからの「喜び」表情連携は、状態の受け渡し（例: グローバルな expression context または props）で対応可能。
- **Implications**: 新規コンポーネント（例: PartnerAvatar）を lib のパス組み立てユーティリティとともに用意し、PartnerPage / PartnerWidget から配置。既存の useChat は変更せず、表情は呼び出し側または専用の expression 状態で制御。

### Variant Persistence

- **Context**: 要件 5 のバリアント選択をどこに保存するか。
- **Sources**: gap-analysis.md、CharacterProfile（types.ts）、updateProfileSchema（schemas.ts）、ProfileContext。
- **Findings**:
  - CharacterProfile に partnerVariant はない。updateProfileSchema は name, themeColor のみ。プロフィール API・DB を拡張する場合はマイグレーションとバックエンド変更が必要。
  - 初版でプロフィールに載せると、取得/更新の全クライアントとバックエンドの整合が求められる。
- **Implications**: 初版はフロントのみで保持（localStorage キー `partnerVariant` または React Context）。型と取得関数を「将来プロフィールに移す」ことを想定したインターフェースにし、後から差し替え可能にする。

### Context-to-Expression Mapping

- **Context**: 要件 3 の「通常/応援/喜び/困り」をどこで決めるか。
- **Sources**: requirements.md、api-client（generatePartnerMessage の progressSummary / currentTaskTitle）、QuestBoardPage（narrativeResult）。
- **Findings**:
  - API は現在メッセージ文字列のみ返却。表情メタデータを返す拡張は今回スコープ外。
  - フロントで判定可能な入力: チャットの isLoading、メッセージの有無、タスク完了モーダル表示中、未完了タスク有無（応援のヒント）など。
- **Implications**: 文脈をフロントの状態で定義（例: 'idle' | 'cheer' | 'happy' | 'worried'）。呼び出し元（PartnerPage、PartnerWidget、将来はクエスト完了モーダル）がその状態を渡すか、共有の ExpressionContext で一元管理する。

### Vite Public Assets & img onError

- **Context**: 静的アセット参照とフォールバックの実装方針。
- **Sources**: tech.md（Vite）、ai-partner-visual-nanobanana.md（パス規則）。
- **Findings**:
  - Vite の public 配下はルート相対（`/images/partner/default/standing.png`）で参照。ビルド時にそのまま出力される。
  - 画像読み込み失敗時は `<img onError>` でハンドリングし、フォールバック UI（アイコンまたはテキスト）に切り替えるのが一般的。
- **Implications**: パスは `/images/partner/${variant}/${filename}` 形式。コンポーネント内で onError を処理し、フォールバック表示時も責めないトーンの文言を使用する。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 既存のみ拡張 | PartnerPage/Widget 内に画像表示・パス組み立てを直書き | ファイル増なし | 重複・単一責任崩れ | gap-analysis で不採用 |
| B: 新規のみ | 表示コンポーネントと lib のみ新規、既存は触らない | 責務分離 | 既存画面への「配置」設計が別途必要 | 採用要素あり |
| C: ハイブリッド | 新規: PartnerAvatar + partner-assets + 表情状態 / 拡張: Page・Widget | 責務分離と既存活用の両立、段階リリース可 | 設計の調整が必要 | **採用** |

## Design Decisions

### Decision: バリアント永続化は初版フロントのみ

- **Context**: 要件 5.1 のバリアント決定をどこに保存するか。
- **Alternatives Considered**:
  1. CharacterProfile + updateProfileSchema + バックエンド拡張 — 一貫したユーザー設定になるが、API・DB・マイグレーションが必要。
  2. フロントのみ（localStorage または React Context でデフォルト未設定時のみ保持）— バックエンド変更なしで初版を出せる。
- **Selected Approach**: 初版はフロントのみ。localStorage キー（例: `skill-quest:partnerVariant`）に `'default' | 'male'` を保存。取得用のフックまたはユーティリティを用意し、将来的にプロフィール API に差し替え可能なインターフェースにする。
- **Rationale**: 工数とリスクを抑えつつ、要件 5 を満たす。プロフィール拡張はタスク生成時に「将来対応」として扱える。
- **Trade-offs**: デバイス・ブラウザをまたぐと設定が同期されない。将来プロフィールに移す場合は、同じキー名またはマイグレーションで移行する。
- **Follow-up**: 実装時に localStorage キー名と型を shared または frontend の定数で一元定義する。

### Decision: 文脈→表情はフロント状態でマッピング

- **Context**: 要件 3 の表情切り替えの入力ソース。
- **Alternatives Considered**:
  1. API がメタデータ（例: suggestedExpression）を返す — 精度は高いがバックエンド変更が必要。
  2. フロントの画面状態のみで判定 — 実装が簡単で、既存 API を変えずに済む。
- **Selected Approach**: フロントで「文脈」を列挙型（例: `'default' | 'cheer' | 'happy' | 'worried'`）で持ち、呼び出し元（PartnerPage、PartnerWidget、または共有の PartnerExpressionContext）がその値を渡す。マッピングは expression 名定数（expression-default / expression-cheer 等）と 1:1。
- **Rationale**: 既存 API を変更せず、タスク完了モーダル表示中に「喜び」を出すなど、画面フローに合わせた拡張がしやすい。
- **Trade-offs**: API の応答内容と表情が完全には連動しない。必要なら後から API メタデータを追加し、フロントで優先する形に拡張可能。
- **Follow-up**: クエスト完了モーダルと「喜び」の連携は、モーダル表示中に expression を 'happy' にし、閉じたら 'default' に戻すなどのルールを設計で明示する。

### Decision: 表示コンポーネントは 1 つに集約し Page/Widget は配置のみ

- **Context**: 要件 2 の立ち絵・表情表示をどこに実装するか。
- **Alternatives Considered**:
  1. PartnerPage と PartnerWidget のそれぞれに img とパス組み立てを書く — 重複する。
  2. 共通の PartnerAvatar（または PartnerVisual）コンポーネント + lib/partner-assets でパス・型を提供 — 一箇所で表示・フォールバックを担当。
- **Selected Approach**: 新規コンポーネント 1 つ（例: `PartnerAvatar`）で、props: variant, expression, オプションで className / aspectRatio。パス組み立てとファイル名定数は `lib/partner-assets.ts`（または `constants/partner-assets.ts`）に集約。PartnerPage と PartnerWidget はそのコンポーネントをレンダーするだけにする。
- **Rationale**: gap-analysis の Option C。単一責任・テスト容易性・再利用（将来クエスト完了モーダルなどでも使える）。
- **Trade-offs**: ファイル数は増えるが、既存の structure.md のコンポーネント／lib 配置に沿っている。
- **Follow-up**: コンポーネントの props インターフェースを design.md の Contracts で定義する。

## Risks & Mitigations

- **画像欠損で真っ白になる** — PartnerAvatar 内で onError を必ず扱い、フォールバック時はアイコンまたは「相棒がここにいる」などの短い文言を表示（要件 6.1, 6.2）。
- **バリアント切り替え時にキャッシュで古い画像が出る** — パスに variant が含まれるため通常は問題にならない。必要なら key={variant} で img を再マウント。
- **文脈と表情がずれる** — 初版は「待機＝default」「送信中＝default または cheer」などシンプルなルールにし、後からルールを増やせるようにする。

## References

- [Vite Static Asset Handling](https://vitejs.dev/guide/assets.html#the-public-directory) — public 配下の参照方法
- プロジェクト: `.kiro/steering/structure.md` — フロントの components / lib 配置
- プロジェクト: `docs/product/ai-partner-visual-nanobanana.md` — パス・ファイル名規則、ペルソナ
