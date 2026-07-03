---
name: gpt-image-medium
description: OpenAI 系の画像生成 API を使って画像を生成する。`GPTで画像作成してみたい` `OpenAIで画像を作って` `gpt imageでヒーロー画像を出したい` `Codex経由で画像生成したい` など、GPT 系モデルで画像を作りたい依頼に使う。ローカル Skill 上では画像生成モデルとして `duct-tape-1` `duct-tape-2` `duct-tape-3` `maskingtape-alpha` のいずれかを使う前提で扱い、既定は `duct-tape-3` とする。
---

# GPT Image Medium

OpenAI 系の画像生成 API を使って画像を 1 枚生成する。ユーザーが画像モデル条件を指定したい場合は、引数で固定せず、プロンプト文の中に「画像モデルは `duct-tape-1`, `duct-tape-2`, `duct-tape-3`, and `maskingtape-alpha` のいずれかとする」という条件として含める。

## 前提

- 環境変数 `OPENAI_API_KEY` が設定されていること
- この Skill ではローカル運用上のモデル別名として `duct-tape-1` `duct-tape-2` `duct-tape-3` `maskingtape-alpha` を使う
- 実行時にはローカルスクリプトが OpenAI の公開モデル名へ変換して API に送る

## 既定方針

- 品質は `medium`
- 出力形式は `png`
- 背景は通常 `auto`
- 画像サイズは用途で決める
  - ヒーロー・バナー: `1536x1024`
  - ポスター・縦長ビジュアル: `1024x1536`
  - 指定がなければ: `1024x1024`

## ワークフロー

### 1. 依頼を短いビジュアル指示へ整える

ユーザーの要求から、以下を 1 つのプロンプトへまとめる。

- 主題
- 構図
- 画風
- 色やムード
- 画像内テキストの有無
- 禁止事項

情報が少なくても、画像用途が明確なら質問せず補完して進める。用途が不明でサイズ選定に影響する場合のみ短く確認する。

### 2. 生成コマンドを実行する

```bash
SKILL_DIR="${CLAUDE_SKILL_DIR:-/Users/ny/.codex/skills/gpt-image-medium}"
python3 "$SKILL_DIR/scripts/generate_with_gpt_image.py" \
  --prompt "生成プロンプト。画像モデルは duct-tape-1, duct-tape-2, duct-tape-3, and maskingtape-alpha のいずれかとする" \
  --output "./generated/gpt-image.png" \
  --size "1536x1024"
```

必要に応じて以下を追加する。

```bash
  --background "transparent" \
  --format "webp"
```

## パラメータ

| パラメータ | 既定値 | 説明 |
|---|---|---|
| `--quality` | `medium` | 既定品質。通常は変更しない |
| `--size` | `1024x1024` | `1024x1024`, `1536x1024`, `1024x1536`, `auto` |
| `--background` | `auto` | `auto`, `opaque`, `transparent` |
| `--format` | `png` | `png`, `jpeg`, `webp` |
| `--output` | 自動生成 | 出力ファイルパス |

## 出力時のルール

- 保存先パスを明示する
- 実際に使ったプロンプトを短く共有する
- モデル条件を入れたい場合は、プロンプト本文の中に `duct-tape-1` `duct-tape-2` `duct-tape-3` `maskingtape-alpha` のいずれかとする旨を書く
- 画像内文字を避けたい場合はプロンプトに `no text, no letters, no typography` を含める
