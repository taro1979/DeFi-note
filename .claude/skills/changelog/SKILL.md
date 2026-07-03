---
name: changelog
description: |
  直近のコミットから CHANGELOG.md をユーザー向けの表現で自動更新し、push まで実行する。
  TRIGGER when: 「changelog 更新して」「リリースノート書いて」「変更履歴まとめて」「/changelog」など。commit-merge 完了後に自動提案してもよい。
  DO NOT TRIGGER when: コミット前、実装途中、changelog と無関係な依頼。
---

# Changelog 自動更新ワークフロー

直近のコミットを分析し、ユーザー（利用者）に伝わる表現で CHANGELOG.md を更新する。
内部リファクタや CI 修正など、ユーザーに価値として伝わらないものは省く。

## フェーズ 1: コミット収集

### 1-1. 前回の changelog 更新ポイントを特定

```bash
git log --all --oneline --grep="changelog" --grep="CHANGELOG" --grep="リリースノート" -i --max-count=1
```

見つからない場合は、CHANGELOG.md の最新エントリに記載されたバージョンやタグ、
または直近 50 コミットを対象範囲とする。

### 1-2. 対象コミットを取得

```bash
git log <前回ポイント>..HEAD --oneline --no-merges
```

### 1-3. フィルタリング

以下のコミットは **除外** する:
- `chore:` `ci:` `style:` `refactor:` のみで、ユーザー影響なし
- merge コミット
- changelog 自体の更新コミット
- テスト追加のみ（`test:` のみ）
- 依存関係更新のみ（`deps:` `bump` のみ）

以下のコミットは **含める**:
- `feat:` — 新機能
- `fix:` — バグ修正
- `perf:` — パフォーマンス改善
- `breaking:` や `!` 付き — 破壊的変更
- Conventional Commits でなくても、ユーザー影響がある変更

## フェーズ 2: Changelog エントリ生成

### 2-1. カテゴリ分類

コミットを以下のカテゴリに分類する:

| カテゴリ | 説明 |
|---|---|
| ✨ 新機能 | 新しく追加された機能 |
| 🐛 バグ修正 | 不具合の修正 |
| ⚡ 改善 | パフォーマンス・UX の向上 |
| 💥 破壊的変更 | 既存動作が変わる変更（最上部に配置） |

- 該当コミットがないカテゴリは省略する
- 1コミット = 1エントリではない。関連コミットはまとめてよい

### 2-2. ユーザー向け表現に変換

**NG（技術的すぎる）:**
- `tRPC router に exportCsv プロシージャを追加`
- `useQuery の staleTime を 5min に変更`

**OK（ユーザー視点）:**
- `データを CSV でエクスポートできるようになりました`
- `画面の読み込み速度が改善されました`

ルール:
- 主語は「ユーザー」ではなく、動作や機能を主語にする
- 技術用語（tRPC, Drizzle, hook 等）は使わない
- 1エントリ1行、簡潔に

### 2-3. バージョン番号の決定

CHANGELOG.md の最新バージョンを確認し、以下のルールで次バージョンを決定:

- 破壊的変更あり → メジャーバージョン UP
- 新機能あり → マイナーバージョン UP
- バグ修正・改善のみ → パッチバージョン UP
- バージョン管理していない場合は日付ヘッダー (`## YYYY-MM-DD`) を使う

## フェーズ 3: CHANGELOG.md 更新

### 3-1. ファイルの存在確認

CHANGELOG.md がなければ以下のテンプレートで新規作成:

```markdown
# Changelog

このプロジェクトの注目すべき変更をまとめています。

---
```

### 3-2. エントリの挿入

最新エントリを **ファイル先頭側（`---` の直後）** に追加する。古いエントリは下に残す。

```markdown
## v1.2.0 (YYYY-MM-DD)

### 💥 破壊的変更
- ...

### ✨ 新機能
- ...

### 🐛 バグ修正
- ...

### ⚡ 改善
- ...
```

## フェーズ 4: コミットと Push

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG.md"
git push -u origin HEAD
```

- push 失敗時はリトライ（2s, 4s, 8s, 16s の指数バックオフ、最大4回）

## フェーズ 5: 完了報告

- 追加したエントリの内容を簡潔に表示
- 除外したコミット数を報告（例: 「内部変更 8 件は省略」）
- 次のアクション候補を提案（タグ付け、リリース作成など）

## オプション: 引数

ユーザーが引数を指定した場合:

| 引数 | 動作 |
|---|---|
| `--since=<ref>` | 指定リビジョン以降を対象にする |
| `--dry-run` | CHANGELOG.md を更新せず、プレビューだけ表示 |
| `--all` | フィルタリングせず全コミットを含める |
| `--no-push` | push を省略する |

## 機械可読フォーマット仕様

CHANGELOG.md はフロントエンドから自動パースされることを前提に、以下のフォーマットを **厳格に守る**。

### 構造ルール

```
# Changelog                          ← H1: 固定タイトル
                                     ← 空行
