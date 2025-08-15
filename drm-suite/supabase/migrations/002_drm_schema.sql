-- === DRM Suite: Schema & Tables ===
create schema if not exists drm;

-- 必要なら
create extension if not exists pgcrypto;

-- JWTクレーム読み出しヘルパ
create or replace function drm.jwt_claim(claim text)
returns text language sql stable as $$
  select coalesce( (current_setting('request.jwt.claims', true)::jsonb ->> claim), '' )
$$;

create or replace function drm.claim_bool(claim text)
returns boolean language sql stable as $$
  select lower(drm.jwt_claim(claim)) in ('true','1','yes','on')
$$;

create or replace function drm.current_tenant_id()
returns uuid language sql stable as $$
  select nullif(drm.jwt_claim('tenant_id'), '')::uuid
$$;

-- 現場（プロジェクト）
create table if not exists drm.projects (
  project_code text primary key,
  project_name text,
  tenant_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_tenant on drm.projects(tenant_id);

-- 見積 明細
create table if not exists drm.estimate_lines (
  project_code text not null,
  estimate_no  text not null,
  estimate_date date,
  line_no int not null,
  category text,
  sku text,
  item_name text,
  spec text,
  quantity numeric(18,4) not null default 0,
  unit text,
  cost_unit_ex numeric(18,2),   -- 原価単価(税抜)
  price_unit_ex numeric(18,2),  -- 販売単価(税抜)
  tax_rate numeric(5,2) default 10,
  note text,
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(project_code, estimate_no, line_no)
);

create index if not exists idx_est_lines_proj on drm.estimate_lines(project_code);

-- 発注（ヘッダ）
create table if not exists drm.purchase_orders (
  po_no text primary key,
  project_code text not null,
  order_date date,
  vendor_code text,
  vendor_name text,
  tenant_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_po_proj on drm.purchase_orders(project_code);

-- 発注明細
create table if not exists drm.purchase_order_lines (
  po_no text not null references drm.purchase_orders(po_no) on delete cascade,
  line_no int not null,
  category text,
  sku text,
  item_name text,
  quantity numeric(18,4) not null default 0,
  unit text,
  unit_cost_ex numeric(18,2),
  tax_rate numeric(5,2) default 10,
  due_date date,
  note text,
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(po_no, line_no)
);

-- 仕入請求（AP）※単純化：行=1件想定のケースも扱える
create table if not exists drm.ap_invoices (
  ap_no text primary key,
  po_no text not null references drm.purchase_orders(po_no) on delete restrict,
  invoice_date date,
  pay_due_date date,
  line_no int not null default 1,
  sku text,
  item_name text,
  quantity numeric(18,4) default 0,
  unit text,
  amount_ex numeric(18,2) not null, -- 税抜請求額
  tax_rate numeric(5,2) default 10,
  note text,
  tenant_id uuid not null,
  created_at timestamptz not null default now()
);

-- 将来の参照整合のためのFK（任意）
alter table drm.estimate_lines
  add constraint fk_est_proj foreign key(project_code) references drm.projects(project_code) on delete restrict;

alter table drm.purchase_orders
  add constraint fk_po_proj foreign key(project_code) references drm.projects(project_code) on delete restrict;