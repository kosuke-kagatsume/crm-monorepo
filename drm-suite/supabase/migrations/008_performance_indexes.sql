-- FX-0: パフォーマンス用のインデックス
create index if not exists idx_ap_invoices_tenant_due on drm.ap_invoices(tenant_id, pay_due_date);
create index if not exists idx_mv_finance_tenant on drm.mv_project_finance(tenant_id);