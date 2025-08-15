-- ========= PROMPT 5b：サニティチェック（そのまま実行） =========
-- 目的：Seed/CSV投入後、数値が期待通りに出ているかを簡易確認。

-- 1) リフレッシュ
select drm.refresh_finance();

-- 2) テナント視点で20件
select
  project_code,
  estimate_revenue_ex,
  estimate_cost_ex,
  committed_cost_ex,
  actual_cost_ex,
  estimate_gross_ex,
  estimate_gross_margin_pct,
  variance_est_vs_committed_ex,
  variance_committed_vs_actual_ex
from drm.v_project_finance_public
order by project_code
limit 20;

-- 3) 期待する特定案件だけをピンポイント確認（例：PRJ-0001）
select *
from drm.v_project_finance_public
where project_code = 'PRJ-0001';