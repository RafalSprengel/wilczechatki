"use server";

import { Types } from "mongoose";
import { headers } from "next/headers";
import dbConnect from "@/db/connection";
import Booking from "@/db/models/Booking";
import BookingConfig from "@/db/models/BookingConfig";
import Property from "@/db/models/Property";
import { stripe } from "@/lib/stripe";
import type { BookingData } from "@/types/booking";
import { generateOrderId } from "@/utils/generateOrderId";
import { formatDisplayDate } from "@/utils/formatDate";
import { calculateTotalPrice } from "@/actions/searchActions";
import { buildBookingOverlapFilter } from "@/utils/bookingOverlap";
import { resolveOccupiedPropertyIdsFromBookings } from "@/utils/lazyAvailabilityCleanup";

export async function createCheckoutSession(bookingData: BookingData) {
  if (!bookingData) throw new Error("Brak danych rezerwacji.");

  const { startDate, endDate, adults, children, clientData, orders } = bookingData;

  if (
    !startDate ||
    !endDate ||
    !Number.isInteger(adults) ||
    adults < 1 ||
    !Number.isInteger(children) ||
    children < 0 ||
    !clientData?.firstName ||
    !clientData?.lastName ||
    !clientData?.email ||
    !Array.isArray(orders) ||
    orders.length === 0
  ) {
    throw new Error("Niekompletne dane rezerwacji.");
  }

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

    if (!Number.isInteger(order.adults) || order.adults < 1) {
      throw new Error("Nieprawidłowa liczba płatnych gości w zamówieniu.");
    }

    if (!Number.isInteger(order.children) || order.children < 0) {
      throw new Error("Nieprawidłowa liczba dzieci w zamówieniu.");
    }

    if (order.adults + order.children !== order.guests) {
      throw new Error("Niespójne dane gości w zamówieniu.");
    }

    if (!Number.isInteger(order.extraBeds) || order.extraBeds < 0) {
      throw new Error("Nieprawidłowa liczba dostawek w zamówieniu.");
    }
  }

  const bookingConfig = await BookingConfig.findById("main").lean();
  const allowCheckinOnDepartureDay = bookingConfig?.allowCheckinOnDepartureDay ?? true;
  const overlapFilter = buildBookingOverlapFilter(new Date(startDate), new Date(endDate), allowCheckinOnDepartureDay);

  const overlappingBookings = await Booking.find({
    $or: [{ status: "blocked" }, { status: "confirmed" }, { status: "pending" }],
    ...overlapFilter,
  })
    .select("_id propertyId status createdAt stripeSessionId source adminNotes")
    .lean();

  const { occupiedPropertyIds } = await resolveOccupiedPropertyIdsFromBookings(overlappingBookings);

  const verifiedOrders: Array<{ propertyId: string; displayName: string; adults: number; children: number; extraBeds: number; guests: number; price: number }> = [];
  let totalAdults = 0;
  let totalChildren = 0;

  for (const order of orders) {
    if (occupiedPropertyIds.has(order.propertyId)) {
      throw new Error(`Obiekt "${order.displayName}" jest niedostępny w wybranym terminie.`);
    }

    const property = await Property.findOne({ _id: order.propertyId, isActive: true })
      .select("_id maxAdults maxExtraBeds maxChildren")
      .lean();

    if (!property) {
      throw new Error(`Obiekt "${order.displayName}" nie istnieje lub jest nieaktywny.`);
    }

    if (order.adults > property.maxAdults) {
      throw new Error(`Liczba dorosłych (${order.adults}) przekracza pojemność obiektu "${order.displayName}" (max ${property.maxAdults}).`);
    }

    if (order.extraBeds > property.maxExtraBeds) {
      throw new Error(`Liczba dostawek (${order.extraBeds}) przekracza pojemność obiektu "${order.displayName}" (max ${property.maxExtraBeds}).`);
    }

    const recalculatedPrice = await calculateTotalPrice({
      startDate,
      endDate,
      baseGuests: order.adults,
      extraBeds: order.extraBeds,
      propertySelection: order.propertyId,
    });

    if (recalculatedPrice <= 0) {
      throw new Error(`Nie udało się wyliczyć ceny dla obiektu "${order.displayName}".`);
    }

    totalAdults += order.adults;
    totalChildren += order.children;

    verifiedOrders.push({ ...order, price: recalculatedPrice });
  }

  if (totalAdults !== adults || totalChildren !== children) {
    throw new Error("Niespójne dane liczby dorosłych i dzieci w rezerwacji.");
  }

  const amount = verifiedOrders.reduce((sum, item) => sum + item.price, 0);

  const propertyIds = verifiedOrders.map((order) => order.propertyId).join(",");
  const orderDisplayName = verifiedOrders.length === 1
    ? verifiedOrders[0].displayName
    : `${verifiedOrders.length} obiekty`;
  const totalGuests = verifiedOrders.reduce((sum, item) => sum + item.guests, 0);
  const totalExtraBeds = verifiedOrders.reduce((sum, item) => sum + item.extraBeds, 0);

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

  const bookingDocs = verifiedOrders.map((order) => ({
    propertyId: new Types.ObjectId(order.propertyId),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    firstName: clientData.firstName,
    lastName: clientData.lastName,
    guestEmail: clientData.email,
    guestPhone: clientData.phone,
    guestAddress: clientData.address,
    adults: order.adults,
    children: order.children,
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
              description: `Pobyt od ${formatDisplayDate(startDate)} do ${formatDisplayDate(endDate)}`,
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
        adults: adults.toString(),
        children: children.toString(),
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



    return { url: session.url };
  } catch (error) {
    await Booking.deleteMany({ _id: { $in: bookingObjectIds } });
    console.error("Błąd podczas tworzenia sesji checkout:", error);
    throw new Error("Wystąpił błąd podczas inicjowania płatności Stripe.");
  }
}
