-- Migration: Add GIN Trigram, Full-Text, and Foreign Key Indexes for Fast Search
-- Enables lightning-fast product search by inputting a few letters or partial strings

begin;

-- Enable trigram extension for substring and ILIKE search
create extension if not exists pg_trgm;

-- 1. Product Search Indexes
-- Trigram indexes on product_name, sku, and barcode for instant few-letter matching
create index if not exists idx_products_name_trgm on public.products using gin (product_name gin_trgm_ops);
create index if not exists idx_products_sku_trgm on public.products using gin (sku gin_trgm_ops);
create index if not exists idx_products_barcode_trgm on public.products using gin (barcode gin_trgm_ops);
create index if not exists idx_products_brand_trgm on public.products using gin (brand gin_trgm_ops);

-- Full-text search tsvector generated column & index for comprehensive hardware search
alter table public.products 
  add column if not exists search_vector tsvector 
  generated always as (
    to_tsvector('english', 
      coalesce(product_name, '') || ' ' || 
      coalesce(sku, '') || ' ' || 
      coalesce(brand, '') || ' ' || 
      coalesce(specification, '')
    )
  ) stored;

create index if not exists idx_products_search_vector on public.products using gin (search_vector);

-- 2. Customer Search Indexes
create index if not exists idx_customers_name_trgm on public.customers using gin (full_name gin_trgm_ops);
create index if not exists idx_customers_phone_trgm on public.customers using gin (phone gin_trgm_ops);
create index if not exists idx_customers_code_trgm on public.customers using gin (customer_code gin_trgm_ops);

-- 3. Supplier Search Indexes
create index if not exists idx_suppliers_name_trgm on public.suppliers using gin (name gin_trgm_ops);
create index if not exists idx_suppliers_phone_trgm on public.suppliers using gin (phone gin_trgm_ops);

-- 4. Sales & Payments Search Indexes
create index if not exists idx_sales_receipt_number on public.sales(receipt_number);
create index if not exists idx_payments_reference on public.payments(provider_reference);

-- 5. Foreign Key Indexes for Referential Performance & Cascade Optimization
create index if not exists idx_sale_items_product on public.sale_items(product_id);
create index if not exists idx_purchase_items_product on public.purchase_items(product_id);
create index if not exists idx_returns_sale on public.returns(sale_id);
create index if not exists idx_return_items_return on public.return_items(return_id);
create index if not exists idx_return_items_product on public.return_items(product_id);

commit;
