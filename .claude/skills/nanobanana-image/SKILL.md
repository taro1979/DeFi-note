---
name: nanobanana-image
description: Nano Banana（Gemini Pro Image）APIで高品質な画像を生成・編集する。プロジェクト情報を自動収集しブランドに合った画像を出力する。「nanobanaで画像を作って」「Geminiでヒーロー画像を生成」「バナーを作りたい」「この画像を編集して」「プロダクト画像を生成」「背景を変えて」などに対応。
user-invocable: false
---

# Nano Banana 画像生成

Nano Banana（Gemini Image Generation）API でLP・マーケティング用画像を生成・編集する。

## 前提条件

- 環境変数 `GEMINI_API_KEY` または `GOOGLE_API_KEY` が設定されていること
- API Tier 1+（画像出力には課金が必要）

## モデル選択

| モデル | ID | 用途 |
|---|---|---|
| Flash Image | `gemini-3.1-flash-image-preview` | 高速・低コスト。プロトタイプ・ラフ確認向け |
| Pro Image | `gemini-3-pro-image-preview` | 高品質・4K対応。本番画像・編集すべてに推奨 |

**デフォルトは Pro**。品質を最優先する。Flash は「とりあえずラフで見たい」「大量バリエーション出して」等の明示的な指示があった場合のみ使用する。既存画像の編集は常に Pro を使用する。

## ワークフロー

### Phase 0: プロジェクト情報の収集

画像プロンプトにプロジェクトのコンテキストを反映するため、以下を自動収集する:

1. **product-marketing-context**: `.agents/product-marketing-context.md` が存在すれば読み込み、プロダクト名・ターゲット・トーンを把握
2. **CLAUDE.md**: プロジェクトルートの CLAUDE.md から技術スタック・カラースキーム・ブランド情報を抽出
3. **既存画像**: `public/images/` や `assets/` にある既存画像のファイル名からスタイルの一貫性を推測
4. **LP コンポーネント**: LP ファイルが存在すれば、ヒーローセクションの構造やブランドカラーの CSS 変数を確認

収集した情報をプロンプトに自動反映する:
- プロダクト名 → 主題の文脈に
- ブランドカラー → `[color scheme]` に（例: `blue and teal technology color scheme`）
- ターゲットユーザー → 感情・トーンの選択に（例: B2B → `professional, trustworthy` / B2C → `friendly, approachable`）
- 既存スタイル → 一貫性のある照明・構図の選択に

### Phase 1: 用途判定とプロンプト自動生成

ユーザーの要求から用途を判定し、Phase 0 で収集したプロジェクト情報を組み込んで最適なプロンプトを自動生成する。

#### LP 用途別プロンプトテンプレート

**ヒーロー画像**:
```
[スタイル: professional/cinematic/modern] hero image of [主題],
[背景環境] with [カラーアクセント],
dynamic composition with balanced negative space for text overlay,
[照明: cinematic lighting / soft natural lighting],
conveying [感情: innovation, trust, growth],
no text, no words, no letters
```

> アスペクト比・解像度はプロンプトではなく `--aspect`/`--resolution` パラメータで指定する（`imageConfig` API に渡される）

**プロダクト画像**:
```
Clean product visualization of [プロダクト概要],
modern UI with [ビジュアル要素],
professional tech environment, bright clean lighting,
sharp focus, shallow depth of field,
[カラースキーム], premium quality
```

**フィーチャーセクション**:
```
Isometric 3D illustration of [機能名] workflow,
step-by-step process visualization, clean modern design,
[カラーパレット], modern tech aesthetic,
educational and professional tone
```

**CTA バナー**:
```
Professional banner image showing [シーン],
action-oriented composition, warm professional lighting,
high resolution, modern startup aesthetic,
space for text overlay on [left/right/center]
```

**アイコン・イラスト**:
```
Modern flat illustration of [概念],
minimal design, [カラースキーム],
clean lines, professional icon style,
1:1 aspect ratio, transparent-friendly composition
```

ユーザーが用途を明示しない場合は質問する: 「どのセクション用の画像ですか？（ヒーロー / プロダクト / フィーチャー / CTA / アイコン）」

### Phase 2: 画像生成

`scripts/generate_image.py` を実行する:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/generate_image.py \
  --prompt "生成プロンプト" \
  --output "出力パス.png" \
  --aspect "16:9" \
  --resolution "4K" \
  --model "pro"
```

#### パラメータ

| パラメータ | 値 | デフォルト |
|---|---|---|
| `--aspect` | `1:1`, `3:2`, `2:3`, `4:3`, `16:9`, `9:16`, `21:9` 等 | `16:9` |
| `--resolution` | `512`, `1K`, `2K`, `4K` | `2K` |
| `--model` | `flash`, `pro` | `pro` |
| `--output` | 出力ファイルパス | `./generated_image.png` |

#### LP 用途別デフォルト

| 用途 | アスペクト比 | 解像度 |
|---|---|---|
| ヒーロー画像 | 16:9 | 4K |
| プロダクト画像 | 16:9 または 3:2 | 2K |
| フィーチャー画像 | 1:1 または 4:3 | 1K |
| CTA バナー | 21:9 または 16:9 | 2K |
| アイコン | 1:1 | 512 |

### Phase 3: 画像編集（既存画像の変更）

既存画像を編集する場合:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/generate_image.py \
  --prompt "編集指示" \
  --input "元画像パス.png" \
  --output "出力パス.png" \
  --model "pro"
```

`--input` を指定すると、元画像を API に送信し編集モードで動作する。**画像編集は常に Pro を使用する**（元画像の品質を維持するため）。

### Phase 4: 出力と配置

1. 生成画像を適切なディレクトリに保存する（例: `public/images/`, `assets/`）
2. LP コードに画像パスを設定する
3. 必要なら `alt` テキストも提案する

## プロンプト品質ルール

- **150-300語** を目安にする（短すぎると曖昧、長すぎると品質低下）
- **構造**: `[スタイル] [主題] [環境] [テクニカル] [感情]` の順
- **テキストオーバーレイ用スペース**: ヒーロー・CTA では `space for text overlay` を明示
- **カラー統一**: プロジェクトのブランドカラーがあれば `[color] color scheme` で指定
- **禁止**: 実在ブランド名、著名人名、商標の使用

## トラブルシューティング

| 問題 | 対処 |
|---|---|
| API キーエラー | `echo $GEMINI_API_KEY` で設定確認 |
| 画像が生成されない | `responseModalities: ["TEXT", "IMAGE"]` が必要 |
| 品質が低い | `--resolution 4K` + `--model pro` に変更 |
| テキストが画像に入る | プロンプトに `no text, no words, no letters` を追加 |
| ブランドカラーと合わない | プロンプトにHexカラーコードを含める |
