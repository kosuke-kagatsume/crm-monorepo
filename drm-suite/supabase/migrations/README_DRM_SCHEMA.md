# DRM スキーマ DDL 実行手順

## 実行ファイル

1. `002_drm_schema.sql` - スキーマとテーブル定義
2. `002_drm_schema_verify.sql` - 作成確認クエリ

## 実行方法

### Supabase SQL Editor での実行

1. Supabase ダッシュボード → SQL Editor を開く
2. `002_drm_schema.sql` の内容を全て貼り付け
3. 「Run」ボタンをクリック
4. 実行完了後、`002_drm_schema_verify.sql` を実行して確認

### psql コマンドでの実行

```bash
# Supabase接続情報を使用
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" \
  -f supabase/migrations/002_drm_schema.sql

# 確認
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" \
  -f supabase/migrations/002_drm_schema_verify.sql
```

### ローカルPostgreSQLでの実行

```bash
# ローカル接続
psql -U postgres -d drm_db -f supabase/migrations/002_drm_schema.sql

# 確認
psql -U postgres -d drm_db -f supabase/migrations/002_drm_schema_verify.sql
```

## 作成されるオブジェクト

### スキーマ

- `drm` - DRM Suite専用スキーマ

### ヘルパー関数

- `drm.jwt_claim(claim text)` - JWT クレーム取得
- `drm.claim_bool(claim text)` - boolean型クレーム取得
- `drm.current_tenant_id()` - 現在のテナントID取得

### テーブル

1. **drm.projects** - 現場（プロジェクト）マスタ
   - PK: project_code
   - テナント分離: tenant_id

2. **drm.estimate_lines** - 見積明細
   - PK: (project_code, estimate_no, line_no)
   - 原価・販売単価管理

3. **drm.purchase_orders** - 発注ヘッダ
   - PK: po_no
   - 発注先（vendor）情報

4. **drm.purchase_order_lines** - 発注明細
   - PK: (po_no, line_no)
   - 仕入単価管理

5. **drm.ap_invoices** - 仕入請求
   - PK: ap_no
   - 発注との紐付け（po_no）

## 確認結果の期待値

```
      t             | c
--------------------|---
 projects           | 0
 estimate_lines     | 0
 purchase_orders    | 0
 purchase_order_lines| 0
 ap_invoices        | 0
```

## 注意事項

- PostgreSQL 12以上が必要（pgcrypto拡張）
- スキーマ作成権限が必要
- 既存の`drm`スキーマがある場合は影響なし（IF NOT EXISTS）
