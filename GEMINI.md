# Universal Agent Memory & System Guidelines — Becky's Hardware Store

This document is the **universal, permanent system memory and operational instruction file** for any AI agent, coding assistant, or developer working on the **Becky's Hardware Store** codebase.

---

## 1. AI Infrastructure & Model Provider

- **Model Provider**: **NVIDIA** (NVIDIA NIM & AI Foundation Models).
- **Universal Design Principle**:
  - Keep all agent instructions, code structures, and documentation **universal, clean, and model-agnostic**.
  - Avoid proprietary vendor lock-in or platform-specific assumptions.
  - Ensure fast inference, deterministic JSON schemas, and clear function-calling compatibility.

---

## 2. Core Business Invariants (Strict Store Rules)

- **Store Identity**: **Becky's Hardware Store** (single physical retail hardware store in Kenya).
  - Strictly **never** use "Simba Hardware" or unspecified shop locations. Authentic product brand names like "Simba Cement" are preserved as products only.
  - Store KRA PIN: `P051234567X` (16% VAT Registered).
  - Store Contact: `+254 712 345 678` | `sales@beckyshardware.co.ke`.
- **Currency & Taxation**:
  - Currency: **KES (Kenyan Shillings)** formatted via `formatKES()`.
  - VAT: **16% VAT inclusive** calculations (`round((total * 16 / 116), 2)`).
- **Single-Location Retail Model**:
  - Single shop floor with counter service and immediate shelf stock.
  - Strictly no multi-tenancy, no godown transfers, and no complex warehouse hierarchies.
- **Scope & Anti-Complexity Invariant (Strictly No Delivery Monster)**:
  - The store focus is strictly on **physical counter sales, inventory stock/ledger, and product catalog tracking**.
  - Strictly **no delivery tracking, no dispatch logistics, no delivery driver fleets, and no shipping management**. Keep the workflows lean, instant, and focused on shelf stock.
- **Navigation Standard**:
  - **Bottom Navigation (`BottomNav`)** is the default unified navigation bar with an embedded "More" popup sheet for all secondary modules.
  - No persistent desktop sidebar, mobile drawer, or hamburger buttons.
- **Default Policy**: **Simplicity, speed, and offline resilience**.

---

## 3. Product Catalog, POS & Pricing Rules

- **Price Updatability**:
  - Item selling prices must be updateable directly on the POS cart line items (for negotiated discounts or bulk pricing).
  - Master catalog prices and attributes must be editable from the **POS terminal**, the **Inventory Ledger**, and the **Catalogue** page.
- **POS Usability**:
  - Fast few-letter multi-token matching across product name, SKU, specification, and brand (e.g. typing `cem` or `nail 3` matches immediately).
  - Fractional decimal sales allowed for items like pipes (meters), nails (kg), and wire (kg).
- **Daily Sales Tracking**:
  - POS tracks live daily sales directly in a quick-tracker bar: Today's Gross Sales, Ring-ups count, Cash in Drawer, M-Pesa Till, and Credit.
  - POS features a live "Today's Sales Log" modal with 1-click receipt reprint.
  - Dashboard KPI cards accurately track today's sales and payment breakdowns.
- **Customer Invoicing**:
  - Support both **Thermal ETR Receipts** and **A4 Official Tax Invoices** (with KRA PIN, store details, line items, 16% VAT breakdown, payment terms, and remittance info).
  - Invoices page (`/invoices`) manages customer billing, quotations, and payment reconciliation.
  - Invoices can be generated directly from the POS cart with a single click.

---

## 4. Offline-First & Bi-Directional Sync Architecture

- **Local Virtual Store**:
  - Dexie IndexedDB (`HardwareStoreLocalDB`) acts as the instant, zero-latency local database.
  - Every operational flow (checkout, stock adjustment, delivery receiving, invoice creation, catalog update) executes locally first.
- **Remote Cloud Database**:
  - Supabase PostgreSQL (Project: `gikivrpwayzqrvrturyz`).
  - Remote tables: `store_settings`, `product_categories`, `products`, `customers`, `customer_repayments`, `suppliers`, `purchases`, `purchase_items`, `sales`, `sale_items`, `payments`, `returns`, `expenses`, `stock_movements`, `invoices`, `audit_logs`.
- **Bi-Directional Sync (`syncEngine`)**:
  - **Push**: Queued local operations with unique idempotency keys synced via `syncPendingQueue()`.
  - **Pull**: Remote database state pulled into Dexie via `pullRemoteData()`.
  - **Full Sync**: `syncEngine.syncAll()` pushes local changes and pulls latest cloud records in one command.

---

## 5. Memory Protocol (When to Remember & What to Store)

### What to Remember Permanently
1. **Architectural Decisions**: Decisions that affect the entire app (e.g. offline-first Dexie + Supabase, bottom navigation, single store, model provider: Nvidia).
2. **User Corrections & Business Policies**: Any explicit preference given by the user (e.g. KES currency, 16% VAT, no Simba Hardware, updateable prices, daily sales tracking).
3. **Database & Schema Invariants**: Table structures, RPC names, RLS rules, and sync operation types.
4. **Codebase Patterns**: Component conventions, formatting helpers, and auth role permissions.

### When to Remember
- When a user corrects a behavior or establishes a design rule $\rightarrow$ Record immediately in `GEMINI.md` and `AGENTS.md`.
- When adding a new module or database table $\rightarrow$ Update `GEMINI.md` and keep remote migrations aligned with local Dexie stores.
- When resolving a non-trivial architectural bug $\rightarrow$ Document the fix pattern in `GEMINI.md`.

### What NOT to Remember
- Ephemeral test values, temporary debug variables, or transient tool outputs.
- One-off scratch scripts stored in the scratch folder.
- Temporary conversation states that do not impact future coding turns.
