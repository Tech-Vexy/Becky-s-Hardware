import type { Invoice } from '@/lib/types/database';

export interface InvoicePrintOptions {
  storeName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  kraPin?: string;
  paybill?: string;
  tillNumber?: string;
  bankDetails?: string;
}

export function printTaxInvoice(
  invoice: Invoice,
  options: InvoicePrintOptions = {}
): void {
  if (typeof window === 'undefined') return;

  const storeName = options.storeName || "Becky's Hardware Store";
  const tagline = options.tagline || 'Quality Building Materials, Timber, Plumbing & Tools';
  const phone = options.phone || '+254 712 345 678';
  const email = options.email || 'accounts@beckyshardware.co.ke';
  const kraPin = options.kraPin || 'P051234567X';
  const tillNumber = options.tillNumber || '882194';
  const bankDetails = options.bankDetails || 'Equity Bank • Acc: 0180293847291 • Westlands';

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups to print invoices.');
    return;
  }

  const itemsHtml = (invoice.items || [])
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
        <td style="padding: 8px 6px; color: #64748b; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px 6px; font-weight: 600; color: #0f172a;">
          ${item.product_name}
          ${item.sku ? `<div style="font-size: 10px; font-family: monospace; color: #94a3b8;">SKU: ${item.sku}</div>` : ''}
        </td>
        <td style="padding: 8px 6px; text-align: center; color: #334155;">
          ${item.quantity} <span style="font-size: 10px; color: #64748b;">${item.unit_of_measure || 'pcs'}</span>
        </td>
        <td style="padding: 8px 6px; text-align: right; color: #334155;">
          KES ${Number(item.unit_price_kes).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </td>
        <td style="padding: 8px 6px; text-align: right; font-weight: 700; color: #0f172a;">
          KES ${Number(item.line_total_kes).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `
    )
    .join('');

  const statusBadgeColor =
    invoice.status === 'paid'
      ? '#059669'
      : invoice.status === 'pending'
      ? '#d97706'
      : invoice.status === 'partial'
      ? '#2563eb'
      : '#64748b';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Tax Invoice - ${invoice.invoice_number}</title>
      <style>
        @media print {
          @page {
            margin: 15mm;
            size: A4 portrait;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 24px;
          background: #ffffff;
        }
        .container {
          max-width: 760px;
          margin: 0 auto;
        }
        .btn-print {
          background: #d97706;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <span style="font-size: 13px; font-weight: 600; color: #475569;">Ready to print A4 Official Tax Invoice</span>
          <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
        </div>

        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #0f172a;">
          <div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">${storeName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">${tagline}</p>
            <div style="margin-top: 8px; font-size: 11px; color: #475569; line-height: 1.5;">
              <div><strong>Tel / WhatsApp:</strong> ${phone}</div>
              <div><strong>Email:</strong> ${email}</div>
              <div><strong>KRA PIN:</strong> <span style="font-family: monospace; font-weight: bold;">${kraPin}</span> (16% VAT Registered)</div>
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 26px; font-weight: 900; color: #d97706; letter-spacing: 1px;">TAX INVOICE</div>
            <div style="font-size: 14px; font-family: monospace; font-weight: 800; color: #0f172a; margin-top: 4px;">${invoice.invoice_number}</div>
            <div style="margin-top: 6px;">
              <span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: ${statusBadgeColor}20; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeColor}40;">
                ${invoice.status}
              </span>
            </div>
          </div>
        </div>

        <!-- Invoice Meta Details -->
        <div style="display: flex; justify-content: space-between; gap: 20px; padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="flex: 1;">
            <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 4px;">INVOICE TO (CLIENT)</div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${invoice.customer_name}</div>
            ${invoice.customer_phone ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Phone: ${invoice.customer_phone}</div>` : ''}
            ${invoice.customer_kra_pin ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Client KRA PIN: <strong>${invoice.customer_kra_pin}</strong></div>` : ''}
            ${invoice.customer_address ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Client Address: ${invoice.customer_address}</div>` : ''}
          </div>

          <div style="width: 220px; font-size: 11px; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Issue Date:</span>
              <strong style="color: #0f172a;">${invoice.issue_date}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Due Date:</span>
              <strong style="color: #dc2626;">${invoice.due_date}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Terms:</span>
              <span style="font-weight: 600; color: #0f172a;">${invoice.payment_terms || 'Due on Receipt'}</span>
            </div>
            ${invoice.sale_receipt_number ? `
              <div style="display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 4px; margin-top: 4px;">
                <span style="color: #64748b;">Ref Receipt:</span>
                <span style="font-family: monospace; font-weight: bold; color: #0f172a;">${invoice.sale_receipt_number}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
              <th style="padding: 10px 6px; text-align: center; width: 32px;">#</th>
              <th style="padding: 10px 6px; text-align: left;">Item Description</th>
              <th style="padding: 10px 6px; text-align: center; width: 90px;">Qty</th>
              <th style="padding: 10px 6px; text-align: right; width: 120px;">Unit Price (KES)</th>
              <th style="padding: 10px 6px; text-align: right; width: 130px;">Total (KES)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals & Payment Instructions -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 30px; margin-top: 24px; padding-top: 16px;">
          <!-- Payment Remittance -->
          <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 11px; line-height: 1.5;">
            <div style="font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 6px; font-size: 11px;">Payment Remittance Details:</div>
            <div><strong>M-Pesa Buy Goods (Till):</strong> <span style="font-mono font-bold text-emerald-800">${tillNumber}</span></div>
            <div><strong>Bank Transfer:</strong> ${bankDetails}</div>
            <div style="margin-top: 6px; color: #64748b; font-size: 10px;">
              Please quote Invoice No. <strong>${invoice.invoice_number}</strong> on payment remittance.
            </div>
            ${invoice.notes ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; color: #334155;"><strong>Special Notes:</strong> ${invoice.notes}</div>` : ''}
          </div>

          <!-- Summary Box -->
          <div style="width: 250px; font-size: 12px; line-height: 1.8;">
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>Subtotal:</span>
              <strong style="color: #0f172a;">KES ${Number(invoice.subtotal_kes).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>16% VAT (Inclusive):</span>
              <strong style="color: #0f172a;">KES ${Number(invoice.tax_kes).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; padding: 6px 0; margin: 6px 0; color: #0f172a;">
              <span>Total Payable:</span>
              <span style="color: #d97706;">KES ${Number(invoice.total_kes).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #059669; font-weight: 600;">
              <span>Amount Paid:</span>
              <span>KES ${Number(invoice.amount_paid_kes).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 900; color: #dc2626; font-size: 13px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
              <span>Balance Due:</span>
              <span>KES ${Number(invoice.balance_due_kes).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <!-- Signatures & Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #475569;">
          <div>
            <div style="margin-bottom: 40px;">Prepared by: <strong>${invoice.created_by_name || 'Store Management'}</strong></div>
            <div style="width: 200px; border-top: 1px solid #94a3b8; padding-top: 4px; text-align: center;">Authorized Signature & Store Stamp</div>
          </div>

          <div>
            <div style="width: 220px; border-top: 1px solid #94a3b8; padding-top: 4px; text-align: center;">
              Customer Received in Good Order
            </div>
          </div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 30px;">
          Goods once sold in good order are subject to the store's return & warranty policy. Thank you for building with us!
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
