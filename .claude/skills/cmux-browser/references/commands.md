# cmux browser コマンド全リファレンス

ソース: https://cmux.com/ja/docs/browser-automation

## サーフェス指定

全コマンド共通。位置引数またはフラグで指定:
```
cmux browser surface:2 <command>
cmux browser --surface surface:2 <command>
```

---

## ナビゲーション

| コマンド | 説明 |
|---|---|
| `open <URL>` | 新規ブラウザサーフェスでURLを開く |
| `open-split <URL>` | 分割でブラウザを開く |
| `navigate <URL> [--snapshot-after]` | URLへナビゲート |
| `back` | 戻る |
| `forward` | 進む |
| `reload [--snapshot-after]` | 再読み込み |
| `url` | 現在のURLを取得 |
| `identify` | サーフェス識別 |
| `focus-webview` | WebViewにフォーカス |
| `is-webview-focused` | WebViewがフォーカス中か確認 |

---

## 待機 (wait)

```
cmux browser surface:2 wait [options]
```

| オプション | 説明 |
|---|---|
| `--load-state <state>` | ページロード状態（complete等） |
| `--selector <css>` | CSS セレクタで要素待機 |
| `--text <text>` | テキスト出現を待機 |
| `--url-contains <fragment>` | URLパターン待機 |
| `--function <js>` | JavaScript式がtrueになるまで待機 |
| `--timeout-ms <ms>` | タイムアウト（ミリ秒） |

---

## DOM操作

### クリック・ホバー
```
click <selector> [--snapshot-after]
dblclick <selector>
hover <selector>
focus <selector>
```

### テキスト入力
```
type <selector> <text>          # キーストローク入力
fill <selector> --text <value>  # 値を直接設定（クリアは --text ""）
press <key>                     # キー入力（Enter, Tab, Escape等）
keydown <key>                   # キー押下
keyup <key>                     # キー離上
```

### フォーム要素
```
check <selector>                # チェックON
uncheck <selector>              # チェックOFF
select <selector> <value>       # セレクトボックス選択
```

### スクロール
```
scroll --dy <pixels> [--snapshot-after]
scroll --selector <css> --dx <px> --dy <px>
scroll-into-view <selector>
```

---

## インスペクション

### snapshot（アクセシビリティツリー）
```
snapshot [options]
  --interactive    インタラクティブ要素のみ
  --compact        コンパクト表示
  --selector <css> 特定要素のみ
  --max-depth <n>  深さ制限
```

### screenshot
```
screenshot --out <path>
```

### get（要素情報取得）
```
get title                              # ページタイトル
get url                                # 現在のURL
get text <selector>                    # テキスト内容
get html <selector>                    # HTML
get value <selector>                   # input/selectの値
get attr <selector> --attr <name>      # 属性値
get count <selector>                   # 要素数
get box <selector>                     # バウンディングボックス
get styles <selector> --property <prop> # CSSプロパティ
```

### is（状態確認）
```
is visible <selector>
is enabled <selector>
is checked <selector>
```

### find（要素検索）
```
find role <role> --name <name>    # ARIAロールで検索
find text <text>                  # テキストで検索
find label <label>                # ラベルで検索
find placeholder <text>           # プレースホルダで検索
find alt <text>                   # alt属性で検索
find title <text>                 # title属性で検索
find testid <id>                  # data-testidで検索
find first <selector>             # 最初の要素
find last <selector>              # 最後の要素
find nth <n> <selector>           # N番目の要素
```

### highlight
```
highlight <selector>              # 要素をハイライト表示
```

---

## JavaScript実行・注入

```
eval <expression>                 # JS式を評価して結果を返す
eval --script <expression>        # スクリプトとして実行
addinitscript <code>              # ページ初期化時に実行されるスクリプト
addscript <code>                  # スクリプトを実行
addstyle <css>                    # CSSを注入
```

---

## フレーム・ダイアログ・ダウンロード

### frame（iframe操作）
```
frame <selector>                  # iframeに切り替え
frame main                       # 最上位ドキュメントに戻る
```

### dialog（アラート/確認）
```
dialog accept [text]              # 承認（テキスト入力可）
dialog dismiss                    # 却下
```

### download
```
download --path <path> --timeout-ms <ms>
```

---

## タブ操作

```
tab list                          # タブ一覧
tab new <URL>                     # 新規タブ
tab switch <index|surface>        # タブ切替
tab close [surface]               # タブ閉じる
```

---

## コンソール・エラー

```
console list                      # コンソールログ一覧
console clear                     # クリア
errors list                       # エラー一覧
errors clear                      # クリア
```

---

## 状態・セッション管理

### cookies
```
cookies get [--name <name>]
cookies set <name> <value> --domain <domain> --path <path>
cookies clear [--name <name> | --all]
```

### storage
```
storage local get <key>
storage local set <key> <value>
storage local clear
storage session get <key>
storage session set <key> <value>
storage session clear
```

### state（セッション保存/復元）
```
state save <path>
state load <path>
```
