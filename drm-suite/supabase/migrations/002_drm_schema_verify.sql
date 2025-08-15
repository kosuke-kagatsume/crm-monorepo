-- === 確認クエリ（DDL実行後に実行） ===
select 'projects' t, count(*) c from drm.projects
union all select 'estimate_lines', count(*) from drm.estimate_lines
union all select 'purchase_orders', count(*) from drm.purchase_orders
union all select 'purchase_order_lines', count(*) from drm.purchase_order_lines
union all select 'ap_invoices', count(*) from drm.ap_invoices;