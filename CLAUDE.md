# Project Name

このファイルは、このプロジェクトで Claude が判断と実装を行うための最上位ガイドです。
最初に `TEMPLATE_SETUP.md` を埋め、その後このファイルをプロジェクト固有の内容に更新してください。

## 読み方ガイド

| やりたいこと | まず読む | 次に読む |
|---|---|---|
| 全体像を掴む | `CLAUDE.md` | `docs/architecture.md` |
| 新機能を実装する | `spec/` の該当仕様 | `docs/architecture.md` |
| 次のタスクを探す | `todo.md` | `docs/domain/phase-roadmap.md` |
| ローカル開発 | `docs/local-dev.md` | `package.json` |
| ドメイン理解 | `docs/domain/business-model.md` | `docs/domain/data-model.md` |

## リポジトリ構成

以下は例です。実際の構成に合わせて更新してください。

```text
src/        アプリケーション本体
app/        Web / API エントリポイント
packages/   共有ライブラリやモジュール
scripts/    開発・運用スクリプト
docs/       プロジェクト知識ベース
```

## docs/ の役割

| ファイル | 役割 |
|---|---|
| `docs/architecture.md` | アーキテクチャマップ。レイヤー、依存方向、主要フロー |
| `todo.md` | 唯一のタスク管理ソース |
| `spec/` | 機能仕様書 |
| `docs/domain/` | ビジネスルール、データモデル、Phase 計画 |
| `docs/local-dev.md` | ローカル開発手順 |

## 標準コマンド

移植先の `package.json` に合わせてこのセクションを更新してください。

```bash
pnpm dev          # 開発サーバー
pnpm build        # 本番ビルド
pnpm test         # テスト
pnpm check        # 型チェック
pnpm format       # Biome フォーマット
pnpm lint         # Biome + Oxlint リント
pnpm lint:fix     # リント自動修正
```

## Critical Rules

- 実装前に `docs/architecture.md` と `spec/` の関連仕様を読む
- 仕様やスキーマを変更したら、関連ドキュメントも同じ変更で更新する
- 完了報告前に、存在するテスト・型チェック・ビルドを実行する
- 秘密情報はハードコードしない
- 判断を求める時は、案ごとのメリット・デメリットを明示して要約する
