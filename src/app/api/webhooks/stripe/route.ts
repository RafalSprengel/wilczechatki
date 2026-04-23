import dbConnect from "@/db/connection";
import Booking from "@/db/models/Booking";
import { stripe } from "@/lib/stripe";
import { Types } from "mongoose";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function getBookingObjectIdsFromSession(session: Stripe.Checkout.Session) {
  const bookingIdsMetadata = session.metadata?.bookingIds;

  if (!bookingIdsMetadata) {
    throw new Error("Brak bookingIds w metadata sesji Stripe.");
  }

  const bookingIds = bookingIdsMetadata
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (bookingIds.length === 0) {
    throw new Error("Niepoprawne bookingIds w metadata sesji Stripe.");
  }

  const invalidBookingId = bookingIds.find((id) => !Types.ObjectId.isValid(id));

  if (invalidBookingId) {
    throw new Error("Niepoprawne ID rezerwacji w metadata sesji Stripe.");
  }

  return bookingIds.map((id) => new Types.ObjectId(id));
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Brak naglowka stripe-signature." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Brak STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany blad weryfikacji webhooka.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const handledEvents = [
    "checkout.session.completed",
    "checkout.session.expired",
    "checkout.session.async_payment_failed",
  ] as const;

  if (!handledEvents.includes(event.type as (typeof handledEvents)[number])) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    await dbConnect();

    const objectIds = await getBookingObjectIdsFromSession(session);

    if (event.type === "checkout.session.completed") {
      const updateResult = await Booking.updateMany(
        {
          _id: { $in: objectIds },
          source: "online",
        },
        {
          $set: {
            status: "confirmed",
            paymentStatus: "paid",
            stripeSessionId: session.id,
          },
        }
      );

      if (updateResult.matchedCount !== objectIds.length) {
        return NextResponse.json(
          { error: "Nie znaleziono wszystkich rezerwacji do potwierdzenia platnosci." },
          { status: 404 }
        );
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    const cancelResult = await Booking.updateMany(
      {
        _id: { $in: objectIds },
        source: "online",
        paymentStatus: "unpaid",
      },
      {
        $set: {
          status: "failed",
          stripeSessionId: session.id,
        },
      }
    );

    if (cancelResult.matchedCount !== objectIds.length) {
      return NextResponse.json(
        { error: "Nie znaleziono wszystkich rezerwacji do oznaczenia jako nieudane po nieudanej platnosci." },
        { status: 404 }
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Blad podczas aktualizacji rezerwacji.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
