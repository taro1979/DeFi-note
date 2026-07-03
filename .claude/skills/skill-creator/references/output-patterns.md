# 出力パターン

スキルが一貫した高品質の出力を生成する必要がある場合にこれらのパターンを使用してください。

## テンプレートパターン

出力フォーマットのテンプレートを提供します。ニーズに応じて厳格さのレベルを調整してください。

**厳格な要件の場合（API レスポンスやデータフォーマットなど）:**

```markdown
## レポート構造

必ずこの正確なテンプレート構造を使用すること:

# [分析タイトル]

## エグゼクティブサマリー

[主要な発見の 1 段落概要]

## 主要な発見

- 裏付けデータを含む発見 1
- 裏付けデータを含む発見 2
- 裏付けデータを含む発見 3

## 推奨事項

1. 具体的な実行可能な推奨事項
2. 具体的な実行可能な推奨事項
```

**柔軟なガイダンスの場合（適応が有効な場合）:**

```markdown
## レポート構造

これは合理的なデフォルトフォーマットですが、最善の判断を使用してください:

# [分析タイトル]

## エグゼクティブサマリー

[概要]

## 主要な発見

[発見内容に基づいてセクションを適応]

## 推奨事項

[特定のコンテキストに合わせて調整]

特定の分析タイプに応じてセクションを調整してください。
```

## 例パターン

出力品質が例を見ることに依存するスキルでは、入力/出力のペアを提供します：

```markdown
## コミットメッセージフォーマット

以下の例に従ってコミットメッセージを生成してください:

**例 1:**
入力: Added user authentication with JWT tokens
出力:
```

feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware

```

**例 2:**
入力: Fixed bug where dates displayed incorrectly in reports
出力:
```

fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation

```

このスタイルに従ってください: type(scope): 簡潔な説明、その後に詳細な説明。
```

例は説明だけよりも、Claude が望ましいスタイルと詳細レベルをより明確に理解するのに役立ちます。
