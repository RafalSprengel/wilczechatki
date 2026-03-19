'use server'
import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import Booking from '@/db/models/Booking';
import PriceConfig from '@/db/models/PriceConfig';
import SystemConfig from '@/db/models/SystemConfig';
import BookingConfig from '@/db/models/BookingConfig';
import { Types } from 'mongoose';

function toPlainObject(doc: any) {
  return JSON.parse(JSON.stringify(doc));
}

export async function clearAllData() {
  try {
    await dbConnect();
    await Booking.deleteMany({});
    await Property.deleteMany({});
    await PriceConfig.deleteMany({});
    await SystemConfig.deleteMany({});
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
        description: 'Przytulny domek z kominkiem, idealny dla par i małych rodzin.',
        baseCapacity: 6,
        maxExtraBeds: 2,
        images: ['/images/chatka-a-1.jpg'],
        isActive: true,
        type: 'single'
      },
      {
        name: 'Chatka B (Leśna)',
        slug: 'chatka-b',
        description: 'Domek z widokiem na las, wyposażony w saunę i jacuzzi.',
        baseCapacity: 6,
        maxExtraBeds: 2,
        images: ['/images/chatka-b-1.jpg'],
        isActive: true,
        type: 'single'
      },
      {
        name: 'Cała posesja',
        slug: 'cala-posesja',
        description: 'Cała posesja do dyspozycji',
        baseCapacity: 12,
        maxExtraBeds: 4,
        images: ['/images/cala-posesja.jpg'],
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

export async function seedPriceConfig() {
  try {
    await dbConnect();

    const priceConfig = {
      _id: 'main',
      baseRates: {
        weekday: [
          { minGuests: 1, maxGuests: 3, price: 300 },
          { minGuests: 4, maxGuests: 5, price: 400 },
          { minGuests: 6, maxGuests: 8, price: 500 }
        ],
        weekend: [
          { minGuests: 1, maxGuests: 3, price: 400 },
          { minGuests: 4, maxGuests: 5, price: 500 },
          { minGuests: 6, maxGuests: 8, price: 600 }
        ],
        extraBedPrice: 50,
        childrenFreeAgeLimit: 13
      },
      seasons: []
    };

    await PriceConfig.deleteMany({});
    const created = await PriceConfig.create(priceConfig);
    const plainConfig = toPlainObject(created);

    return {
      success: true,
      message: 'Konfiguracja cen została utworzona',
      data: plainConfig
    };
  } catch (error) {
    console.error('Błąd podczas seedowania cen:', error);
    return { success: false, error: 'Nie udało się utworzyć konfiguracji cen' };
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
    console.error('Błąd podczas seedowania konfiguracji:', error);
    return { success: false, error: 'Nie udało się utworzyć konfiguracji systemowej' };
  }
}

export async function seedBookings() {
  try {
    await dbConnect();

    const properties = await Property.find({ isActive: true }).lean();

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
        guestEmail: 'jan@example.com',
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
        customerNotes: 'Przykładowa rezerwacja',
        source: 'customer'
      },
      {
        propertyId: new Types.ObjectId(properties[1]._id),
        startDate: twoWeeksStart,
        endDate: twoWeeksEnd,
        guestName: 'Anna Nowak',
        guestEmail: 'anna@example.com',
        guestPhone: '+48 987 654 321',
        guestAddress: 'ul. Inna 5, 80-001 Gdańsk',
        numberOfGuests: 2,
        extraBedsCount: 0,
        totalPrice: 1800,
        paidAmount: 1800,
        status: 'confirmed',
        invoice: false,
        customerNotes: '',
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
export async function seedBookingConfig() {
  try {
    await dbConnect();

    const bookingConfig = {
      _id: 'main',
      minBookingDays: 1,
      maxBookingDays: 30,
      highSeasonStart: new Date(new Date().getFullYear(), 5, 1), // 1 czerwca
      highSeasonEnd: new Date(new Date().getFullYear(), 7, 31), // 31 sierpnia
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

export async function seedAllData() {
  try {
    await dbConnect();

    await clearAllData();

    const properties = await seedProperties();
    if (!properties.success) throw new Error(properties.error);

    const prices = await seedPriceConfig();
    if (!prices.success) throw new Error(prices.error);

    const system = await seedSystemConfig();
    if (!system.success) throw new Error(system.error);

    const bookingConfig = await seedBookingConfig(); // NOWE
    if (!bookingConfig.success) throw new Error(bookingConfig.error);

    const bookings = await seedBookings();

    return {
      success: true,
      message: 'Wszystkie dane zostały zresetowane do stanu początkowego'
    };
  } catch (error) {
    console.error('Błąd podczas seedowania wszystkich danych:', error);
    return { success: false, error: 'Nie udało się zresetować danych' };
  }
}