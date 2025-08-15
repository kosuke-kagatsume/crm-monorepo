-- ========= DRM Suite: Finance MV =========
-- 前提：PROMPT 3 (DDL), PROMPT 4 (RLS/ビュー) 済み
-- 目的：案件（project_code）単位で
--   - 見積売上（Estimate Revenue）
--   - 見積原価（Estimate Cost）
--   - 発注コミット原価（Committed Cost：PO行ベース）
--   - 実績原価（Actual Cost：AP請求）
-- を横持ち集計し、差異・粗利の参考値も出す

-- 既存があれば破棄
drop materialized view if exists drm.mv_project_finance;

create materialized view drm.mv_project_finance as
with
-- 見積（売上・原価）
est as (
  select
    el.tenant_id,
    el.project_code,
    sum(coalesce(el.price_unit_ex,0) * coalesce(el.quantity,0)) as estimate_revenue_ex,
    sum(coalesce(el.cost_unit_ex,0)  * coalesce(el.quantity,0)) as estimate_cost_ex
  from drm.estimate_lines el
  group by el.tenant_id, el.project_code
),

-- 発注コミット原価（PO明細）
po_cost as (
  select
    p.tenant_id,
    p.project_code,
    sum(coalesce(l.unit_cost_ex,0) * coalesce(l.quantity,0)) as committed_cost_ex
  from drm.purchase_order_lines l
  join drm.purchase_orders p on p.po_no = l.po_no
  group by p.tenant_id, p.project_code
),

-- 実績原価（AP請求）
ap_cost as (
  select
    po.tenant_id,
    po.project_code,
    sum(coalesce(ap.amount_ex,0)) as actual_cost_ex
  from drm.ap_invoices ap
  join drm.purchase_orders po on po.po_no = ap.po_no
  group by po.tenant_id, po.project_code
)

select
  pr.tenant_id,
  pr.project_code,
  pr.project_name,

  -- 見積（売上・原価）
  coalesce(est.estimate_revenue_ex,0) as estimate_revenue_ex,
  coalesce(est.estimate_cost_ex,0)    as estimate_cost_ex,

  -- 発注コミット
  coalesce(po_cost.committed_cost_ex,0) as committed_cost_ex,

  -- 実績（AP）
  coalesce(ap_cost.actual_cost_ex,0)    as actual_cost_ex,

  -- 参考KPI
  -- 見積粗利（売上-見積原価）
  coalesce(est.estimate_revenue_ex,0) - coalesce(est.estimate_cost_ex,0) as estimate_gross_ex,

  -- 見積粗利率（%）
  case
    when coalesce(est.estimate_revenue_ex,0) = 0 then null
    else round(100 * (
      (coalesce(est.estimate_revenue_ex,0) - coalesce(est.estimate_cost_ex,0))
      / nullif(est.estimate_revenue_ex,0)
    )::numeric, 2)
  end as estimate_gross_margin_pct,

  -- 差異：見積原価 vs 発注コミット
  coalesce(po_cost.committed_cost_ex,0) - coalesce(est.estimate_cost_ex,0) as variance_est_vs_committed_ex,

  -- 差異：発注コミット vs 実績
  coalesce(ap_cost.actual_cost_ex,0) - coalesce(po_cost.committed_cost_ex,0) as variance_committed_vs_actual_ex,

  now() as snapshot_at
from drm.projects pr
left join est     on est.tenant_id = pr.tenant_id and est.project_code = pr.project_code
left join po_cost on po_cost.tenant_id = pr.tenant_id and po_cost.project_code = pr.project_code
left join ap_cost on ap_cost.tenant_id = pr.tenant_id and ap_cost.project_code = pr.project_code
;

-- CONCURRENTLY リフレッシュに必要な一意インデックス
create unique index if not exists ux_mv_project_finance
  on drm.mv_project_finance(tenant_id, project_code);

-- マスク付き公開ビュー（RLSはMVにはかからないため、ビュー側でテナント・権限制御）
drop view if exists drm.v_project_finance_public;
create view drm.v_project_finance_public as
select
  tenant_id,
  project_code,
  project_name,
  estimate_revenue_ex,
  case when drm.claim_bool('can_view_cost') then estimate_cost_ex else null end as estimate_cost_ex,
  case when drm.claim_bool('can_view_cost') then committed_cost_ex else null end as committed_cost_ex,
  case when drm.claim_bool('can_view_cost') then actual_cost_ex else null end as actual_cost_ex,
  -- 粗利・差異も原価を含むため、閲覧権限がない場合は非表示
  case when drm.claim_bool('can_view_cost') then estimate_gross_ex else null end as estimate_gross_ex,
  case when drm.claim_bool('can_view_cost') then estimate_gross_margin_pct else null end as estimate_gross_margin_pct,
  case when drm.claim_bool('can_view_cost') then variance_est_vs_committed_ex else null end as variance_est_vs_committed_ex,
  case when drm.claim_bool('can_view_cost') then variance_committed_vs_actual_ex else null end as variance_committed_vs_actual_ex,
  snapshot_at
from drm.mv_project_finance
where tenant_id = drm.current_tenant_id();

-- ========== リフレッシュ関数 ==========
drop function if exists drm.refresh_finance();
create or replace function drm.refresh_finance()
returns void
language plpgsql
as $$
begin
  -- MV全体をノンブロッキングで更新（ユニークインデックス必須）
  refresh materialized view concurrently drm.mv_project_finance;
end;
$$;

-- ヘルパ：更新＋確認のスクリプト（任意）
-- select drm.refresh_finance();
-- select * from drm.v_project_finance_public order by project_code limit 20;