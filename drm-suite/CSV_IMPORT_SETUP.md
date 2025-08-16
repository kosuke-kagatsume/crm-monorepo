# CSV Import Sprint 0 - セットアップガイド

## 1. 環境変数設定

### ローカル開発環境

`.env.local` ファイルを作成：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...   # 任意
```

### Vercel環境

1. Vercel Dashboardにアクセス
2. Settings → Environment Variables
3. 上記3つの環境変数を追加
4. Development/Preview/Production全てにチェック
5. 再デプロイを実行

## 2. ヘルスチェック

ブラウザでアクセス：

```
https://your-app.vercel.app/api/health/supabase
```

成功時のレスポンス：

```json
{
  "ok": true,
  "using": "service_role",
  "rls_error": null
}
```

## 3. CSVインポートテスト

### テストページ

```
https://your-app.vercel.app/test-csv.html
```

### サンプルCSVファイル

- `/seed/csv/sample_estimates.csv` - 見積データ
- `/seed/csv/sample_purchase_orders.csv` - 発注データ
- `/seed/csv/sample_bills.csv` - 請求データ

### コマンドラインテスト

```bash
# 見積インポート
curl -X POST -F "csv=@seed/csv/sample_estimates.csv" \
  -F "tenant=11111111-1111-1111-1111-111111111111" \
  "https://your-app.vercel.app/api/imports/estimate/commit"

# 発注インポート
curl -X POST -F "csv=@seed/csv/sample_purchase_orders.csv" \
  -F "tenant=11111111-1111-1111-1111-111111111111" \
  "https://your-app.vercel.app/api/imports/po/commit"

# 請求インポート
curl -X POST -F "csv=@seed/csv/sample_bills.csv" \
  -F "tenant=11111111-1111-1111-1111-111111111111" \
  "https://your-app.vercel.app/api/imports/bill/commit"
```

## 4. データ確認

Supabase SQL Editorで実行：

```sql
-- MVリフレッシュ
select drm.refresh_finance();

-- データ確認
select * from drm.mv_project_finance order by project_code;
```

## 期待される結果

| Project  | 見積売上 | 見積原価 | PO原価  | 実績原価 |
| -------- | -------- | -------- | ------- | -------- |
| PRJ-0001 | 242,000  | 156,000  | 58,000  | 58,000   |
| PRJ-0002 | 395,000  | 147,000  | 142,000 | 142,000  |

## トラブルシューティング

### "supabaseUrl is required" エラー

→ 環境変数が未設定。Vercelで環境変数を設定後、再デプロイ

### データが0件

→ tenant_id が一致しているか確認

### 原価がnull

→ can_view_cost=false でマスクされている。SQLで権限を確認

## API仕様

### Preview API

- エンドポイント: `/api/imports/{type}/preview`
- メソッド: POST
- type: `estimate` | `po` | `bill`
- 最大100行をバリデーション

### Commit API

- エンドポイント: `/api/imports/{type}/commit`
- メソッド: POST
- type: `estimate` | `po` | `bill`
- 1000行単位でバルクインサート
- 自動でMVリフレッシュ実行
