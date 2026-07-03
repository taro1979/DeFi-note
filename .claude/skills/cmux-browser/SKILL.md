---
name: cmux-browser
description: cmux 環境でブラウザサーフェスを操作し、Webページの情報取得・DOM操作・フォーム入力・スクリーンショット等を自律的に行う。cmux上で動作している時、隣のサーフェスのブラウザからフィードバックを得てデバッグや検証を進める。「ブラウザで確認」「画面を見て」「ページを開いて」「DOMを操作」「スクリーンショット撮って」「ブラウザでデバッグ」「cmux browser」などに対応。
metadata:
  version: 1.1.0
---

# cmux ブラウザ自律操作

cmux のブラウザサーフェスを使い、Webページの閲覧・操作・検証を自律的に行う。

## Phase 0: ブラウザサーフェスの特定（必須）

**`surface:2` はハードコードしない。** サーフェスIDはワークスペースごとに異なるため、毎回動的に特定する。

### 手順

```bash
# 1. 現在のワークスペースのサーフェス一覧を取得
cmux list-pane-surfaces

# 出力例:
# surface:15  Yazi: ~/work/project
# * surface:16  ⠂ Claude Code  [selected]
# surface:17  Browser: http://localhost:5173
```

ブラウザサーフェスが見つかったら、そのIDを以降のコマンドで使用する。

```bash
# 2. ブラウザサーフェスの存在確認
cmux browser --surface surface:17 identify
```

### ブラウザが存在しない場合

```bash
# 新規ブラウザを開く（URLなしで空タブ、またはURL指定）
cmux browser open http://localhost:5173

# 分割で開く
cmux browser open-split http://localhost:5173

# 開いた後、再度 list-pane-surfaces でサーフェスIDを取得する
cmux list-pane-surfaces
```

### 変数化パターン（推奨）

特定したサーフェスIDを変数に入れて使い回す:

```bash
BSURF="surface:17"
cmux browser $BSURF snapshot --interactive --compact
cmux browser $BSURF url
```

以降の例では `$BSURF` を使用する。実際のコマンドでは特定したサーフェスIDに置き換えること。

## ページ情報を取得する

```bash
# アクセシビリティツリー（DOM構造の把握に最適）
cmux browser $BSURF snapshot --interactive --compact

# 特定要素のみ
cmux browser $BSURF snapshot --selector "main" --max-depth 5

# スクリーンショット（視覚的確認）
cmux browser $BSURF screenshot --out /tmp/cmux-page.png

# 現在のURL
cmux browser $BSURF url

# ページタイトル
cmux browser $BSURF get title

# テキスト取得
cmux browser $BSURF get text "h1"
cmux browser $BSURF get html "main"
```

## ナビゲーション

```bash
# navigate と --snapshot-after は分けて実行する（※注意事項参照）
cmux browser $BSURF navigate "http://localhost:5173"
cmux browser $BSURF wait --load-state complete --timeout-ms 5000
cmux browser $BSURF snapshot --interactive --compact

cmux browser $BSURF back
cmux browser $BSURF forward
cmux browser $BSURF reload
```

> **注意: `navigate` と `--snapshot-after` の罠**
>
> `cmux browser $BSURF navigate <URL> --snapshot-after` は **URL に `--snapshot-after` が結合されて壊れることがある**。
> 安全のため、navigate → wait → snapshot を3ステップで実行すること。
>
> ```bash
> # NG: URLが壊れる可能性
> cmux browser $BSURF navigate http://localhost:5173 --snapshot-after
>
> # OK: 分けて実行
> cmux browser $BSURF navigate "http://localhost:5173"
> cmux browser $BSURF wait --load-state complete --timeout-ms 5000
> cmux browser $BSURF snapshot --interactive --compact
> ```

## DOM操作

```bash
# クリック
cmux browser $BSURF click "button[type='submit']" --snapshot-after

# テキスト入力
cmux browser $BSURF type "#search" "検索テキスト"
cmux browser $BSURF fill "#email" --text "user@example.com"

# フォームクリア
cmux browser $BSURF fill "#email" --text ""

# キー入力
cmux browser $BSURF press Enter

# チェックボックス
cmux browser $BSURF check "#terms"
cmux browser $BSURF uncheck "#newsletter"

# セレクトボックス
cmux browser $BSURF select "#region" "us-east"

# スクロール
cmux browser $BSURF scroll --dy 800 --snapshot-after
cmux browser $BSURF scroll-into-view "#pricing"
```

### ref の不安定性への対処

snapshot で得られる `[ref=eN]` は **その snapshot の時点でのみ有効**。Reactアプリなど仮想DOMを使うSPAでは、snapshot と click の間に再レンダリングが走り ref が無効化されることがある。

