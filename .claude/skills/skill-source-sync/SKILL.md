---
name: skill-source-sync
description: 外部ソース（Anthropic 公式ドキュメント、GitHub リポジトリ、技術ブログ等）から最新情報を取得し、スキルやルールの知識ベースを更新する。定期的な情報同期、ベストプラクティスの反映、参照元の鮮度チェックに使用する。
---

# Skill Source Sync

外部ソースから最新のベストプラクティス・仕様変更を取得し、スキルとルールに反映する。

## トリガー

- 「ソースを同期して」「最新情報を取り込んで」「スキルを最新化して」
- 「公式ドキュメントが更新されてないか確認」「ベストプラクティスを更新」
- `skill-inspect` で `note: "ルール未整備"` や `note: "表現が曖昧"` が検出された後
- 月次メンテナンスの一環として

## ソースレジストリ

### 登録済みソース

`.claude/state/source-registry.jsonl` にソース定義を管理する。初回実行時にデフォルトソースを登録する。

```json
{
  "id": "anthropic-memory",
  "url": "https://docs.anthropic.com/en/docs/claude-code/memory",
  "type": "official_doc",
  "affects": ["check-claude-md", "claude-md-gen"],
  "fetch_prompt": "CLAUDE.md のベストプラクティス、推奨構造、行数制限、記載すべき内容を抽出して",
  "last_synced": null
}
```

### デフォルトソース一覧

| ID | URL | タイプ | 影響スキル |
|---|---|---|---|
| `anthropic-memory` | `https://docs.anthropic.com/en/docs/claude-code/memory` | official_doc | check-claude-md, claude-md-gen |
| `anthropic-hooks` | `https://docs.anthropic.com/en/docs/claude-code/hooks` | official_doc | check-claude-md, claude-md-gen |
| `anthropic-settings` | `https://docs.anthropic.com/en/docs/claude-code/settings` | official_doc | check-claude-md |
| `anthropic-skills` | `https://docs.anthropic.com/en/docs/claude-code/skills` | official_doc | skill-creator, check-claude-md |
| `anthropic-sub-agents` | `https://docs.anthropic.com/en/docs/claude-code/sub-agents` | official_doc | skill-creator |
| `everything-claude-code` | `https://github.com/anthropics/claude-code/blob/main/README.md` | community | check-claude-md, claude-md-gen |
| `agentskills-best-practices` | `https://github.com/agentskills/agentskills/blob/main/docs/skill-creation/best-practices.mdx` | community | skill-creator, skill-amend |
| `claude-code-changelog` | `https://github.com/anthropics/claude-code/releases` | changelog | _all |

### ソースタイプ

| タイプ | 説明 | 同期頻度目安 |
|---|---|---|
| `official_doc` | Anthropic 公式ドキュメント。最優先 | 2週間 |
| `changelog` | リリースノート。機能追加・破壊的変更の検知 | 1週間 |
| `community` | コミュニティリポジトリ・ブログ | 1ヶ月 |
| `research` | 学術研究・技術レポート | 3ヶ月 |

## ワークフロー

### Phase 1: ソースレジストリの読み込み

1. `.claude/state/source-registry.jsonl` を読み込む
2. ファイルが存在しなければデフォルトソースで初期化する
3. `$ARGUMENTS` にスキル名が指定されていれば、そのスキルに関連するソースのみに絞る
4. `$ARGUMENTS` に URL が指定されていれば、新規ソースとして追加フローへ

### Phase 2: ソース取得

各ソースに対して:

1. **WebFetch** で URL のコンテンツを取得する
   - `fetch_prompt` に記載された観点で情報を抽出
   - 取得できない場合は **WebSearch** にフォールバック（`site:{domain} {キーワード}` で検索）
2. 取得結果を一時変数に保持する（ファイル書き出しは不要）
3. 並列可能なソースは **Agent** ツールで並列取得する（最大3並列）

### Phase 3: 差分分析

取得した最新情報と現在のスキル/ルールを比較する:

