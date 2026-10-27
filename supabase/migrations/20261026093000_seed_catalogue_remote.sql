-- Seed remote database with catalogue, suppliers, and customers
begin;

-- 1. Insert Categories
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000001', 'Boards, Timber & Gypsum', 'Boards, Timber & Gypsum Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000002', 'Cabinet & Door Hardware', 'Cabinet & Door Hardware Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000003', 'Cement & Masonry', 'Cement & Masonry Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000004', 'Drainage & Covers', 'Drainage & Covers Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000005', 'Electrical Conduits & Boxes', 'Electrical Conduits & Boxes Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000006', 'Fasteners & Wire', 'Fasteners & Wire Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000007', 'Hand Tools & Cutting', 'Hand Tools & Cutting Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000008', 'Locks & Security', 'Locks & Security Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000009', 'PPR Pipes & Fittings', 'PPR Pipes & Fittings Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000010', 'PVC Waste & Drainage', 'PVC Waste & Drainage Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000011', 'Painting Tools', 'Painting Tools Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000012', 'Paints, Solvents & Wood Finishes', 'Paints, Solvents & Wood Finishes Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000013', 'Tapes & Adhesives', 'Tapes & Adhesives Department', true)
on conflict (name) do update set active = true;
insert into public.product_categories (id, name, description, active)
values ('00000000-0000-0000-0005-000000000014', 'Waterproofing & Sheeting', 'Waterproofing & Sheeting Department', true)
on conflict (name) do update set active = true;

-- 2. Insert Suppliers
insert into public.suppliers (id, supplier_code, name, phone, email, address, tax_pin, active)
values ('00000000-0000-0000-0002-000000000001', 'SUP-001', 'Bamburi Cement Ltd', '+254 709 724 000', 'orders@lafarge.bamburi.co.ke', 'Corporate Square, Nairobi', 'P051112233A', true)
on conflict (supplier_code) do update set name = excluded.name, phone = excluded.phone, email = excluded.email;
insert into public.suppliers (id, supplier_code, name, phone, email, address, tax_pin, active)
values ('00000000-0000-0000-0002-000000000002', 'SUP-002', 'Mabati Rolling Mills (MRM)', '+254 788 123 456', 'sales@mrm.co.ke', 'Mariakani / Industrial Area, Nairobi', 'P051223344B', true)
on conflict (supplier_code) do update set name = excluded.name, phone = excluded.phone, email = excluded.email;
insert into public.suppliers (id, supplier_code, name, phone, email, address, tax_pin, active)
values ('00000000-0000-0000-0002-000000000003', 'SUP-003', 'Crown Paints Kenya PLC', '+254 709 887 000', 'orders@crownpaints.co.ke', 'Likoni Road, Industrial Area, Nairobi', 'P051334455C', true)
on conflict (supplier_code) do update set name = excluded.name, phone = excluded.phone, email = excluded.email;
insert into public.suppliers (id, supplier_code, name, phone, email, address, tax_pin, active)
values ('00000000-0000-0000-0002-000000000004', 'SUP-004', 'Davis & Shirtliff Ltd', '+254 711 079 000', 'sales@dayliff.com', 'D&S Complex, Dundori Rd, Nairobi', 'P051445566D', true)
on conflict (supplier_code) do update set name = excluded.name, phone = excluded.phone, email = excluded.email;
insert into public.suppliers (id, supplier_code, name, phone, email, address, tax_pin, active)
values ('00000000-0000-0000-0002-000000000005', 'SUP-005', 'Khetshi Dharamshi & Co', '+254 722 516 789', 'hardware@khetshi.co.ke', 'Dar es Salaam Rd, Nairobi', 'P051556677E', true)
on conflict (supplier_code) do update set name = excluded.name, phone = excluded.phone, email = excluded.email;

-- 3. Insert Customers
insert into public.customers (id, customer_code, full_name, phone, email, address, credit_limit_kes, active)
values ('00000000-0000-0000-0003-000000000001', 'CUST-001', 'Walk-In Customer (Cash/M-Pesa)', '+254 700 000 000', '', 'Counter Service', 0, true)
on conflict (customer_code) do update set full_name = excluded.full_name, phone = excluded.phone, credit_limit_kes = excluded.credit_limit_kes;
insert into public.customers (id, customer_code, full_name, phone, email, address, credit_limit_kes, active)
values ('00000000-0000-0000-0003-000000000002', 'CUST-002', 'Fundi James Mwangi (Plumber & Mason)', '+254 722 345 678', 'fundimwangi@gmail.com', 'Syokimau Estate, Nairobi', 50000, true)
on conflict (customer_code) do update set full_name = excluded.full_name, phone = excluded.phone, credit_limit_kes = excluded.credit_limit_kes;
insert into public.customers (id, customer_code, full_name, phone, email, address, credit_limit_kes, active)
values ('00000000-0000-0000-0003-000000000003', 'CUST-003', 'Nairobi Buildcon Contractors Ltd', '+254 733 987 654', 'accounts@nairobibuildcon.co.ke', 'Enterprise Rd, Industrial Area', 250000, true)
on conflict (customer_code) do update set full_name = excluded.full_name, phone = excluded.phone, credit_limit_kes = excluded.credit_limit_kes;
insert into public.customers (id, customer_code, full_name, phone, email, address, credit_limit_kes, active)
values ('00000000-0000-0000-0003-000000000004', 'CUST-004', 'Mama Sarah Oloo (Home Builder)', '+254 710 445 566', 'saraholoo@yahoo.com', 'Kitengela, Plot 42', 80000, true)
on conflict (customer_code) do update set full_name = excluded.full_name, phone = excluded.phone, credit_limit_kes = excluded.credit_limit_kes;

