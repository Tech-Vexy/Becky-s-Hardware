# Becky's Hardware Store — Universal Agent Operational Reference

This document serves as the permanent reference guide for agents and developers working on Becky's Hardware Store.

---

## 1. AI Infrastructure & Model Provider
- **Provider**: NVIDIA (NVIDIA NIM & AI Foundation Models).
- **Core Tenet**: Clean, vendor-agnostic architecture with deterministic schemas.

---

## 2. Core Business Invariants
- **Store**: **Becky's Hardware Store** (Single physical retail store in Kenya). Strictly no "Simba Hardware".
- **PIN & Contact**: KRA PIN `P051234567X` (16% VAT Registered) | `+254 712 345 678` | `sales@beckyshardware.co.ke`.
- **Currency**: `KES` formatted with `formatKES()`.
- **Taxation**: 16% VAT inclusive calculation (`round((total * 16 / 116), 2)`).
- **Single Location**: Walk-in counter service and immediate shelf stock. No godowns, no multi-tenancy.
- **Strictly No Delivery**: Keep it simple. Store focus is strictly on **inventory, daily sales, and product catalog tracking**. No delivery tracking, no dispatch logistics.
- **Navigation**: `BottomNav` bar with "More" popup sheet. No persistent desktop sidebar.

---

## 3. Product Catalog, POS & Pricing
- **Price Updatability**:
  - Item selling prices are updateable directly on POS cart line items (for negotiated discounts or bulk pricing).
  - Master catalog prices and attributes are updateable from POS, Inventory Ledger, and Catalogue page.
- **POS Usability**: Multi-token search (`cem`, `nail 3`), decimal quantities for pipes/nails.
- **Daily Sales Tracking**:
  - Live daily sales tracker bar at POS: Today's Gross Sales, Ring-ups count, Cash, M-Pesa Till, and Credit.
  - Live "Today's Sales Log" modal with 1-click receipt reprint.
  - Dashboard KPI cards accurately track today's sales.
- **Invoicing**:
  - A4 Official Tax Invoices via `printTaxInvoice()` and `/invoices` page.
  - 1-click invoice creation directly from POS cart.

---

## 4. Offline-First & Bi-Directional Sync
- **Local DB**: Dexie IndexedDB (`HardwareStoreLocalDB`).
- **Remote DB**: Supabase PostgreSQL (`gikivrpwayzqrvrturyz`).
- **Sync**: `syncEngine.syncAll()` pushes queued mutations and pulls cloud updates.

---

## 5. Authentication, Access Control & Deployment Protection
- **Supabase-Only Authentication**:
  - All logins are strictly authenticated via Supabase Cloud Auth (`supabase.auth.signInWithPassword`).
  - Strictly **NO local accounts**, no mock offline logins, no automatic registration fallbacks, and no hardcoded admin logins.
  - Initial authentication state is unauthenticated (`user = null`, `isAuthenticated = false`).
- **Edge Route Protection (`middleware.ts`)**:
  - Next.js server middleware verifies active Supabase sessions using `supabase.auth.getUser()`.
  - Unauthenticated requests to store routes are immediately redirected with a 307 to `/login`.
  - Authenticated sessions visiting `/login` are redirected to `/`.
- **Deployment Security Headers**:
  - Standard security headers (CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy) are enforced via `next.config.mjs` and `vercel.json`.

---

## 6. Daily Reports, Resend Email Delivery & Pusher Local Notifications
- **Email Dispatcher (Resend)**:
  - Daily financial and inventory summary digests dispatched to store owner `kamenengewa@gmail.com` via Resend API.
  - From address: `"Becky's Hardware Store <onboarding@resend.dev>"` with `Reply-To: eveliaveldrine@gmail.com`.
  - Manual 1-click email dispatch from Reports (`/reports`) and Settings (`/settings`), plus automatic closing time trigger.
- **Local Device Notifications**:
  - Native PWA and device notification banners powered by Service Worker (`sw.js`) and Web Notifications API.
  - User-configurable local notifications toggle in Settings with permission request workflow and test alert.
- **Pusher WebSockets (`pusher-js`)**:
  - Integrated client library `pusher-js` (`PusherListener`) subscribing to `beckys-hardware-channel`.
  - Broadcasts storewide realtime events (`daily-summary`, `stock-alert`, `payment-received`, `store-announcement`).

