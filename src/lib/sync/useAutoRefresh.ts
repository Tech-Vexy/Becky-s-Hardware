'use client';

import { useEffect, useRef } from 'react';

export type RefreshEntityType =
  | 'sales'
  | 'products'
  | 'customers'
  | 'invoices'
  | 'payments'
  | 'purchases'
  | 'all';

/**
 * Reusable React hook for Becky's Hardware Store.
 * Automatically reloads the component's data whenever:
 * 1. Background polling syncs new cloud records.
 * 2. Supabase Realtime broadcasts an incoming transaction or inventory shift.
 * 3. Another device/browser completes a sale, payment, or price adjustment.
 */
export function useAutoRefresh(
  onRefresh: () => void | Promise<void>,
  types?: RefreshEntityType[]
) {
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    const handleDataRefreshed = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const eventType: RefreshEntityType = detail?.type || 'all';

      if (!types || types.includes('all') || eventType === 'all' || types.includes(eventType)) {
        try {
          void refreshRef.current();
        } catch (err) {
          console.warn('[useAutoRefresh] Error in refresh callback:', err);
        }
      }
    };

    const handleSalesUpdated = () => {
      if (!types || types.includes('all') || types.includes('sales')) {
        try {
          void refreshRef.current();
        } catch (err) {
          console.warn('[useAutoRefresh] Error in sales-updated callback:', err);
        }
      }
    };

    window.addEventListener('beckys-hardware:data-refreshed', handleDataRefreshed);
    window.addEventListener('beckys-hardware:sales-updated', handleSalesUpdated);

    return () => {
      window.removeEventListener('beckys-hardware:data-refreshed', handleDataRefreshed);
      window.removeEventListener('beckys-hardware:sales-updated', handleSalesUpdated);
    };
  }, [types]);
}
