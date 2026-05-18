import { Types } from "mongoose";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import dbConnect from "@/db/connection";
import Booking from "@/db/models/Booking";
import BookingConfirmationToClient from "@/emails/BookingConfirmationToClient";
import BookingConfirmationToAdmin from "@/emails/BookingConfirmationToAdmin";
import BookingFailure from "@/emails/BookingFailure";
import { sendBookingEmail } from "@/lib/sendEmail";
import { stripe } from "@/lib/stripe";
import { getSiteSettings } from "@/actions/siteSettingsActions";

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
  console.log("[WEBHOOK] Otrzymano webhook Stripe");
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.log("[WEBHOOK] Brak nagłówka stripe-signature");
    return NextResponse.json({ error: "Brak naglowka stripe-signature." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.log("[WEBHOOK] Brak STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Brak STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const payload = await request.text();
  console.log("[WEBHOOK] Payload:", payload.slice(0, 200));
  console.log("[WEBHOOK] Signature:", signature);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    console.log("[WEBHOOK] Event type:", event.type);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany blad weryfikacji webhooka.";
    console.error("[WEBHOOK] Błąd weryfikacji webhooka:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const handledEvents = [
    "checkout.session.completed",
    "checkout.session.expired",
    "checkout.session.async_payment_failed",
  ] as const;

  if (!handledEvents.includes(event.type as (typeof handledEvents)[number])) {
    console.log("[WEBHOOK] Nieobsługiwany typ eventu:", event.type);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  console.log("[WEBHOOK] Session id:", session.id);

  try {
    await dbConnect();
    console.log("[WEBHOOK] Połączono z bazą danych");

    const objectIds = await getBookingObjectIdsFromSession(session);
    console.log("[WEBHOOK] Booking objectIds:", objectIds);

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
      console.log("[WEBHOOK] Wynik updateMany (confirmed):", updateResult);

      if (updateResult.matchedCount !== objectIds.length) {
        console.log("[WEBHOOK] Nie znaleziono wszystkich rezerwacji do potwierdzenia platnosci");
        return NextResponse.json(
          { error: "Nie znaleziono wszystkich rezerwacji do potwierdzenia platnosci." },
          { status: 404 }
        );
      }

      const booking = await Booking.findOne({ _id: objectIds[0] });
      console.log("[WEBHOOK] Booking do maila (confirmed):", booking);

      if (booking) {
        try {
          const siteSettings = await getSiteSettings();
          const customerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
          console.log("[WEBHOOK] Wysyłam maila potwierdzającego rezerwację do:", booking.guestEmail, booking.orderId);
          await sendBookingEmail({
            to: booking.guestEmail,
            subject: "Potwierdzenie rezerwacji w Wilcze Chatki",
            react: BookingConfirmationToClient({
              customerName,
              orderNumber: booking.orderId ?? '',
              checkIn: booking.startDate.toISOString().split('T')[0],
              checkOut: booking.endDate.toISOString().split('T')[0],
              totalPrice: booking.totalPrice,
              siteSettings,
            }),
          });
          console.log("[WEBHOOK] Mail do klienta wysłany");

          console.log("[WEBHOOK] Wysyłam maila o nowej rezerwacji do admina:", siteSettings.email);
          if (siteSettings.email) {
            await sendBookingEmail({
              to: siteSettings.email,
              subject: `Nowa rezerwacja: ${customerName} (${booking.orderId})`,
              react: BookingConfirmationToAdmin({
                customerName,
                orderNumber: booking.orderId ?? '',
                checkIn: booking.startDate.toISOString().split('T')[0],
                checkOut: booking.endDate.toISOString().split('T')[0],
                totalPrice: booking.totalPrice,
                siteSettings,
              }),
            });
            console.log("[WEBHOOK] Mail do admina wysłany");
          } else {
            console.warn("[WEBHOOK] Brak adresu email admina – mail do admina nie został wysłany.");
          }
        } catch (mailError) {
          console.error("Błąd wysyłki maila potwierdzającego rezerwację:", mailError);
        }
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
    console.log("[WEBHOOK] Wynik updateMany (failed):", cancelResult);

    if (cancelResult.matchedCount !== objectIds.length) {
      console.log("[WEBHOOK] Nie znaleziono wszystkich rezerwacji do oznaczenia jako nieudane po nieudanej platnosci");
      return NextResponse.json(
        { error: "Nie znaleziono wszystkich rezerwacji do oznaczenia jako nieudane po nieudanej platnosci." },
        { status: 404 }
      );
    }

    const failedBooking = await Booking.findOne({ _id: objectIds[0] });
    console.log("[WEBHOOK] Booking do maila (failed):", failedBooking);

    if (failedBooking) {
      try {
        console.log("[WEBHOOK] Wysyłam maila o nieudanej płatności do:", failedBooking.guestEmail, failedBooking.orderId);
        const siteSettings = await getSiteSettings();
        await sendBookingEmail({
          to: failedBooking.guestEmail,
          subject: "Nieudana płatność za rezerwację w Wilcze Chatki",
          react: BookingFailure({
              customerName: `${failedBooking.firstName || ''} ${failedBooking.lastName || ''}`.trim(),
              orderNumber: failedBooking.orderId ?? '',
              checkIn: failedBooking.startDate.toISOString().split('T')[0],
              checkOut: failedBooking.endDate.toISOString().split('T')[0],
              siteSettings,
            }),
        });
        console.log("[WEBHOOK] Mail o nieudanej płatności wysłany");
      } catch (mailError) {
        console.error("Błąd wysyłki maila o nieudanej płatności:", mailError);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Blad podczas aktualizacji rezerwacji.";
    console.error("[WEBHOOK] Błąd ogólny:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
