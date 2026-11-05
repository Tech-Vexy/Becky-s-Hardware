import crypto from 'crypto';

interface TriggerPusherEventParams {
  channel?: string;
  event: string;
  data: Record<string, any>;
}

/**
 * Triggers an event on Pusher Channels via the Pusher HTTP REST API.
 * Uses native Node crypto and fetch with zero heavy external dependencies.
 */
export async function triggerPusherEvent({
  channel = 'beckys-hardware-channel',
  event,
  data,
}: TriggerPusherEventParams): Promise<{ success: boolean; error?: string }> {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

  if (!appId || !key || !secret) {
    return { success: false, error: 'Pusher credentials not configured.' };
  }

  const path = `/apps/${appId}/events`;
  const body = JSON.stringify({
    name: event,
    channel,
    data: typeof data === 'string' ? data : JSON.stringify(data),
  });

  const bodyMd5 = crypto.createHash('md5').update(body, 'utf8').digest('hex');
  const authTimestamp = Math.floor(Date.now() / 1000).toString();
  const authVersion = '1.0';

  const queryParams = [
    `auth_key=${encodeURIComponent(key)}`,
    `auth_timestamp=${authTimestamp}`,
    `auth_version=${authVersion}`,
    `body_md5=${bodyMd5}`,
  ].sort().join('&');

  const stringToSign = `POST\n${path}\n${queryParams}`;
  const authSignature = crypto
    .createHmac('sha256', secret)
    .update(stringToSign, 'utf8')
    .digest('hex');

  const url = `https://api-${cluster}.pusher.com${path}?${queryParams}&auth_signature=${authSignature}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    if (res.ok) {
      return { success: true };
    }

    const errText = await res.text();
    console.warn('[Pusher Server] Trigger failed:', errText);
    return { success: false, error: errText };
  } catch (err: any) {
    console.warn('[Pusher Server] Network error triggering event:', err);
    return { success: false, error: err.message || 'Pusher network error' };
  }
}
