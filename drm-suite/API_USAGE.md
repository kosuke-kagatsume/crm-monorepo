# CSV Import API 使用ガイド

## エンドポイント構成

- Preview: `/api/imports/[type]/preview`
- Commit: `/api/imports/[type]/commit`
- Type: `estimate` | `po` | `bill`

## 使い方（curl 例）

### PREVIEW（100行検証）

```bash
# 見積データのプレビュー
curl -s -X POST \
  -H "Authorization: Bearer <JWT or omit>" \
  -F file=@seed/csv/sample_estimates.csv \
  "http://localhost:3000/api/imports/estimate/preview?type=estimate"

# 発注データのプレビュー
curl -s -X POST \
  -F file=@seed/csv/sample_purchase_orders.csv \
  "http://localhost:3000/api/imports/po/preview?type=po"

# 請求データのプレビュー
curl -s -X POST \
  -F file=@seed/csv/sample_bills.csv \
  "http://localhost:3000/api/imports/bill/preview?type=bill"
```

### COMMIT（本番投入）

#### JWTトークン使用（RLS有効）

```bash
# 見積データ投入（tenantクエリ不要、JWTから自動解決）
curl -s -X POST \
  -H "Authorization: Bearer <JWT>" \
  -F file=@seed/csv/sample_estimates.csv \
  "http://localhost:3000/api/imports/estimate/commit?type=estimate"

# 発注データ投入
curl -s -X POST \
  -H "Authorization: Bearer <JWT>" \
  -F file=@seed/csv/sample_purchase_orders.csv \
  "http://localhost:3000/api/imports/po/commit?type=po"

# 請求データ投入
curl -s -X POST \
  -H "Authorization: Bearer <JWT>" \
  -F file=@seed/csv/sample_bills.csv \
  "http://localhost:3000/api/imports/bill/commit?type=bill"
```

#### SERVICE_ROLE使用（RLS無視）

```bash
# 見積データ投入（tenant を必ず付与）
curl -s -X POST \
  -F file=@seed/csv/sample_estimates.csv \
  "http://localhost:3000/api/imports/estimate/commit?type=estimate&tenant=11111111-1111-1111-1111-111111111111"

# 発注データ投入
curl -s -X POST \
  -F file=@seed/csv/sample_purchase_orders.csv \
  "http://localhost:3000/api/imports/po/commit?type=po&tenant=11111111-1111-1111-1111-111111111111"

# 請求データ投入
curl -s -X POST \
  -F file=@seed/csv/sample_bills.csv \
  "http://localhost:3000/api/imports/bill/commit?type=bill&tenant=11111111-1111-1111-1111-111111111111"
```

## レスポンス例

### Preview成功

```json
{
  "total": 5,
  "sample_ok": 5,
  "sample_errors": 0,
  "errors": []
}
```

### Preview検証エラー

```json
{
  "total": 5,
  "sample_ok": 3,
  "sample_errors": 2,
  "errors": [
    {
      "row": 3,
      "issues": [
        {
          "code": "invalid_type",
          "path": ["数量"],
          "message": "Expected number, received string"
        }
      ]
    }
  ]
}
```

### Commit成功

```json
{
  "type": "estimate",
  "received": 5,
  "inserted": 5,
  "status": "ok"
}
```

### Commitエラー

```json
{
  "error": "validation error",
  "total": 5,
  "valid": 3,
  "errors": [
    {
      "row": 4,
      "issues": [...]
    }
  ]
}
```

## 環境変数設定

`.env.local`:

```bash
# Supabase設定（必須）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# SERVICE_ROLE（オプション：管理者投入用）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## JWTトークンの取得方法

### Supabaseクライアントから

```typescript
const {
  data: { session },
} = await supabase.auth.getSession();
const token = session?.access_token;
```

### テスト用トークン生成

```sql
-- Supabase SQL Editor で実行
select
  extensions.sign(
    json_build_object(
      'tenant_id', '11111111-1111-1111-1111-111111111111',
      'can_view_cost', true,
      'iat', extract(epoch from now()),
      'exp', extract(epoch from now() + interval '7 days')
    ),
    'your-jwt-secret'
  );
```

## データフロー

```
CSVファイル
    ↓
[Preview API]
    ├→ エンコード検出（Shift-JIS/UTF-8自動判別）
    ├→ CSV解析
    └→ Zod検証（100行サンプル）

[Commit API]
    ├→ 全行検証
    ├→ プロジェクトマスタ自動作成
    ├→ バルクアップサート（1000件/チャンク）
    └→ MV自動リフレッシュ
```

## トラブルシューティング

### "tenant required" エラー

- SERVICE_ROLE使用時は `&tenant=UUID` が必須
- JWTトークンに `tenant_id` クレームが含まれているか確認

### "file required" エラー

- multipart/form-data で送信しているか確認
- ファイルのフィールド名が `file` になっているか確認

### 文字化け

- CSVファイルのエンコーディングは自動検出されます
- Shift-JIS、UTF-8、UTF-8 BOM対応

### 日付フォーマットエラー

- 対応形式: `2024-01-15`, `2024/01/15`, `2024.01.15`
- 自動で `YYYY-MM-DD` に正規化されます

### 数値フォーマットエラー

- カンマ、円記号、スペースは自動除去
- 例: `￥1,500` → `1500`
