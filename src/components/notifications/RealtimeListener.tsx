'use client';

import React, { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { localDb } from '@/lib/dexie/db';
import { formatKES } from '@/lib/utils/formatters';

export const RealtimeListener: React.FC = () => {
  const { addNotification, setIsRealtimeConnected } = useNotifications();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsRealtimeConnected(false);
      return;
    }

    // Subscribe to unified Hardware Store Realtime channel
    const channel = supabase
      .channel('hardware-store-realtime', {
        config: {
          broadcast: { self: false },
          presence: { key: 'store-owner' },
        },
      })
      // 1. Live Sales Feed
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales' },
        async (payload) => {
          const sale = payload.new as any;
          if (sale && sale.id) {
            try {
              // Update local IndexedDB cache
              await localDb.sales.put(sale);
            } catch (err) {
              console.warn('Could not cache realtime sale locally:', err);
            }

            addNotification({
              type: 'sale',
              title: 'New POS Sale Completed',
              message: `Receipt #${sale.receipt_number || 'N/A'} for ${formatKES(sale.total_kes || 0)}`,
              link: '/pos',
              data: sale,
            });
          }
        }
      )
      // 2. M-Pesa & Payment Status Feed
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          const payment = payload.new as any;
          if (!payment) return;

          if (payment.method === 'mpesa') {
            if (payload.eventType === 'INSERT') {
              addNotification({
                type: 'payment',
                title: 'M-Pesa Payment Received',
                message: `${formatKES(payment.amount_kes || 0)} (${payment.provider_reference || 'Code pending'}) [${payment.verification_status}]`,
                link: '/payments',
                data: payment,
              });
            } else if (payload.eventType === 'UPDATE' && payment.verification_status === 'verified') {
              addNotification({
                type: 'payment',
                title: 'M-Pesa Payment Verified',
                message: `Transaction ${payment.provider_reference || ''} of ${formatKES(payment.amount_kes || 0)} has been verified.`,
                link: '/payments',
                data: payment,
              });
            }
          }
        }
      )
      // 3. Inventory Stock Updates & Low Stock Warnings
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        async (payload) => {
          const product = payload.new as any;
          if (!product || !product.id) return;

          try {
            await localDb.products.put(product);
          } catch (err) {
            console.warn('Could not update local product replica:', err);
          }

          // Trigger alert if stock fell to or below reorder threshold
          if (
            product.low_stock_alert_enabled &&
            product.stock_on_hand <= product.low_stock_level &&
            product.stock_on_hand > 0
          ) {
            addNotification({
              type: 'inventory',
              title: 'Low Stock Alert',
              message: `${product.product_name} is down to ${product.stock_on_hand} ${product.unit_of_measure} (Reorder level: ${product.reorder_quantity})`,
              link: '/catalogue',
              data: product,
            });
          } else if (product.stock_on_hand <= 0) {
            addNotification({
              type: 'inventory',
              title: 'Out of Stock Alert',
              message: `${product.product_name} is completely depleted. Reorder needed immediately.`,
              link: '/catalogue',
              data: product,
            });
          }
        }
      )
      // 4. Customer Credit Repayments
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customer_repayments' },
        async (payload) => {
          const repayment = payload.new as any;
          if (repayment && repayment.id) {
            try {
              await localDb.customerRepayments.put(repayment);
            } catch (err) {
              console.warn('Could not cache repayment locally:', err);
            }

            addNotification({
              type: 'credit',
              title: 'Customer Debt Repaid',
              message: `Repayment of ${formatKES(repayment.amount_kes || 0)} received (Receipt #${repayment.receipt_number || 'N/A'})`,
              link: '/customers',
              data: repayment,
            });
          }
        }
      )
      // 5. Broadcast Store Broadcasts (e.g. Price updates or announcements)
      .on('broadcast', { event: 'store_announcement' }, (payload) => {
        if (payload?.payload?.title) {
          addNotification({
            type: 'system',
            title: payload.payload.title,
            message: payload.payload.message || 'Storewide update',
          });
        }
      })
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsRealtimeConnected(false);
    };
  }, [addNotification, setIsRealtimeConnected]);

  return null;
};
