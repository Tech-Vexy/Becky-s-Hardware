-- Hardware Store Seed Data (Suppliers, Customers, Initial Stock)
begin;

-- Seed Suppliers
insert into public.suppliers (id, supplier_code, name, phone, email, address, tax_pin, active)
values
  ('00000000-0000-0000-0002-000000000001'::uuid, 'SUP-001', 'Bamburi Cement Ltd', '+254 709 724 000', 'orders@lafarge.bamburi.co.ke', 'Corporate Square, Nairobi', 'P051112233A', true),
  ('00000000-0000-0000-0002-000000000002'::uuid, 'SUP-002', 'Mabati Rolling Mills (MRM)', '+254 788 123 456', 'sales@mrm.co.ke', 'Mariakani / Industrial Area, Nairobi', 'P051223344B', true),
  ('00000000-0000-0000-0002-000000000003'::uuid, 'SUP-003', 'Crown Paints Kenya PLC', '+254 709 887 000', 'orders@crownpaints.co.ke', 'Likoni Road, Industrial Area, Nairobi', 'P051334455C', true),
  ('00000000-0000-0000-0002-000000000004'::uuid, 'SUP-004', 'Davis & Shirtliff Ltd', '+254 711 079 000', 'sales@dayliff.com', 'D&S Complex, Dundori Rd, Nairobi', 'P051445566D', true),
  ('00000000-0000-0000-0002-000000000005'::uuid, 'SUP-005', 'Khetshi Dharamshi & Co', '+254 722 516 789', 'hardware@khetshi.co.ke', 'Dar es Salaam Rd, Nairobi', 'P051556677E', true)
on conflict (supplier_code) do update set name = excluded.name, phone = excluded.phone, updated_at = now();

-- Seed Customers
insert into public.customers (id, customer_code, full_name, phone, email, address, credit_limit_kes, active)
values
  ('00000000-0000-0000-0003-000000000001'::uuid, 'CUST-001', 'Walk-In Customer (Cash/M-Pesa)', '+254 700 000 000', null, 'Counter Service', 0.0, true),
  ('00000000-0000-0000-0003-000000000002'::uuid, 'CUST-002', 'Fundi James Mwangi (Plumber & Mason)', '+254 722 345 678', 'fundimwangi@gmail.com', 'Syokimau Estate, Nairobi', 50000.0, true),
  ('00000000-0000-0000-0003-000000000003'::uuid, 'CUST-003', 'Nairobi Buildcon Contractors Ltd', '+254 733 987 654', 'accounts@nairobibuildcon.co.ke', 'Enterprise Rd, Industrial Area', 250000.0, true),
  ('00000000-0000-0000-0003-000000000004'::uuid, 'CUST-004', 'Mama Sarah Oloo (Home Builder)', '+254 710 445 566', 'saraholoo@yahoo.com', 'Kitengela, Plot 42', 80000.0, true)
on conflict (customer_code) do update set full_name = excluded.full_name, credit_limit_kes = excluded.credit_limit_kes, updated_at = now();

commit;
