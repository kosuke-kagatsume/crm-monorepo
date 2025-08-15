# DRM RLS（Row Level Security）ポリシー実装

## 概要

テナント分離と原価マスキングを実現するRLSポリシーとビューの定義。

## 実行ファイル

1. `003_drm_rls_policies.sql` - RLSポリシーとマスクビュー
2. `003_drm_rls_verify.sql` - 動作確認クエリ

## 前提条件

- `002_drm_schema.sql` が実行済みであること
- PostgreSQL 12以上
- JWT に以下のクレームが含まれること：
  - `tenant_id`: UUID形式のテナントID
  - `can_view_cost`: 原価閲覧権限（"true"/"false"）

## 実行方法

### Supabase SQL Editor

```sql
-- 1. RLSポリシー適用
-- 003_drm_rls_policies.sql の内容を実行

-- 2. 動作確認
-- 003_drm_rls_verify.sql の内容を実行
```

### psql コマンド

```bash
# RLSポリシー適用
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" \
  -f supabase/migrations/003_drm_rls_policies.sql

# 動作確認
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" \
  -f supabase/migrations/003_drm_rls_verify.sql
```

## 実装内容

### 1. RLS有効化

以下のテーブルでRow Level Securityを有効化：

- `drm.projects`
- `drm.estimate_lines`
- `drm.purchase_orders`
- `drm.purchase_order_lines`
- `drm.ap_invoices`

### 2. テナント隔離ポリシー

各テーブルに2種類のポリシーを適用：

#### SELECT ポリシー（tenant*iso_sel*\*）

- 自テナントのデータのみ参照可能
- 条件: `tenant_id = drm.current_tenant_id()`

#### INSERT/UPDATE/DELETE ポリシー（tenant*iso_mod*\*）

- 自テナントのデータのみ操作可能
- USING: `tenant_id = drm.current_tenant_id()`
- WITH CHECK: `tenant_id = drm.current_tenant_id()`

### 3. 原価マスクビュー

原価情報を権限に応じてマスクするビュー：

#### drm.v_estimate_lines_public

- 見積明細の公開ビュー
- `cost_unit_ex`: `can_view_cost=true` の場合のみ表示

#### drm.v_purchase_order_lines_public

- 発注明細の公開ビュー
- `unit_cost_ex`: `can_view_cost=true` の場合のみ表示

#### drm.v_ap_invoices_public

- 仕入請求の公開ビュー
- `amount_ex`: `can_view_cost=true` の場合のみ表示

## テスト方法

### 1. JWT クレーム設定（開発環境）

```sql
-- Supabase SQL Editor でセッション設定
set request.jwt.claims = '{
  "tenant_id": "11111111-1111-1111-1111-111111111111",
  "can_view_cost": "true"
}';
```

### 2. テストデータ投入

```sql
-- テナントIDが自動設定される
insert into drm.projects(project_code, project_name, tenant_id)
values ('TEST-001', 'テスト現場', drm.current_tenant_id());

-- 見積データ
insert into drm.estimate_lines(
  project_code, estimate_no, estimate_date, line_no,
  item_name, quantity, unit, cost_unit_ex, price_unit_ex,
  tenant_id
) values (
  'TEST-001', 'EST-001', '2024-01-01', 1,
  'テスト品目', 10, '個', 1000, 1500,
  drm.current_tenant_id()
);
```

### 3. 動作確認

```sql
-- 原価閲覧権限あり
set request.jwt.claims = '{"tenant_id": "11111111-1111-1111-1111-111111111111", "can_view_cost": "true"}';
select * from drm.v_estimate_lines_public;
-- → cost_unit_ex が表示される

-- 原価閲覧権限なし
set request.jwt.claims = '{"tenant_id": "11111111-1111-1111-1111-111111111111", "can_view_cost": "false"}';
select * from drm.v_estimate_lines_public;
-- → cost_unit_ex が NULL になる

-- 別テナント
set request.jwt.claims = '{"tenant_id": "22222222-2222-2222-2222-222222222222", "can_view_cost": "true"}';
select * from drm.v_estimate_lines_public;
-- → 0件（別テナントのデータは見えない）
```

## アプリケーション実装時の注意

### Supabase クライアント設定

```typescript
// JWT カスタムクレーム設定例
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      // カスタムクレームをヘッダーに追加
      'x-tenant-id': tenantId,
      'x-can-view-cost': canViewCost.toString(),
    },
  },
});
```

### API 実装例

```typescript
// 原価情報を含む/含まないデータ取得
const { data, error } = await supabase
  .from('v_estimate_lines_public') // マスクビューを使用
  .select('*')
  .eq('project_code', projectCode);
```

## トラブルシューティング

### RLSが効かない場合

1. テーブルでRLSが有効か確認
2. JWTクレームが正しく設定されているか確認
3. ポリシーが正しく作成されているか確認

### 原価が常にNULLになる場合

1. `can_view_cost` クレームの値を確認（文字列 "true"）
2. ビュー定義の CASE 文を確認

### データが見えない場合

1. `tenant_id` クレームが正しいか確認
2. データの `tenant_id` と一致しているか確認