```bash
# NG: snapshot → 時間経過 → click で ref が無効化
cmux browser $BSURF snapshot --interactive --compact
# ... 何か他の作業 ...
cmux browser $BSURF click "[ref=e7]"  # → not_found エラー

# OK: CSSセレクタやテキストで直接指定
cmux browser $BSURF click "button:has-text('送信')"

# OK: eval で JS 経由でクリック（最も確実）
cmux browser $BSURF eval "document.querySelector('button[aria-label=\"送信\"]')?.click()"

# OK: snapshot 直後に即 click
cmux browser $BSURF snapshot --interactive --compact
cmux browser $BSURF click "[ref=e7]"  # snapshot 直後なら成功率が高い
```

**推奨: ref ではなく CSS セレクタ、aria-label、テキスト内容で要素を指定する。ref は最後の手段。**

## 要素検索・状態確認

```bash
# 要素を探す（複数の方法）
cmux browser $BSURF find role button --name "送信"
cmux browser $BSURF find text "注文完了"
cmux browser $BSURF find label "メールアドレス"
cmux browser $BSURF find testid "save-btn"

# 要素の状態確認
cmux browser $BSURF is visible "#checkout"
cmux browser $BSURF is enabled "button[type='submit']"

# 要素数カウント
cmux browser $BSURF get count ".row"

# 属性取得
cmux browser $BSURF get attr "a.primary" --attr href
cmux browser $BSURF get value "#email"
```

## 待機条件

ページ遷移やAPI応答を待つ場合:

```bash
cmux browser $BSURF wait --load-state complete --timeout-ms 15000
cmux browser $BSURF wait --selector "#checkout" --timeout-ms 10000
cmux browser $BSURF wait --text "読み込み完了"
cmux browser $BSURF wait --url-contains "/dashboard"
cmux browser $BSURF wait --function "window.__appReady === true"
```

## JavaScript 実行

```bash
cmux browser $BSURF eval "document.title"
cmux browser $BSURF eval "document.querySelectorAll('.item').length"
cmux browser $BSURF addscript "document.querySelector('#debug')?.remove()"
cmux browser $BSURF addstyle "#banner { display: none !important; }"
```

### localStorage / sessionStorage の確認

```bash
cmux browser $BSURF eval "JSON.stringify({userId: !!localStorage.getItem('userId'), token: !!localStorage.getItem('token')})"
```

## コンソール・エラー確認

```bash
cmux browser $BSURF console list
cmux browser $BSURF errors list
```

## 自律操作の原則

1. **Phase 0 を必ず実行** — `cmux list-pane-surfaces` でブラウザサーフェスを特定してから操作を開始する
2. **snapshot を多用する** — 操作前後で snapshot を取り、状態変化を確認する
3. **navigate は3ステップ** — navigate → wait → snapshot。`--snapshot-after` は navigate では使わない
4. **ref よりセレクタ** — `[ref=eN]` は不安定。CSSセレクタ、aria-label、eval を優先する
5. **wait で確実に待つ** — ページ遷移やAjax後は wait で完了を確認してから次の操作へ
6. **エラー時はコンソールを確認** — `errors list` と `console list` で問題を特定する
7. **eval はフォールバック** — セレクタでクリックできない場合は `eval` で JS 経由で操作する

## 典型的なユースケース

### ローカル開発サーバーの動作確認

```bash
# 1. ブラウザを開く
cmux browser open http://localhost:5173

# 2. サーフェスIDを取得
cmux list-pane-surfaces

# 3. 状態確認（$BSURFは実際のIDに置換）
cmux browser $BSURF snapshot --interactive --compact
```

### フォーム送信テスト

```bash
cmux browser $BSURF fill "#name" --text "テストユーザー"
cmux browser $BSURF fill "#email" --text "test@example.com"
cmux browser $BSURF click "button[type='submit']" --snapshot-after
cmux browser $BSURF wait --text "送信完了" --timeout-ms 5000
```

### SPAの画面遷移テスト

```bash
# ボタンクリックで画面遷移
cmux browser $BSURF eval "document.querySelector('button[aria-label=\"設定\"]')?.click()"
cmux browser $BSURF wait --url-contains "/settings" --timeout-ms 3000
cmux browser $BSURF snapshot --interactive --compact
```

### デバッグ（コンソールログ確認）

```bash
cmux browser $BSURF eval "console.log(JSON.stringify(window.__APP_STATE__))"
cmux browser $BSURF console list
```

## トラブルシューティング

| エラー | 原因 | 対処 |
|--------|------|------|
| `Surface not found or not a browser` | サーフェスIDが間違っている or ブラウザがない | `cmux list-pane-surfaces` で再確認 |
| `Element "[ref=eN]" not found` | ref が無効化された（SPAの再レンダリング） | CSSセレクタ or eval で操作 |
| navigate 後に Google 検索結果が表示される | `--snapshot-after` がURLに結合された | navigate と snapshot を分離 |
| `Workspace not found` | 別のワークスペースで実行している | `cmux current-workspace` で確認 |

## 詳細リファレンス

- **全コマンド一覧と詳細オプション**: [references/commands.md](references/commands.md)
