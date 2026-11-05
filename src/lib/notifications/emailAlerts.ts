/**
 * Becky's Hardware Store — Email Alert Dispatcher Client
 * Connects Supabase Realtime event listeners to the Email Alert endpoint
 * with intelligent throttling to prevent duplicate emails for the same item.
 */

interface DispatchEmailAlertParams {
  type: 'inventory' | 'payment' | 'sale' | 'system';
  title: string;
  message: string;
  productName?: string;
  sku?: string;
  currentStock?: number | string;
  reorderLevel?: number | string;
  amountKes?: number;
  reference?: string;
  recipientEmail?: string;
  actionUrl?: string;
  /** Overrides the default "[ALERT] …" email subject (used for daily reports). */
  subject?: string;
  /** Overrides the default "REALTIME STORE ALERT" email header label. */
  headerLabel?: string;
  /** Extra label/value rows rendered inside the email body. */
  fields?: Array<{ label: string; value: string }>;
  throttleKey?: string; // Optional unique key (e.g. sku or payment reference)
}

// In-memory throttling map (key -> timestamp in ms)
const throttleCache = new Map<string, number>();
const THROTTLE_DURATION_MS = 30 * 60 * 1000; // 30 minutes throttle per item

export async function dispatchEmailAlert(params: DispatchEmailAlertParams): Promise<boolean> {
  const { throttleKey, ...payload } = params;

  // Check throttling
  if (throttleKey) {
    const lastSent = throttleCache.get(throttleKey);
    const now = Date.now();
    if (lastSent && now - lastSent < THROTTLE_DURATION_MS) {
      console.log(`[Alerts] Throttled email for ${throttleKey} (sent ${Math.round((now - lastSent) / 60000)}m ago)`);
      return false;
    }
  }

  try {
    const res = await fetch('/api/alerts/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      if (throttleKey) {
        throttleCache.set(throttleKey, Date.now());
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Alerts] Failed to send email alert:', err);
    return false;
  }
}
