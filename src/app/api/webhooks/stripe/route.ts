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
  console.log("[stripe-webhook] Incoming request");
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("[stripe-webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Brak naglowka stripe-signature." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET env var");
    return NextResponse.json({ error: "Brak STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    console.log("[stripe-webhook] Event verified", { eventId: event.id, eventType: event.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany blad weryfikacji webhooka.";
    console.error("[stripe-webhook] Signature verification failed", { message });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const handledEvents = [
    "checkout.session.completed",
    "checkout.session.expired",
    "checkout.session.async_payment_failed",
  ] as const;

  if (!handledEvents.includes(event.type as (typeof handledEvents)[number])) {
    console.log("[stripe-webhook] Ignored event type", { eventType: event.type });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  console.log("[stripe-webhook] Processing session", {
    eventType: event.type,
    sessionId: session.id,
    paymentStatus: session.payment_status,
    metadata: session.metadata,
  });

  try {
    await dbConnect();
    console.log("[stripe-webhook] DB connected");

    const objectIds = await getBookingObjectIdsFromSession(session);
    console.log("[stripe-webhook] Parsed bookingIds", {
      bookingIds: objectIds.map((id) => id.toString()),
    });

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
          },
        }
      );

      console.log("[stripe-webhook] Completed update result", {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
      });

      if (updateResult.matchedCount !== objectIds.length) {
        const foundBookings = await Booking.find({ _id: { $in: objectIds } })
          .select("_id source status paymentStatus")
          .lean();
        console.error("[stripe-webhook] Not all bookings matched for completion", {
          expected: objectIds.length,
          foundCount: foundBookings.length,
          foundBookings,
        });
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
          status: "cancelled",
        },
      }
    );

    console.log("[stripe-webhook] Failed/expired update result", {
      matchedCount: cancelResult.matchedCount,
      modifiedCount: cancelResult.modifiedCount,
    });

    if (cancelResult.matchedCount !== objectIds.length) {
      const foundBookings = await Booking.find({ _id: { $in: objectIds } })
        .select("_id source status paymentStatus")
        .lean();
      console.error("[stripe-webhook] Not all bookings matched for cancellation", {
        expected: objectIds.length,
        foundCount: foundBookings.length,
        foundBookings,
      });
      return NextResponse.json(
        { error: "Nie znaleziono wszystkich rezerwacji do anulowania po nieudanej platnosci." },
        { status: 404 }
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Blad podczas aktualizacji rezerwacji.";
    console.error("[stripe-webhook] Processing failed", { message, eventType: event.type, eventId: event.id });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
