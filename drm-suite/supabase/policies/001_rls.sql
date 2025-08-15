-- 各テーブルに RLS 有効化（例：projects。他テーブルも同様に）
alter table projects enable row level security;
create policy if not exists tenant_select_projects on projects for select using (tenant_id = uuid(auth.jwt() ->> 'tenant_id'));
create policy if not exists tenant_write_projects on projects for all using (tenant_id = uuid(auth.jwt() ->> 'tenant_id')) with check (tenant_id = uuid(auth.jwt() ->> 'tenant_id'));
-- 以降、全テーブルへ同様の select / write ポリシーを適用

-- 集計 MV + マスク用ビュー
create materialized view if not exists mv_project_finance as
select
  p.tenant_id,
  p.id as project_id,
  p.project_code,
  p.name,
  coalesce(p.contract_amount,0) as contract_amount,
  coalesce(sum(bl.amount_excl_tax) filter (where bl.tenant_id = p.tenant_id),0) as actual_cost,
  coalesce(sum(el.unit_price_sell * el.qty),0) as estimate_amount,
  coalesce(sum(coalesce(el.unit_price_cost,0) * el.qty),0) as estimate_cost
from projects p
left join estimates e on e.project_id = p.id and e.tenant_id = p.tenant_id
left join estimate_lines el on el.estimate_id = e.id and el.tenant_id = e.tenant_id
left join purchase_orders po on po.project_id = p.id and po.tenant_id = p.tenant_id
left join bills b on b.tenant_id = p.tenant_id
left join bill_lines bl on bl.bill_id = b.id and bl.tenant_id = b.tenant_id and bl.po_id = po.id
group by p.tenant_id, p.id, p.project_code, p.name, p.contract_amount;

create or replace view v_project_finance_masked as
select
  tenant_id, project_id, project_code, name,
  contract_amount,
  case when exists (
    select 1 from jsonb_array_elements_text((auth.jwt() -> 'roles')::jsonb) r where r.value in ('owner','accounting')
  ) then actual_cost else null end as actual_cost,
  case when exists (
    select 1 from jsonb_array_elements_text((auth.jwt() -> 'roles')::jsonb) r where r.value in ('owner','accounting')
  ) then (contract_amount - actual_cost) else null end as gross_profit
from mv_project_finance;