export interface ReceiptPrintData {
  storeName: string;
  tagline?: string;
  kraPin?: string;
  address?: string;
  phone?: string;
  receiptNumber: string;
  date: string;
  cashierName: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount?: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: Array<{
    method: string;
    amount: number;
    reference?: string;
  }>;
  footerNotes?: string;
}

export function printThermalReceipt(data: ReceiptPrintData): void {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (!printWindow) {
    alert('Please allow popups to print receipts.');
    return;
  }

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td colspan="3" style="font-weight: bold; padding-top: 4px;">${item.name}</td>
    </tr>
    <tr style="border-bottom: 1px dashed #ddd; font-size: 11px;">
      <td>${item.quantity} ${item.unit} x ${item.unitPrice.toLocaleString('en-KE')}</td>
      <td style="text-align: right;">${item.discount ? `(-${item.discount})` : ''}</td>
      <td style="text-align: right; font-weight: bold;">KES ${item.total.toLocaleString('en-KE')}</td>
    </tr>
  `
    )
    .join('');

  const paymentsHtml = data.payments
    .map(
      (p) => `
    <div style="display: flex; justify-content: space-between; font-size: 11px;">
      <span>${p.method.toUpperCase()} ${p.reference ? `(${p.reference})` : ''}</span>
      <span>KES ${p.amount.toLocaleString('en-KE')}</span>
    </div>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${data.receiptNumber}</title>
        <style>
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            width: 76mm;
            margin: 0 auto;
            padding: 8px 4px;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          .flex-between { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="font-size: 14px; font-weight: bold;">${data.storeName.toUpperCase()}</div>
          ${data.tagline ? `<div style="font-size: 10px;">${data.tagline}</div>` : ''}
          ${data.address ? `<div style="font-size: 11px;">${data.address}</div>` : ''}
          <div style="font-size: 11px;">Tel: ${data.phone || '+254 712 345 678'}</div>
          ${data.kraPin ? `<div style="font-size: 11px; font-weight: bold;">KRA PIN: ${data.kraPin}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div style="font-size: 11px;">
          <div class="flex-between"><span>RECEIPT:</span><span class="bold">${data.receiptNumber}</span></div>
          <div class="flex-between"><span>DATE:</span><span>${data.date}</span></div>
          <div class="flex-between"><span>CASHIER:</span><span>${data.cashierName}</span></div>
          <div class="flex-between"><span>CUSTOMER:</span><span>${data.customerName || 'Walk-In'}</span></div>
        </div>

        <div class="divider"></div>

        <table>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div style="font-size: 11px;">
          <div class="flex-between"><span>Subtotal:</span><span>KES ${data.subtotal.toLocaleString('en-KE')}</span></div>
          ${data.discount > 0 ? `<div class="flex-between"><span>Discount:</span><span>- KES ${data.discount.toLocaleString('en-KE')}</span></div>` : ''}
          <div class="flex-between"><span>16% VAT Incl:</span><span>KES ${data.tax.toLocaleString('en-KE')}</span></div>
          <div class="double-divider"></div>
          <div class="flex-between" style="font-size: 14px; font-weight: bold;">
            <span>TOTAL:</span><span>KES ${data.total.toLocaleString('en-KE')}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 11px; margin-bottom: 6px;">
          <div style="font-weight: bold; margin-bottom: 2px;">PAID VIA:</div>
          ${paymentsHtml}
        </div>

        <div class="divider"></div>

        <div class="text-center" style="font-size: 10px; margin-top: 8px;">
          ${data.footerNotes || 'Goods once sold are returnable within 7 days in good condition with original receipt.'}
          <div style="font-weight: bold; margin-top: 4px;">*** ASANTE KWA BIASHARA YAKO ***</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
