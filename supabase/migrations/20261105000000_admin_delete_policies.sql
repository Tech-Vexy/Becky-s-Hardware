-- Migration: Add DELETE policies for admin role to ensure store owner can make changes whenever necessary
-- Date: 2026-11-05
-- Purpose: Store owner (admin role) should have full control including deletion capabilities

begin;

-- 1. Store Settings - Admin can delete and recreate the singleton row
drop policy if exists store_settings_delete on public.store_settings;
create policy store_settings_delete on public.store_settings for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 2. Profiles - Admin can delete staff profiles (with cascade handled by auth.users on delete restrict)
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 3. Product Categories - Admin can delete categories
drop policy if exists categories_delete on public.product_categories;
create policy categories_delete on public.product_categories for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 4. Products - Admin can delete products
drop policy if exists products_delete on public.products;
create policy products_delete on public.products for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 5. Customers - Admin can delete customers
drop policy if exists customers_delete on public.customers;
create policy customers_delete on public.customers for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 6. Customer Repayments - Admin can delete repayments
drop policy if exists repayments_delete on public.customer_repayments;
create policy repayments_delete on public.customer_repayments for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 7. Suppliers - Admin can delete suppliers
drop policy if exists suppliers_delete on public.suppliers;
create policy suppliers_delete on public.suppliers for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 8. Purchases - Admin can delete purchases
drop policy if exists purchases_delete on public.purchases;
create policy purchases_delete on public.purchases for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 9. Purchase Items - Admin can delete purchase items (cascades with purchases)
drop policy if exists purchase_items_delete on public.purchase_items;
create policy purchase_items_delete on public.purchase_items for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 10. Sales - Admin can delete sales (typically only for test data or voids)
drop policy if exists sales_delete on public.sales;
create policy sales_delete on public.sales for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 11. Sale Items - Admin can delete sale items (cascades with sales)
drop policy if exists sale_items_delete on public.sale_items;
create policy sale_items_delete on public.sale_items for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 12. Payments - Admin can delete payments (cascades with sales)
drop policy if exists payments_delete on public.payments;
create policy payments_delete on public.payments for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 13. Returns - Admin can delete returns
drop policy if exists returns_delete on public.returns;
create policy returns_delete on public.returns for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 14. Return Items - Admin can delete return items (cascades with returns)
drop policy if exists return_items_delete on public.return_items;
create policy return_items_delete on public.return_items for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 15. Expenses - Admin can delete expenses
drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 16. Stock Movements - Admin can delete stock movements (for correcting audit trail errors)
-- Note: This is dangerous for financial integrity, but admin should have ultimate control
drop policy if exists stock_movements_delete on public.stock_movements;
create policy stock_movements_delete on public.stock_movements for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 17. Audit Logs - Admin can delete audit logs (for data retention compliance)
drop policy if exists audit_logs_delete on public.audit_logs;
create policy audit_logs_delete on public.audit_logs for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- 18. Invoices - Admin can delete invoices
drop policy if exists invoices_delete on public.invoices;
create policy invoices_delete on public.invoices for delete to authenticated
using (public.has_role(array['admin']::public.app_role[]));

-- Grant DELETE permission to authenticated role (RLS policies will enforce actual access)
grant delete on public.store_settings, public.profiles, public.product_categories, public.products,
  public.customers, public.customer_repayments, public.suppliers, public.purchases, public.purchase_items,
  public.sales, public.sale_items, public.payments, public.returns, public.return_items, public.expenses,
  public.stock_movements, public.audit_logs, public.invoices to authenticated;

commit;