-- 4. Insert 193 Hardware Products
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000001',
  (select id from public.product_categories where name = 'Boards, Timber & Gypsum' limit 1),
  'BRD-CRN-TPE',
  '616400000001',
  'Corner Tape',
  'Generic',
  'Standard Roll',
  NULL,
  'Metal-Reinforced',
  'roll',
  850,
  850,
  663,
  20,
  5,
  15,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000002',
  (select id from public.product_categories where name = 'Boards, Timber & Gypsum' limit 1),
  'BRD-GYP-BRD',
  '616400000002',
  'Gyproc (Gypsum Board/Filler)',
  'Gyproc',
  'Standard',
  'White',
  'Standard',
  'pcs',
  2000,
  2000,
  1560,
  20,
  10,
  30,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000003',
  (select id from public.product_categories where name = 'Boards, Timber & Gypsum' limit 1),
  'BRD-GYP-CHN',
  '616400000003',
  'Gypsum Channels',
  'Generic',
  'Standard Length',
  NULL,
  'Galvanized',
  'pcs',
  180,
  180,
  140.4,
  20,
  20,
  50,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000004',
  (select id from public.product_categories where name = 'Boards, Timber & Gypsum' limit 1),
  'BRD-GYP-STD',
  '616400000004',
  'Gypsum Studs',
  'Generic',
  'Standard Length',
  NULL,
  'Galvanized',
  'pcs',
  180,
  180,
  140.4,
  20,
  20,
  50,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000005',
  (select id from public.product_categories where name = 'Boards, Timber & Gypsum' limit 1),
  'BRD-MDF-STD',
  '616400000005',
  'MDF Board',
  'Generic',
  'Standard Sheet',
  NULL,
  '8x4 Sheet',
  'sheet',
  3300,
  3300,
  2574,
  20,
  5,
  15,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000006',
  (select id from public.product_categories where name = 'Boards, Timber & Gypsum' limit 1),
  'BRD-PLY-3MM',
  '616400000006',
  'Plywood',
  'Generic',
  '3mm',
  NULL,
  '8x4 Sheet',
  'sheet',
  500,
  500,
  390,
  20,
  10,
  25,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000007',
  (select id from public.product_categories where name = 'Boards, Timber & Gypsum' limit 1),
  'BRD-PLY-6MM',
  '616400000007',
  'Plywood',
  'Generic',
  '6mm',
  NULL,
  '8x4 Sheet',
  'sheet',
  1200,
  1200,
  936,
  20,
  8,
  20,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000008',
  (select id from public.product_categories where name = 'Boards, Timber & Gypsum' limit 1),
  'BRD-PLY-9MM',
  '616400000008',
  'Plywood',
  'Generic',
  '9mm',
  NULL,
  '8x4 Sheet',
  'sheet',
  1400,
  1400,
  1092,
  20,
  8,
  20,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000009',
  (select id from public.product_categories where name = 'Cabinet & Door Hardware' limit 1),
  'CAB-BTH-STD',
  '616400000009',
  'Butt Hinges',
  'Generic',
  'Standard',
  NULL,
  'Steel/Brass',
  'pair',
  300,
  300,
  234,
  20,
  10,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000010',
  (select id from public.product_categories where name = 'Cabinet & Door Hardware' limit 1),
  'CAB-CHR-PIP',
  '616400000010',
  'Chrome Pipe',
  'Generic',
  'Standard Length',
  'Chrome',
  'Wardrobe Rod',
  'pcs',
  450,
  450,
  351,
  20,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000011',
  (select id from public.product_categories where name = 'Cabinet & Door Hardware' limit 1),
  'CAB-DRL-12',
  '616400000011',
  'Drawer Rails',
  'Generic',
  '12 inch',
  NULL,
  'Roller/Ball Bearing',
  'pair',
  250,
  250,
  195,
  20,
  6,
  15,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000012',
  (select id from public.product_categories where name = 'Cabinet & Door Hardware' limit 1),
  'CAB-DRL-14',
  '616400000012',
  'Drawer Rails',
  'Generic',
  '14 inch',
  NULL,
  'Roller/Ball Bearing',
  'pair',
  300,
  300,
  234,
  20,
  6,
  15,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000013',
  (select id from public.product_categories where name = 'Cabinet & Door Hardware' limit 1),
  'CAB-DRL-16',
  '616400000013',
  'Drawer Rails',
  'Generic',
  '16 inch',
  NULL,
  'Roller/Ball Bearing',
  'pair',
  350,
  350,
  273,
  20,
  6,
  15,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000014',
  (select id from public.product_categories where name = 'Cabinet & Door Hardware' limit 1),
  'CAB-DRL-18',
  '616400000014',
  'Drawer Rails',
  'Generic',
  '18 inch',
  NULL,
  'Roller/Ball Bearing',
  'pair',
  400,
  400,
  312,
  20,
  6,
  15,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000015',
  (select id from public.product_categories where name = 'Cabinet & Door Hardware' limit 1),
  'CAB-DRL-20',
  '616400000015',
  'Drawer Rails',
  'Generic',
  '20 inch',
  NULL,
  'Roller/Ball Bearing',
  'pair',
  500,
  500,
  390,
  20,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000016',
  (select id from public.product_categories where name = 'Cement & Masonry' limit 1),
  'CMT-LSE-KG',
  '616400000016',
  'Cement',
  'Generic',
  'Loose / Repackaged',
  'Grey',
  'Portland',
  'kg',
  50,
  50,
  39,
  50,
  100,
  500,
  true,
  'SHOP',
  'Sold per kg',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000017',
  (select id from public.product_categories where name = 'Drainage & Covers' limit 1),
  'DRN-MHC-12',
  '616400000017',
  'Manhole Cover',
  'Generic',
  '12x12 inch',
  NULL,
  'Standard',
  'pcs',
  600,
  600,
  468,
  20,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000018',
  (select id from public.product_categories where name = 'Drainage & Covers' limit 1),
  'DRN-MHC-15',
  '616400000018',
  'Manhole Cover',
  'Generic',
  '15x15 inch',
  NULL,
  'Standard',
  'pcs',
  700,
  700,
  546,
  20,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000019',
  (select id from public.product_categories where name = 'Drainage & Covers' limit 1),
  'DRN-MHC-18',
  '616400000019',
  'Manhole Cover',
  'Generic',
  '18x18 inch',
  NULL,
  'Standard',
  'pcs',
  800,
  800,
  624,
  20,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000020',
  (select id from public.product_categories where name = 'Electrical Conduits & Boxes' limit 1),
  'ELC-BOX-4W20',
  '616400000020',
  'Circular 4-Way Junction Box',
  'Generic',
  '20mm',
  'Black/White',
  '4-Way Circular',
  'pcs',
  80,
  80,
  62.4,
  20,
  25,
  100,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000021',
  (select id from public.product_categories where name = 'Electrical Conduits & Boxes' limit 1),
  'ELC-CND-20',
  '616400000021',
  'Electrical Conduit Pipe',
  'Generic',
  '20mm',
  'Black/White',
  'Heavy Gauge PVC',
  'length',
  200,
  200,
  156,
  20,
  25,
  100,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000022',
  (select id from public.product_categories where name = 'Electrical Conduits & Boxes' limit 1),
  'ELC-CND-25',
  '616400000022',
  'Electrical Conduit Pipe',
  'Generic',
  '25mm',
  'Black/White',
  'Heavy Gauge PVC',
  'length',
  250,
  250,
  195,
  20,
  20,
  80,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000023',
  (select id from public.product_categories where name = 'Electrical Conduits & Boxes' limit 1),
  'ELC-CND-32',
  '616400000023',
  'Electrical Conduit Pipe',
  'Generic',
  '32mm',
  'Black/White',
  'Heavy Gauge PVC',
  'length',
  350,
  350,
  273,
  20,
  15,
  50,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000024',
  (select id from public.product_categories where name = 'Electrical Conduits & Boxes' limit 1),
  'ELC-CPL-20',
  '616400000024',
  'PVC Coupler',
  'Generic',
  '20mm',
  'Black/White',
  'Conduit Coupler',
  'pcs',
  10,
  10,
  7.8,
  20,
  50,
  200,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000025',
  (select id from public.product_categories where name = 'Electrical Conduits & Boxes' limit 1),
  'ELC-CPL-25',
  '616400000025',
  'PVC Coupler',
  'Generic',
  '25mm',
  'Black/White',
  'Conduit Coupler',
  'pcs',
  15,
  15,
  11.7,
  20,
  40,
  150,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000026',
  (select id from public.product_categories where name = 'Electrical Conduits & Boxes' limit 1),
  'ELC-CPL-32',
  '616400000026',
  'PVC Coupler',
  'Generic',
  '32mm',
  'Black/White',
  'Conduit Coupler',
  'pcs',
  20,
  20,
  15.6,
  20,
  30,
  100,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000027',
  (select id from public.product_categories where name = 'Electrical Conduits & Boxes' limit 1),
  'ELC-BOX-1G',
  '616400000027',
  'Single Switch Box',
  'Generic',
  '1-Gang (3x3)',
  'Black/White',
  'Flush Mount',
  'pcs',
  40,
  40,
  31.2,
  20,
  25,
  100,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000028',
  (select id from public.product_categories where name = 'Electrical Conduits & Boxes' limit 1),
  'ELC-BOX-2G',
  '616400000028',
  'Twin Switch Box',
  'Generic',
  '2-Gang (3x6)',
  'Black/White',
  'Flush Mount',
  'pcs',
  60,
  60,
  46.8,
  20,
  20,
  80,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000029',
  (select id from public.product_categories where name = 'Fasteners & Wire' limit 1),
  'FST-WIR-BRB',
  '616400000029',
  'Barbed Wire',
  'Generic',
  '480m Roll',
  NULL,
  '16 Gauge',
  'roll',
  4200,
  4200,
  3276,
  50,
  3,
  10,
  false,
  'SHOP',
  '480m roll',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000030',
  (select id from public.product_categories where name = 'Fasteners & Wire' limit 1),
  'FST-WIR-BND',
  '616400000030',
  'Binding Wire',
  'Generic',
  'Standard',
  NULL,
  'Annealed',
  'kg',
  150,
  150,
  117,
  50,
  25,
  75,
  true,
  'SHOP',
  'Sold per kg',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000031',
  (select id from public.product_categories where name = 'Fasteners & Wire' limit 1),
  'FST-HPI-STD',
  '616400000031',
  'Hoop Iron',
  'Generic',
  'Standard Roll',
  NULL,
  'Galvanized',
  'roll',
  1600,
  1600,
  1248,
  20,
  3,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000032',
  (select id from public.product_categories where name = 'Fasteners & Wire' limit 1),
  'FST-NLS-ORD',
  '616400000032',
  'Ordinary Nails',
  'Generic',
  'Assorted',
  NULL,
  'Standard',
  'kg',
  200,
  200,
  156,
  50,
  50,
  150,
  true,
  'SHOP',
  'Sold per kg',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000033',
  (select id from public.product_categories where name = 'Fasteners & Wire' limit 1),
  'FST-NLS-RFG',
  '616400000033',
  'Roofing Nails',
  'Generic',
  'Standard',
  NULL,
  'With Washer',
  'kg',
  270,
  270,
  210.6,
  50,
  25,
  100,
  true,
  'SHOP',
  'Sold per kg',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000034',
  (select id from public.product_categories where name = 'Fasteners & Wire' limit 1),
  'FST-NLS-STL',
  '616400000034',
  'Steel Nails',
  'Generic',
  'Assorted',
  NULL,
  'Hardened Steel',
  'kg',
  250,
  250,
  195,
  50,
  15,
  50,
  true,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000035',
  (select id from public.product_categories where name = 'Fasteners & Wire' limit 1),
  'FST-WLD-MSH',
  '616400000035',
  'Weld Mesh',
  'Generic',
  '8x4 Sheet',
  NULL,
  'Standard',
  'sheet',
  450,
  450,
  351,
  20,
  10,
  30,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000036',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-CUT-DSK',
  '616400000036',
  'Cutting Disk',
  'Generic',
  'Standard',
  NULL,
  'Standard',
  'pcs',
  150,
  150,
  117,
  50,
  15,
  40,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000037',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-HKS-BLD',
  '616400000037',
  'Hacksaw Blade',
  'Generic',
  'Standard',
  NULL,
  'Standard',
  'pcs',
  100,
  100,
  78,
  50,
  20,
  50,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000038',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-HMR-STD',
  '616400000038',
  'Hammer',
  'Generic',
  'Standard',
  NULL,
  'Claw Hammer',
  'pcs',
  350,
  350,
  273,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000039',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-SAW-16',
  '616400000039',
  'Handsaw',
  'Generic',
  '16 inch',
  NULL,
  'Standard',
  'pcs',
  280,
  280,
  218.4,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000040',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-SAW-18',
  '616400000040',
  'Handsaw',
  'Generic',
  '18 inch',
  NULL,
  'Standard',
  'pcs',
  350,
  350,
  273,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000041',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-SAW-20',
  '616400000041',
  'Handsaw',
  'Generic',
  '20 inch',
  NULL,
  'Standard',
  'pcs',
  400,
  400,
  312,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000042',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-SAW-BNN',
  '616400000042',
  'Handsaw',
  'Generic',
  'Standard',
  NULL,
  'Steel banana',
  'pcs',
  250,
  250,
  195,
  50,
  4,
  10,
  false,
  'SHOP',
  'Banana handle handsaw',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000043',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-TRW-HD',
  '616400000043',
  'Mason Trowel (Vijiko chuma)',
  'Generic',
  'Heavy Duty',
  NULL,
  'Vijiko chuma',
  'pcs',
  180,
  180,
  140.4,
  50,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000044',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-TRW-LG',
  '616400000044',
  'Mason Trowel (Vijiko chuma)',
  'Generic',
  'Large',
  NULL,
  'Normal Kubwa',
  'pcs',
  150,
  150,
  117,
  50,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000045',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-TRW-MD',
  '616400000045',
  'Mason Trowel (Vijiko chuma)',
  'Generic',
  'Medium',
  NULL,
  'Medium',
  'pcs',
  120,
  120,
  93.6,
  50,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000046',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-TRW-SM',
  '616400000046',
  'Mason Trowel (Vijiko chuma)',
  'Generic',
  'Small',
  NULL,
  'Small',
  'pcs',
  100,
  100,
  78,
  50,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000047',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-UZI-LG',
  '616400000047',
  'Mason Twine (Uzi)',
  'Generic',
  'Large',
  'Yellow',
  'Yellow big one',
  'roll',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000048',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-UZI-MD',
  '616400000048',
  'Mason Twine (Uzi)',
  'Generic',
  'Medium',
  NULL,
  'Medium',
  'roll',
  100,
  100,
  78,
  50,
  10,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000049',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-UZI-SM',
  '616400000049',
  'Mason Twine (Uzi)',
  'Generic',
  'Small',
  NULL,
  'Small',
  'roll',
  80,
  80,
  62.4,
  50,
  10,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000050',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-MTP-3M',
  '616400000050',
  'Measuring Tape',
  'Generic',
  '3m',
  NULL,
  'Standard',
  'pcs',
  100,
  100,
  78,
  50,
  6,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000051',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-MTP-5M',
  '616400000051',
  'Measuring Tape',
  'Generic',
  '5m',
  NULL,
  'Standard',
  'pcs',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000052',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-PNG-STD',
  '616400000052',
  'Panga (Machete)',
  'Generic',
  'Standard',
  NULL,
  'Standard',
  'pcs',
  250,
  250,
  195,
  50,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000053',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-PLR-STD',
  '616400000053',
  'Pliers',
  'Generic',
  'Standard',
  NULL,
  'Standard',
  'pcs',
  300,
  300,
  234,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000054',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-PLB-STD',
  '616400000054',
  'Plumbline (Plumbob)',
  'Generic',
  'Standard',
  NULL,
  'Standard',
  'pcs',
  250,
  250,
  195,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000055',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-SND-PPR',
  '616400000055',
  'Sand Paper',
  'Generic',
  'Continuous Roll',
  NULL,
  'Standard',
  'ft',
  50,
  50,
  39,
  50,
  30,
  100,
  true,
  'SHOP',
  'Sold per foot',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000056',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-WBR-5R',
  '616400000056',
  'Wire Brush',
  'Generic',
  '5 Rows',
  NULL,
  '5 Rows',
  'pcs',
  180,
  180,
  140.4,
  50,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000057',
  (select id from public.product_categories where name = 'Hand Tools & Cutting' limit 1),
  'TLS-WBR-6R',
  '616400000057',
  'Wire Brush',
  'Generic',
  '6 Rows',
  NULL,
  '6 Rows',
  'pcs',
  180,
  180,
  140.4,
  50,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000058',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-MND-L',
  '616400000058',
  'Mindy Padlock',
  'Mindy',
  'Big',
  NULL,
  'Large',
  'pcs',
  800,
  800,
  624,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000059',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-MND-M',
  '616400000059',
  'Mindy Padlock',
  'Mindy',
  'Medium',
  NULL,
  'Medium',
  'pcs',
  700,
  700,
  546,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000060',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-MND-S',
  '616400000060',
  'Mindy Padlock',
  'Mindy',
  'Small',
  NULL,
  'Small',
  'pcs',
  600,
  600,
  468,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000061',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-PRO-60',
  '616400000061',
  'Pro Padlock',
  'Pro',
  '60mm',
  NULL,
  'Heavy Duty',
  'pcs',
  700,
  700,
  546,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000062',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-PRO-70',
  '616400000062',
  'Pro Padlock',
  'Pro',
  '70mm',
  NULL,
  'Heavy Duty',
  'pcs',
  800,
  800,
  624,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000063',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-STL-40',
  '616400000063',
  'Stella Padlock',
  'Stella',
  '40mm',
  NULL,
  'Standard',
  'pcs',
  350,
  350,
  273,
  50,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000064',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-STL-50',
  '616400000064',
  'Stella Padlock',
  'Stella',
  '50mm',
  NULL,
  'Standard',
  'pcs',
  450,
  450,
  351,
  50,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000065',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-STL-60',
  '616400000065',
  'Stella Padlock',
  'Stella',
  '60mm',
  NULL,
  'Standard',
  'pcs',
  650,
  650,
  507,
  50,
  4,
  10,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000066',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-TRI-265',
  '616400000066',
  'Tri-Circle Padlock',
  'Tri-Circle',
  '265',
  NULL,
  'Standard',
  'pcs',
  250,
  250,
  195,
  50,
  5,
  12,
  false,
  'SHOP',
  'Brass padlock model 265',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000067',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-TRI-266',
  '616400000067',
  'Tri-Circle Padlock',
  'Tri-Circle',
  '266',
  NULL,
  'Standard',
  'pcs',
  350,
  350,
  273,
  50,
  5,
  12,
  false,
  'SHOP',
  'Brass padlock model 266',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000068',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-YNG-362',
  '616400000068',
  'Yongli Padlock',
  'Yongli',
  '362',
  NULL,
  'Small',
  'pcs',
  100,
  100,
  78,
  50,
  10,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000069',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-YNG-364',
  '616400000069',
  'Yongli Padlock',
  'Yongli',
  '364',
  NULL,
  'Medium',
  'pcs',
  150,
  150,
  117,
  50,
  8,
  20,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000070',
  (select id from public.product_categories where name = 'Locks & Security' limit 1),
  'LCK-YNG-365',
  '616400000070',
  'Yongli Padlock',
  'Yongli',
  '365',
  NULL,
  'Large',
  'pcs',
  250,
  250,
  195,
  50,
  6,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000071',
  (select id from public.product_categories where name = 'PPR Pipes & Fittings' limit 1),
  'PPR-ELB-20',
  '616400000071',
  'PPR Elbow',
  'Generic',
  '20mm',
  'Green',
  '90 Degree',
  'pcs',
  20,
  20,
  15.6,
  50,
  30,
  100,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000072',
  (select id from public.product_categories where name = 'PPR Pipes & Fittings' limit 1),
  'PPR-ELB-32',
  '616400000072',
  'PPR Elbow',
  'Generic',
  '32mm',
  'Green',
  '90 Degree',
  'pcs',
  30,
  30,
  23.4,
  50,
  20,
  60,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000073',
  (select id from public.product_categories where name = 'PPR Pipes & Fittings' limit 1),
  'PPR-PIP-20',
  '616400000073',
  'PPR Pipe',
  'Generic',
  '20mm',
  'Green',
  'PN20',
  'length',
  450,
  450,
  351,
  50,
  15,
  50,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000074',
  (select id from public.product_categories where name = 'PPR Pipes & Fittings' limit 1),
  'PPR-PIP-25',
  '616400000074',
  'PPR Pipe',
  'Generic',
  '25mm',
  'Green',
  'PN20',
  'length',
  350,
  350,
  273,
  50,
  15,
  50,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000075',
  (select id from public.product_categories where name = 'PPR Pipes & Fittings' limit 1),
  'PPR-PIP-32A',
  '616400000075',
  'PPR Pipe',
  'Generic',
  '32mm',
  'Green',
  'Heavy / Grade A (PN20)',
  'length',
  700,
  700,
  546,
  50,
  10,
  30,
  false,
  'SHOP',
  'Heavy gauge 32mm PPR pipe',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000076',
  (select id from public.product_categories where name = 'PPR Pipes & Fittings' limit 1),
  'PPR-PIP-32B',
  '616400000076',
  'PPR Pipe',
  'Generic',
  '32mm',
  'Green',
  'Standard / Grade B (PN16)',
  'length',
  400,
  400,
  312,
  50,
  10,
  30,
  false,
  'SHOP',
  'Standard gauge 32mm PPR pipe',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000077',
  (select id from public.product_categories where name = 'PPR Pipes & Fittings' limit 1),
  'PPR-SCK-20',
  '616400000077',
  'PPR Socket',
  'Generic',
  '20mm',
  'Green',
  'Plain Socket',
  'pcs',
  20,
  20,
  15.6,
  50,
  30,
  100,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000078',
  (select id from public.product_categories where name = 'PPR Pipes & Fittings' limit 1),
  'PPR-SCK-32',
  '616400000078',
  'PPR Socket',
  'Generic',
  '32mm',
  'Green',
  'Plain Socket',
  'pcs',
  30,
  30,
  23.4,
  50,
  20,
  60,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000079',
  (select id from public.product_categories where name = 'PPR Pipes & Fittings' limit 1),
  'PPR-TEE-20',
  '616400000079',
  'PPR Tee',
  'Generic',
  '20mm',
  'Green',
  'Equal Tee',
  'pcs',
  25,
  25,
  19.5,
  50,
  25,
  80,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000080',
  (select id from public.product_categories where name = 'PPR Pipes & Fittings' limit 1),
  'PPR-TEE-32',
  '616400000080',
  'PPR Tee',
  'Generic',
  '32mm',
  'Green',
  'Equal Tee',
  'pcs',
  35,
  35,
  27.3,
  50,
  15,
  50,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000081',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-ABD-110',
  '616400000081',
  'PVC Access Bend (A/Bend)',
  'Generic',
  '110mm',
  'Golden Brown',
  'With Inspection Door',
  'pcs',
  250,
  250,
  195,
  50,
  8,
  20,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000082',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-ATE-110',
  '616400000082',
  'PVC Access Tee (A/Tee)',
  'Generic',
  '110mm',
  'Golden Brown',
  'With Inspection Door',
  'pcs',
  350,
  350,
  273,
  50,
  6,
  15,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000083',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-B45-15',
  '616400000083',
  'PVC Bend 45°',
  'Generic',
  '1.5 inch',
  'Grey',
  '45 Degree',
  'pcs',
  50,
  50,
  39,
  50,
  15,
  40,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000084',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-B45-20',
  '616400000084',
  'PVC Bend 45°',
  'Generic',
  '2 inch',
  'Grey',
  '45 Degree',
  'pcs',
  70,
  70,
  54.6,
  50,
  15,
  40,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000085',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-B45-30',
  '616400000085',
  'PVC Bend 45°',
  'Generic',
  '3 inch',
  'Grey',
  '45 Degree',
  'pcs',
  150,
  150,
  117,
  50,
  10,
  25,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000086',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-B45-40',
  '616400000086',
  'PVC Bend 45°',
  'Generic',
  '4 inch',
  'Grey/Golden Brown',
  '45 Degree',
  'pcs',
  150,
  150,
  117,
  50,
  10,
  25,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000087',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-B90-15',
  '616400000087',
  'PVC Bend 90°',
  'Generic',
  '1.5 inch',
  'Grey',
  '90 Degree',
  'pcs',
  35,
  35,
  27.3,
  50,
  20,
  50,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000088',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-B90-20',
  '616400000088',
  'PVC Bend 90°',
  'Generic',
  '2 inch',
  'Grey',
  '90 Degree',
  'pcs',
  50,
  50,
  39,
  50,
  20,
  50,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000089',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-B90-30',
  '616400000089',
  'PVC Bend 90°',
  'Generic',
  '3 inch',
  'Grey',
  '90 Degree Elbow',
  'pcs',
  120,
  120,
  93.6,
  50,
  10,
  30,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000090',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-B90-40',
  '616400000090',
  'PVC Bend 90°',
  'Generic',
  '4 inch',
  'Grey/Golden Brown',
  '90 Degree',
  'pcs',
  200,
  200,
  156,
  50,
  10,
  30,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000091',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-BSS-110X15',
  '616400000091',
  'PVC Boss Connector',
  'Generic',
  '110mm x 1.5 inch',
  'Grey/Brown',
  'Strap-On Boss',
  'pcs',
  120,
  120,
  93.6,
  50,
  10,
  25,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000092',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-BSS-110X2',
  '616400000092',
  'PVC Boss Connector',
  'Generic',
  '110mm x 2 inch',
  'Grey/Brown',
  'Strap-On Boss',
  'pcs',
  120,
  120,
  93.6,
  50,
  10,
  25,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000093',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-BGL-110',
  '616400000093',
  'PVC Bottle Gully',
  'Generic',
  '110mm x 2 inch',
  'Golden Brown',
  'Bottle Gully Trap',
  'pcs',
  250,
  250,
  195,
  50,
  6,
  15,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000094',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-CTE-110',
  '616400000094',
  'PVC Cross Tee',
  'Generic',
  '110mm',
  'Golden Brown',
  '4-Way Cross Tee',
  'pcs',
  400,
  400,
  312,
  50,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000095',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-FLT-110',
  '616400000095',
  'PVC Floor Trap',
  'Generic',
  '110mm x 2 x 1.5',
  'Grey/White',
  'Multi-Inlet Floor Trap',
  'pcs',
  300,
  300,
  234,
  50,
  8,
  20,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000096',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-INL-110',
  '616400000096',
  'PVC Gulley Inlet',
  'Generic',
  '110mm',
  'Golden Brown',
  'Inlet Hopper',
  'pcs',
  150,
  150,
  117,
  50,
  8,
  20,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000097',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-PLG-15',
  '616400000097',
  'PVC Plug',
  'Generic',
  '1.5 inch',
  'Grey',
  'Access/Socket Plug',
  'pcs',
  80,
  80,
  62.4,
  50,
  10,
  30,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000098',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-PLG-20',
  '616400000098',
  'PVC Plug',
  'Generic',
  '2 inch',
  'Grey',
  'Access/Socket Plug',
  'pcs',
  100,
  100,
  78,
  50,
  10,
  30,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000099',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-PLG-30',
  '616400000099',
  'PVC Plug',
  'Generic',
  '3 inch',
  'Grey',
  'Access/Socket Plug',
  'pcs',
  150,
  150,
  117,
  50,
  8,
  20,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000100',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-PLG-40',
  '616400000100',
  'PVC Plug',
  'Generic',
  '4 inch',
  'Grey/Golden Brown',
  'Access/Socket Plug',
  'pcs',
  200,
  200,
  156,
  50,
  8,
  20,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000101',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-RDC-110X2',
  '616400000101',
  'PVC Reducer',
  'Generic',
  '110mm x 2 inch',
  'Golden Brown',
  'Reducing Socket/Bush',
  'pcs',
  150,
  150,
  117,
  50,
  10,
  25,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000102',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-RDC-3X2',
  '616400000102',
  'PVC Reducer',
  'Generic',
  '3 x 2 inch',
  'Grey',
  'Reducing Socket/Bush',
  'pcs',
  100,
  100,
  78,
  50,
  10,
  25,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000103',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-TEE-15',
  '616400000103',
  'PVC Tee',
  'Generic',
  '1.5 inch',
  'Grey',
  'Equal Tee',
  'pcs',
  100,
  100,
  78,
  50,
  15,
  40,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000104',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-TEE-20',
  '616400000104',
  'PVC Tee',
  'Generic',
  '2 inch',
  'Grey',
  'Equal Tee',
  'pcs',
  120,
  120,
  93.6,
  50,
  15,
  40,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000105',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-TEE-30',
  '616400000105',
  'PVC Tee',
  'Generic',
  '3 inch',
  'Grey',
  'Equal Tee',
  'pcs',
  150,
  150,
  117,
  50,
  10,
  25,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000106',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-TEE-40',
  '616400000106',
  'PVC Tee',
  'Generic',
  '4 inch',
  'Grey/Golden Brown',
  'Equal Tee',
  'pcs',
  250,
  250,
  195,
  50,
  10,
  25,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000107',
  (select id from public.product_categories where name = 'PVC Waste & Drainage' limit 1),
  'PVC-VNT-110',
  '616400000107',
  'PVC Vent Cowl',
  'Generic',
  '110mm',
  'Grey/Brown',
  'Slotted Vent Cap',
  'pcs',
  50,
  50,
  39,
  50,
  10,
  30,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000108',
  (select id from public.product_categories where name = 'Painting Tools' limit 1),
  'PNT-BRS-1',
  '616400000108',
  'Paint Brush',
  'Generic',
  '1 inch',
  NULL,
  'Standard',
  'pcs',
  60,
  60,
  46.8,
  50,
  10,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000109',
  (select id from public.product_categories where name = 'Painting Tools' limit 1),
  'PNT-BRS-2',
  '616400000109',
  'Paint Brush',
  'Generic',
  '2 inch',
  NULL,
  'Standard',
  'pcs',
  80,
  80,
  62.4,
  50,
  10,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000110',
  (select id from public.product_categories where name = 'Painting Tools' limit 1),
  'PNT-BRS-3',
  '616400000110',
  'Paint Brush',
  'Generic',
  '3 inch',
  NULL,
  'Standard',
  'pcs',
  100,
  100,
  78,
  50,
  10,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000111',
  (select id from public.product_categories where name = 'Painting Tools' limit 1),
  'PNT-BRS-4',
  '616400000111',
  'Paint Brush',
  'Generic',
  '4 inch',
  NULL,
  'Standard',
  'pcs',
  150,
  150,
  117,
  50,
  8,
  20,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000112',
  (select id from public.product_categories where name = 'Painting Tools' limit 1),
  'PNT-BRS-5',
  '616400000112',
  'Paint Brush',
  'Generic',
  '5 inch',
  NULL,
  'Standard',
  'pcs',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000113',
  (select id from public.product_categories where name = 'Painting Tools' limit 1),
  'PNT-BRS-6',
  '616400000113',
  'Paint Brush',
  'Generic',
  '6 inch',
  NULL,
  'Standard',
  'pcs',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000114',
  (select id from public.product_categories where name = 'Painting Tools' limit 1),
  'PNT-RLR-STD',
  '616400000114',
  'Paint Roller',
  'Generic',
  'Standard',
  NULL,
  'Dual Tier (150/200)',
  'pcs',
  150,
  150,
  117,
  50,
  8,
  20,
  false,
  'SHOP',
  'Two price tiers: 150 and 200',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000115',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'WDV-CLR-1L',
  '616400000115',
  'Clear Varnish',
  'Generic',
  '1L',
  'Clear',
  'Gloss Wood Varnish',
  'tin',
  150,
  150,
  117,
  20,
  8,
  20,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000116',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'WDV-CLR-4L',
  '616400000116',
  'Clear Varnish',
  'Generic',
  '4L',
  'Clear',
  'Gloss Wood Varnish',
  'tin',
  150,
  150,
  117,
  20,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000117',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-CVM-WHT-1L',
  '616400000117',
  'Covermatt',
  'Generic',
  '1L',
  'White',
  'Matt Finish',
  'tin',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000118',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-CVM-CRM-1L',
  '616400000118',
  'Covermatt',
  'Generic',
  '1L',
  'Cream',
  'Matt Finish',
  'tin',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000119',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-CVM-WHT-4L',
  '616400000119',
  'Covermatt',
  'Generic',
  '4L',
  'White',
  'Matt Finish',
  'tin',
  150,
  150,
  117,
  50,
  4,
  10,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000120',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-CVM-CRM-4L',
  '616400000120',
  'Covermatt',
  'Generic',
  '4L',
  'Cream',
  'Matt Finish',
  'tin',
  150,
  150,
  117,
  50,
  4,
  10,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000121',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-WHT-500ML',
  '616400000121',
  'Gloss Enamel',
  'Generic',
  '1/2L',
  'White',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000122',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-TBL-500ML',
  '616400000122',
  'Gloss Enamel',
  'Generic',
  '1/2L',
  'True Blue',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000123',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-BLK-500ML',
  '616400000123',
  'Gloss Enamel',
  'Generic',
  '1/2L',
  'Black',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000124',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-BBL-500ML',
  '616400000124',
  'Gloss Enamel',
  'Generic',
  '1/2L',
  'Bermuda Blue',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000125',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-SAF-500ML',
  '616400000125',
  'Gloss Enamel',
  'Generic',
  '1/2L',
  'Safaricom Green',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000126',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-CRM-500ML',
  '616400000126',
  'Gloss Enamel',
  'Generic',
  '1/2L',
  'Cream',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000127',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-PNK-500ML',
  '616400000127',
  'Gloss Enamel',
  'Generic',
  '1/2L',
  'Pink',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000128',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-GNM-500ML',
  '616400000128',
  'Gloss Enamel',
  'Generic',
  '1/2L',
  'Gun Metal',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000129',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-WHT-250ML',
  '616400000129',
  'Gloss Enamel',
  'Generic',
  '1/4L',
  'White',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  12,
  36,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000130',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-TBL-250ML',
  '616400000130',
  'Gloss Enamel',
  'Generic',
  '1/4L',
  'True Blue',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  12,
  36,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000131',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-BLK-250ML',
  '616400000131',
  'Gloss Enamel',
  'Generic',
  '1/4L',
  'Black',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  12,
  36,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000132',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-BBL-250ML',
  '616400000132',
  'Gloss Enamel',
  'Generic',
  '1/4L',
  'Bermuda Blue',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  12,
  36,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000133',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-SAF-250ML',
  '616400000133',
  'Gloss Enamel',
  'Generic',
  '1/4L',
  'Safaricom Green',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  12,
  36,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000134',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-CRM-250ML',
  '616400000134',
  'Gloss Enamel',
  'Generic',
  '1/4L',
  'Cream',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  12,
  36,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000135',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-PNK-250ML',
  '616400000135',
  'Gloss Enamel',
  'Generic',
  '1/4L',
  'Pink',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  12,
  36,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000136',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-GNM-250ML',
  '616400000136',
  'Gloss Enamel',
  'Generic',
  '1/4L',
  'Gun Metal',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  12,
  36,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000137',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-WHT-1L',
  '616400000137',
  'Gloss Enamel',
  'Generic',
  '1L',
  'White',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  8,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000138',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-TBL-1L',
  '616400000138',
  'Gloss Enamel',
  'Generic',
  '1L',
  'True Blue',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  8,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000139',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-BLK-1L',
  '616400000139',
  'Gloss Enamel',
  'Generic',
  '1L',
  'Black',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  8,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000140',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-BBL-1L',
  '616400000140',
  'Gloss Enamel',
  'Generic',
  '1L',
  'Bermuda Blue',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  8,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000141',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-SAF-1L',
  '616400000141',
  'Gloss Enamel',
  'Generic',
  '1L',
  'Safaricom Green',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  8,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000142',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-CRM-1L',
  '616400000142',
  'Gloss Enamel',
  'Generic',
  '1L',
  'Cream',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  8,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000143',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-PNK-1L',
  '616400000143',
  'Gloss Enamel',
  'Generic',
  '1L',
  'Pink',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  8,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000144',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-GNM-1L',
  '616400000144',
  'Gloss Enamel',
  'Generic',
  '1L',
  'Gun Metal',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  8,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000145',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-WHT-4L',
  '616400000145',
  'Gloss Enamel',
  'Generic',
  '4L',
  'White',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000146',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-TBL-4L',
  '616400000146',
  'Gloss Enamel',
  'Generic',
  '4L',
  'True Blue',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000147',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-BLK-4L',
  '616400000147',
  'Gloss Enamel',
  'Generic',
  '4L',
  'Black',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000148',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-BBL-4L',
  '616400000148',
  'Gloss Enamel',
  'Generic',
  '4L',
  'Bermuda Blue',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000149',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-SAF-4L',
  '616400000149',
  'Gloss Enamel',
  'Generic',
  '4L',
  'Safaricom Green',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000150',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-CRM-4L',
  '616400000150',
  'Gloss Enamel',
  'Generic',
  '4L',
  'Cream',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000151',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-PNK-4L',
  '616400000151',
  'Gloss Enamel',
  'Generic',
  '4L',
  'Pink',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000152',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-GLS-GNM-4L',
  '616400000152',
  'Gloss Enamel',
  'Generic',
  '4L',
  'Gun Metal',
  'High Gloss',
  'tin',
  150,
  150,
  117,
  50,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000153',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-PRM-GRY-500ML',
  '616400000153',
  'Metal & Wood Primer',
  'Generic',
  '1/2L',
  'Grey',
  'Grey Primer',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000154',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-PRM-GRY-250ML',
  '616400000154',
  'Metal & Wood Primer',
  'Generic',
  '1/4L',
  'Grey',
  'Grey Primer',
  'tin',
  150,
  150,
  117,
  50,
  12,
  36,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000155',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-PRM-GRY-1L',
  '616400000155',
  'Metal & Wood Primer',
  'Generic',
  '1L',
  'Grey',
  'Grey Primer',
  'tin',
  150,
  150,
  117,
  50,
  8,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000156',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-PRM-GRY-4L',
  '616400000156',
  'Metal & Wood Primer',
  'Generic',
  '4L',
  'Grey',
  'Grey Primer',
  'tin',
  150,
  150,
  117,
  50,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000157',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-PEM-WHT-1L',
  '616400000157',
  'Plastic Emulsion',
  'Generic',
  '1L',
  'White',
  'Matt Emulsion',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000158',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-PEM-CRM-1L',
  '616400000158',
  'Plastic Emulsion',
  'Generic',
  '1L',
  'Cream',
  'Matt Emulsion',
  'tin',
  150,
  150,
  117,
  50,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000159',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-PEM-WHT-4L',
  '616400000159',
  'Plastic Emulsion',
  'Generic',
  '4L',
  'White',
  'Matt Emulsion',
  'tin',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000160',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-PEM-CRM-4L',
  '616400000160',
  'Plastic Emulsion',
  'Generic',
  '4L',
  'Cream',
  'Matt Emulsion',
  'tin',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000161',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-SLK-CRM-1L',
  '616400000161',
  'Silk Vinyl',
  'Generic',
  '1L',
  'Cream',
  'Silk Sheen',
  'tin',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000162',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-SLK-WHT-1L',
  '616400000162',
  'Silk Vinyl',
  'Generic',
  '1L',
  'White',
  'Silk Sheen',
  'tin',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000163',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-SLK-TNG-1L',
  '616400000163',
  'Silk Vinyl',
  'Generic',
  '1L',
  'Tango',
  'Silk Sheen',
  'tin',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000164',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-SLK-S16-1L',
  '616400000164',
  'Silk Vinyl',
  'Generic',
  '1L',
  'Sweet Sixteen',
  'Silk Sheen',
  'tin',
  150,
  150,
  117,
  50,
  6,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000165',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-SLK-CRM-4L',
  '616400000165',
  'Silk Vinyl',
  'Generic',
  '4L',
  'Cream',
  'Silk Sheen',
  'tin',
  150,
  150,
  117,
  50,
  4,
  10,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000166',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-SLK-WHT-4L',
  '616400000166',
  'Silk Vinyl',
  'Generic',
  '4L',
  'White',
  'Silk Sheen',
  'tin',
  150,
  150,
  117,
  50,
  4,
  10,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000167',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-SLK-TNG-4L',
  '616400000167',
  'Silk Vinyl',
  'Generic',
  '4L',
  'Tango',
  'Silk Sheen',
  'tin',
  150,
  150,
  117,
  50,
  4,
  10,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000168',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-SLK-S16-4L',
  '616400000168',
  'Silk Vinyl',
  'Generic',
  '4L',
  'Sweet Sixteen',
  'Silk Sheen',
  'tin',
  150,
  150,
  117,
  50,
  4,
  10,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000169',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-SPR-400',
  '616400000169',
  'Spray Paint',
  'Generic',
  '400ml',
  'Assorted',
  'Aerosol',
  'tin',
  280,
  280,
  218.4,
  50,
  10,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000170',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'SLV-THN-1L',
  '616400000170',
  'Standard Thinner',
  'Generic',
  '1L',
  'Clear',
  'Nitrocellulose Thinner',
  'tin',
  150,
  150,
  117,
  20,
  10,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000171',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'SLV-THN-5L',
  '616400000171',
  'Standard Thinner',
  'Generic',
  '5L',
  'Clear',
  'Nitrocellulose Thinner',
  'tin',
  150,
  150,
  117,
  20,
  5,
  15,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000172',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'SLV-TRP-1L',
  '616400000172',
  'Turpentine',
  'Generic',
  '1L',
  'Clear',
  'Mineral Turpentine',
  'tin',
  150,
  150,
  117,
  20,
  8,
  20,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000173',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'SLV-TRP-5L',
  '616400000173',
  'Turpentine',
  'Generic',
  '5L',
  'Clear',
  'Mineral Turpentine',
  'tin',
  150,
  150,
  117,
  20,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000174',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-UND-1L',
  '616400000174',
  'Undercoat',
  'Generic',
  '1L',
  'White',
  'Universal Undercoat',
  'tin',
  150,
  150,
  117,
  50,
  8,
  24,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000175',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'PNT-UND-4L',
  '616400000175',
  'Undercoat',
  'Generic',
  '4L',
  'White',
  'Universal Undercoat',
  'tin',
  150,
  150,
  117,
  50,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000176',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'SLV-WSP-1L',
  '616400000176',
  'White Spirit',
  'Generic',
  '1L',
  'Clear',
  'White Spirit Solvent',
  'tin',
  150,
  150,
  117,
  20,
  8,
  20,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000177',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'SLV-WSP-5L',
  '616400000177',
  'White Spirit',
  'Generic',
  '5L',
  'Clear',
  'White Spirit Solvent',
  'tin',
  150,
  150,
  117,
  20,
  4,
  12,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000178',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'WDV-LOK-1L',
  '616400000178',
  'Wood Stain Varnish',
  'Generic',
  '1L',
  'Light Oak',
  'Tinted Wood Varnish',
  'tin',
  150,
  150,
  117,
  20,
  6,
  15,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000179',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'WDV-MHG-1L',
  '616400000179',
  'Wood Stain Varnish',
  'Generic',
  '1L',
  'Mahogany',
  'Tinted Wood Varnish',
  'tin',
  150,
  150,
  117,
  20,
  6,
  15,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000180',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'WDV-LOK-4L',
  '616400000180',
  'Wood Stain Varnish',
  'Generic',
  '4L',
  'Light Oak',
  'Tinted Wood Varnish',
  'tin',
  150,
  150,
  117,
  20,
  3,
  10,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000181',
  (select id from public.product_categories where name = 'Paints, Solvents & Wood Finishes' limit 1),
  'WDV-MHG-4L',
  '616400000181',
  'Wood Stain Varnish',
  'Generic',
  '4L',
  'Mahogany',
  'Tinted Wood Varnish',
  'tin',
  150,
  150,
  117,
  20,
  3,
  10,
  false,
  'SHOP',
  'Price pending',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000182',
  (select id from public.product_categories where name = 'Tapes & Adhesives' limit 1),
  'ADH-CLT-WHT',
  '616400000182',
  'Cellotape / Insulating Tape',
  'Generic',
  'Standard',
  'White',
  'Standard',
  'roll',
  50,
  50,
  39,
  20,
  15,
  36,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000183',
  (select id from public.product_categories where name = 'Tapes & Adhesives' limit 1),
  'ADH-CLT-BLK',
  '616400000183',
  'Cellotape / Insulating Tape',
  'Generic',
  'Standard',
  'Black',
  'Standard',
  'roll',
  50,
  50,
  39,
  20,
  15,
  36,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000184',
  (select id from public.product_categories where name = 'Tapes & Adhesives' limit 1),
  'ADH-CNT-100',
  '616400000184',
  'Conta Glue (Contact Adhesive)',
  'Conta',
  '100ml',
  NULL,
  'Contact Adhesive',
  'tin',
  300,
  300,
  234,
  20,
  8,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000185',
  (select id from public.product_categories where name = 'Tapes & Adhesives' limit 1),
  'ADH-CNT-250',
  '616400000185',
  'Conta Glue (Contact Adhesive)',
  'Conta',
  '250ml',
  NULL,
  'Contact Adhesive',
  'tin',
  400,
  400,
  312,
  20,
  8,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000186',
  (select id from public.product_categories where name = 'Tapes & Adhesives' limit 1),
  'ADH-PUF-CAN',
  '616400000186',
  'PU Foam (Expanding Foam)',
  'Generic',
  '750ml Can',
  NULL,
  'Polyurethane',
  'tin',
  600,
  600,
  468,
  20,
  5,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000187',
  (select id from public.product_categories where name = 'Tapes & Adhesives' limit 1),
  'ADH-SIL-CRT',
  '616400000187',
  'Silicone Sealant',
  'Generic',
  '300ml Cartridge',
  'Clear/White',
  'Acetic Cure',
  'pcs',
  280,
  280,
  218.4,
  20,
  10,
  24,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000188',
  (select id from public.product_categories where name = 'Tapes & Adhesives' limit 1),
  'ADH-TNG-100',
  '616400000188',
  'Tangit PVC Pipe Cement',
  'Tangit',
  '100ml',
  NULL,
  'PVC Solvent Cement',
  'tin',
  550,
  550,
  429,
  20,
  6,
  18,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000189',
  (select id from public.product_categories where name = 'Tapes & Adhesives' limit 1),
  'ADH-TNG-250',
  '616400000189',
  'Tangit PVC Pipe Cement',
  'Tangit',
  '250ml',
  NULL,
  'PVC Solvent Cement',
  'tin',
  750,
  750,
  585,
  20,
  6,
  18,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000190',
  (select id from public.product_categories where name = 'Tapes & Adhesives' limit 1),
  'ADH-TNG-500',
  '616400000190',
  'Tangit PVC Pipe Cement',
  'Tangit',
  '500ml',
  NULL,
  'PVC Solvent Cement',
  'tin',
  1100,
  1100,
  858,
  20,
  4,
  12,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000191',
  (select id from public.product_categories where name = 'Waterproofing & Sheeting' limit 1),
  'WPF-DPC-RLL',
  '616400000191',
  'DPC (Polythene)',
  'Generic',
  'Full Roll',
  'Black',
  'Polythene',
  'roll',
  2300,
  2300,
  1794,
  20,
  3,
  8,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000192',
  (select id from public.product_categories where name = 'Waterproofing & Sheeting' limit 1),
  'WPF-DPM-RLL',
  '616400000192',
  'DPM (Damp Proof Membrane)',
  'Generic',
  'Full Roll',
  'Black',
  'Standard',
  'roll',
  2100,
  2100,
  1638,
  20,
  3,
  8,
  false,
  'SHOP',
  NULL,
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;
insert into public.products (
  id, category_id, sku, barcode, product_name, brand, size_or_pack, colour, specification,
  unit_of_measure, selling_price_kes, minimum_selling_price_kes, buying_price_kes,
  stock_on_hand, low_stock_level, reorder_quantity, allow_decimal, stock_location, notes, active
) values (
  '00000000-0000-0000-0001-000000000193',
  (select id from public.product_categories where name = 'Waterproofing & Sheeting' limit 1),
  'WPF-PLY-MTR',
  '616400000193',
  'Polythene Sheet',
  'Generic',
  'Cut to Length',
  'Clear/Black',
  'Heavy Gauge',
  'm',
  100,
  100,
  78,
  20,
  20,
  100,
  true,
  'SHOP',
  'Sold per meter',
  true
)
on conflict (sku) do update set
  product_name = excluded.product_name,
  selling_price_kes = excluded.selling_price_kes,
  buying_price_kes = excluded.buying_price_kes,
  stock_on_hand = excluded.stock_on_hand,
  unit_of_measure = excluded.unit_of_measure,
  category_id = excluded.category_id,
  active = true;

commit;