1. 影響スキルの **SKILL.md** と **references/** 配下を Read で読む
2. 以下の観点で差分を特定:

| 差分タイプ | 説明 | 例 |
|---|---|---|
| `new_feature` | 新機能・新概念の追加 | 公式に新しい設定項目が追加された |
| `deprecation` | 非推奨・削除された機能 | フック形式が変更された |
| `best_practice` | ベストプラクティスの更新 | 推奨行数の変更、新しいパターン |
| `correction` | 既存情報の誤りの発見 | URL変更、数値の訂正 |
| `no_change` | 変更なし | — |

3. 差分がないソースは `no_change` として記録しスキップ

### Phase 4: 影響評価と提案

差分が見つかったスキル/ルールごとに:

1. **影響範囲を評価**:
   - 必須チェック項目への影響 → 🔴 高優先度
   - 推奨チェック項目への影響 → 🟡 中優先度
   - 参考情報の更新のみ → 🟢 低優先度

2. **変更提案をテーブルで提示**:

```
## ソース同期レポート

### 取得結果サマリー
| ソース | ステータス | 最終同期 |
|---|---|---|
| anthropic-memory | ✅ 取得成功 | 2026-03-23 |
| anthropic-hooks | ✅ 変更検出 | 2026-03-23 |
| ... | | |

### 変更提案 ({n}件)

#### 🔴 [高] check-claude-md: D4 基準の更新
- **ソース**: anthropic-memory
- **差分タイプ**: best_practice
- **現在**: test / build / lint のうち2つ以上
- **提案**: test / build / lint / format のうち3つ以上（公式が format を追加推奨）
- **影響ファイル**: `.claude/skills/check-claude-md/SKILL.md`

#### 🟡 [中] claude-md-gen: 新セクションテンプレート追加
- ...
```

### Phase 5: ユーザー承認と適用

1. 提案をユーザーに提示し、**承認を得てから** 適用する
   - 一括承認 or 個別承認を選択可能
2. 承認された変更を適用:
   - SKILL.md の該当箇所を Edit で更新
   - references/ 配下のファイルを更新（必要な場合）
   - 情報ソース引用のコメントを更新
3. 適用しない変更は理由を記録

### Phase 6: 同期記録

1. `.claude/state/source-registry.jsonl` の `last_synced` を更新
2. `.claude/state/source-sync-log.jsonl` に同期結果を追記:

```json
{
  "ts": "2026-03-23T06:00:00Z",
  "sources_checked": 7,
  "changes_found": 2,
  "changes_applied": 1,
  "changes_skipped": 1,
  "affected_skills": ["check-claude-md"],
  "note": "anthropic-memory の行数推奨を反映"
}
```

## ソース追加コマンド

`/skill-source-sync add <URL>` で新規ソースを追加:

1. WebFetch で URL の内容を確認
2. 影響するスキルを推定（ユーザーに確認）
3. `fetch_prompt` を自動生成（ユーザーが編集可能）
4. `source-registry.jsonl` に追記

## ルール

- **読み取り専用フェーズ**（Phase 1-4）はユーザー確認不要で自律実行する
- **書き込みフェーズ**（Phase 5）は必ずユーザー承認を経る
- WebFetch の結果をそのままスキルにコピペしない。要約・構造化して反映する
- 外部ソースの情報は検証する — 公式ドキュメント > コミュニティ > ブログの信頼度順
- 1回の同期で大量変更しない。影響の大きい変更は1-2件に絞り、段階的に反映する
- ソース取得に失敗しても他のソースの処理を継続する（エラー耐性）

## skill-inspect / skill-amend との連携

| スキル | 役割 | データフロー |
|---|---|---|
| **skill-source-sync** | 外部ソースから最新情報を取得 → スキルの知識ベースを更新 | → SKILL.md, references/ |
| **skill-inspect** | 実行ログからスキルの品質を診断 | ← observations.jsonl |
| **skill-amend** | 診断結果に基づきスキルのロジックを改善 | ← observations.jsonl, → SKILL.md |

- `skill-source-sync` は **知識の鮮度** を担当（外部→内部）
- `skill-amend` は **ワークフローの品質** を担当（内部フィードバック）
- 両方の更新が必要な場合: `skill-source-sync` → `skill-amend` の順で実行

## 注意事項

- WebFetch は認証が必要なページ（Notion, Jira 等）には使えない。公開ページのみ対象
- changelog ソースはリリースノートの最新5件のみを確認する（全履歴は不要）
- 同期ログが100行を超えたら古い50行を削除する（直近50行を保持）
