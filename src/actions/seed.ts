'use server'

import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import PropertyPrices from '@/db/models/PropertyPrices';
import Booking from '@/db/models/Booking';
import SystemConfig from '@/db/models/SystemConfig';
import BookingConfig from '@/db/models/BookingConfig';
import PriceConfig from '@/db/models/PriceConfig';
import Season from '@/db/models/Season';
import CustomPrice from '@/db/models/CustomPrice';
import { Types } from 'mongoose';

function toPlainObject(doc: any) {
  return JSON.parse(JSON.stringify(doc));
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────

export async function clearAllData() {
  try {
    await dbConnect();
    await Booking.deleteMany({});
    await Property.deleteMany({});
    await PropertyPrices.deleteMany({});
    await SystemConfig.deleteMany({});
    await BookingConfig.deleteMany({});
    await PriceConfig.deleteMany({});
    await Season.deleteMany({});
    await CustomPrice.deleteMany({});
    return { success: true, message: 'Wszystkie dane zostały usunięte' };
  } catch (error) {
    console.error('Błąd podczas czyszczenia danych:', error);
    return { success: false, error: 'Nie udało się usunąć danych' };
  }
}

export async function seedSeasons() {
  try {
    await dbConnect();
    const currentYear = new Date().getFullYear();

    const seasons = [
      {
        name: 'Sezon wysoki (wakacje letnie)',
        description: 'Ceny obowiązują w sezonie letnim – czerwiec, lipiec, sierpień',
        startDate: new Date(currentYear, 5, 1),
        endDate: new Date(currentYear, 7, 31),
        isActive: true,
        order: 3,
      },
      {
        name: 'Sezon świąteczno-noworoczny',
        description: 'Podwyższone ceny w okresie świąt Bożego Narodzenia i Nowego Roku',
        startDate: new Date(currentYear, 11, 20),
        endDate: new Date(currentYear + 1, 0, 5),
        isActive: true,
        order: 1,
      },
      {
        name: 'Sezon wiosenny',
        description: 'Sezon przejściowy wiosna',
        startDate: new Date(currentYear, 2, 1),
        endDate: new Date(currentYear, 4, 31),
        isActive: true,
        order: 2,
      },
    ];

    await Season.deleteMany({});
    const created = await Season.insertMany(seasons);
    return {
      success: true,
      message: `Utworzono ${created.length} sezonów`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania sezonów:', error);
    return { success: false, error: 'Nie udało się utworzyć sezonów' };
  }
}

/**
 * Tworzy domki BEZ cen – ceny żyją teraz w PropertyPrices.
 */
export async function seedProperties() {
  try {
    await dbConnect();

    const properties = [
      {
        name: 'Chatka A (Wilcza)',
        slug: 'chatka-a',
        description: 'Przytulny domek z kominkiem, idealny dla par i małych rodzin.',
        baseCapacity: 6,
        maxExtraBeds: 2,
        images: ['/gallery/wnetrze1.webp', '/gallery/wnetrze2.webp'],
        isActive: true,
        type: 'single',
      },
      {
        name: 'Chatka B (Leśna)',
        slug: 'chatka-b',
        description: 'Domek z widokiem na las, wyposażony w saunę i jacuzzi.',
        baseCapacity: 6,
        maxExtraBeds: 2,
        images: ['/gallery/wnetrze4.webp', '/gallery/wnetrze5.webp'],
        isActive: true,
        type: 'single',
      },
    ];

    await Property.deleteMany({});
    const created = await Property.insertMany(properties);
    return {
      success: true,
      message: `Utworzono ${created.length} domków`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania domków:', error);
    return { success: false, error: 'Nie udało się utworzyć domków' };
  }
}

/**
 * Seeduje kolekcję PropertyPrices.
 * Musi być wywołana PO seedProperties() i seedSeasons().
 */
export async function seedPropertyPrices() {
  try {
    await dbConnect();

    const properties = await Property.find({ type: 'single' }).lean();
    const seasons = await Season.find({}).lean();

    if (properties.length === 0) {
      return { success: false, error: 'Najpierw uruchom seedProperties()' };
    }

    const summerSeason = seasons.find((s: any) =>
      s.name.includes('wakacje')
    );
    const xmasSeason = seasons.find((s: any) =>
      s.name.includes('świąteczno')
    );
    const springSeason = seasons.find((s: any) =>
      s.name.includes('wiosenny')
    );

    const pricesToInsert: any[] = [];

    for (const prop of properties) {
      // ── Ceny podstawowe (poza sezonem) ─────────────────────────────────────
      pricesToInsert.push({
        propertyId: prop._id,
        seasonId: null, // null = poza sezonem
        weekdayPrices: [
          { minGuests: 2, maxGuests: 3, price: 300 },
          { minGuests: 4, maxGuests: 5, price: 400 },
          { minGuests: 6, maxGuests: 10, price: 500 },
        ],
        weekendPrices: [
          { minGuests: 2, maxGuests: 3, price: 400 },
          { minGuests: 4, maxGuests: 5, price: 500 },
          { minGuests: 6, maxGuests: 10, price: 600 },
        ],
        weekdayExtraBedPrice: 50,
        weekendExtraBedPrice: 70,
      });

      // ── Ceny sezon letni ────────────────────────────────────────────────────
      if (summerSeason) {
        pricesToInsert.push({
          propertyId: prop._id,
          seasonId: summerSeason._id,
          weekdayPrices: [
            { minGuests: 2, maxGuests: 3, price: 500 },
            { minGuests: 4, maxGuests: 5, price: 600 },
            { minGuests: 6, maxGuests: 10, price: 700 },
          ],
          weekendPrices: [
            { minGuests: 2, maxGuests: 3, price: 600 },
            { minGuests: 4, maxGuests: 5, price: 700 },
            { minGuests: 6, maxGuests: 10, price: 800 },
          ],
          weekdayExtraBedPrice: 60,
          weekendExtraBedPrice: 80,
        });
      }

      // ── Ceny sezon świąteczny ───────────────────────────────────────────────
      if (xmasSeason) {
        pricesToInsert.push({
          propertyId: prop._id,
          seasonId: xmasSeason._id,
          weekdayPrices: [
            { minGuests: 2, maxGuests: 3, price: 450 },
            { minGuests: 4, maxGuests: 5, price: 550 },
            { minGuests: 6, maxGuests: 10, price: 650 },
          ],
          weekendPrices: [
            { minGuests: 2, maxGuests: 3, price: 550 },
            { minGuests: 4, maxGuests: 5, price: 650 },
            { minGuests: 6, maxGuests: 10, price: 750 },
          ],
          weekdayExtraBedPrice: 55,
          weekendExtraBedPrice: 75,
        });
      }

      // ── Ceny sezon wiosenny ─────────────────────────────────────────────────
      if (springSeason) {
        pricesToInsert.push({
          propertyId: prop._id,
          seasonId: springSeason._id,
          weekdayPrices: [
            { minGuests: 2, maxGuests: 3, price: 320 },
            { minGuests: 4, maxGuests: 5, price: 420 },
            { minGuests: 6, maxGuests: 10, price: 520 },
          ],
          weekendPrices: [
            { minGuests: 2, maxGuests: 3, price: 420 },
            { minGuests: 4, maxGuests: 5, price: 520 },
            { minGuests: 6, maxGuests: 10, price: 620 },
          ],
          weekdayExtraBedPrice: 50,
          weekendExtraBedPrice: 70,
        });
      }
    }

    await PropertyPrices.deleteMany({});
    const created = await PropertyPrices.insertMany(pricesToInsert);

    return {
      success: true,
      message: `Utworzono ${created.length} rekordów cen w PropertyPrices`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania cen:', error);
    return { success: false, error: 'Nie udało się utworzyć cen' };
  }
}

export async function seedPriceConfigDefaults() {
  try {
    await dbConnect();

    const defaultPriceConfig = {
      _id: 'main',
      defaultWeekdayPrices: [
        { minGuests: 2, maxGuests: 3, price: 300 },
        { minGuests: 4, maxGuests: 5, price: 400 },
        { minGuests: 6, maxGuests: 10, price: 500 },
      ],
      defaultWeekendPrices: [
        { minGuests: 2, maxGuests: 3, price: 400 },
        { minGuests: 4, maxGuests: 5, price: 500 },
        { minGuests: 6, maxGuests: 10, price: 600 },
      ],
      defaultWeekdayExtraBedPrice: 50,
      defaultWeekendExtraBedPrice: 70,
      childrenFreeAgeLimit: 13,
    };

    await PriceConfig.deleteMany({});
    const created = await PriceConfig.create(defaultPriceConfig);
    return {
      success: true,
      message: 'Domyślna konfiguracja cen została utworzona',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania konfiguracji cen:', error);
    return { success: false, error: 'Nie udało się utworzyć konfiguracji cen' };
  }
}

export async function seedSystemConfig() {
  try {
    await dbConnect();
    await SystemConfig.deleteMany({});
    const created = await SystemConfig.create({
      _id: 'main',
      autoBlockOtherCabins: true,
      onlyOnePropertyInSearchResult: false
    });
    return {
      success: true,
      message: 'Konfiguracja systemowa została utworzona',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania konfiguracji systemowej:', error);
    return { success: false, error: 'Nie udało się utworzyć konfiguracji systemowej' };
  }
}

export async function seedBookingConfig() {
  try {
    await dbConnect();
    await BookingConfig.deleteMany({});
    const created = await BookingConfig.create({
      _id: 'main',
      minBookingDays: 1,
      maxBookingDays: 30,
      childrenFreeAgeLimit: 13,
      allowCheckinOnDepartureDay: true,
      checkInHour: 15,
      checkOutHour: 12,
    });
    return {
      success: true,
      message: 'Konfiguracja rezerwacji została utworzona',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania konfiguracji rezerwacji:', error);
    return { success: false, error: 'Nie udało się utworzyć konfiguracji rezerwacji' };
  }
}

export async function seedBookings() {
  try {
    await dbConnect();

    const properties = await Property.find({ isActive: true, type: 'single' }).lean();
    if (properties.length < 2) {
      return { success: false, error: 'Najpierw utwórz minimum 2 domki' };
    }

    const today = new Date();

    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + 7);
    nextWeekStart.setHours(14, 0, 0, 0);

    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 4);
    nextWeekEnd.setHours(11, 0, 0, 0);

    const twoWeeksStart = new Date(today);
    twoWeeksStart.setDate(today.getDate() + 21);
    twoWeeksStart.setHours(14, 0, 0, 0);

    const twoWeeksEnd = new Date(twoWeeksStart);
    twoWeeksEnd.setDate(twoWeeksStart.getDate() + 3);
    twoWeeksEnd.setHours(11, 0, 0, 0);

    const bookings = [
      {
        propertyId: new Types.ObjectId(properties[0]._id),
        startDate: nextWeekStart,
        endDate: nextWeekEnd,
        guestName: 'Jan Kowalski',
        guestEmail: 'jan.kowalski@example.com',
        guestPhone: '+48 123 456 789',
        guestAddress: 'ul. Przykładowa 1, 00-001 Warszawa',
        numberOfGuests: 4,
        extraBedsCount: 1,
        totalPrice: 3500,
        paidAmount: 500,
        status: 'confirmed',
        invoice: true,
        invoiceData: {
          companyName: 'Test Sp. z o.o.',
          nip: '1234567890',
          street: 'ul. Faktury 10',
          city: 'Warszawa',
          postalCode: '00-002',
        },
        customerNotes: 'Rezerwacja testowa dla chatki A',
        source: 'customer',
      },
      {
        propertyId: new Types.ObjectId(properties[1]._id),
        startDate: twoWeeksStart,
        endDate: twoWeeksEnd,
        guestName: 'Anna Nowak',
        guestEmail: 'anna.nowak@example.com',
        guestPhone: '+48 987 654 321',
        guestAddress: 'ul. Inna 5, 80-001 Gdańsk',
        numberOfGuests: 2,
        extraBedsCount: 0,
        totalPrice: 1800,
        paidAmount: 1800,
        status: 'confirmed',
        invoice: false,
        customerNotes: 'Prośba o ciszę nocną',
        source: 'customer',
      },
    ];

    await Booking.deleteMany({});
    const created = await Booking.insertMany(bookings);
    return {
      success: true,
      message: `Utworzono ${created.length} rezerwacji`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania rezerwacji:', error);
    return { success: false, error: 'Nie udało się utworzyć rezerwacji' };
  }
}

/**
 * Pełny reset bazy danych.
 * Kolejność ma znaczenie: sezony → domki → ceny (PropertyPrices) → reszta.
 */
export async function seedAllData() {
  try {
    await dbConnect();

    await clearAllData();

    // Kolejność jest ważna – PropertyPrices wymaga ID z Season i Property
    const seasons = await seedSeasons();
    if (!seasons.success) throw new Error(seasons.error);

    const props = await seedProperties();
    if (!props.success) throw new Error(props.error);

    const prices = await seedPropertyPrices(); // ← nowy krok
    if (!prices.success) throw new Error(prices.error);

    const priceConfig = await seedPriceConfigDefaults();
    if (!priceConfig.success) throw new Error(priceConfig.error);

    const system = await seedSystemConfig();
    if (!system.success) throw new Error(system.error);

    const bookingConfig = await seedBookingConfig();
    if (!bookingConfig.success) throw new Error(bookingConfig.error);

    const bookings = await seedBookings();
    if (!bookings.success) throw new Error(bookings.error);

    return {
      success: true,
      message:
        'Wszystkie dane zostały zresetowane. ' +
        `Sezony: ${seasons.data?.length}, Domki: ${props.data?.length}, ` +
        `Rekordy cen: ${prices.data?.length}, Rezerwacje: ${bookings.data?.length}`,
    };
  } catch (error) {
    console.error('Błąd podczas seedowania wszystkich danych:', error);
    return { success: false, error: 'Nie udało się zresetować danych' };
  }
}