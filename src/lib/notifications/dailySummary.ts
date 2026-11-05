/**
 * Becky's Hardware Store — Daily End-of-Day Summary
 *
 * Builds a once-per-day digest of the store's performance from the local
 * offline-first ledger (Dexie) and delivers it as an in-app/PWA notification
 * and, optionally, as an email to the store owner.
 *
 * All date boundaries are evaluated in Africa/Nairobi time so the summary
 * always reflects the store's trading day rather than the UTC date.
 */

import { localDb } from '@/lib/dexie/db';
import { formatKES } from '@/lib/utils/formatters';
import { dispatchEmailAlert } from '@/lib/notifications/emailAlerts';
import type { Sale, Product, Expense, CustomerRepayment } from '@/lib/types/database';

const NAIROBI_TZ = 'Africa/Nairobi';

const CONFIG_STORAGE_KEY = 'beckys_hardware_daily_summary_config';
const LAST_SENT_STORAGE_KEY = 'beckys_hardware_daily_summary_last_sent';

/** Fired on window whenever the schedule settings are saved. */
export const DAILY_SUMMARY_CONFIG_EVENT = 'beckys-hardware:daily-summary-config-updated';

export interface DailySummaryConfig {
  /** Whether the automatic end-of-day digest is active. */
  enabled: boolean;
  /** Local (Nairobi) time of day in HH:MM, e.g. "20:00". */
  time: string;
  /** Also email the digest to the store owner via Resend. */
  email: boolean;
  /** Email address receiving the daily report. Defaults to kamenengewa@gmail.com. */
  recipientEmail?: string;
  /** Whether to trigger native local device notifications. */
  localNotifications?: boolean;
}

export const DEFAULT_DAILY_SUMMARY_CONFIG: DailySummaryConfig = {
  enabled: true,
  time: '20:00',
  email: true,
  recipientEmail: 'kamenengewa@gmail.com',
  localNotifications: true,
};

export interface DailyPaymentBreakdown {
  cash: number;
  mpesa: number;
  card: number;
  credit: number;
  other: number;
}

export interface DailySummary {
  dateKey: string;
  dateLabel: string;
  salesCount: number;
  grossSalesKes: number;
  vatKes: number;
  discountsKes: number;
  cogsKes: number;
  grossProfitKes: number;
  expensesKes: number;
  netProfitKes: number;
  repaymentsKes: number;
  paymentBreakdown: DailyPaymentBreakdown;
  topProduct: { name: string; quantity: number; revenueKes: number } | null;
  lowStockCount: number;
}

// ─── Date helpers (Africa/Nairobi) ──────────────────────────────────────────

function nairobiParts(date: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: NAIROBI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return map;
}

/** Returns the Nairobi calendar date as YYYY-MM-DD. */
export function getNairobiDateKey(date: Date = new Date()): string {
  const p = nairobiParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Returns the Nairobi wall-clock time as HH:MM. */
export function getNairobiTimeKey(date: Date = new Date()): string {
  const p = nairobiParts(date);
  return `${p.hour}:${p.minute}`;
}

export function formatNairobiDateLabel(dateKey: string): string {
  const parsed = new Date(`${dateKey}T12:00:00+03:00`);
  if (isNaN(parsed.getTime())) return dateKey;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: NAIROBI_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function toDateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  // Date-only values (e.g. expense_date) are already Nairobi calendar days
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
  }
  return getNairobiDateKey(parsed);
}

// ─── Config persistence ─────────────────────────────────────────────────────

function normalizeConfig(raw: Partial<DailySummaryConfig> | null | undefined): DailySummaryConfig {
  const time = typeof raw?.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time)
    ? raw.time
    : DEFAULT_DAILY_SUMMARY_CONFIG.time;

  const recipientEmail =
    typeof raw?.recipientEmail === 'string' && raw.recipientEmail.includes('@')
      ? raw.recipientEmail.trim()
      : DEFAULT_DAILY_SUMMARY_CONFIG.recipientEmail;

  return {
    enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : DEFAULT_DAILY_SUMMARY_CONFIG.enabled,
    time,
    email: typeof raw?.email === 'boolean' ? raw.email : DEFAULT_DAILY_SUMMARY_CONFIG.email,
    recipientEmail,
    localNotifications:
      typeof raw?.localNotifications === 'boolean'
        ? raw.localNotifications
        : DEFAULT_DAILY_SUMMARY_CONFIG.localNotifications,
  };
}

