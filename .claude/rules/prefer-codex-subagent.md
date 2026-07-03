---
description: コード作業は原則 Codex に委任。Token コスト最適化と環境条件で 3 パスを切替
alwaysApply: true
---

# Codex 優先委任ルール

## 原則

実装・デバッグ・調査・リファクタリング・コードレビューなど **コード作業を伴うタスクは、原則として Codex に委任する**。
親 Claude は「タスク分解 → 委任 → 結果統合 → 最終検証」に専念する。

このルールは `proactive-subagent-and-skill.md`（Skill/Subagent 活用ルール）の拡張。「サブエージェントを使うべき」と判断したら、まず Codex への委任が成立しないかを検討する。

## なぜ Codex に寄せるか（Token コスト）

- **A / B（Codex 経由）** は OpenAI 側課金で動く。Anthropic 側の Token 消費は親 Claude の指示・統合分のみ
- **C（Claude サブエージェント `.claude/agents/`）** は Claude（`sonnet`）で動くため Anthropic 側 Token を消費する
- 同じコード作業でも、A/B を選ぶと **Anthropic Token を大幅に節約できる**
- C は「Claude モデルの判断特性が必要」「Codex を使えない」場合のフォールバックに限定する

## デフォルトパスの選択

環境によって標準パスを切り替える（A → B → C の優先順）。

| 環境条件 | デフォルト |
|---|---|
| **`openai-codex` プラグイン（`codex:codex-rescue` を提供）が利用可能** | パス A を優先 |
| **プラグインなし、Codex CLI のみあり** | パス B を優先 |
| **Codex 自体が使えない** | パス C にフォールバック |

確認方法: `which codex` で CLI、Agent ツールで `codex:codex-rescue` が `subagent_type` として通るかで判定する。

## 委任パス（3 系統・優先順）

### A) `codex:codex-rescue` サブエージェント（**推奨・標準パス**）

**`openai-codex` プラグイン** が提供する thin forwarding wrapper。`tools: Bash` のみで自分では推論せず、内部で `codex-companion.mjs task ...` を呼んで Codex CLI へ forward する。Token は forward 分のみ Claude、実処理は OpenAI 課金。

```
Agent({
  subagent_type: "codex:codex-rescue",
  description: "<task summary>",
  prompt: "<routing flags> <Persona + Goal block + Task>"
})
```

**routing flags（prompt 先頭に置く / wrapper が抜き取って Codex に渡す）:**

| フラグ | 動作 | デフォルト |
|---|---|---|
| `--write` | Codex が書き込み可能で実行 | **wrapper が自動付与（ON）**。read-only にしたいときは prompt 内に「read-only」「review only」「diagnose without edits」など意図を明示する — wrapper がそれを検知して `--write` を**付けない** |
| `--background` / `--wait` | ジョブを background / foreground で実行 | 小タスクは foreground、複雑/長時間は background |
| `--resume-last` / `--fresh` | 前回 Codex ジョブを継続 / 新規開始 | 新規開始 |
| `--model <name>` | モデル指定（例: `gpt-5.3-codex-spark`） | 未指定（プラグインデフォルト） |
| `--effort <low\|medium\|high>` | reasoning effort | 未指定（プラグインデフォルト） |

**ジョブ管理**: `/codex:status`, `/codex:result`, `/codex:cancel` で外部制御可能。長時間タスクでも安全。

### B) `codex exec` 直叩き（ローカル sandbox / 1 回完結）

sandbox/approval を明示制御したい単発タスク向け。

```bash
codex exec --cd <repo_abs_path> "<Goal block + Task>"
```

`.codex/config.toml` にプロファイル定義がないため `--profile` は使わない。
ユーザーのグローバル `~/.codex/config.toml` にプロファイルがあれば `--profile <name>` を併用可。

### C) `.claude/agents/*.md` の Claude サブエージェント（補助パス）

プロジェクトに 4 ロールの Claude サブエージェント定義あり（`sonnet` モデル、`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` で有効化済み）。ロール間で `SendMessage` 連携が効く。

Codex を使えない/不要、または Claude モデルの判断特性（ツール特性・即応性）が必要なときに使う。

| ロール | 用途 |
|---|---|
| `orchestrator` | 要求整理・タスク分解・担当割り振り |
| `product-owner` | 仕様化・`spec/` 整備・Phase 管理 |
| `senior-engineer` | 実装・統合・リファクタ・デバッグ |
| `api-reviewer` | 読み取り専用レビュー |

```
Agent({ subagent_type: "senior-engineer", description: "...", prompt: "..." })
```

