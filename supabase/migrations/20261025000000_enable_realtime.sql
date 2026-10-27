-- ============================================================================
-- Supabase Realtime Publication Setup
-- Enables postgres_changes replication for live sales, payments, products,
-- stock movements, and customer repayments.
-- ============================================================================

do $$
begin
  -- Ensure publication exists
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Enable Realtime for single store tables
alter publication supabase_realtime add table public.sales;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.customer_repayments;
alter publication supabase_realtime add table public.stock_movements;
