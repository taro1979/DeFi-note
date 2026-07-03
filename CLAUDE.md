# DeFi Note

このリポジトリは、DeFi の歴史、主要プロトコル、カテゴリ、調査メモを静的 HTML と JavaScript でまとめるサイトです。

## プロジェクト概要

- 公開サイトは GitHub Pages で配信する想定です。
- 主要ページはリポジトリ直下の HTML ファイルです。
- 共通データ、スタイル、クライアント側スクリプトは `assets/` にあります。
- `build_multisite.js` はサイト生成・更新用の Node.js スクリプトです。

## 主要ファイル

| パス | 役割 |
|---|---|
| `index.html` | トップページ |
| `defi_timeline.html` | DeFi 年表の詳細ページ |
| `timeline.html` | 年表ナビゲーション |
| `protocols.html` | プロトコル一覧 |
| `categories.html` | カテゴリ一覧 |
| `sources.html` | 参考情報・出典 |
| `deep-research.html` | 詳細調査メモ |
| `research-method.html` | 調査方法 |
| `underworld.html` | リスク・事件・裏側の解説 |
| `assets/defi-data.js` | サイトで利用する DeFi データ |
| `assets/site.css` | 共通スタイル |
| `assets/site.js` | 共通のクライアント側処理 |
| `build_multisite.js` | HTML 生成・更新用スクリプト |

## 作業方針

- 既存の静的サイト構成を維持し、不要なフレームワークは追加しないでください。
- 表示文言、データ、出典を変更した場合は、関連ページ間で矛盾が出ないように確認してください。
- DeFi の事実関係、日付、現在のプロトコル状況を扱う場合は、最新情報を確認してください。
- API キー、ウォレット秘密鍵、シードフレーズ、未公開メモなどの機密情報はコミットしないでください。
- 大きな構成変更をする場合は、先に `README.md` とこのファイルを更新してください。

## ローカル確認

このサイトは静的 HTML なので、基本的には `index.html` をブラウザで開けば確認できます。
ローカルサーバーで確認する場合は、次のように実行できます。

```bash
python -m http.server 8000
```

その後、ブラウザで `http://localhost:8000/` を開いてください。

Node.js が利用できる環境では、生成スクリプトを直接実行できます。

```bash
node build_multisite.js
```

## GitHub Pages

GitHub Pages は `main` ブランチのリポジトリルートから配信する設定です。
Pages 用に `.nojekyll` を置いているため、GitHub Pages の Jekyll 処理は無効化されています。

## Claude 利用時の注意

- このプロジェクトには MySQL、Docker、npm パッケージ前提の常時起動処理はありません。
- `.claude/settings.json` は静的 HTML プロジェクト向けに、秘密情報チェック中心の hook 構成にしています。
- `.claude/skills/` と `.claude/rules/` はテンプレート由来の補助ルールです。必要に応じてこのリポジトリ向けに調整してください。
