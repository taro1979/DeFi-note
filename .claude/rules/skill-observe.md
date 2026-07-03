# Skill & Rule Observation Rule

## 必須ルール

以下のタイミングで観測データを記録する:

### スキル観測
1. **スキル実行が完了した直後** — outcome を判定して記録
2. **ユーザーから修正指示を受けた時** — `user_correction: true` で追加記録

### ルール違反観測
3. **ユーザーから修正指示を受け、その修正が既存ルールで防げたはずの場合** — `rule_violated` にルール名を記録

## 記録方法

`.claude/state/skill-observations.jsonl` に **1行の JSON を追記** する（Write ツールではなく Edit ツールで末尾に追記、またはファイルが空なら Write で1行書く）。

## データスキーマ

```json
{
  "ts": "ISO8601",
  "skill": "スキル名",
  "outcome": "success | partial | fail",
  "ci_passed": true,
  "user_correction": false,
  "correction_type": null,
  "rule_violated": null,
  "error_summary": null,
  "files_changed": 0,
  "note": null
}
```

## outcome の判定基準

| 値 | 条件 |
|---|---|
| `success` | スキルの全フェーズ完了、CI パス、ユーザー修正なし |
| `partial` | 一部フェーズ完了、または CI 失敗後に修正して通過 |
| `fail` | スキルが目的を達成できなかった |

## correction_type の分類

| 値 | 意味 |
|---|---|
| `trigger_mismatch` | スキルが不適切に発火した / 発火すべき時にしなかった |
| `output_quality` | 出力品質が期待以下だった |
| `missing_step` | スキルの手順に欠落があった |
| `null` | 修正なし |

## 自動診断トリガー

観測を記録した後、以下の **いずれか** に該当する場合、そのセッション内で自動的に `/skill-inspect` を実行する:

1. **同一スキルの観測が累計 5 の倍数に達した時**（5, 10, 15...）
2. **fail または user_correction を記録した直後**（即時フィードバック）

これにより、ユーザーが手動で診断を呼ぶ必要がなくなる。

## rule_violated の記録基準

ユーザーから修正指示を受けた時、`.claude/rules/` 内のルールを確認し:

- **既存ルールが明確にカバーしている** のに従わなかった → ルールファイル名を記録（例: `"security-awareness"`）
- **既存ルールの表現が曖昧** で判断を誤った → ルールファイル名 + note に「表現が曖昧」と記録
- **該当ルールが存在しない** → `rule_violated: null`、note に「ルール未整備: {領域}」と記録

スキル実行外でもユーザー修正があった場合は、`skill: "_general"` として記録する。

## ローテーション

`skill-observations.jsonl` が **200行を超えた** 場合:

1. 古い方から 100行を削除する（直近 100行を保持）
2. 削除したデータの集計サマリーを `skill-observations.jsonl` の先頭に `{"_type":"archive_summary", ...}` として1行追記する

```json
{
  "_type": "archive_summary",
  "ts": "ISO8601",
  "archived_count": 100,
  "period": "oldest_ts — newest_ts",
  "skills": {"skill_name": {"n": 10, "success": 8, "partial": 1, "fail": 1}},
  "rules": {"rule_name": {"violations": 2, "ambiguous": 1}}
}
```

ローテーションは `/skill-inspect` 実行時に Phase 0 として自動実行する。

## 注意事項

- 1スキル実行につき最低1レコード記録する
- ユーザー修正があった場合は追加で1レコード記録する（同じスキル名で `user_correction: true`）
- `files_changed` は変更されたファイル数の概算でよい
- `note` には改善のヒントになる特記事項を自由記述する
- スキル実行外のルール違反も `skill: "_general"` で記録する