export function loadDailySummaryConfig(): DailySummaryConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_DAILY_SUMMARY_CONFIG };
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DAILY_SUMMARY_CONFIG };
    return normalizeConfig(JSON.parse(raw));
  } catch (err) {
    console.warn('[DailySummary] Could not read config:', err);
    return { ...DEFAULT_DAILY_SUMMARY_CONFIG };
  }
}

export function saveDailySummaryConfig(config: DailySummaryConfig): DailySummaryConfig {
  const normalized = normalizeConfig(config);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent(DAILY_SUMMARY_CONFIG_EVENT, { detail: normalized }));
    } catch (err) {
      console.warn('[DailySummary] Could not persist config:', err);
    }
  }
  return normalized;
}

export function getLastSentDateKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LAST_SENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function markDailySummarySent(dateKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_SENT_STORAGE_KEY, dateKey);
  } catch (err) {
    console.warn('[DailySummary] Could not record dispatch date:', err);
  }
}

/**
 * The digest is due when enabled, not already dispatched today, and the
 * Nairobi clock has reached the configured closing time.
 */
export function isDailySummaryDue(
  config: DailySummaryConfig,
  lastSentDateKey: string | null,
  now: Date = new Date()
): boolean {
  if (!config.enabled) return false;
  const today = getNairobiDateKey(now);
  if (lastSentDateKey === today) return false;
  return getNairobiTimeKey(now) >= config.time;
}

// ─── Summary computation ────────────────────────────────────────────────────

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function belongsToDay(value: string | null | undefined, dateKey: string): boolean {
  return toDateKey(value) === dateKey;
}

export async function buildDailySummary(dateKey: string = getNairobiDateKey()): Promise<DailySummary> {
  const [sales, products, expenses, repayments] = await Promise.all([
    localDb.sales.where('status').equals('completed').toArray() as Promise<Sale[]>,
    localDb.products.toArray() as Promise<Product[]>,
    localDb.expenses.toArray() as Promise<Expense[]>,
    localDb.customerRepayments.toArray() as Promise<CustomerRepayment[]>,
  ]);

  const productById = new Map<string, Product>();
  for (const product of products) productById.set(product.id, product);

  const todaySales = sales.filter((sale) =>
    belongsToDay(sale.completed_at || sale.created_at, dateKey)
  );

  let grossSalesKes = 0;
  let vatKes = 0;
  let discountsKes = 0;
  let cogsKes = 0;
  const paymentBreakdown: DailyPaymentBreakdown = { cash: 0, mpesa: 0, card: 0, credit: 0, other: 0 };
  const productTotals = new Map<string, { name: string; quantity: number; revenueKes: number }>();

  for (const sale of todaySales) {
    grossSalesKes += Number(sale.total_kes) || 0;
    vatKes += Number(sale.tax_kes) || 0;
    discountsKes += Number(sale.discount_kes) || 0;

    // Cost of goods sold, valued at the catalogue buying price
    for (const item of sale.items ?? []) {
      const product = productById.get(item.product_id);
      const unitCost = Number(product?.buying_price_kes) || 0;
      cogsKes += unitCost * (Number(item.quantity) || 0);

      const name = item.product_name_snapshot || product?.product_name || 'Item';
      const agg = productTotals.get(item.product_id || name) ?? {
        name,
        quantity: 0,
        revenueKes: 0,
      };
      agg.quantity += Number(item.quantity) || 0;
      agg.revenueKes += Number(item.line_total_kes) || 0;
      productTotals.set(item.product_id || name, agg);
    }

    for (const payment of sale.payments ?? []) {
      const amount = Number(payment.amount_kes) || 0;
      if (payment.method === 'cash') paymentBreakdown.cash += amount;
      else if (payment.method === 'mpesa') paymentBreakdown.mpesa += amount;
      else if (payment.method === 'card') paymentBreakdown.card += amount;
      else if (payment.method === 'credit') paymentBreakdown.credit += amount;
      else paymentBreakdown.other += amount;
    }
  }

  const expensesKes = expenses
    .filter((expense) => belongsToDay(expense.expense_date || expense.created_at, dateKey))
    .reduce((sum, expense) => sum + (Number(expense.amount_kes) || 0), 0);

  const repaymentsKes = repayments
    .filter((repayment) => belongsToDay(repayment.received_at || repayment.created_at, dateKey))
    .reduce((sum, repayment) => sum + (Number(repayment.amount_kes) || 0), 0);

  // Selling prices are VAT-inclusive, so revenue is netted of VAT before
  // comparing against cost of goods to keep the margin honest.
  const netRevenueKes = round2(grossSalesKes - vatKes);
  const grossProfitKes = round2(netRevenueKes - cogsKes);
  const netProfitKes = round2(grossProfitKes - expensesKes);

  let topProduct: DailySummary['topProduct'] = null;
  for (const entry of productTotals.values()) {
    if (!topProduct || entry.revenueKes > topProduct.revenueKes) {
      topProduct = { ...entry };
    }
  }

  const lowStockCount = products.filter(
    (product) => product.active !== false && product.stock_on_hand <= product.low_stock_level
  ).length;

  return {
    dateKey,
    dateLabel: formatNairobiDateLabel(dateKey),
    salesCount: todaySales.length,
    grossSalesKes: round2(grossSalesKes),
    vatKes: round2(vatKes),
    discountsKes: round2(discountsKes),
    cogsKes: round2(cogsKes),
    grossProfitKes,
    expensesKes: round2(expensesKes),
    netProfitKes,
    repaymentsKes: round2(repaymentsKes),
    paymentBreakdown: {
      cash: round2(paymentBreakdown.cash),
      mpesa: round2(paymentBreakdown.mpesa),
      card: round2(paymentBreakdown.card),
      credit: round2(paymentBreakdown.credit),
      other: round2(paymentBreakdown.other),
    },
    topProduct,
    lowStockCount,
  };
}

