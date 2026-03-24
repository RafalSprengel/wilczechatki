// src/actions/seed.ts
'use server'
import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
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

export async function clearAllData() {
  try {
    await dbConnect();
    await Booking.deleteMany({});
    await Property.deleteMany({});
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

export async function seedProperties() {
  try {
    await dbConnect();

    const properties = [
      {
        name: 'Chatka A (Wilcza)',
        slug: 'chatka-a',
        description: 'Przytulny domek z kominkiem, idealny dla par i małych rodzin. Na poddaszu znajdują się dwie sypialnie: jedna z łóżkiem małżeńskim, druga z dwoma łóżkami pojedynczymi. Na parterze rozkładana kanapa. Domek wyposażony w klimatyzację, aneks kuchenny, łazienkę oraz taras z grillem.',
        baseCapacity: 6,
        maxExtraBeds: 2,
        images: ['/gallery/wnetrze1.webp', '/gallery/wnetrze2.webp', '/gallery/wnetrze3.webp'],
        isActive: true,
        type: 'single'
      },
      {
        name: 'Chatka B (Leśna)',
        slug: 'chatka-b',
        description: 'Domek z widokiem na las, wyposażony w saunę i jacuzzi. Przestronny taras idealny do wypoczynku. Wnętrze: salon z aneksem kuchennym, łazienka oraz dwie sypialnie na poddaszu. Idealny dla rodzin z dziećmi.',
        baseCapacity: 6,
        maxExtraBeds: 2,
        images: ['/gallery/wnetrze4.webp', '/gallery/wnetrze5.webp', '/gallery/wnetrze6.webp'],
        isActive: true,
        type: 'single'
      },
      {
        name: 'Cała posesja',
        slug: 'cala-posesja',
        description: 'Wynajem całej posesji - oba domki wraz ze strefą relaksu (sauna, jacuzzi, altana biesiadna) i placem zabaw. Idealne rozwiązanie dla większych grup, rodzin z przyjaciółmi lub firmowych wyjazdów. Gwarancja pełnej prywatności.',
        baseCapacity: 12,
        maxExtraBeds: 4,
        images: ['/gallery/zagroda1.webp', '/gallery/zagroda2.webp', '/gallery/zagroda3.webp'],
        isActive: true,
        type: 'whole'
      }
    ];

    await Property.deleteMany({});
    const created = await Property.insertMany(properties);
    const plainProperties = created.map(doc => toPlainObject(doc));

    return {
      success: true,
      message: `Utworzono ${plainProperties.length} domków`,
      data: plainProperties
    };
  } catch (error) {
    console.error('Błąd podczas seedowania domków:', error);
    return { success: false, error: 'Nie udało się utworzyć domków' };
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
        { minGuests: 6, maxGuests: 10, price: 500 }
      ],
      defaultWeekendPrices: [
        { minGuests: 2, maxGuests: 3, price: 400 },
        { minGuests: 4, maxGuests: 5, price: 500 },
        { minGuests: 6, maxGuests: 10, price: 600 }
      ],
      defaultWeekdayExtraBedPrice: 50,
      defaultWeekendExtraBedPrice: 70,
      childrenFreeAgeLimit: 13
    };

    await PriceConfig.deleteMany({});
    const created = await PriceConfig.create(defaultPriceConfig);
    const plainConfig = toPlainObject(created);

    return {
      success: true,
      message: 'Domyślna konfiguracja cen została utworzona',
      data: plainConfig
    };
  } catch (error) {
    console.error('Błąd podczas seedowania domyślnej konfiguracji cen:', error);
    return { success: false, error: 'Nie udało się utworzyć domyślnej konfiguracji cen' };
  }
}

