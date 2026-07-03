---
name: cmux-subagent
description: cmux 環境でサブエージェントを可視ペインに起動し、タスク実行の様子をリアルタイムで見えるようにする。`CMUX_SOCKET_PATH` が存在する時にサブエージェントを並列実行する場合、Agent ツールの代わりにこのスキルのパターンを使用する。「cmuxでサブエージェント」「見えるようにタスクを投げて」「並列で別ペインに」「cmux subagent」などに対応。
user-invocable: false
---

# cmux 可視サブエージェント

cmux 環境で Claude Code サブエージェントを別ペインに起動し、タスクの実行過程をユーザーに見える形で実行する。

## 前提条件

`CMUX_SOCKET_PATH` 環境変数が存在する場合のみ有効。存在しない場合は通常の Agent ツールを使用する。

## いつ使うか

- サブエージェントに委任するタスクが **ユーザーに実行過程を見せたい** 場合
- 並列で複数のタスクを投げ、**進捗をリアルタイム監視** したい場合
- 調査・探索タスクで **結果を確認しながら進めたい** 場合

通常の Agent ツールで十分な場合（結果だけ欲しい、軽い調査）はそちらを使う。

## ワークフロー

### Step 1: 環境確認

```bash
# cmux 環境かチェック
test -n "$CMUX_SOCKET_PATH" && echo "cmux: available" || echo "cmux: not available"

# 現在のトポロジー確認
cmux tree
```

### Step 2: 遊休ペイン検索 → 配置

新しいペインを作る前に、既存の遊休ペインを探す。

```bash
# 全サーフェス一覧
cmux list-pane-surfaces

# 各サーフェスの状態を確認（プロンプトのみ = 遊休）
cmux read-screen --surface surface:N
```

遊休ペインがなければ新規作成:

```bash
# 同一ワークスペース内に分割（推奨 — PTY遅延初期化問題を回避）
SURF=$(cmux new-split right | awk '{print $2}')
cmux rename-tab --surface $SURF "Task-Name"
```

### Step 3: Claude Code 起動

```bash
cmux send --surface $SURF "claude --dangerously-skip-permissions\n"
```

### Step 4: Trust 検出 → 承認 → 起動完了待機

**重要**: `--dangerously-skip-permissions` 使用時、Bypass Permissions の承認プロンプトが表示される。選択肢内に `❯` マーカーがあるため、Trust プロンプトの検出は `"Yes, I accept"` や `"No, exit"` で判定する。

```bash
# ポーリングで Trust/Bypass プロンプトを検出して承認
for i in $(seq 1 30); do
  screen=$(cmux read-screen --surface $SURF)
  # Bypass Permissions 承認プロンプトを検出
  if echo "$screen" | grep -q "Yes, I accept"; then
    # Option 2 を選択: 下矢印キー → Enter（キー名は arrow-down）
    cmux send-key --surface $SURF arrow-down
    sleep 0.5
    cmux send-key --surface $SURF return
    # arrow-down が未対応の場合のフォールバック: "2" を送信
    # cmux send --surface $SURF "2\n"
    break
  fi
  # 通常の Trust プロンプト
  if echo "$screen" | grep -qi "trust.*directory"; then
    cmux send-key --surface $SURF return
    break
  fi
  # すでにプロンプト表示済み（行頭の独立した ❯）
  if echo "$screen" | grep -qE "^❯\s*$"; then
    break
  fi
  sleep 2
done

# 入力プロンプト（行頭の独立した ❯）が出るまで待機
for i in $(seq 1 30); do
  screen=$(cmux read-screen --surface $SURF)
  if echo "$screen" | grep -qE "^❯\s*$"; then
    break
  fi
  sleep 2
done
```

> **注意**: `grep -q "❯"` は Trust プロンプトの選択肢マーカーにも誤マッチする。必ず `grep -qE "^❯\s*$"` で行頭の独立した `❯` のみを検出すること。

