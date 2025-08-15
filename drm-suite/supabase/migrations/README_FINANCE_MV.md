# DRM Finance Materialized View（集計MV）

## 概要

案件（プロジェクト）単位で財務情報を集計するMaterialized Viewと、原価マスク機能を持つ公開ビュー。

## 実行ファイル

1. `004_drm_finance_mv.sql` - MV定義とリフレッシュ関数
2. `004_drm_finance_mv_check.sql` - 動作確認クエリ

## 前提条件

- `002_drm_schema.sql` 実行済み（テーブル作成）
- `003_drm_rls_policies.sql` 実行済み（RLS/ヘルパー関数）
- PostgreSQL 12以上（CONCURRENTLY リフレッシュ対応）

## 実装内容

### 1. Materialized View: `drm.mv_project_finance`

案件別に以下を集計：

| カラム                          | 説明               | 計算元                                       |
| ------------------------------- | ------------------ | -------------------------------------------- |
| estimate_revenue_ex             | 見積売上（税抜）   | estimate_lines.price_unit_ex × quantity      |
| estimate_cost_ex                | 見積原価（税抜）   | estimate_lines.cost_unit_ex × quantity       |
| committed_cost_ex               | 発注コミット原価   | purchase_order_lines.unit_cost_ex × quantity |
| actual_cost_ex                  | 実績原価（AP請求） | ap_invoices.amount_ex                        |
| estimate_gross_ex               | 見積粗利益         | 見積売上 - 見積原価                          |
| estimate_gross_margin_pct       | 見積粗利率（%）    | (粗利 ÷ 売上) × 100                          |
| variance_est_vs_committed_ex    | 差異1              | 発注原価 - 見積原価                          |
| variance_committed_vs_actual_ex | 差異2              | 実績原価 - 発注原価                          |

### 2. 公開ビュー: `drm.v_project_finance_public`

- テナント分離: `tenant_id = drm.current_tenant_id()`
- 原価マスク: `can_view_cost = false` の場合、原価関連フィールドを NULL

### 3. リフレッシュ関数: `drm.refresh_finance()`

```sql
-- MVをノンブロッキングで更新
select drm.refresh_finance();
```

## 実行方法

### Supabase SQL Editor

```sql
-- 1. MV作成
-- 004_drm_finance_mv.sql の内容を実行

-- 2. 動作確認
-- 004_drm_finance_mv_check.sql の内容を実行
```

### psql コマンド

```bash
# MV作成
psql $DATABASE_URL -f supabase/migrations/004_drm_finance_mv.sql

# 動作確認
psql $DATABASE_URL -f supabase/migrations/004_drm_finance_mv_check.sql
```

## テストシナリオ

### 1. テストデータ投入

```sql
-- JWT設定（開発環境）
set request.jwt.claims = '{
  "tenant_id": "11111111-1111-1111-1111-111111111111",
  "can_view_cost": "true"
}';

-- プロジェクト
insert into drm.projects(project_code, project_name, tenant_id)
values ('PJ001', 'テスト工事1', drm.current_tenant_id());

-- 見積明細
insert into drm.estimate_lines(
  project_code, estimate_no, estimate_date, line_no,
  item_name, quantity, unit, cost_unit_ex, price_unit_ex, tenant_id
) values
('PJ001', 'EST-001', '2024-01-01', 1, 'コンクリート', 50, 'm3', 15000, 18000, drm.current_tenant_id()),
('PJ001', 'EST-001', '2024-01-01', 2, '鉄筋', 2000, 'kg', 120, 150, drm.current_tenant_id());

-- 発注
insert into drm.purchase_orders(po_no, project_code, order_date, vendor_code, vendor_name, tenant_id)
values ('PO-001', 'PJ001', '2024-01-02', 'V001', '山田建材', drm.current_tenant_id());

insert into drm.purchase_order_lines(
  po_no, line_no, item_name, quantity, unit, unit_cost_ex, tenant_id
) values
('PO-001', 1, 'コンクリート', 50, 'm3', 14500, drm.current_tenant_id()),
('PO-001', 2, '鉄筋', 2000, 'kg', 115, drm.current_tenant_id());

-- 請求
insert into drm.ap_invoices(
  ap_no, po_no, invoice_date, item_name, amount_ex, tenant_id
) values
('AP-001', 'PO-001', '2024-02-01', 'コンクリート', 725000, drm.current_tenant_id()),
('AP-002', 'PO-001', '2024-02-01', '鉄筋', 230000, drm.current_tenant_id());
```

### 2. MV更新と確認

```sql
-- リフレッシュ
select drm.refresh_finance();

-- 確認（原価閲覧権限あり）
select * from drm.v_project_finance_public where project_code = 'PJ001';
```

### 3. 期待値

| 項目                      | 期待値    | 計算式                      |
| ------------------------- | --------- | --------------------------- |
| estimate_revenue_ex       | 1,200,000 | (18000×50) + (150×2000)     |
| estimate_cost_ex          | 990,000   | (15000×50) + (120×2000)     |
| committed_cost_ex         | 955,000   | (14500×50) + (115×2000)     |
| actual_cost_ex            | 955,000   | 725000 + 230000             |
| estimate_gross_ex         | 210,000   | 1,200,000 - 990,000         |
| estimate_gross_margin_pct | 17.50     | (210,000 ÷ 1,200,000) × 100 |

### 4. 原価マスク確認

```sql
-- 原価閲覧権限なし
set request.jwt.claims = '{
  "tenant_id": "11111111-1111-1111-1111-111111111111",
  "can_view_cost": "false"
}';

select
  project_code,
  estimate_revenue_ex,  -- 表示される
  estimate_cost_ex,      -- NULL
  committed_cost_ex,     -- NULL
  actual_cost_ex         -- NULL
from drm.v_project_finance_public
where project_code = 'PJ001';
```

## 受け入れ条件（DoD）

✅ `select drm.refresh_finance();` が正常終了  
✅ `v_project_finance_public` にデータが表示される  
✅ CSVサンプル投入後、各種金額がゼロ以外で計算される  
✅ `can_view_cost=false` で原価系カラムが NULL になる

## トラブルシューティング

### MVリフレッシュエラー

```sql
-- 通常リフレッシュ（ロックあり）
refresh materialized view drm.mv_project_finance;
```

### データが表示されない

1. テナントIDの確認
2. プロジェクトデータの存在確認
3. JWTクレームの設定確認

### 計算結果がおかしい

1. 各テーブルのデータ確認
2. JOIN条件の確認（po_no, project_code）
3. NULL値の扱い（COALESCE）
