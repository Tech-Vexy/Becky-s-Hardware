# Becky's Hardware Store — Management PWA

Production-oriented, single-store Hardware Store Management Progressive Web App (PWA) built specifically for a Kenyan hardware retailer.

Architected with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **shadcn/ui-inspired primitives**, **Supabase Auth**, **PostgreSQL Row-Level Security (RLS)**, and **IndexedDB using Dexie.js 4** for high-reliability offline persistence and real-time cloud synchronization.

---

## 🏗️ Architecture & Single-Store Principles

- **Single Store Scope**: One physical hardware store, one unified inventory at the single shop location (no separate godowns or multi-location storage transfers), and confined to a single user—the Store Owner. Strictly no multi-tenancy, no tenant onboarding, no branch switching, and no subscription billing.
- **Single Owner User Model**: Confined to one authorized user (the Store Owner) who retains master control over POS sales, price modifications, stocktaking, credit approvals, financial reconciliation, and store settings.
- **Currency & Local Compliance**: Default currency **KES**, 16% standard VAT breakdown, KRA Tax PIN (`P051234567X`), and M-Pesa Buy Goods Till & Paybill configuration.
- **Virtual Store Replica**: A high-fidelity local replica maintained in browser IndexedDB via Dexie.js. Catalogue search, touchscreen POS, receipt printing, and stock deductions work with zero latency even during network cutoffs.
- **Compensating Transactions**: Completed transactions and financial history are immutable. Deletions are blocked in PostgreSQL RLS; corrections use compensating stock movements and audited credit notes.

---

## 👥 User Model: Store Owner

The application is streamlined for single-operator retail management:

| Store Capability | Store Owner (Single User) |
| :--- | :---: |
| **POS Sales & Receipts** | ✅ |
| **Sales Returns & Refunds** | ✅ |
| **Customer Credit Repayments** | ✅ |
| **Stock Receiving (PO Deliveries)** | ✅ |
| **Stocktake Adjustments & Write-offs** | ✅ |
| **M-Pesa Payment Verification** | ✅ |
| **Financial & Z-Reports** | ✅ |
| **Store Parameters & Tax PIN** | ✅ |
| **Protected Deletions** | ✅ |

---

## 📦 Core Modules

1. **Dashboard (`/`)**: Today's Gross Sales, Cash in Register, M-Pesa collections, unverified payment alerts, low stock warnings, and quick action shortcuts.
2. **Point of Sale (`/pos`)**: Fast, touchscreen-friendly tile & list view with barcode scanner simulation, decimal quantity entry (for nails per kg, binding wire per kg, cut polythene per meter), multi-payment modal (Cash with change calculation, M-Pesa, Customer Credit, Bank transfer), and thermal receipt printing.
3. **Product Catalogue (`/catalogue`)**: 193 authentic Kenyan hardware items (Ordinary Nails, Simba Cement, Gyproc, PPR Pipes, PVC Drainage, Crown Paints, Mindy Padlocks, Panga machetes) with stock levels, units of measure, and pricing at the single shop.
4. **Inventory Ledger (`/inventory`)**: Immutable timeline of all stock deltas (`opening_balance`, `purchase_receipt`, `sale`, `sale_return`, `adjustment`, `damage`) and valuation at landed cost vs. retail price.
5. **Purchases (`/purchases`)**: Supplier purchase orders and physical stock receiving workflows for Lafarge Bamburi Cement, Mabati Rolling Mills, Crown Paints, etc.
6. **Suppliers (`/suppliers`)**: Contact directory, tax PINs, and delivery notes.
7. **Customer Credit Ledger (`/customers`)**: Contractor and fundi credit management, credit limit enforcement, aging balance calculations, and repayment receipt generation.
8. **Payments & M-Pesa (`/payments`)**: Reconciliation ledger with trusted M-Pesa reference code verification.
9. **Sales Returns (`/returns`)**: Return processing with restocking options and credit notes.
10. **Store Expenses (`/expenses`)**: Petty cash log for casual labor (cement offloaders), transport, KPLC tokens, and municipal permits.
11. **Reports (`/reports`)**: Daily Register / Z-Report (physical cash reconciliation), sales by category, and stock margin projections.
12. **Owner Account (`/staff`)**: Store owner profile details and management overview.
13. **Audit Logs (`/audit-logs`)**: Operational activity log tracking mutations across all business tables.
14. **Settings (`/settings`)**: Store branding, KRA PIN, VAT percentage, M-Pesa Till & Paybill numbers, and offline credit policies.

