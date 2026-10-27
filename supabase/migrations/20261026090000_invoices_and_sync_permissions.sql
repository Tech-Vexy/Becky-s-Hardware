-- Migration: Add Invoices, Invoice Items, and Sync Permissions
-- Date: 2026-10-26

begin;

-- 1. Create Invoices Table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  sale_id uuid references public.sales(id) on delete set null,
  sale_receipt_number text,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_kra_pin text,
  customer_address text,
  issue_date date not null default current_date,
  due_date date not null default (current_date + interval '14 days'),
  status text not null default 'pending', -- 'draft', 'pending', 'paid', 'partial', 'cancelled'
  subtotal_kes numeric(14, 2) not null default 0 check (subtotal_kes >= 0),
  tax_kes numeric(14, 2) not null default 0 check (tax_kes >= 0),
  total_kes numeric(14, 2) not null default 0 check (total_kes >= 0),
  amount_paid_kes numeric(14, 2) not null default 0 check (amount_paid_kes >= 0),
  balance_due_kes numeric(14, 2) not null default 0 check (balance_due_kes >= 0),
  notes text,
  payment_terms text default 'Net 14 Days',
  items jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for Invoices
create index if not exists idx_invoices_number on public.invoices(invoice_number);
create index if not exists idx_invoices_customer on public.invoices(customer_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_date on public.invoices(issue_date desc);

-- Trigger for updated_at
drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- 2. Row Level Security for Invoices
alter table public.invoices enable row level security;

drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select to authenticated using (true);

drop policy if exists invoices_insert on public.invoices;
create policy invoices_insert on public.invoices for insert to authenticated with check (true);

drop policy if exists invoices_update on public.invoices;
create policy invoices_update on public.invoices for update to authenticated using (true);

-- 3. Grants for Invoices
grant select, insert, update on public.invoices to authenticated;

-- 4. Enable public reading of catalog & store settings for seamless offline-first bootstrapping
grant select on public.products, public.product_categories, public.store_settings to anon;

-- Ensure RLS policies allow anon select on products, categories, and store settings
drop policy if exists products_anon_select on public.products;
create policy products_anon_select on public.products for select to anon using (active = true);

drop policy if exists categories_anon_select on public.product_categories;
create policy categories_anon_select on public.product_categories for select to anon using (active = true);

drop policy if exists store_settings_anon_select on public.store_settings;
create policy store_settings_anon_select on public.store_settings for select to anon using (true);

-- 5. Add Invoices to Realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'invoices'
  ) then
    alter publication supabase_realtime add table public.invoices;
  end if;
end $$;

commit;
