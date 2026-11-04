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
          const saleHeader = payload.new as any;
          if (saleHeader && saleHeader.id) {
            try {
              // Fetch full sale with items and payments for zero-loss cross-browser replication
              const { data: fullSale } = await supabase
                .from('sales')
                .select('*, sale_items(*), payments(*)')
                .eq('id', saleHeader.id)
                .maybeSingle();

              const s = fullSale || saleHeader;
              const localSale = {
                id: s.id,
                receipt_number: s.receipt_number,
                customer_id: s.customer_id,
                customer_name_snapshot: s.customer_name_snapshot,
                cashier_id: s.cashier_id,
                cashier_name_snapshot: s.cashier_name_snapshot,
                status: s.status,
                subtotal_kes: Number(s.subtotal_kes) || 0,
                discount_kes: Number(s.discount_kes) || 0,
                tax_kes: Number(s.tax_kes) || 0,
                total_kes: Number(s.total_kes) || 0,
                amount_paid_kes: Number(s.amount_paid_kes) || 0,
                offline_id: s.offline_id,
                idempotency_key: s.idempotency_key,
                is_offline_sync: Boolean(s.is_offline_sync),
                notes: s.notes,
                completed_at: s.completed_at,
                created_at: s.created_at,
                updated_at: s.updated_at,
                items: (s.sale_items || []).map((si: any) => ({
                  id: si.id,
                  sale_id: si.sale_id,
                  product_id: si.product_id,
                  product_name_snapshot: si.product_name_snapshot,
                  sku_snapshot: si.sku_snapshot,
                  quantity: Number(si.quantity) || 0,
                  unit_price_kes: Number(si.unit_price_kes) || 0,
                  discount_kes: Number(si.discount_kes) || 0,
                  line_total_kes: Number(si.line_total_kes) || 0,
                })),
                payments: (s.payments || []).map((p: any) => ({
                  id: p.id,
                  sale_id: p.sale_id,
                  method: p.method,
                  amount_kes: Number(p.amount_kes) || 0,
                  provider_reference: p.provider_reference,
                  received_by: p.received_by,
                  received_at: p.received_at || p.created_at,
                  verification_status: p.verification_status,
                  verified_by: p.verified_by,
                  verified_at: p.verified_at,
                  notes: p.notes,
                })),
              };

              // Prevent duplicates if sale was recorded with client temporary ID
              const existingByReceipt = await localDb.sales
                .where('receipt_number')
                .equals(localSale.receipt_number)
                .first();
              if (existingByReceipt && existingByReceipt.id !== localSale.id) {
                await localDb.sales.delete(existingByReceipt.id);
              }

              // Update local IndexedDB cache
              await localDb.sales.put(localSale);

              // Maintain offline receipts ledger for instant reprint in any browser
              await localDb.offlineReceipts.put({
                receipt_number: localSale.receipt_number,
                sale_id: localSale.id,
                customer_name: localSale.customer_name_snapshot || 'Walk-In Customer',
                total_kes: localSale.total_kes,
                amount_paid_kes: localSale.amount_paid_kes,
                payment_method: (localSale.payments || []).map((p: any) => p.method).join(', ') || 'cash',
                provider_reference: (localSale.payments || []).find((p: any) => p.provider_reference)?.provider_reference || undefined,
                items_count: localSale.items?.length || 0,
                cashier_name: localSale.cashier_name_snapshot || 'Staff',
                created_at: localSale.created_at,
                sync_status: 'synced',
              });

              // Dispatch real-time refresh to all active UI modules
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('beckys-hardware:data-refreshed', { detail: { type: 'sales', data: localSale } }));
                window.dispatchEvent(new CustomEvent('beckys-hardware:sales-updated', { detail: localSale }));
              }
            } catch (err) {
              console.warn('Could not cache realtime sale locally:', err);
            }

            addNotification({
              type: 'sale',
              title: 'New POS Sale Completed',
              message: `Receipt #${saleHeader.receipt_number || 'N/A'} for ${formatKES(saleHeader.total_kes || 0)}`,
              link: '/pos',
              data: saleHeader,
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

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('beckys-hardware:data-refreshed', { detail: { type: 'payments', data: payment } }));
            window.dispatchEvent(new CustomEvent('beckys-hardware:sales-updated'));
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
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('beckys-hardware:data-refreshed', { detail: { type: 'products', data: product } }));
            }
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
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('beckys-hardware:data-refreshed', { detail: { type: 'customers', data: repayment } }));
              }
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
