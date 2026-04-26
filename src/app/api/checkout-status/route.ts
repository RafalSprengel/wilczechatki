import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Brak parametru session_id.' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json(
      {
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udalo sie pobrac statusu sesji Stripe.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