---

## 🔒 Security & Database Integrity

### 1. Trusted Atomic PostgreSQL RPCs
- `rpc_checkout(payload jsonb)`:
  - Validates active product status and derives prices from the database (client-supplied prices are strictly untrusted).
  - Verifies stock availability; rejects sales exceeding physical stock unless `allow_negative_stock` is enabled.
  - Enforces customer credit limit: `current_balance + requested_credit <= credit_limit`.
  - Atomically records sale, line items, payments, decrements stock on hand, and logs negative stock movements.
  - Checks `idempotency_key` / `offline_id`: duplicate pushes return the existing sale without double-deducting stock or recording duplicate payments.
- `rpc_receive_purchase(payload jsonb)`:
  - Atomically marks purchase as received, increments stock on hand, updates wholesale buying price, and logs `purchase_receipt` movements.
- `rpc_process_return(payload jsonb)`:
  - Records return, conditionally restocks good items into inventory, logs `damage` movements for defective goods, and adjusts customer accounts.
- `rpc_record_repayment(payload jsonb)`:
  - Records customer debt repayments and generates unique repayment receipts (`RPM-YYYYMMDD-XXXX`).
- `rpc_record_stock_adjustment(payload jsonb)`:
  - Handles stocktake count discrepancies and write-offs with mandatory audit reason.
- `rpc_verify_payment(p_payment_id uuid, p_status text, p_notes text)`:
  - Restricted to Store Managers and Accountants for signing off M-Pesa references.

### 2. Operational PostgreSQL Views
- `v_customer_balances`: Computes `total_credit_sales_kes`, `total_repayments_kes`, `current_balance_kes`, and `available_credit_kes`.
- `v_low_stock_products`: Immediate filter of all items at or below reorder level.
- `v_stock_valuation`: Real-time inventory valuation at landed cost and retail selling price.
- `v_daily_sales_summary`: Aggregates gross sales, discounts, taxes, and payment method breakdowns.

---

## 📶 Offline Behavior & Conflict Rules

- **Offline Queueing**: Offline checkouts and adjustments are given unique UUIDs and client idempotency keys (`idemp_...`) and stored in Dexie's `syncQueue`.
- **M-Pesa Policy**: In strict compliance, M-Pesa payments recorded by cashiers while offline or during manual entry are flagged `verification_status: 'unverified'`. The system never claims M-Pesa is verified until signed off by the Manager or verified via server callback.
- **Stock Conflicts**: If local stock is depleted upon cloud sync, the server flags the sale with backorder movements and alerts the Store Manager in the Sync Center drawer.
- **Sync Center Drawer**: Accessible by clicking the Online/Offline status badge in the navbar; shows queued operations, retry counts, and sync status.

---

## 🚀 Getting Started

### 1. Database Setup in Supabase
Run the comprehensive migration script in your Supabase SQL Editor:
```bash
# File: supabase/migrations/20261022000000_single_store_schema.sql
# Seeds: supabase/seed.sql
```

### 2. Environment Configuration & Supabase Authentication
Copy `.env.example` to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```
- **Store Owner Registration**: When Supabase is configured, navigate to `/login` and select **Register Store Owner**. The first registered user is automatically provisioned as the master **Store Owner Admin (`admin`)** via PostgreSQL trigger `handle_new_user()`.
- **Staff Provisioning**: The Store Owner can provision employees from `/staff` with role-based supermarket access (Cashier, Clerk, Accountant, Manager) and login credentials.
- **Offline / Local Fallback**: If Supabase credentials are not yet configured, the PWA runs seamlessly against its IndexedDB virtual replica pre-seeded with all 193 products, suppliers, customers, and simulated local sessions.

### 3. Run Automated Tests
```bash
npm test
```
Executes authorization, concurrency, idempotency, supermarket permissions, and offline recovery test suites (20 passing tests).

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
