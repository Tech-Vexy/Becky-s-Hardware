import { NextRequest, NextResponse } from 'next/server';

interface EmailAlertPayload {
  type: 'inventory' | 'payment' | 'sale' | 'system';
  title: string;
  message: string;
  recipientEmail?: string;
  productName?: string;
  sku?: string;
  currentStock?: number | string;
  reorderLevel?: number | string;
  amountKes?: number;
  reference?: string;
  actionUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailAlertPayload = await request.json();
    const {
      type = 'system',
      title,
      message,
      recipientEmail = 'kamenengewa@gmail.com',
      productName,
      sku,
      currentStock,
      reorderLevel,
      amountKes,
      reference,
      actionUrl = 'https://beckyshardware.co.ke',
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing title or message in alert payload.' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const storeName = "Becky's Hardware Store";
    const timestamp = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

    // Build responsive HTML email template
    const badgeColor =
      type === 'inventory' ? '#dc2626' : type === 'payment' ? '#16a34a' : '#d97706';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 28px; border-bottom: 3px solid #d97706;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: #f59e0b; text-transform: uppercase;">
                      REALTIME STORE ALERT
                    </span>
                    <h1 style="margin: 4px 0 0; font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em;">
                      ${storeName}
                    </h1>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; background: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase;">
                      ${type}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Body -->
          <tr>
            <td style="padding: 28px;">
              <h2 style="margin: 0 0 12px; font-size: 17px; font-weight: 800; color: #0f172a;">
                ${title}
              </h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                ${message}
              </p>

              <!-- Specific detail card -->
              ${
                productName
                  ? `
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; padding: 16px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Product Name:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${productName}</td>
                </tr>
                ${sku ? `<tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">SKU:</td><td style="padding: 6px 0; font-size: 13px; font-weight: 700; font-family: monospace; color: #0f172a; text-align: right;">${sku}</td></tr>` : ''}
                ${currentStock !== undefined ? `<tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Current Stock On Hand:</td><td style="padding: 6px 0; font-size: 13px; font-weight: 800; color: #dc2626; text-align: right;">${currentStock}</td></tr>` : ''}
                ${reorderLevel !== undefined ? `<tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Reorder Level:</td><td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${reorderLevel}</td></tr>` : ''}
              </table>
              `
                  : ''
              }

              ${
                amountKes !== undefined
                  ? `
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; padding: 16px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Amount:</td>
                  <td style="padding: 6px 0; font-size: 15px; font-weight: 900; color: #0f172a; text-align: right;">KES ${Number(amountKes).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                </tr>
                ${reference ? `<tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Transaction Code:</td><td style="padding: 6px 0; font-size: 13px; font-weight: 700; font-family: monospace; color: #0f172a; text-align: right;">${reference}</td></tr>` : ''}
              </table>
              `
                  : ''
              }

              <!-- CTA Button -->
              <table role="presentation" width="100%" style="margin-top: 12px;">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.25);">
                      Open Becky's Hardware Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 18px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5; text-align: center;">
              This is an automated notification from <strong>Becky's Hardware Store</strong>.<br>
              Store PIN: P051234567X &bull; Contact: +254 712 345 678 &bull; Dispatched at: ${timestamp}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // 1. Try Resend if configured
    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Becky's Hardware <alerts@beckyshardware.co.ke>",
          to: [recipientEmail],
          subject: `[ALERT] ${title} — Becky's Hardware`,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ success: true, provider: 'resend', id: data.id });
      }
      console.warn('[Alerts] Resend dispatch failed:', await res.text());
    }

    // 2. Try SendGrid if configured
    if (sendgridApiKey) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sendgridApiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipientEmail }] }],
          from: { email: 'alerts@beckyshardware.co.ke', name: "Becky's Hardware" },
          subject: `[ALERT] ${title} — Becky's Hardware`,
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      });

      if (res.ok) {
        return NextResponse.json({ success: true, provider: 'sendgrid' });
      }
    }

    // 3. Fallback: Log alert to server trace for auditing
    console.log(`[REALTIME ALERT EMAIL DISPATCH] To: ${recipientEmail} | Subject: ${title} | ${message}`);
    return NextResponse.json({
      success: true,
      logged: true,
      recipient: recipientEmail,
      message: 'Alert logged. To deliver to inbox, add RESEND_API_KEY in Vercel environment variables.',
    });
  } catch (err: any) {
    console.error('[Alerts] Error processing email alert:', err);
    return NextResponse.json({ error: err.message || 'Failed to dispatch email alert.' }, { status: 500 });
  }
}