> `.codex/agents/*.toml` は同名ロールの **Codex CLI 用並列定義**。Codex CLI からの参照方法は公式ドキュメントで未確認だが、Claude Code は `.claude/agents/*.md`（Markdown + YAML frontmatter）のみ読むため、Claude から直接ロール指定して呼ぶ用途では使わない。

## 委任先の選び方

| 状況 | 推奨パス |
|---|---|
| 新機能実装・既存コード修正 | A |
| バグ調査・根本原因分析・最小パッチ | A |
| リファクタリング・コード整理 | A |
| 横断調査（複数ファイル/モジュール） | A（書込不要なら read-only 指示） |
| 差分レビュー・セキュリティ確認 | A or C (`api-reviewer`) |
| 仕様化・`spec/` 整備 | C (`product-owner`) or 親で直接 |
| 1 コマンド / 1 ファイル read で済む微小タスク | 親で直接実行 |
| 長時間・多段階タスク | A + `--background` |
| Claude のツール/モデル特性が必要 | C |

## 委任の作法

1. **宣言**: 委任前に「委任します（パス=`A|B|C` / ロール=`<name>`）: `<理由>`」を 1 行で明示
2. **プロンプト**: 下記 **Goal ブロックを必須** とし、背景・制約（ファイルパス、行番号、既知の落とし穴）を self-contained で記述
3. **結果統合**: 出力を親で確認し、最終検証・コミット判断は親が行う

### ペルソナ埋め込み（`.claude/agents/<role>.md` を Codex に渡す）

`.codex/agents/*.toml` を Codex CLI が読むかは未確認のため、ロール定義を Codex に渡したいときは **`.claude/agents/<role>.md` を Single Source of Truth とし、その本文（Role / Mission / Execution Protocol）を prompt 先頭に埋め込む** 運用にする。これで `.claude/agents/*.md` を更新するだけで Claude / Codex の両方に最新ロール定義が反映される。

組み立て順: `routing flags` → `Persona` → `Goal block` → `Task`

```
<routing flags（例: --write --background）>

# Persona

<.claude/agents/senior-engineer.md の Role / Execution Protocol を抜粋>

## Goal

Complete <タスクの目的> without stopping until <検証可能な終了状態>.

## Task

<具体的なタスク内容>
```

`Agent({subagent_type: "codex:codex-rescue", prompt: <この本文>})` で渡せば、wrapper が routing flags を抜き取り、残りを Codex CLI に forward する。

### Goal ブロック（必須）

`codex exec` は非対話モードのため `/goal` スラッシュコマンドが使えない。同等の効果を **プロンプト先頭に Goal ブロックとして埋め込む** ことで再現する。

```
## Goal

Complete <タスクの目的> without stopping until <検証可能な終了状態>.

## Success Criteria（要件 → 証拠マッピング）

- [ ] 要件1 → 証拠: <確認するファイル / コマンド出力 / テスト結果>
- [ ] 要件2 → 証拠: <...>

## Verification Rules

- 自己申告で "done" としない。各要件は実ファイル / コマンド出力 / テスト結果で裏取りする。
- 不確実な点は "not-done" として扱い、追加調査かブロッカー報告を行う。

## Task

<具体的なタスク内容・背景・制約>
```

**書き方のコツ:**

- 終了状態は「`pnpm test` が pass」「`grep -r "TODO" src/ で 0 件`」のように **コマンド出力で判定可能** にする
- 要件は最大 5 項目程度。多すぎると焦点がぼやける

## 委任しない（親で直接実行）

- 1 コマンド / 1 ファイル read で完了する微小タスク
- ユーザーへの単純な回答・状況報告
- 設定ファイル（`.claude/**`, `.codex/**`, `AGENTS.md`, `~/.claude/**`, `~/.codex/**`）の直接編集
- コミット・PR 作成など承認を伴うフロー
- Codex で既に失敗した同一タスクの繰り返し（→ 別アプローチか親で着手）

## 並列実行

独立した複数タスクは並列で A を起動してよい。ただし以下を確認する:

- 書き込み対象ファイル / モジュールが競合しないか
- 各タスクが self-contained に Goal ブロックを持っているか
- 親が結果を統合できる粒度に分かれているか

## 禁止事項

- 委任で済む実装作業を親で抱え込まない
- Codex 結果を未検証のまま「完了」と報告しない
- read-only 用途の指示で書き込みを期待しない
- Goal ブロック / 終了条件のないまま委任しない（無限ループ・暴走防止）
- `.codex/agents/*.toml` や `.claude/agents/*.md` を一時的に書き換えてロールを暫定追加しない（必要なら別 PR で正式追加）
