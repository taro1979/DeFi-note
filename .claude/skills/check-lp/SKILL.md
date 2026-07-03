---
name: check-lp
description: |
  Lightweight LP sanity check that runs on every LP edit.
  TRIGGER when: `LandingPage.{tsx,jsx}`、`client/src/pages/*Landing*`、`client/src/components/landing/**`、LP用 i18n 文言を変更した時。会話で LP修正、LP直して、LP変更、LP編集、LPセクション追加、LP更新、hero、faq、cta、pricing section、LP文言 の依頼が出た時。
  DO NOT TRIGGER when: 通常アプリ画面の修正、Billing ページだけの変更、LPと無関係な pricing 修正、バックエンドのみの変更。
  Quick pass/fail — no heavy analysis.
---

# check-lp — LP 軽量サニティチェック

LP を修正するたびに自動発火する軽量チェック。数秒で完了し、✅/❌ を返す。

## 実行手順

1. LP ファイルを特定（`**/LandingPage.{tsx,jsx}` 等）
2. 以下の項目を **Grep/Read のみ** で高速チェック
3. 結果を1テーブルで出力

## チェック項目

### 1. 11セクション存在チェック
LP コンポーネントを Read し、以下のセクションが存在するか確認:
- Hero（価格ライン or キャッチコピー）
- ソーシャルプルーフ（実績・導入数）
- 問題提起（課題共感）
- 解決策
- 機能紹介（`id="features"` 等）
- コスト訴求（`id="why-cheap"` or `id="pricing"` 等）
- 品質証明（`id="security"` 等）
- 比較表（`COMPETITOR` or 比較テーブル）
- FAQ（`id="faq"` 等）
- 最終CTA
- フッター（`<footer>`）

欠落セクションがあれば ❌ で報告。

### 2. CTA 配置チェック
`handleLogin` や CTA ボタンが **3箇所以上** に配置されているか Grep で確認。

### 3. 煽り表現チェック
i18n の ja.json で `激安|破格|最安|爆安|格安|超安|特価|衝撃|驚愕` を Grep。
LP で実際に使用されているキーに該当するものがあれば ❌。

### 4. ハードコード文字列チェック
LP ファイル内に i18n を通さない日本語/英語テキストが `>` の直後にないか簡易 Grep。
`{t("` を使っていないテキスト要素を検出。

### 5. セクション間余白チェック
`<section` タグに `py-20` 以上のクラスがあるか Grep。`py-10` 以下があれば ⚠️。

## 出力フォーマット

```
## check-lp 結果

| # | チェック | 結果 |
|---|---------|------|
| 1 | 11セクション | ✅ 11/11 or ❌ N/11（欠落: ...） |
| 2 | CTA 配置 | ✅ N箇所 or ❌ 不足 |
| 3 | 煽り表現 | ✅ なし or ❌ 検出（...） |
| 4 | ハードコード文字列 | ✅ なし or ⚠️ N件 |
| 5 | セクション余白 | ✅ 統一 or ⚠️ 狭い箇所あり |
```

❌ がある場合のみ、該当行と修正提案を1〜2行で添える。
詳細なレビューが必要な場合は `/review-lp-uiux` を案内する。
