# CSV Import & ダッシュボード動作確認ガイド

## 動作確認の順番（超短縮）

### 1. ヘルスチェック

```
/api/health/supabase → ok:true
```

### 2. CSVインポート

```
/imports →
1. 見積CSV → PREVIEW → COMMIT（tenant指定）
2. 発注CSV → PREVIEW → COMMIT（tenant指定）
3. 仕入CSV → PREVIEW → COMMIT（tenant指定）
```

### 3. MVリフレッシュ

Supabase SQL Editorで実行：

```sql
select drm.refresh_finance();
```

### 4. ダッシュボード確認

```
/dashboard/owner → tenant 入力 → KPIを確認
```

## 期待値（サンプルCSV投入時）

PRJ-0001/0002 の合計：

- 見積売上: 637,000
- 見積原価: 303,000
- 発注: 200,000
- 実績: 200,000
- 見積粗利: 334,000

## ページURL一覧

| ページ         | URL                    | 説明                  |
| -------------- | ---------------------- | --------------------- |
| ヘルスチェック | `/api/health/supabase` | Supabase接続確認      |
| CSVインポート  | `/imports`             | CSV一括インポート画面 |
| 経営者ダッシュ | `/dashboard/owner`     | KPI表示画面           |
| テストページ   | `/test-csv.html`       | 簡易テスト画面        |

## トラブルシューティング

### "supabaseUrl is required"

→ Vercel環境変数が未設定

### データが表示されない

→ tenant UUIDが一致しているか確認

### 原価がnull

→ can_view_cost権限を確認

## テスト用tenant UUID

```
11111111-1111-1111-1111-111111111111
```
