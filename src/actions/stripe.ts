"use server";

import dbConnect from "@/db/connection";
import Booking from "@/db/models/Booking";
import Property from "@/db/models/Property";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { BookingData } from "@/types/booking";
import { Types } from "mongoose";

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
    paymentStatus: "unpaid" as const,
    status: "pending" as const,
    paymentMethod: "online" as const,
    source: "online" as const,
  }));

  const insertedBookings = await Booking.insertMany(bookingDocs);
  const bookingIds = insertedBookings.map((booking) => booking._id.toString());

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
        startDate: startDate,
        endDate: endDate,
        propertyIds,
        guestEmail: clientData.email,
        guests: totalGuests.toString(),
        extraBeds: totalExtraBeds.toString(),
        bookingIds: bookingIds.join(","),
      },
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/summary`,
    });

    return { url: session.url };
  } catch (error) {
    await Booking.deleteMany({ _id: { $in: bookingIds.map((id) => new Types.ObjectId(id)) } });
    console.error("Błąd podczas tworzenia sesji checkout:", error);
    throw new Error("Wystąpił błąd podczas inicjowania płatności Stripe.");
  }
}