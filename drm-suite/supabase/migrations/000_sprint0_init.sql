-- companies, users, user_roles
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null
);
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text,
  tenant_id uuid not null references companies(id)
);
create type if not exists user_role as enum ('owner','sales','site','design','accounting','construction','office','after','admin');
create table if not exists user_roles (
  user_id uuid references users(id),
  role user_role not null,
  primary key(user_id, role)
);

-- projects（現場）
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references companies(id),
  project_code text not null,
  name text not null,
  contract_amount numeric(14,2),
  unique(tenant_id, project_code)
);

-- vendors（仕入先）
create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references companies(id),
  vendor_code text not null,
  name text not null,
  unique(tenant_id, vendor_code)
);

-- estimates / estimate_lines
create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references companies(id),
  project_id uuid not null references projects(id),
  estimate_no text not null,
  estimate_date date not null,
  unique(tenant_id, estimate_no)
);
create table if not exists estimate_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references companies(id),
  estimate_id uuid not null references estimates(id),
  line_no int not null,
  sku text,
  name text not null,
  spec text,
  qty numeric(12,3) not null,
  unit text not null,
  unit_price_cost numeric(12,2),
  unit_price_sell numeric(12,2) not null,
  tax_rate numeric(5,2) default 10,
  unique(tenant_id, estimate_id, line_no)
);

-- purchase_orders / purchase_order_lines
create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references companies(id),
  project_id uuid not null references projects(id),
  vendor_id uuid not null references vendors(id),
  po_no text not null,
  po_date date not null,
  unique(tenant_id, po_no)
);
create table if not exists purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references companies(id),
  po_id uuid not null references purchase_orders(id),
  line_no int not null,
  sku text,
  name text not null,
  qty numeric(12,3) not null,
  unit text not null,
  unit_price numeric(12,2) not null,
  tax_rate numeric(5,2) default 10,
  unique(tenant_id, po_id, line_no)
);

-- bills / bill_lines（AP）
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references companies(id),
  vendor_id uuid not null references vendors(id),
  bill_no text not null,
  bill_date date not null,
  due_date date,
  unique(tenant_id, bill_no)
);
create table if not exists bill_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references companies(id),
  bill_id uuid not null references bills(id),
  po_id uuid references purchase_orders(id),
  po_line_no int,
  line_no int not null,
  sku text,
  name text not null,
  qty numeric(12,3) not null,
  unit text not null,
  amount_excl_tax numeric(12,2) not null,
  tax_rate numeric(5,2) default 10,
  unique(tenant_id, bill_id, line_no)
);

-- import_mappings（ヘッダマッピング保存）
create table if not exists import_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references companies(id),
  type text not null check (type in ('estimate','po','bill')),
  template_name text not null,
  header_map jsonb not null,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  unique (tenant_id, type, template_name)
);

-- import_jobs / import_job_errors（ログ）
create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references companies(id),
  type text not null check (type in ('estimate','po','bill')),
  filename text,
  total_rows int,
  success_rows int,
  error_rows int,
  status text not null check (status in ('queued','processing','done','failed')) default 'queued',
  created_by uuid references users(id),
  created_at timestamptz default now()
);
create table if not exists import_job_errors (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references import_jobs(id),
  row_no int not null,
  code text not null,
  message text not null,
  raw jsonb
);