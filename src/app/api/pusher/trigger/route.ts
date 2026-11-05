import { NextRequest, NextResponse } from 'next/server';
import { triggerPusherEvent } from '@/lib/pusher/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, channel, data } = body;

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Missing event or data payload.' },
        { status: 400 }
      );
    }

    const result = await triggerPusherEvent({
      channel: channel || 'beckys-hardware-channel',
      event,
      data,
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: result.error || 'Failed to broadcast via Pusher' },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Pusher trigger handler error' },
      { status: 500 }
    );
  }
}
