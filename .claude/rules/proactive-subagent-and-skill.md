---
description: 通常タスクで該当 Skill/Subagent を積極的に探して使う
alwaysApply: true
---

# Skill と Subagent を積極活用する

## 使い分け
- **Skill**: 専門知識が必要なタスク → SKILL.md を読み、手順/制約を適用する
- **Subagent**: 独立コンテキストが有効なタスク、並列実行したい場合に委任する
  - コード作業（実装・修正・調査・レビュー・リファクタ）は **原則 Codex に委任**（Anthropic Token 節約のため）。詳細は `prefer-codex-subagent.md`

## 並列実行の判断基準
- 独立した3つ以上のファイル/モジュールを同時に調査・修正する場合
- 広範囲のコードベース探索（7ディレクトリ以上）
