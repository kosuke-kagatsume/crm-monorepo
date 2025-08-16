-- PROMPT 7: テーブル作成 & RLS（drm.import_mappings）
-- 既存drmスキーマ前提
create table if not exists drm.import_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  type text not null check (type in ('estimate','po','bill')),
  template_name text not null,
  header_map jsonb not null,         -- { "外部ヘッダ":"標準ヘッダ", ... }
  created_by uuid,
  created_at timestamptz default now(),
  unique(tenant_id, type, template_name)
);

alter table drm.import_mappings enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='import_mappings' and policyname='tenant_import_map_sel') then
    create policy tenant_import_map_sel on drm.import_mappings
      for select using (tenant_id = drm.current_tenant_id());
    create policy tenant_import_map_mod on drm.import_mappings
      using (tenant_id = drm.current_tenant_id())
      with check (tenant_id = drm.current_tenant_id());
  end if;
end$$;