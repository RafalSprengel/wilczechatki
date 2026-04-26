"use server";

import dbConnect from "@/db/connection";
import Booking from "@/db/models/Booking";
import Property from "@/db/models/Property";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { BookingData } from "@/types/booking";
import { Types } from "mongoose";
import { generateOrderId } from "@/utils/generateOrderId";
import { sendBookingEmail } from "@/lib/sendEmail";
import BookingConfirmation from '@/emails/BookingConfirmation';
import { render } from '@react-email/render';

export async function createCheckoutSession(bookingData: BookingData) {
  if (!bookingData) throw new Error("Brak danych rezerwacji.");

  const { startDate, endDate, clientData, orders } = bookingData;

  if (
    !startDate ||
    !endDate ||
    !clientData?.firstName ||
    !clientData?.lastName ||
    !clientData?.email ||
    !Array.isArray(orders) ||
    orders.length === 0
  ) {
    throw new Error("Niekompletne dane rezerwacji.");
  }

  //sprawdzamy czy domki o danych id istnieja w bazie
  // robimy petle po orders i sprawdzamy czy kazdy z nich ma propertyId, displayName, price, guests i extraBeds oraz dodajemy do wpis o rezerwacji dla kazdego domku oobno z tymi samymi danymi dotyczacymi rezerwujacego oraz datami, oznaczamy paymentStatus jako unpaid, status: pending. Pozniej jak zrobimy obsługe webhooka to bedziemy zonaczac jako caonfirmad albo jak sie nie uda platnosc nie wiem cancelled
  // ponizej tworzymy sesje checkout dla stripe

  await dbConnect();

  for (const order of orders) {
    if (!order.propertyId || !Types.ObjectId.isValid(order.propertyId)) {
      throw new Error("Nieprawidłowe ID obiektu w zamówieniu.");
    }

    if (!order.displayName || order.displayName.trim().length === 0) {
      throw new Error("Brak nazwy obiektu w zamówieniu.");
    }

    if (!Number.isFinite(order.price) || order.price <= 0) {
      throw new Error("Nieprawidłowa cena w zamówieniu.");
    }

    if (!Number.isInteger(order.guests) || order.guests <= 0) {
      throw new Error("Nieprawidłowa liczba gości w zamówieniu.");
    }

    if (!Number.isInteger(order.extraBeds) || order.extraBeds < 0) {
      throw new Error("Nieprawidłowa liczba dostawek w zamówieniu.");
    }
  }

  const uniquePropertyIds = [...new Set(orders.map((order) => order.propertyId))];

  const existingProperties = await Property.find({
    _id: { $in: uniquePropertyIds.map((id) => new Types.ObjectId(id)) },
    isActive: true,
  })
    .select("_id")
    .lean();

  if (existingProperties.length !== uniquePropertyIds.length) {
    throw new Error("Co najmniej jeden obiekt z zamówienia nie istnieje lub jest nieaktywny.");
  }

  const amount = orders.reduce((sum, item) => sum + item.price, 0);
  const propertyIds = orders.map((order) => order.propertyId).join(",");
  const orderDisplayName = orders.length === 1
    ? orders[0].displayName
    : `${orders.length} obiekty`;
  const totalGuests = orders.reduce((sum, item) => sum + item.guests, 0);
  const totalExtraBeds = orders.reduce((sum, item) => sum + item.extraBeds, 0);

  if (amount <= 0) {
    console.error("Błąd: Nieprawidłowa kwota rezerwacji:", amount);
    throw new Error("Nieprawidłowa kwota rezerwacji. Proszę spróbować ponownie.");
  }

  const headerList = await headers();
  const origin = headerList.get("origin");

  if (!origin) {
    throw new Error("Brak nagłówka origin potrzebnego do utworzenia sesji Stripe.");
  }

  const orderId = await generateOrderId();

  const bookingDocs = orders.map((order) => ({
    propertyId: new Types.ObjectId(order.propertyId),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    guestName: `${clientData.firstName} ${clientData.lastName}`,
    guestEmail: clientData.email,
    guestPhone: clientData.phone,
    guestAddress: clientData.address,
    adults: order.guests,
    children: 0,
    extraBedsCount: order.extraBeds,
    totalPrice: order.price,
    depositAmount: order.price,
    paidAmount: 0,
    orderId,
    paymentStatus: "unpaid" as const,
    status: "pending" as const,
    paymentMethod: "online" as const,
    source: "online" as const,
  }));

  const insertedBookings = await Booking.insertMany(bookingDocs);
  const bookingIds = insertedBookings.map((booking) => booking._id.toString());
  const bookingObjectIds = bookingIds.map((id) => new Types.ObjectId(id));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "blik", "p24"],
      line_items: [
        {
          price_data: {
            currency: "pln",
            product_data: {
              name: `Rezerwacja: ${orderDisplayName}`,
              description: `Pobyt od ${startDate} do ${endDate}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: clientData.email,
      metadata: {
        orderId,
        startDate: startDate,
        endDate: endDate,
        propertyIds,
        guestEmail: clientData.email,
        guests: totalGuests.toString(),
        extraBeds: totalExtraBeds.toString(),
        bookingIds: bookingIds.join(","),
      },
      shipping_address_collection: {
        allowed_countries: [
          'PL', 'DE', 'GB', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH',
          'DK', 'SE', 'NO', 'FI', 'IE', 'PT', 'CZ', 'SK', 'HU', 'LT',
          'LV', 'EE', 'RO', 'BG', 'GR', 'HR', 'SI', 'IS', 'LU'
        ],
      },
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/summary`,
    });

    const updatedBookings = await Booking.updateMany(
      { _id: { $in: bookingObjectIds } },
      {
        $set: {
          stripeSessionId: session.id,
          stripeSessionStatus: session.status === 'open' ? 'open' : 'unknown',
        },
      }
    );

    if (updatedBookings.matchedCount !== bookingObjectIds.length) {
      throw new Error('Nie udało się przypisać identyfikatora sesji Stripe do wszystkich rezerwacji.');
    }

    // Wysyłka maila z potwierdzeniem rezerwacji (React template)
    try {
      const html = await render(
        BookingConfirmation({
          customerName: `${clientData.firstName} ${clientData.lastName}`,
          orderNumber: orderId,
          checkIn: startDate,
          checkOut: endDate,
          totalPrice: amount
        })
      );
      await sendBookingEmail({
        to: clientData.email,
        subject: "Potwierdzenie rezerwacji w Wilcze Chatki",
        html,
      });
    } catch (mailError) {
      console.error("Błąd wysyłki maila potwierdzającego rezerwację:", mailError);
      // Nie przerywamy procesu, tylko logujemy błąd
    }

    return { url: session.url };
  } catch (error) {
    await Booking.deleteMany({ _id: { $in: bookingObjectIds } });
    console.error("Błąd podczas tworzenia sesji checkout:", error);
    throw new Error("Wystąpił błąd podczas inicjowania płatności Stripe.");
  }
}