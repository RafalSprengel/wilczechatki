"use server";

import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

export async function createCheckoutSession(reservationId: string, amount: number) {
  amount = 39;
  reservationId = "test123";
  const headerList = await headers();
  const origin = headerList.get("origin");

  try {

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "pln",
            product_data: {
              name: "Reservation in Wilcze Chatki",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        reservationId: reservationId,
      },
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Błąd podczas tworzenia sesji checkout:', error);
    throw new Error("Failed to create Stripe session");
  }
}