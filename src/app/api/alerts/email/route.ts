import { NextRequest, NextResponse } from 'next/server';
import { triggerPusherEvent } from '@/lib/pusher/server';

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
  subject?: string;
  headerLabel?: string;
  fields?: Array<{ label: string; value: string }>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailAlertPayload = await request.json();
    const defaultRecipient = process.env.STORE_OWNER_EMAIL || 'kamenengewa@gmail.com';
    const {
      type = 'system',
      title,
      message,
      recipientEmail = defaultRecipient,
      productName,
      sku,
      currentStock,
      reorderLevel,
      amountKes,
      reference,
      actionUrl = 'https://beckyshardware.co.ke',
      subject,
      headerLabel,
      fields,
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
    const emailSubject =
      typeof subject === 'string' && subject.trim()
        ? subject
        : `[ALERT] ${title} — Becky's Hardware`;
    const headerText =
      typeof headerLabel === 'string' && headerLabel.trim()
        ? headerLabel
        : 'REALTIME STORE ALERT';
    const detailFields = Array.isArray(fields)
      ? fields.filter(
          (field) =>
            field &&
            typeof field.label === 'string' &&
            typeof field.value === 'string'
        )
      : [];

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
                      ${escapeHtml(headerText)}
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
                detailFields.length > 0
                  ? `
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; padding: 16px;">
                ${detailFields
                  .map(
                    (field) => `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #64748b;">${escapeHtml(field.label)}:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${escapeHtml(field.value)}</td>
                </tr>`
                  )
                  .join('')}
              </table>
              `
                  : ''
              }

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

    // Broadcast realtime event via Pusher if configured
    const pusherEvent =
      type === 'system'
        ? 'daily-summary'
        : type === 'inventory'
        ? 'stock-alert'
        : type === 'payment'
        ? 'payment-received'
        : 'store-announcement';

    triggerPusherEvent({
      event: pusherEvent,
      data: {
        type,
        title,
        message,
        productName,
        sku,
        amountKes,
        reference,
        actionUrl,
      },
    }).catch((e) => console.warn('[Alerts] Pusher broadcast skipped:', e?.message));

    // 1. Try Resend if configured
    if (resendApiKey) {
      const fromAddress = process.env.RESEND_FROM_EMAIL || "Becky's Hardware Store <onboarding@resend.dev>";
      const replyToAddress = process.env.RESEND_REPLY_TO || 'eveliaveldrine@gmail.com';

      const resendPayload = {
        from: fromAddress,
        to: [recipientEmail],
        reply_to: replyToAddress,
        subject: emailSubject,
        html: htmlContent,
      };

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(resendPayload),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          success: true,
          provider: 'resend',
          id: data.id,
          recipient: recipientEmail,
          replyTo: replyToAddress,
        });
      }

      const resendErrText = await res.text();
      console.warn('[Alerts] Resend dispatch initial attempt:', resendErrText);

      // Handle Resend trial/sandbox mode: if domain is not yet verified on Resend,
      // Resend restricts delivery exclusively to the account holder's registered email address.
      if (res.status === 403 && resendErrText.includes('You can only send testing emails to your own email address')) {
        const match = resendErrText.match(/\(([^)]+@[^)]+)\)/);
        const sandboxRegisteredEmail = match ? match[1] : 'eveliaveldrine@outlook.com';

        const sandboxNotice = `
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 16px 28px 0; font-size: 12px; line-height: 1.5; color: #92400e;">
            <strong>Resend Testing Mode Notice:</strong> Delivered to your verified Resend account (<code>${sandboxRegisteredEmail}</code>) because delivering directly to <code>${recipientEmail}</code> requires custom domain verification in your Resend Dashboard (<a href="https://resend.com/domains" style="color: #b45309; font-weight: bold;">resend.com/domains</a>). Replies will still route to <code>${replyToAddress}</code>.
          </div>
        `;
        const modifiedHtml = htmlContent.replace('<!-- Alert Body -->', `<!-- Alert Body -->${sandboxNotice}`);

        const retryRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [sandboxRegisteredEmail],
            reply_to: replyToAddress,
            subject: `${emailSubject} [Resend Sandbox -> for ${recipientEmail}]`,
            html: modifiedHtml,
          }),
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          return NextResponse.json({
            success: true,
            provider: 'resend',
            id: retryData.id,
            sandboxRedirect: sandboxRegisteredEmail,
            intendedRecipient: recipientEmail,
            replyTo: replyToAddress,
            message: `Delivered via Resend testing mode to ${sandboxRegisteredEmail} (for ${recipientEmail}). Verify a custom domain at resend.com/domains to deliver straight to ${recipientEmail}.`,
          });
        }
        console.warn('[Alerts] Resend sandbox retry failed:', await retryRes.text());
      }
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
          subject: emailSubject,
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