### Step 5: タスク送信

```bash
# 単一行の指示
cmux send --surface $SURF "調査して: プロジェクトのテスト構成を把握し、カバレッジの弱い箇所を報告して\n"

# ステータス表示
cmux set-status task1 "調査中" --icon hammer
```

複数行の指示を送る場合は `send-key return` で改行:

```bash
cmux send --surface $SURF "以下を実装して:"
cmux send-key --surface $SURF return
cmux send --surface $SURF "1. ユーザー一覧API"
cmux send-key --surface $SURF return
cmux send --surface $SURF "2. ページネーション対応"
cmux send-key --surface $SURF return
```

### Step 6: 完了検出

```bash
# ❯ プロンプトの再表示をポーリング（行頭の独立した ❯ のみ検出）
for i in $(seq 1 120); do
  screen=$(cmux read-screen --surface $SURF)
  if echo "$screen" | tail -8 | grep -qE "^❯\s*$"; then
    break
  fi
  sleep 5
done
```

> **注意**: `tail -8` で末尾を広めに取る。Claude Code の出力にはステータスバー等が含まれるため `tail -3` では不足する場合がある。

### Step 7: 結果回収 & クリーンアップ

```bash
# ステータスクリア
cmux clear-status task1

# 全出力を取得（scrollback でバッファ全体）
result=$(cmux read-screen --surface $SURF --scrollback)

# Claude を終了してペインを閉じる
cmux send --surface $SURF "/exit\n"
sleep 2
cmux close-surface --surface $SURF
```

## 並列実行パターン

複数タスクを同時に投げる場合:

```bash
# 1. 複数ペインを作成
SURF1=$(cmux new-split right | awk '{print $2}')
cmux rename-tab --surface $SURF1 "Researcher"

SURF2=$(cmux new-split down | awk '{print $2}')
cmux rename-tab --surface $SURF2 "Implementer"

# 2. それぞれ Claude Code を起動（Trust 処理は省略 — 同パターン）
cmux send --surface $SURF1 "claude --dangerously-skip-permissions\n"
cmux send --surface $SURF2 "claude --dangerously-skip-permissions\n"

# 3. 起動完了を待ってタスク送信
cmux send --surface $SURF1 "プロジェクトのAPI構成を調査して\n"
cmux set-status task1 "API調査" --icon hammer

cmux send --surface $SURF2 "テストカバレッジの弱い箇所を特定して\n"
cmux set-status task2 "テスト調査" --icon hammer

# 4. 両方の完了をポーリング
# ... （Step 6 と同じパターンを各 SURF に対して実行）

# 5. 結果回収
result1=$(cmux read-screen --surface $SURF1 --scrollback)
result2=$(cmux read-screen --surface $SURF2 --scrollback)
```

## 重要なルール

- **`--surface` は同一ワークスペース内でのみ有効**。別ワークスペースのサーフェスには `--workspace` を使う
- **send で複数行を送らない**。`\n` は末尾の1個だけが Enter として機能する。途中改行は `send-key return`
- **制御キーは `send-key`** で送る。`send "C-c"` や `send "\x03"` は動作しない
- **`/exit` だけではペインが残る**。`/exit` → `sleep 2` → `close-surface` でペインも閉じる
- **read-screen が空なら `refresh-surfaces`** を実行してからリトライ
- **遊休ペインを再利用**。新規 split する前に `list-pane-surfaces` で遊休を探す
- **ペインに名前をつける**。`rename-tab` で用途がわかる名前を設定する

## read-screen トラブルシューティング

| 問題 | 対処 |
|------|------|
| 出力が空 / 古い | `cmux refresh-surfaces` してから再読み取り |
| 長い出力が切れる | `--scrollback` を追加 |
| `Surface is not a terminal` | PTY 遅延初期化問題。GUI で一度ワークスペースを表示する必要あり |
