'use server'
import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import Booking from '@/db/models/Booking';
import PriceConfig from '@/db/models/PriceConfig';
import SystemConfig from '@/db/models/SystemConfig';

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
        isActive: true
      },
      {
        name: 'Chatka B (Leśna)',
        slug: 'chatka-b',
        description: 'Domek z widokiem na las, wyposażony w saunę i jacuzzi.',
        baseCapacity: 6,
        maxExtraBeds: 2,
        images: ['/images/chatka-b-1.jpg'],
        isActive: true
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
      autoBlockOtherCabins: true,
      highSeasonStart: new Date(new Date().getFullYear(), 5, 1),
      highSeasonEnd: new Date(new Date().getFullYear(), 7, 31),
      maxGuestsPerCabin: 8,
      childrenFreeAgeLimit: 13
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
    const properties = await Property.find().lean();
    if (properties.length === 0) {
      return { success: false, error: 'Najpierw utwórz domki' };
    }

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);

    const twoWeeks = new Date(today);
    twoWeeks.setDate(today.getDate() + 14);
    twoWeeks.setHours(11, 0, 0, 0);

    const bookings = [
      {
        propertyId: properties[0]._id,
        startDate: nextWeek,
        endDate: twoWeeks,
        guestName: 'Jan Kowalski',
        guestEmail: 'jan@example.com',
        guestPhone: '+48 123 456 789',
        guestAddress: 'ul. Przykładowa 1, 00-001 Warszawa',
        numberOfGuests: 4,
        extraBedsCount: 1,
        totalPrice: 3500,
        paidAmount: 500,
        status: 'confirmed',
        bookingType: 'real',
        notes: 'Przykładowa rezerwacja',
        source: 'seed'
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

    const prices = await seedPriceConfig();
    if (!prices.success) throw new Error(prices.error);

    const system = await seedSystemConfig();
    if (!system.success) throw new Error(system.error);

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