export async function seedSeasons() {
  try {
    await dbConnect();

    const currentYear = new Date().getFullYear();
    
    const seasons = [
      {
        name: 'Sezon niski (poza sezonem letnim)',
        description: 'Ceny obowiązujące poza sezonem letnim - idealne dla szukających spokoju i niższych cen',
        startDate: new Date(currentYear, 8, 1),  // 1 września bieżącego roku
        endDate: new Date(currentYear + 1, 5, 31), // 31 maja następnego roku
        isActive: true,
        weekdayPrices: [
          { minGuests: 2, maxGuests: 3, price: 300 },
          { minGuests: 4, maxGuests: 5, price: 400 },
          { minGuests: 6, maxGuests: 10, price: 500 }
        ],
        weekendPrices: [
          { minGuests: 2, maxGuests: 3, price: 400 },
          { minGuests: 4, maxGuests: 5, price: 500 },
          { minGuests: 6, maxGuests: 10, price: 600 }
        ],
        weekdayExtraBedPrice: 50,
        weekendExtraBedPrice: 70
      },
      {
        name: 'Sezon wysoki (wakacje letnie)',
        description: 'Ceny obowiązujące w sezonie letnim - czerwiec, lipiec, sierpień',
        startDate: new Date(currentYear, 5, 1),   // 1 czerwca bieżącego roku
        endDate: new Date(currentYear, 7, 31),    // 31 sierpnia bieżącego roku
        isActive: true,
        weekdayPrices: [
          { minGuests: 2, maxGuests: 3, price: 500 },
          { minGuests: 4, maxGuests: 5, price: 600 },
          { minGuests: 6, maxGuests: 10, price: 700 }
        ],
        weekendPrices: [
          { minGuests: 2, maxGuests: 3, price: 600 },
          { minGuests: 4, maxGuests: 5, price: 700 },
          { minGuests: 6, maxGuests: 10, price: 800 }
        ],
        weekdayExtraBedPrice: 60,
        weekendExtraBedPrice: 80
      },
      {
        name: 'Sezon świąteczno-noworoczny',
        description: 'Podwyższone ceny w okresie świąt Bożego Narodzenia i Nowego Roku',
        startDate: new Date(currentYear, 11, 20),  // 20 grudnia bieżącego roku
        endDate: new Date(currentYear + 1, 0, 5),  // 5 stycznia następnego roku
        isActive: true,
        weekdayPrices: [
          { minGuests: 2, maxGuests: 3, price: 450 },
          { minGuests: 4, maxGuests: 5, price: 550 },
          { minGuests: 6, maxGuests: 10, price: 650 }
        ],
        weekendPrices: [
          { minGuests: 2, maxGuests: 3, price: 550 },
          { minGuests: 4, maxGuests: 5, price: 650 },
          { minGuests: 6, maxGuests: 10, price: 750 }
        ],
        weekdayExtraBedPrice: 55,
        weekendExtraBedPrice: 75
      }
    ];

    await Season.deleteMany({});
    const created = await Season.insertMany(seasons);
    const plainSeasons = created.map(doc => toPlainObject(doc));

    return {
      success: true,
      message: `Utworzono ${plainSeasons.length} sezonów`,
      data: plainSeasons
    };
  } catch (error) {
    console.error('Błąd podczas seedowania sezonów:', error);
    return { success: false, error: 'Nie udało się utworzyć sezonów' };
  }
}

export async function seedSystemConfig() {
  try {
    await dbConnect();

    const systemConfig = {
      _id: 'main',
      autoBlockOtherCabins: true
    };

    await SystemConfig.deleteMany({});
    const created = await SystemConfig.create(systemConfig);
    const plainConfig = toPlainObject(created);

    return {
      success: true,
      message: 'Konfiguracja systemowa została utworzona',
      data: plainConfig
    };
  } catch (error) {
    console.error('Błąd podczas seedowania konfiguracji systemowej:', error);
    return { success: false, error: 'Nie udało się utworzyć konfiguracji systemowej' };
  }
}

export async function seedBookingConfig() {
  try {
    await dbConnect();

    const bookingConfig = {
      _id: 'main',
      minBookingDays: 1,
      maxBookingDays: 30,
      childrenFreeAgeLimit: 13,
      allowCheckinOnDepartureDay: true,
      checkInHour: 15,
      checkOutHour: 12
    };

    await BookingConfig.deleteMany({});
    const created = await BookingConfig.create(bookingConfig);
    const plainConfig = toPlainObject(created);

    return {
      success: true,
      message: 'Konfiguracja rezerwacji została utworzona',
      data: plainConfig
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
          postalCode: '00-002'
        },
        customerNotes: 'Rezerwacja testowa dla chatki A',
        source: 'customer'
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
        source: 'customer'
      }
    ];

    await Booking.deleteMany({});
    const created = await Booking.insertMany(bookings);
    const plainBookings = created.map(doc => toPlainObject(doc));

    return {
      success: true,
      message: `Utworzono ${plainBookings.length} rezerwacji`,
      data: plainBookings
    };
  } catch (error) {
    console.error('Błąd podczas seedowania rezerwacji:', error);
    return { success: false, error: 'Nie udało się utworzyć rezerwacji' };
  }
}

export async function seedAllData() {
  try {
    await dbConnect();

    await clearAllData();

    const properties = await seedProperties();
    if (!properties.success) throw new Error(properties.error);

    const priceConfig = await seedPriceConfigDefaults();
    if (!priceConfig.success) throw new Error(priceConfig.error);

    const seasons = await seedSeasons();
    if (!seasons.success) throw new Error(seasons.error);

    const system = await seedSystemConfig();
    if (!system.success) throw new Error(system.error);

    const bookingConfig = await seedBookingConfig();
    if (!bookingConfig.success) throw new Error(bookingConfig.error);

    const bookings = await seedBookings();
    if (!bookings.success) throw new Error(bookings.error);

    return {
      success: true,
      message: 'Wszystkie dane zostały zresetowane do stanu początkowego z sezonami'
    };
  } catch (error) {
    console.error('Błąd podczas seedowania wszystkich danych:', error);
    return { success: false, error: 'Nie udało się zresetować danych' };
  }
}