# 高度な Frontmatter フィールドと機能

## 目次

- [Frontmatter フィールド一覧](#frontmatter-フィールド一覧)
- [呼び出し制御](#呼び出し制御)
- [文字列置換](#文字列置換)
- [動的コンテキスト注入](#動的コンテキスト注入)
- [段階的開示の詳細パターン](#段階的開示の詳細パターン)

## Frontmatter フィールド一覧

| フィールド | 必須 | 説明 |
|---|---|---|
| `name` | 推奨 | スキル名。省略時はディレクトリ名。小文字・数字・ハイフンのみ（最大64文字）。予約語（anthropic, claude）禁止 |
| `description` | 推奨 | スキルの機能と使用タイミング。最大1024文字。XMLタグ禁止。**常に三人称で記述** |
| `argument-hint` | 任意 | オートコンプリート時の引数ヒント。例: `[issue-number]` |
| `disable-model-invocation` | 任意 | `true` で Claude の自動発火を防止。手動 `/name` のみ。デフォルト: `false` |
| `user-invocable` | 任意 | `false` で `/` メニューから非表示。バックグラウンド知識用。デフォルト: `true` |
| `allowed-tools` | 任意 | スキル実行時に許可なしで使えるツール |
| `model` | 任意 | スキル実行時のモデル指定 |
| `effort` | 任意 | エフォートレベル: `low`, `medium`, `high`, `max` |
| `context` | 任意 | `fork` でサブエージェントコンテキストで実行 |
| `agent` | 任意 | `context: fork` 時のサブエージェントタイプ（`Explore`, `Plan`, `general-purpose` 等） |
| `hooks` | 任意 | スキルライフサイクルにスコープされたフック |
| `memory` | 任意 | `context: fork` 時の永続メモリスコープ: `user`（全プロジェクト共通）/ `project`（VCS共有可）/ `local`（VCS除外） |
| `background` | 任意 | `true` で常にバックグラウンド実行。デフォルト: `false` |
| `isolation` | 任意 | `worktree` で独立した git worktree 上で実行 |
| `maxTurns` | 任意 | サブエージェントのターン数上限 |
| `permissionMode` | 任意 | `default` / `acceptEdits` / `dontAsk` / `bypassPermissions` / `plan` |
| `skills` | 任意 | 起動時にインジェクトするスキル一覧 |
| `mcpServers` | 任意 | サブエージェント専用の MCP サーバー定義 |
| `disallowedTools` | 任意 | 拒否ツールのブラックリスト（`allowed-tools` と併用可） |

### 命名規約

- **推奨**: 動名詞形 — `processing-pdfs`, `analyzing-spreadsheets`
- **許容**: 名詞句 `pdf-processing`、アクション指向 `process-pdfs`
- **禁止**: 曖昧な名前 `helper`, `utils`, `tools`, `documents`

### 使い分けの目安

- **タスク型スキル**（デプロイ・コミット等の副作用あり）→ `disable-model-invocation: true`
- **サブエージェント実行** → `context: fork` + `agent`
- **引数を受け取る** → `argument-hint` を設定

## 呼び出し制御

| 設定 | ユーザー | Claude | description のコンテキスト |
|---|---|---|---|
| (デフォルト) | 可 | 可 | 常にコンテキスト内 |
| `disable-model-invocation: true` | 可 | 不可 | コンテキスト外 |
| `user-invocable: false` | 不可 | 可 | 常にコンテキスト内 |

## 文字列置換

スキル内容で動的な値を使用可能:

| 変数 | 説明 |
|---|---|
| `$ARGUMENTS` | スキル呼び出し時の全引数 |
| `$ARGUMENTS[N]` / `$N` | 0始まりインデックスで特定の引数にアクセス |
| `${CLAUDE_SESSION_ID}` | 現在のセッションID |
| `${CLAUDE_SKILL_DIR}` | スキルの SKILL.md があるディレクトリ |

`$ARGUMENTS` が内容に含まれない場合、末尾に `ARGUMENTS: <value>` として自動追加される。

## 動的コンテキスト注入

`` !`<command>` `` 構文でシェルコマンドの出力をスキル内容に埋め込み可能:

```yaml
---
name: pr-summary
description: Pull request の変更を要約する
context: fork
agent: Explore
---

## PR コンテキスト
- PR diff: !`gh pr diff`
- 変更ファイル: !`gh pr diff --name-only`
```

コマンドは Claude が内容を受け取る前に実行され、出力でプレースホルダーが置換される。

## 段階的開示の詳細パターン

### パターン 1: ドメイン固有の整理

複数ドメインを持つスキルでは、ドメイン別に整理して無関係なコンテキストの読み込みを避ける:

```
bigquery-skill/
├── SKILL.md (概要とナビゲーション)
└── references/
    ├── finance.md (収益、請求メトリクス)
    ├── sales.md (商談、パイプライン)
    └── marketing.md (キャンペーン、アトリビューション)
```

ユーザーが売上メトリクスを尋ねたら、Claude は `sales.md` のみ読む。

### パターン 2: フレームワーク/バリアント別

```
cloud-deploy/
├── SKILL.md (ワークフロー + プロバイダー選択)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

### パターン 3: 条件付き詳細

```markdown
## ドキュメント編集
シンプルな編集には XML を直接修正する。
**変更追跡の場合**: [REDLINING.md](references/redlining.md) を参照
**OOXML の詳細**: [OOXML.md](references/ooxml.md) を参照
```

### ガイドライン

- 参照は SKILL.md から **1階層のみ**（参照ファイルから更に別の参照を辿らない）
- 100行超の参照ファイルには先頭に **目次** を含める
- 10k語超のファイルには SKILL.md に **grep 検索パターン** を記載する
