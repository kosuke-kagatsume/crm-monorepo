-- === RLS enable ===
alter table drm.projects enable row level security;
alter table drm.estimate_lines enable row level security;
alter table drm.purchase_orders enable row level security;
alter table drm.purchase_order_lines enable row level security;
alter table drm.ap_invoices enable row level security;

-- テナント隔離（SELECT/INSERT/UPDATE/DELETE）
do $$
begin
  perform 1 from pg_policies where schemaname='drm' and policyname='tenant_iso_sel_projects';
  if not found then
    create policy tenant_iso_sel_projects on drm.projects
      for select using (tenant_id = drm.current_tenant_id());
    create policy tenant_iso_mod_projects on drm.projects
      using (tenant_id = drm.current_tenant_id())
      with check (tenant_id = drm.current_tenant_id());
  end if;
end$$;

-- 他テーブルにも同様に適用
do $$
declare t text;
begin
  foreach t in array array[
    'estimate_lines','purchase_orders','purchase_order_lines','ap_invoices'
  ] loop
    execute format($f$
      do $g$
      begin
        if not exists (
          select 1 from pg_policies
          where schemaname='drm' and tablename=%L and policyname='tenant_iso_sel_'||%L
        ) then
          execute 'create policy tenant_iso_sel_'||%L||' on drm.'||%I||' for select using (tenant_id = drm.current_tenant_id())';
          execute 'create policy tenant_iso_mod_'||%L||' on drm.'||%I||' using (tenant_id = drm.current_tenant_id()) with check (tenant_id = drm.current_tenant_id())';
        end if;
      end
      $g$;
    $f$, t, t, t, t, t, t);
  end loop;
end$$;

-- 原価/金額をマスクした公開ビュー（閲覧専用）
create or replace view drm.v_estimate_lines_public as
select
  project_code, estimate_no, estimate_date, line_no, category, sku, item_name, spec,
  quantity, unit,
  case when drm.claim_bool('can_view_cost') then cost_unit_ex else null end as cost_unit_ex,
  price_unit_ex,
  tax_rate, note
from drm.estimate_lines
where tenant_id = drm.current_tenant_id();

create or replace view drm.v_purchase_order_lines_public as
select
  l.po_no, l.line_no, p.project_code, p.order_date, p.vendor_code, p.vendor_name,
  l.category, l.sku, l.item_name, l.quantity, l.unit,
  case when drm.claim_bool('can_view_cost') then l.unit_cost_ex else null end as unit_cost_ex,
  l.tax_rate, l.due_date, l.note
from drm.purchase_order_lines l
join drm.purchase_orders p on p.po_no = l.po_no
where l.tenant_id = drm.current_tenant_id() and p.tenant_id = drm.current_tenant_id();

create or replace view drm.v_ap_invoices_public as
select
  ap.ap_no, ap.po_no, ap.invoice_date, ap.pay_due_date, ap.line_no, ap.sku, ap.item_name,
  ap.quantity, ap.unit,
  case when drm.claim_bool('can_view_cost') then ap.amount_ex else null end as amount_ex,
  ap.tax_rate, ap.note
from drm.ap_invoices ap
where ap.tenant_id = drm.current_tenant_id();