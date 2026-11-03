'use client';

import React, { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { localDb } from '@/lib/dexie/db';
import { formatKES } from '@/lib/utils/formatters';
import { dispatchEmailAlert } from '@/lib/notifications/emailAlerts';

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
              const msg = `${formatKES(payment.amount_kes || 0)} (${payment.provider_reference || 'Code pending'}) [${payment.verification_status}]`;
              addNotification({
                type: 'payment',
                title: 'M-Pesa Payment Received',
                message: msg,
                link: '/payments',
                data: payment,
              });

              // Send email alert for unverified codes or high-value receipts (>= 10,000 KES)
              if (payment.amount_kes >= 10000 || payment.verification_status === 'unverified') {
                dispatchEmailAlert({
                  type: 'payment',
                  title: 'M-Pesa Payment Alert',
                  message: `Payment of ${formatKES(payment.amount_kes || 0)} received with reference ${payment.provider_reference || 'Pending'}. Status: ${payment.verification_status}.`,
                  amountKes: payment.amount_kes,
                  reference: payment.provider_reference,
                  actionUrl: 'https://beckyshardware.co.ke/payments',
                  throttleKey: `mpesa_${payment.id || payment.provider_reference}`,
                });
              }
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
            const alertMsg = `${product.product_name} is down to ${product.stock_on_hand} ${product.unit_of_measure} (Reorder level: ${product.reorder_quantity})`;
            addNotification({
              type: 'inventory',
              title: 'Low Stock Alert',
              message: alertMsg,
              link: '/catalogue',
              data: product,
            });

            // Dispatch automated email alert to store owner
            dispatchEmailAlert({
              type: 'inventory',
              title: `Low Stock Alert: ${product.product_name}`,
              message: alertMsg,
              productName: product.product_name,
              sku: product.sku,
              currentStock: `${product.stock_on_hand} ${product.unit_of_measure}`,
              reorderLevel: `${product.reorder_quantity} ${product.unit_of_measure}`,
              actionUrl: 'https://beckyshardware.co.ke/catalogue',
              throttleKey: `low_stock_${product.sku}`,
            });
          } else if (product.stock_on_hand <= 0) {
            const alertMsg = `${product.product_name} is completely depleted. Reorder needed immediately.`;
            addNotification({
              type: 'inventory',
              title: 'Out of Stock Alert',
              message: alertMsg,
              link: '/catalogue',
              data: product,
            });

            // Dispatch urgent out-of-stock email alert
            dispatchEmailAlert({
              type: 'inventory',
              title: `CRITICAL Out of Stock: ${product.product_name}`,
              message: alertMsg,
              productName: product.product_name,
              sku: product.sku,
              currentStock: '0 (DEPLETED)',
              reorderLevel: `${product.reorder_quantity} ${product.unit_of_measure}`,
              actionUrl: 'https://beckyshardware.co.ke/purchases',
              throttleKey: `out_of_stock_${product.sku}`,
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
