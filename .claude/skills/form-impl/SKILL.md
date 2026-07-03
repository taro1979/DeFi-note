---
name: form-impl
description: |
  フォーム実装時にDB→Zod→FEの三層整合性を検証し、バリデーション・エラー表示まで一貫して実装する。
  TRIGGER when: フォームの新規作成・修正・バリデーション追加の依頼。「フォームを作って」「入力画面を実装して」「バリデーションを追加して」「フォームのエラー表示を直して」など。
  DO NOT TRIGGER when: フォームに関係ないUI実装、API実装のみ、テーブル表示の実装。
---

# フォーム実装ワークフロー

フォーム（作成・編集）を実装または修正する際に使用する。
DB定義を起点に、Zodスキーマ・FE表示の整合性を保証する。

## フェーズ 1: DBスキーマ確認

対象テーブルの `drizzle/schema.ts` を読み、全カラムの以下を把握する:

| 確認項目 | 例 |
|---------|---|
| 型 | `varchar(255)`, `int`, `decimal(10,2)`, `text`, `boolean`, `enum` |
| NULL許可 | `.notNull()` の有無 |
| デフォルト値 | `.default(...)` の有無 |
| 制約 | `.unique()`, 参照キー, `length` 上限 |

結果をテーブルにまとめて宣言する:

```
| カラム | 型 | NULL | デフォルト | FE必須 | 入力形式 |
|--------|-----|------|-----------|--------|---------|
| name   | varchar(255) | NO | - | * | テキスト |
| email  | varchar(320) | YES | NULL | - | email |
```

## フェーズ 2: Zodスキーマ整合

`server/routers.ts` の該当 input スキーマを確認・修正する:

### マッピングルール

| DB定義 | Zodスキーマ |
|--------|------------|
| `NOT NULL` + 文字列 | `z.string().min(1)` |
| `NULL許可` + email | `z.union([z.string().email(), z.literal("")]).optional()` |
| `NULL許可` + url | `z.union([z.string().url(), z.literal("")]).optional()` |
| `NULL許可` + 文字列 | `z.string().optional()` |
| `NOT NULL` + デフォルトあり | `z.xxx().default(value)` |
| `boolean` | `z.boolean().optional()` (デフォルトあり) or `z.boolean()` |
| `int NULL` | `z.number().int().nullish()` |
| `enum` | `z.enum([...])` |
| `decimal` | `z.string().regex(/^\d+(\.\d{1,2})?$/)` |

### mutation内の変換ルール

- NULL許可フィールド: `input.field || null`（`??` ではなく `||` — 空文字はnullishではない）
- optional フィールド: `input.field ?? defaultValue`

## フェーズ 3: FEフォーム実装

### 必須表示
- DB `NOT NULL` かつデフォルトなし → Label に `*` マーク
- placeholder で入力例を示す

### 入力制約の明示
- email → `type="email"` + placeholder `"contact@example.com"`
- url → placeholder `"https://example.com"`
- number → `type="number"` + `min` / `max` / `step` 属性
- 文字数制限 → `maxLength` 属性
- boolean → `Switch` コンポーネント

### エラー表示
1. **クライアント側バリデーション**: 送信前に必須チェック・形式チェック
2. **サーバーエラーのインライン表示**: ZodError の `path` からフィールド特定 → 該当フィールド下にエラーメッセージ表示
3. **toast**: フィールド特定できないエラーのフォールバック

### エラー処理パターン

```typescript
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

onError: (err) => {
  // tRPC Zod バリデーションエラーをパース
  try {
    const zodErrors = JSON.parse(err.message);
    if (Array.isArray(zodErrors)) {
      const errors: Record<string, string> = {};
      for (const e of zodErrors) {
        const field = e.path?.[0];
        if (field) errors[field] = e.message;
      }
      setFieldErrors(errors);
      return;
    }
  } catch {}
  toast.error(err.message);
}
```

```tsx
<div className="space-y-2">
  <Label>メール</Label>
  <Input value={form.email} ... />
  {fieldErrors.email && (
    <p className="text-sm text-destructive">{fieldErrors.email}</p>
  )}
</div>
```

## フェーズ 4: 検証

1. 全必須フィールドを空で送信 → エラーが表示されることを確認
2. 任意フィールドを空で送信 → エラーなく保存されることを確認
3. 不正な形式（無効なemail等）で送信 → 適切なエラーが表示されることを確認
4. 正常値で送信 → DB に正しく保存されることを確認
