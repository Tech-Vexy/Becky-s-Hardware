-- ============================================================================
-- Single-Store Hardware Shop Management PWA Schema for Supabase/PostgreSQL
-- Designed for Kenyan Retail (KES, 16% VAT, KRA PIN, M-Pesa, Credit Ledger)
-- Single store: strictly no multi-tenancy, no tenant onboarding, no store_id
-- Apply in Supabase SQL Editor as a trusted database administrator.
-- ============================================================================

begin;

-- Extensions
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Custom Enum Types
-- ----------------------------------------------------------------------------
do $$ begin 
  create type public.app_role as enum ('admin', 'store_manager', 'cashier', 'inventory_clerk', 'accountant');
exception when duplicate_object then null; end $$;

do $$ begin 
  create type public.sale_status as enum ('draft', 'completed', 'voided');
exception when duplicate_object then null; end $$;

do $$ begin 
  create type public.payment_method as enum ('cash', 'mpesa', 'card', 'bank_transfer', 'credit', 'cheque', 'other');
exception when duplicate_object then null; end $$;

do $$ begin 
  create type public.payment_verification_status as enum ('unverified', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin 
  create type public.stock_movement_type as enum (
    'opening_balance',
    'purchase_receipt',
    'sale',
    'sale_return',
    'adjustment',
    'damage',
    'transfer_in',
    'transfer_out',
    'stocktake'
  );
exception when duplicate_object then null; end $$;

do $$ begin 
  create type public.purchase_status as enum ('draft', 'received', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin 
  create type public.return_condition as enum ('good', 'damaged', 'scrap');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Store Settings (Singleton table for the single hardware store)
-- ----------------------------------------------------------------------------
create table if not exists public.store_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  store_name text not null default 'Becky''s Hardware Store',
  tagline text default 'Ubora na Bei Nafuu - Quality Building Materials',
  physical_address text default '',
  phone text default '+254 712 345 678',
  email text default 'sales@beckyshardware.co.ke',
  kra_pin text default 'P051234567X',
  currency text not null default 'KES',
  vat_rate_percent numeric(5,2) not null default 16.00,
  mpesa_paybill text default '247247',
  mpesa_till text default '5432101',
  mpesa_account text default 'BECKY',
  receipt_header text default 'BECKY''S HARDWARE STORE',
  receipt_footer text default 'Goods once sold are returnable within 7 days in original condition with valid receipt. Asante kwa biashara yako!',
  allow_offline_credit boolean not null default false,
  max_offline_sale_kes numeric(14,2) not null default 100000.00,
  allow_negative_stock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint single_store_singleton check (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Ensure initial settings row exists
insert into public.store_settings (id, store_name, kra_pin)
values ('00000000-0000-0000-0000-000000000001'::uuid, 'Becky''s Hardware Store', 'P051234567X')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 3. Profiles & Role-Based Access Control
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null,
  phone text,
  role public.app_role not null default 'cashier',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_role()
returns public.app_role language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p
  where p.user_id = (select auth.uid()) and p.active = true
  limit 1
$$;

create or replace function public.has_role(allowed public.app_role[])
returns boolean language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.current_role() = any(allowed), false)
$$;

grant execute on function public.current_role() to authenticated;
grant execute on function public.has_role(public.app_role[]) to authenticated;

-- Guard: users cannot self-escalate or change active status unless admin/store_manager
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and not public.has_role(array['admin','store_manager']::public.app_role[]) then
    if tg_op = 'INSERT' then
      raise exception 'Profiles must be provisioned by an administrator';
    end if;
    if new.role is distinct from old.role or new.active is distinct from old.active
       or new.user_id is distinct from old.user_id then
      raise exception 'Only an administrator or store manager can change profile privileges';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_privileges on public.profiles;
create trigger trg_guard_profile_privileges before insert or update on public.profiles
for each row execute function public.guard_profile_privileges();

-- Trigger to automatically create a profile when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = 'public', 'auth'
as $$
declare
  v_role public.app_role;
  v_count integer;
  v_name text;
begin
  select count(*) into v_count from public.profiles;
  if v_count = 0 then
    v_role := 'admin'; -- First user is always Store Owner Admin!
  else
    v_role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'cashier');
  end if;

  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.profiles (user_id, full_name, phone, role, active)
  values (
    new.id,
    v_name,
    coalesce(new.raw_user_meta_data->>'phone', new.phone),
    v_role,
    true
  )
  on conflict (user_id) do update
  set full_name = excluded.full_name,
      phone = coalesce(excluded.phone, profiles.phone);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. Product Categories & Catalogue
-- ----------------------------------------------------------------------------
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete restrict,
  sku text not null unique,
  barcode text unique,
  product_name text not null,
  brand text,
  size_or_pack text,
  colour text,
  specification text,
  unit_of_measure text not null default 'pcs',
  selling_price_kes numeric(14,2) check (selling_price_kes is null or selling_price_kes >= 0),
  alternate_selling_price_kes numeric(14,2) check (alternate_selling_price_kes is null or alternate_selling_price_kes >= 0),
  minimum_selling_price_kes numeric(14,2) check (minimum_selling_price_kes is null or minimum_selling_price_kes >= 0),
  buying_price_kes numeric(14,2) check (buying_price_kes is null or buying_price_kes >= 0),
  stock_on_hand numeric(14,3) not null default 0 check (stock_on_hand >= 0),
  stock_reserved numeric(14,3) not null default 0 check (stock_reserved >= 0 and stock_reserved <= stock_on_hand),
  low_stock_level numeric(14,3) not null default 0 check (low_stock_level >= 0),
  critical_stock_level numeric(14,3) not null default 0 check (critical_stock_level >= 0),
  reorder_quantity numeric(14,3) not null default 0 check (reorder_quantity >= 0),
  allow_decimal boolean not null default false,
  low_stock_alert_enabled boolean not null default true,
  active boolean not null default true,
  stock_location text default 'SHOP', -- Single physical store location
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_products_name on public.products(product_name);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_barcode on public.products(barcode);
create index if not exists idx_products_active on public.products(active);
create index if not exists idx_products_low_stock on public.products(stock_on_hand, low_stock_level);

-- ----------------------------------------------------------------------------
-- 5. Customers & Customer Credit Ledger
-- ----------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text unique,
  full_name text not null,
  phone text,
  email text,
  address text,
  credit_limit_kes numeric(14,2) not null default 0 check (credit_limit_kes >= 0),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_name on public.customers(full_name);

create table if not exists public.customer_repayments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  receipt_number text not null unique,
  amount_kes numeric(14,2) not null check (amount_kes > 0),
  method public.payment_method not null,
  provider_reference text,
  received_by uuid not null references auth.users(id) on delete restrict,
  received_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_repayments_customer on public.customer_repayments(customer_id);

-- ----------------------------------------------------------------------------
-- 6. Suppliers & Purchases (Stock Receiving)
-- ----------------------------------------------------------------------------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_code text unique,
  name text not null,
  phone text,
  email text,
  address text,
  tax_pin text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,
  supplier_id uuid references public.suppliers(id) on delete restrict,
  status public.purchase_status not null default 'draft',
  supplier_invoice_no text,
  subtotal_kes numeric(14,2) not null default 0 check (subtotal_kes >= 0),
  tax_kes numeric(14,2) not null default 0 check (tax_kes >= 0),
  total_kes numeric(14,2) not null default 0 check (total_kes >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  received_by uuid references auth.users(id) on delete set null,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_cost_kes numeric(14,2) not null check (unit_cost_kes >= 0),
  line_total_kes numeric(14,2) not null check (line_total_kes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_items_purchase on public.purchase_items(purchase_id);

-- ----------------------------------------------------------------------------
-- 7. Sales, Sale Items & Payments
-- ----------------------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  customer_id uuid references public.customers(id) on delete restrict,
  cashier_id uuid not null references auth.users(id) on delete restrict,
  status public.sale_status not null default 'draft',
  subtotal_kes numeric(14,2) not null default 0 check (subtotal_kes >= 0),
  discount_kes numeric(14,2) not null default 0 check (discount_kes >= 0),
  tax_kes numeric(14,2) not null default 0 check (tax_kes >= 0),
  total_kes numeric(14,2) not null default 0 check (total_kes >= 0),
  amount_paid_kes numeric(14,2) not null default 0 check (amount_paid_kes >= 0),
  customer_name_snapshot text,
  cashier_name_snapshot text,
  offline_id text unique,
  idempotency_key text unique,
  is_offline_sync boolean not null default false,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sales_created on public.sales(created_at desc);
create index if not exists idx_sales_status on public.sales(status);
create index if not exists idx_sales_offline on public.sales(offline_id);
create index if not exists idx_sales_customer on public.sales(customer_id);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price_kes numeric(14,2) not null check (unit_price_kes >= 0),
  discount_kes numeric(14,2) not null default 0 check (discount_kes >= 0),
  line_total_kes numeric(14,2) not null check (line_total_kes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_sale_items_sale on public.sale_items(sale_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  method public.payment_method not null,
  amount_kes numeric(14,2) not null check (amount_kes > 0),
  provider_reference text,
  received_by uuid not null references auth.users(id) on delete restrict,
  received_at timestamptz not null default now(),
  verification_status public.payment_verification_status not null default 'verified',
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  notes text
);

create index if not exists idx_payments_sale on public.payments(sale_id);
create index if not exists idx_payments_verification on public.payments(verification_status);

-- ----------------------------------------------------------------------------
-- 8. Returns & Return Items
-- ----------------------------------------------------------------------------
create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  return_number text not null unique,
  sale_id uuid references public.sales(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete restrict,
  cashier_id uuid not null references auth.users(id) on delete restrict,
  refund_method public.payment_method not null,
  total_refund_kes numeric(14,2) not null check (total_refund_kes >= 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price_kes numeric(14,2) not null check (unit_price_kes >= 0),
  line_total_kes numeric(14,2) not null check (line_total_kes >= 0),
  restock_inventory boolean not null default true,
  condition public.return_condition not null default 'good'
);

-- ----------------------------------------------------------------------------
-- 9. Expenses (Petty cash, offloading, utilities, transport)
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_number text not null unique,
  expense_date date not null default current_date,
  category text not null, -- casual_labor, transport, utilities, rent, supplies, maintenance, other
  amount_kes numeric(14,2) not null check (amount_kes > 0),
  description text not null,
  paid_to text not null,
  payment_method public.payment_method not null default 'cash',
  provider_reference text,
  receipt_ref text,
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_date on public.expenses(expense_date desc);

-- ----------------------------------------------------------------------------
-- 10. Immutable Inventory Ledger & Audit Trail
-- ----------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type public.stock_movement_type not null,
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0),
  unit_cost_kes numeric(14,2) check (unit_cost_kes is null or unit_cost_kes >= 0),
  reference_type text,
  reference_id uuid,
  reason text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_movements_product_time on public.stock_movements(product_id, created_at desc);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_audit_time on public.audit_logs(occurred_at desc);

-- ----------------------------------------------------------------------------
-- 11. Triggers: Updated At and Audit
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end $$;

create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare old_json jsonb; new_json jsonb; row_id text;
begin
  if tg_op <> 'INSERT' then old_json := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then new_json := to_jsonb(new); end if;
  row_id := coalesce(new_json->>'id', old_json->>'id', new_json->>'user_id', old_json->>'user_id');
  insert into public.audit_logs(actor_user_id, action, table_name, record_id, old_data, new_data)
  values ((select auth.uid()), tg_op, tg_table_name, row_id, old_json, new_json);
  return coalesce(new, old);
end;
$$;

do $$ declare t text; begin
  foreach t in array array['store_settings','profiles','product_categories','products','customers','suppliers','purchases','sales'] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;

  foreach t in array array['store_settings','product_categories','products','customers','suppliers','purchases','purchase_items','sales','sale_items','payments','customer_repayments','returns','expenses','stock_movements'] loop
    execute format('drop trigger if exists trg_%I_audit on public.%I', t, t);
    execute format('create trigger trg_%I_audit after insert or update or delete on public.%I for each row execute function public.audit_row_change()', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 12. Operational & Analytical Views
-- ----------------------------------------------------------------------------

-- View: Customer Credit Balances
create or replace view public.v_customer_balances as
with credit_sales as (
  select s.customer_id, coalesce(sum(p.amount_kes), 0) as total_credit_sales_kes
  from public.sales s
  join public.payments p on p.sale_id = s.id
  where s.status = 'completed' and p.method = 'credit'
  group by s.customer_id
),
repayments as (
  select customer_id, coalesce(sum(amount_kes), 0) as total_repayments_kes
  from public.customer_repayments
  group by customer_id
),
credit_returns as (
  select customer_id, coalesce(sum(total_refund_kes), 0) as total_return_credits_kes
  from public.returns
  where refund_method = 'credit'
  group by customer_id
)
select 
  c.id,
  c.customer_code,
  c.full_name,
  c.phone,
  c.credit_limit_kes,
  c.active,
  coalesce(cs.total_credit_sales_kes, 0) as total_credit_sales_kes,
  coalesce(r.total_repayments_kes, 0) + coalesce(cr.total_return_credits_kes, 0) as total_repayments_kes,
  greatest(0, coalesce(cs.total_credit_sales_kes, 0) - (coalesce(r.total_repayments_kes, 0) + coalesce(cr.total_return_credits_kes, 0))) as current_balance_kes,
  greatest(0, c.credit_limit_kes - greatest(0, coalesce(cs.total_credit_sales_kes, 0) - (coalesce(r.total_repayments_kes, 0) + coalesce(cr.total_return_credits_kes, 0)))) as available_credit_kes
from public.customers c
left join credit_sales cs on cs.customer_id = c.id
left join repayments r on r.customer_id = c.id
left join credit_returns cr on cr.customer_id = c.id;

-- View: Low Stock Products
create or replace view public.v_low_stock_products as
select 
  p.id,
  p.sku,
  p.barcode,
  p.product_name,
  c.name as category_name,
  p.unit_of_measure,
  p.selling_price_kes,
  p.stock_on_hand,
  p.low_stock_level,
  p.critical_stock_level,
  p.reorder_quantity,
  greatest(0, p.low_stock_level - p.stock_on_hand) as shortage_quantity,
  p.stock_location
from public.products p
left join public.product_categories c on c.id = p.category_id
where p.active = true 
  and p.low_stock_alert_enabled = true 
  and p.stock_on_hand <= p.low_stock_level;

-- View: Inventory Valuation
create or replace view public.v_stock_valuation as
select 
  p.id,
  p.sku,
  p.product_name,
  c.name as category_name,
  p.stock_on_hand,
  p.unit_of_measure,
  p.buying_price_kes,
  p.selling_price_kes,
  coalesce(p.stock_on_hand * p.buying_price_kes, 0) as total_cost_valuation_kes,
  coalesce(p.stock_on_hand * p.selling_price_kes, 0) as total_retail_valuation_kes,
  coalesce(p.stock_on_hand * (p.selling_price_kes - coalesce(p.buying_price_kes, 0)), 0) as potential_profit_kes
from public.products p
left join public.product_categories c on c.id = p.category_id
where p.active = true;

-- View: Daily Sales Summary
create or replace view public.v_daily_sales_summary as
select 
  date_trunc('day', s.created_at) as sale_date,
  count(distinct s.id) as total_transactions,
  coalesce(sum(s.total_kes), 0) as gross_sales_kes,
  coalesce(sum(s.discount_kes), 0) as total_discount_kes,
  coalesce(sum(s.tax_kes), 0) as total_tax_kes,
  coalesce(sum(case when p.method = 'cash' then p.amount_kes else 0 end), 0) as cash_collected_kes,
  coalesce(sum(case when p.method = 'mpesa' then p.amount_kes else 0 end), 0) as mpesa_collected_kes,
  coalesce(sum(case when p.method = 'credit' then p.amount_kes else 0 end), 0) as credit_sales_kes,
  coalesce(sum(case when p.method in ('card', 'bank_transfer', 'cheque', 'other') then p.amount_kes else 0 end), 0) as other_collected_kes
from public.sales s
left join public.payments p on p.sale_id = s.id
where s.status = 'completed'
group by date_trunc('day', s.created_at);

-- ----------------------------------------------------------------------------
-- 13. Atomic PostgreSQL RPCs (Checkout, Receiving, Returns, Repayments)
-- ----------------------------------------------------------------------------

-- Atomic Checkout RPC
create or replace function public.rpc_checkout(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'auth'
as $$
declare
  v_user_id uuid := auth.uid();
  v_offline_id text := payload->>'offline_id';
  v_idempotency_key text := coalesce(payload->>'idempotency_key', payload->>'offline_id');
  v_customer_id uuid := (payload->>'customer_id')::uuid;
  v_existing_sale record;
  v_sale_id uuid;
  v_receipt_number text;
  v_item jsonb;
  v_payment jsonb;
  v_product record;
  v_calc_subtotal numeric(14,2) := 0;
  v_calc_discount numeric(14,2) := coalesce((payload->>'discount_kes')::numeric, 0);
  v_calc_tax numeric(14,2) := 0;
  v_calc_total numeric(14,2) := 0;
  v_total_paid numeric(14,2) := 0;
  v_credit_portion numeric(14,2) := 0;
  v_cust_balance record;
  v_vat_rate numeric(5,2);
  v_cashier_name text;
  v_customer_name text;
begin
  -- 1. Idempotency check: if sale already exists by offline_id or idempotency_key, return it
  if v_idempotency_key is not null then
    select s.id, s.receipt_number, s.status, s.total_kes into v_existing_sale
    from public.sales s
    where s.idempotency_key = v_idempotency_key or (v_offline_id is not null and s.offline_id = v_offline_id)
    limit 1;

    if found then
      return jsonb_build_object(
        'success', true,
        'idempotent_duplicate', true,
        'sale_id', v_existing_sale.id,
        'receipt_number', v_existing_sale.receipt_number,
        'status', v_existing_sale.status,
        'total_kes', v_existing_sale.total_kes
      );
    end if;
  end if;

  -- 2. Verify authorization: actor must be active staff
  if v_user_id is null or not public.has_role(array['admin','store_manager','cashier']::public.app_role[]) then
    raise exception 'Unauthorized checkout: active cashier or manager credentials required';
  end if;

  select full_name into v_cashier_name from public.profiles where user_id = v_user_id;

  -- 3. Fetch store VAT rate
  select coalesce(vat_rate_percent, 16.0) into v_vat_rate from public.store_settings limit 1;

  -- 4. Validate customer if provided
  if v_customer_id is not null then
    select full_name into v_customer_name from public.customers where id = v_customer_id and active = true;
    if not found then
      raise exception 'Customer not found or account is inactive';
    end if;
  end if;

  -- 5. Generate Receipt Number: RCP-YYYYMMDD-XXXX
  v_receipt_number := coalesce(
    payload->>'receipt_number',
    'RCP-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text, 1, 6))
  );

  -- 6. Insert sale header
  insert into public.sales (
    receipt_number, customer_id, cashier_id, status, subtotal_kes, discount_kes, tax_kes, total_kes,
    amount_paid_kes, customer_name_snapshot, cashier_name_snapshot, offline_id, idempotency_key,
    is_offline_sync, notes, completed_at
  ) values (
    v_receipt_number, v_customer_id, v_user_id, 'completed', 0, v_calc_discount, 0, 0,
    0, v_customer_name, v_cashier_name, v_offline_id, v_idempotency_key,
    coalesce((payload->>'is_offline_sync')::boolean, false), payload->>'notes', now()
  ) returning id into v_sale_id;

  -- 7. Validate and insert sale items & update stock atomically
  for v_item in select * from jsonb_array_elements(payload->'items') loop
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update; -- Lock row to prevent race conditions

    if not found or v_product.active = false then
      raise exception 'Product % is unavailable or deactivated', (v_item->>'product_id');
    end if;

    -- Verify stock availability unless negative stock explicitly permitted
    if (v_product.stock_on_hand < (v_item->>'quantity')::numeric) then
      raise exception 'Insufficient stock for product "%". Available: %, Requested: %',
        v_product.product_name, v_product.stock_on_hand, (v_item->>'quantity')::numeric;
    end if;

    -- Compute line totals using DB selling price (prevent client price tampering)
    declare
      v_qty numeric := (v_item->>'quantity')::numeric;
      v_price numeric := coalesce(v_product.selling_price_kes, 0);
      v_disc numeric := coalesce((v_item->>'discount_kes')::numeric, 0);
      v_line_total numeric := greatest(0, (v_qty * v_price) - v_disc);
    begin
      v_calc_subtotal := v_calc_subtotal + (v_qty * v_price);

      insert into public.sale_items (
        sale_id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price_kes, discount_kes, line_total_kes
      ) values (
        v_sale_id, v_product.id, v_product.product_name, v_product.sku, v_qty, v_price, v_disc, v_line_total
      );

      -- Deduct product stock on hand
      update public.products
      set stock_on_hand = stock_on_hand - v_qty,
          updated_at = now()
      where id = v_product.id;

      -- Append immutable audit movement
      insert into public.stock_movements (
        product_id, movement_type, quantity_delta, unit_cost_kes, reference_type, reference_id, reason, created_by
      ) values (
        v_product.id, 'sale', -v_qty, v_product.buying_price_kes, 'sale', v_sale_id, 'Sale checkout ' || v_receipt_number, v_user_id
      );
    end;
  end loop;

  -- Calculate final totals & VAT
  v_calc_total := greatest(0, v_calc_subtotal - v_calc_discount);
  if v_vat_rate > 0 then
    v_calc_tax := round((v_calc_total * (v_vat_rate / (100.0 + v_vat_rate))), 2);
  end if;

  -- 8. Validate and insert payments
  for v_payment in select * from jsonb_array_elements(payload->'payments') loop
    declare
      v_p_method public.payment_method := (v_payment->>'method')::public.payment_method;
      v_p_amount numeric := (v_payment->>'amount_kes')::numeric;
      v_p_status public.payment_verification_status := 'verified';
    begin
      -- Unverified M-Pesa payments from client or offline sync must be marked unverified
      if v_p_method = 'mpesa' and coalesce(v_payment->>'verification_status', 'unverified') = 'unverified' then
        v_p_status := 'unverified';
      end if;

      if v_p_method = 'credit' then
        v_credit_portion := v_credit_portion + v_p_amount;
      end if;

      v_total_paid := v_total_paid + v_p_amount;

      insert into public.payments (
        sale_id, method, amount_kes, provider_reference, received_by, verification_status, notes
      ) values (
        v_sale_id, v_p_method, v_p_amount, v_payment->>'provider_reference', v_user_id, v_p_status, v_payment->>'notes'
      );
    end;
  end loop;

  -- 9. Credit Limit Enforcement
  if v_credit_portion > 0 then
    if v_customer_id is null then
      raise exception 'Credit payment requires a registered customer';
    end if;

    select * into v_cust_balance from public.v_customer_balances where id = v_customer_id;
    if v_credit_portion > v_cust_balance.available_credit_kes then
      raise exception 'Credit limit exceeded. Customer available credit: KES %, Requested credit: KES %',
        v_cust_balance.available_credit_kes, v_credit_portion;
    end if;
  end if;

  -- 10. Update sales header with computed totals
  update public.sales
  set subtotal_kes = v_calc_subtotal,
      tax_kes = v_calc_tax,
      total_kes = v_calc_total,
      amount_paid_kes = v_total_paid,
      updated_at = now()
  where id = v_sale_id;

  return jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'receipt_number', v_receipt_number,
    'total_kes', v_calc_total,
    'amount_paid_kes', v_total_paid,
    'tax_kes', v_calc_tax,
    'status', 'completed'
  );
end;
$$;

-- Atomic Receive Purchase RPC
create or replace function public.rpc_receive_purchase(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'auth'
as $$
declare
  v_user_id uuid := auth.uid();
  v_purchase_id uuid := (payload->>'purchase_id')::uuid;
  v_purchase record;
  v_item record;
begin
  if not public.has_role(array['admin','store_manager','inventory_clerk']::public.app_role[]) then
    raise exception 'Unauthorized: Only inventory clerks or managers can receive stock';
  end if;

  select * into v_purchase from public.purchases where id = v_purchase_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_purchase.status = 'received' then raise exception 'Purchase order is already received'; end if;

  for v_item in select * from public.purchase_items where purchase_id = v_purchase_id loop
    update public.products
    set stock_on_hand = stock_on_hand + v_item.quantity,
        buying_price_kes = v_item.unit_cost_kes,
        updated_at = now()
    where id = v_item.product_id;

    insert into public.stock_movements (
      product_id, movement_type, quantity_delta, unit_cost_kes, reference_type, reference_id, reason, created_by
    ) values (
      v_item.product_id, 'purchase_receipt', v_item.quantity, v_item.unit_cost_kes, 'purchase', v_purchase_id,
      'Stock received under PO ' || v_purchase.po_number, v_user_id
    );
  end loop;

  update public.purchases
  set status = 'received',
      received_by = v_user_id,
      received_at = now(),
      updated_at = now()
  where id = v_purchase_id;

  return jsonb_build_object('success', true, 'purchase_id', v_purchase_id, 'status', 'received');
end;
$$;

-- Atomic Sales Return RPC
create or replace function public.rpc_process_return(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'auth'
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale_id uuid := (payload->>'sale_id')::uuid;
  v_customer_id uuid := (payload->>'customer_id')::uuid;
  v_return_id uuid;
  v_return_number text;
  v_item jsonb;
  v_total_refund numeric(14,2) := 0;
begin
  if not public.has_role(array['admin','store_manager','cashier']::public.app_role[]) then
    raise exception 'Unauthorized to process returns';
  end if;

  v_return_number := 'RET-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));

  insert into public.returns (
    return_number, sale_id, customer_id, cashier_id, refund_method, total_refund_kes, reason
  ) values (
    v_return_number, v_sale_id, v_customer_id, v_user_id, (payload->>'refund_method')::public.payment_method,
    0, payload->>'reason'
  ) returning id into v_return_id;

  for v_item in select * from jsonb_array_elements(payload->'items') loop
    declare
      v_pid uuid := (v_item->>'product_id')::uuid;
      v_qty numeric := (v_item->>'quantity')::numeric;
      v_price numeric := (v_item->>'unit_price_kes')::numeric;
      v_restock boolean := coalesce((v_item->>'restock_inventory')::boolean, true);
      v_cond public.return_condition := coalesce((v_item->>'condition')::public.return_condition, 'good');
      v_line_total numeric := v_qty * v_price;
    begin
      v_total_refund := v_total_refund + v_line_total;

      insert into public.return_items (
        return_id, product_id, quantity, unit_price_kes, line_total_kes, restock_inventory, condition
      ) values (
        v_return_id, v_pid, v_qty, v_price, v_line_total, v_restock, v_cond
      );

      if v_restock and v_cond = 'good' then
        update public.products set stock_on_hand = stock_on_hand + v_qty, updated_at = now() where id = v_pid;

        insert into public.stock_movements (
          product_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by
        ) values (
          v_pid, 'sale_return', v_qty, 'return', v_return_id, 'Restocked customer return ' || v_return_number, v_user_id
        );
      elsif v_cond = 'damaged' then
        insert into public.stock_movements (
          product_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by
        ) values (
          v_pid, 'damage', -v_qty, 'return', v_return_id, 'Damaged customer return write-off ' || v_return_number, v_user_id
        );
      end if;
    end;
  end loop;

  update public.returns set total_refund_kes = v_total_refund where id = v_return_id;

  return jsonb_build_object('success', true, 'return_id', v_return_id, 'return_number', v_return_number, 'refund_kes', v_total_refund);
end;
$$;

-- Atomic Stock Adjustment RPC
create or replace function public.rpc_record_stock_adjustment(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'auth'
as $$
declare
  v_user_id uuid := auth.uid();
  v_product_id uuid := (payload->>'product_id')::uuid;
  v_delta numeric := (payload->>'quantity_delta')::numeric;
  v_type public.stock_movement_type := coalesce((payload->>'movement_type')::public.stock_movement_type, 'adjustment');
  v_reason text := payload->>'reason';
  v_product record;
begin
  if not public.has_role(array['admin','store_manager','inventory_clerk']::public.app_role[]) then
    raise exception 'Unauthorized: Only inventory clerks or managers can adjust stock';
  end if;

  select * into v_product from public.products where id = v_product_id for update;
  if not found then raise exception 'Product not found'; end if;

  if (v_product.stock_on_hand + v_delta) < 0 then
    raise exception 'Stock adjustment would cause negative balance (Current: %, Delta: %)', v_product.stock_on_hand, v_delta;
  end if;

  update public.products
  set stock_on_hand = stock_on_hand + v_delta,
      updated_at = now()
  where id = v_product_id;

  insert into public.stock_movements (
    product_id, movement_type, quantity_delta, unit_cost_kes, reason, created_by
  ) values (
    v_product_id, v_type, v_delta, v_product.buying_price_kes, coalesce(v_reason, 'Manual inventory adjustment'), v_user_id
  );

  return jsonb_build_object('success', true, 'product_id', v_product_id, 'new_stock', v_product.stock_on_hand + v_delta);
end;
$$;

-- Atomic Repayment RPC
create or replace function public.rpc_record_repayment(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'auth'
as $$
declare
  v_user_id uuid := auth.uid();
  v_customer_id uuid := (payload->>'customer_id')::uuid;
  v_amount numeric := (payload->>'amount_kes')::numeric;
  v_receipt_no text;
  v_repayment_id uuid;
begin
  if not public.has_role(array['admin','store_manager','cashier','accountant']::public.app_role[]) then
    raise exception 'Unauthorized to record credit repayments';
  end if;

  v_receipt_no := 'RPM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));

  insert into public.customer_repayments (
    customer_id, receipt_number, amount_kes, method, provider_reference, notes, received_by
  ) values (
    v_customer_id, v_receipt_no, v_amount, (payload->>'method')::public.payment_method,
    payload->>'provider_reference', payload->>'notes', v_user_id
  ) returning id into v_repayment_id;

  return jsonb_build_object('success', true, 'repayment_id', v_repayment_id, 'receipt_number', v_receipt_no, 'amount_kes', v_amount);
end;
$$;

-- Atomic Payment Verification RPC
create or replace function public.rpc_verify_payment(p_payment_id uuid, p_status text, p_notes text default null)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'auth'
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if not public.has_role(array['admin','store_manager','accountant']::public.app_role[]) then
    raise exception 'Unauthorized: Only store managers or accountants can verify payments';
  end if;

  update public.payments
  set verification_status = p_status::public.payment_verification_status,
      verified_by = v_user_id,
      verified_at = now(),
      notes = case when p_notes is not null then coalesce(notes || ' | ', '') || p_notes else notes end
  where id = p_payment_id;

  return jsonb_build_object('success', true, 'payment_id', p_payment_id, 'status', p_status);
end;
$$;

grant execute on function public.rpc_checkout(jsonb) to authenticated;
grant execute on function public.rpc_receive_purchase(jsonb) to authenticated;
grant execute on function public.rpc_process_return(jsonb) to authenticated;
grant execute on function public.rpc_record_stock_adjustment(jsonb) to authenticated;
grant execute on function public.rpc_record_repayment(jsonb) to authenticated;
grant execute on function public.rpc_verify_payment(uuid, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 14. Row-Level Security (RLS)
-- ----------------------------------------------------------------------------
alter table public.store_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.customer_repayments enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;
alter table public.expenses enable row level security;
alter table public.stock_movements enable row level security;
alter table public.audit_logs enable row level security;

-- Store Settings
drop policy if exists store_settings_select on public.store_settings;
create policy store_settings_select on public.store_settings for select to authenticated using (true);
drop policy if exists store_settings_update on public.store_settings;
create policy store_settings_update on public.store_settings for update to authenticated
using (public.has_role(array['admin','store_manager']::public.app_role[]));

-- Profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (user_id = (select auth.uid()) or public.has_role(array['admin','store_manager']::public.app_role[]));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using (user_id = (select auth.uid()) or public.has_role(array['admin','store_manager']::public.app_role[]));

-- Catalogue
drop policy if exists categories_select on public.product_categories;
create policy categories_select on public.product_categories for select to authenticated using (true);
drop policy if exists categories_modify on public.product_categories;
create policy categories_modify on public.product_categories for all to authenticated
using (public.has_role(array['admin','store_manager']::public.app_role[]));

drop policy if exists products_select on public.products;
create policy products_select on public.products for select to authenticated using (true);
drop policy if exists products_modify on public.products;
create policy products_modify on public.products for all to authenticated
using (public.has_role(array['admin','store_manager','inventory_clerk']::public.app_role[]));

-- Customers & Repayments
drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers for select to authenticated using (true);
drop policy if exists customers_insert on public.customers;
create policy customers_insert on public.customers for insert to authenticated with check (public.current_role() is not null);
drop policy if exists customers_update on public.customers;
create policy customers_update on public.customers for update to authenticated
using (public.has_role(array['admin','store_manager','cashier','accountant']::public.app_role[]));

drop policy if exists repayments_select on public.customer_repayments;
create policy repayments_select on public.customer_repayments for select to authenticated using (true);
drop policy if exists repayments_insert on public.customer_repayments;
create policy repayments_insert on public.customer_repayments for insert to authenticated
with check (public.has_role(array['admin','store_manager','cashier','accountant']::public.app_role[]));

-- Suppliers & Purchases
drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select on public.suppliers for select to authenticated using (true);
drop policy if exists suppliers_modify on public.suppliers;
create policy suppliers_modify on public.suppliers for all to authenticated
using (public.has_role(array['admin','store_manager','inventory_clerk','accountant']::public.app_role[]));

drop policy if exists purchases_select on public.purchases;
create policy purchases_select on public.purchases for select to authenticated using (true);
drop policy if exists purchases_modify on public.purchases;
create policy purchases_modify on public.purchases for all to authenticated
using (public.has_role(array['admin','store_manager','inventory_clerk']::public.app_role[]));

drop policy if exists purchase_items_select on public.purchase_items;
create policy purchase_items_select on public.purchase_items for select to authenticated using (true);
drop policy if exists purchase_items_modify on public.purchase_items;
create policy purchase_items_modify on public.purchase_items for all to authenticated
using (public.has_role(array['admin','store_manager','inventory_clerk']::public.app_role[]));

-- Sales, Sale Items, Payments
drop policy if exists sales_select on public.sales;
create policy sales_select on public.sales for select to authenticated using (true);
drop policy if exists sales_insert on public.sales;
create policy sales_insert on public.sales for insert to authenticated with check (public.current_role() is not null);
drop policy if exists sales_update on public.sales;
create policy sales_update on public.sales for update to authenticated
using (public.has_role(array['admin','store_manager']::public.app_role[]) or (status = 'draft' and cashier_id = (select auth.uid())));

drop policy if exists sale_items_select on public.sale_items;
create policy sale_items_select on public.sale_items for select to authenticated using (true);
drop policy if exists sale_items_modify on public.sale_items;
create policy sale_items_modify on public.sale_items for all to authenticated with check (public.current_role() is not null);

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select to authenticated using (true);
drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert to authenticated with check (public.current_role() is not null);
drop policy if exists payments_update on public.payments;
create policy payments_update on public.payments for update to authenticated
using (public.has_role(array['admin','store_manager','accountant']::public.app_role[]));

-- Returns
drop policy if exists returns_select on public.returns;
create policy returns_select on public.returns for select to authenticated using (true);
drop policy if exists returns_insert on public.returns;
create policy returns_insert on public.returns for insert to authenticated
with check (public.has_role(array['admin','store_manager','cashier']::public.app_role[]));

drop policy if exists return_items_select on public.return_items;
create policy return_items_select on public.return_items for select to authenticated using (true);
drop policy if exists return_items_insert on public.return_items;
create policy return_items_insert on public.return_items for insert to authenticated with check (public.current_role() is not null);

-- Expenses
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses for select to authenticated using (true);
drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses for insert to authenticated with check (public.current_role() is not null);
drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses for update to authenticated
using (public.has_role(array['admin','store_manager','accountant']::public.app_role[]));

-- Stock Movements (Immutable append-only)
drop policy if exists stock_movements_select on public.stock_movements;
create policy stock_movements_select on public.stock_movements for select to authenticated using (true);
drop policy if exists stock_movements_insert on public.stock_movements;
create policy stock_movements_insert on public.stock_movements for insert to authenticated
with check (public.has_role(array['admin','store_manager','inventory_clerk']::public.app_role[]));

-- Audit Logs
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated
using (public.has_role(array['admin','store_manager']::public.app_role[]));

-- Anonymous Lockdown & Authenticated Grants
revoke all on public.store_settings, public.profiles, public.product_categories, public.products, public.customers,
  public.customer_repayments, public.suppliers, public.purchases, public.purchase_items, public.sales, public.sale_items,
  public.payments, public.returns, public.return_items, public.expenses, public.stock_movements, public.audit_logs from anon;

grant select on public.store_settings, public.profiles, public.product_categories, public.products, public.customers,
  public.customer_repayments, public.suppliers, public.purchases, public.purchase_items, public.sales, public.sale_items,
  public.payments, public.returns, public.return_items, public.expenses, public.stock_movements to authenticated;

grant insert, update on public.store_settings, public.profiles, public.product_categories, public.products, public.customers,
  public.customer_repayments, public.suppliers, public.purchases, public.purchase_items, public.sales, public.sale_items,
  public.payments, public.returns, public.return_items, public.expenses, public.stock_movements to authenticated;

grant select on public.audit_logs to authenticated;

commit;