このプロジェクトの注目すべき...        ← 説明文（任意）
                                     ← 空行
---                                  ← セパレータ（1回だけ）
                                     ← 空行
## v1.2.0 (YYYY-MM-DD)              ← H2: バージョンヘッダー
                                     ← 空行
### ✨ 新機能                         ← H3: カテゴリヘッダー
- エントリ本文                        ← リストアイテム
                                     ← 空行（カテゴリ間）
## v1.1.0 (YYYY-MM-DD)              ← 次のバージョン
...
```

### パース規約

| 要素 | 正規表現 | 例 |
|---|---|---|
| バージョンヘッダー | `^## v(\d+\.\d+\.\d+) \((\d{4}-\d{2}-\d{2})\)$` | `## v1.2.0 (2026-03-21)` |
| 日付ヘッダー（SemVer 未使用時） | `^## (\d{4}-\d{2}-\d{2})$` | `## 2026-03-21` |
| カテゴリヘッダー | `^### (.+)$` | `### ✨ 新機能` |
| エントリ | `^- (.+)$` | `- データを CSV でエクスポート可能に` |
| セパレータ | `^---$` | `---` |

### カテゴリ順序（固定）

出力時は以下の順序を守る。該当なしのカテゴリは省略:

1. `### 💥 破壊的変更`
2. `### ✨ 新機能`
3. `### 🐛 バグ修正`
4. `### ⚡ 改善`

### 禁止事項

- エントリ内に Markdown リンクやインラインコードを含めない（プレーンテキストのみ）
- カテゴリヘッダーの絵文字やテキストを変えない（上記4種固定）
- バージョンヘッダーの括弧や空白の形式を変えない
- `---` セパレータより上のヘッダー・説明文を変更しない

### フロントエンド連携パターン

このフォーマットに従えば、各プロジェクトのフロントエンドは以下のいずれかで CHANGELOG.md を消費できる:

| 方式 | 実装例 | 適用場面 |
|---|---|---|
| ビルド時 MD→JSON | `scripts/parse-changelog.ts` でビルド時に JSON 化 | SSG/SSR サイト |
| API 経由 | `/api/changelog` で raw MD を返し、クライアントでパース | SPA |
| SSG ページ生成 | Next.js の `getStaticProps` 等で MD をパースして `/changelog` ページ生成 | Next.js / Astro |

パーサーの参考実装（TypeScript）:

```typescript
interface ChangelogEntry {
  version: string;       // "v1.2.0" or "2026-03-21"
  date: string;          // "2026-03-21"
  categories: {
    label: string;       // "✨ 新機能"
    items: string[];     // ["データを CSV でエクスポート可能に"]
  }[];
}

function parseChangelog(md: string): ChangelogEntry[] {
  const body = md.split(/^---$/m)[1] ?? "";
  const entries: ChangelogEntry[] = [];
  let current: ChangelogEntry | null = null;
  let currentCat: { label: string; items: string[] } | null = null;

  for (const line of body.split("\n")) {
    const versionMatch = line.match(
      /^## v(\d+\.\d+\.\d+) \((\d{4}-\d{2}-\d{2})\)$/,
    );
    const dateMatch = !versionMatch && line.match(/^## (\d{4}-\d{2}-\d{2})$/);
    const catMatch = line.match(/^### (.+)$/);
    const itemMatch = line.match(/^- (.+)$/);

    if (versionMatch) {
      current = {
        version: `v${versionMatch[1]}`,
        date: versionMatch[2],
        categories: [],
      };
      entries.push(current);
      currentCat = null;
    } else if (dateMatch) {
      current = {
        version: dateMatch[1],
        date: dateMatch[1],
        categories: [],
      };
      entries.push(current);
      currentCat = null;
    } else if (catMatch && current) {
      currentCat = { label: catMatch[1], items: [] };
      current.categories.push(currentCat);
    } else if (itemMatch && currentCat) {
      currentCat.items.push(itemMatch[1]);
    }
  }
  return entries;
}
```

このパーサーはあくまで参考。各プロジェクトの技術スタックに合わせて実装する。
スキル側の責務は **フォーマットを厳格に保つこと** のみ。

## 注意事項

- CHANGELOG.md の既存エントリは **絶対に編集・削除しない**
- エントリが0件（全コミット除外）の場合は「更新対象なし」と報告して終了
- commit-merge スキル完了後、ユーザーに `/changelog` の実行を提案してよい