// ─── Presentation & delivery ────────────────────────────────────────────────

export function dailySummaryTitle(summary: DailySummary): string {
  return `End of Day Summary — ${summary.dateLabel}`;
}

export function dailySummaryMessage(summary: DailySummary): string {
  const ringups = `${summary.salesCount} sale${summary.salesCount === 1 ? '' : 's'}`;
  const top = summary.topProduct
    ? ` Top seller: ${summary.topProduct.name} (${summary.topProduct.quantity}).`
    : '';

  return (
    `${ringups} · Gross ${formatKES(summary.grossSalesKes)} · ` +
    `Gross profit ${formatKES(summary.grossProfitKes)} · Net ${formatKES(summary.netProfitKes)} ` +
    `after ${formatKES(summary.expensesKes)} expenses. ` +
    `Cash ${formatKES(summary.paymentBreakdown.cash)}, ` +
    `M-Pesa ${formatKES(summary.paymentBreakdown.mpesa)}, ` +
    `Credit ${formatKES(summary.paymentBreakdown.credit)}.` +
    top
  );
}

/** Emails the digest through the shared alert endpoint (Resend/SendGrid). */
export async function sendDailySummaryEmail(
  summary: DailySummary,
  recipientEmail?: string
): Promise<boolean> {
  const targetEmail = recipientEmail || loadDailySummaryConfig().recipientEmail || 'kamenengewa@gmail.com';
  return dispatchEmailAlert({
    type: 'system',
    title: dailySummaryTitle(summary),
    message: dailySummaryMessage(summary),
    subject: `[Daily Report] ${summary.dateLabel} — Becky's Hardware`,
    headerLabel: 'DAILY STORE REPORT',
    fields: [
      { label: 'Date', value: summary.dateLabel },
      { label: 'Transactions Completed', value: String(summary.salesCount) },
      { label: 'Gross Sales (KES)', value: formatKES(summary.grossSalesKes) },
      { label: 'VAT Collected (16%)', value: formatKES(summary.vatKes) },
      { label: 'Cost of Goods Sold', value: formatKES(summary.cogsKes) },
      { label: 'Gross Margin / Profit', value: formatKES(summary.grossProfitKes) },
      { label: 'Store Expenses', value: formatKES(summary.expensesKes) },
      { label: 'Net Profit', value: formatKES(summary.netProfitKes) },
      { label: 'Cash in Drawer', value: formatKES(summary.paymentBreakdown.cash) },
      { label: 'M-Pesa Collections', value: formatKES(summary.paymentBreakdown.mpesa) },
      { label: 'Card Sales', value: formatKES(summary.paymentBreakdown.card) },
      { label: 'Credit Given Out', value: formatKES(summary.paymentBreakdown.credit) },
      { label: 'Credit Repayments', value: formatKES(summary.repaymentsKes) },
      {
        label: 'Top Performing Item',
        value: summary.topProduct
          ? `${summary.topProduct.name} (${summary.topProduct.quantity} units · ${formatKES(summary.topProduct.revenueKes)})`
          : 'None sold',
      },
      { label: 'Low Stock SKU Count', value: String(summary.lowStockCount) },
    ],
    recipientEmail: targetEmail,
    actionUrl:
      typeof window !== 'undefined'
        ? `${window.location.origin}/reports`
        : 'https://beckyshardware.co.ke/reports',
    throttleKey: `daily_summary_${summary.dateKey}`,
  });
}
