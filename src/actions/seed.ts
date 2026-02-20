'use server'

import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import Booking from '@/db/models/Booking';
import PriceConfig from '@/db/models/PriceConfig';
import SystemConfig from '@/db/models/SystemConfig';
import mongoose from 'mongoose';
import { ClientSession } from 'mongoose';

async function ensureConnected() {
    await dbConnect();
    if (mongoose.connection.readyState !== 1) {
        throw new Error('Nie udało się nawiązać połączenia z bazą danych.');
    }
}

// --- FUNKCJE POMOCNICZE (ZMODYFIKOWANE) ---

export async function seedProperties(session?: ClientSession) {
    try {
        await ensureConnected();
        
        // Czyścimy tylko jeśli NIE mamy sesji (czyli wywołanie indywidualne)
        if (!session) {
            await Property.deleteMany({});
        }

        const data = [
            {
                name: "Chatka A (Wilcza)",
                slug: "chatka-a",
                description: "Przytulny domek z kominkiem, idealny dla par i małych rodzin.",
                baseCapacity: 6,
                maxCapacityWithExtra: 8,
                images: ["/images/chatka-a-1.jpg"],
                isActive: true
            },
            {
                name: "Chatka B (Leśna)",
                slug: "chatka-b",
                description: "Domek z widokiem na las, wyposażony w saunę.",
                baseCapacity: 6,
                maxCapacityWithExtra: 8,
                images: ["/images/chatka-b-1.jpg"],
                isActive: true
            }
        ];

        const properties = session 
            ? await Property.insertMany(data, { session })
            : await Property.insertMany(data);

        return {
            success: true,
            message: `Utworzono ${properties.length} domki.`
        };
    } catch (error: any) {
        console.error("Błąd seedowania domków:", error);
        return { success: false, error: error.message };
    }
}

export async function seedSystemConfig(session?: ClientSession) {
    try {
        await ensureConnected();
        
        if (!session) {
            await SystemConfig.deleteMany({});
        }

        const data = [{
            _id: 'main',
            autoBlockOtherCabins: true,
            maxGuestsPerCabin: 6,
            childrenFreeAgeLimit: 13
        }];

        if (session) {
            await SystemConfig.insertMany(data, { session });
        } else {
            await SystemConfig.insertMany(data);
        }

        return {
            success: true,
            message: `Konfiguracja systemu zaktualizowana.`
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function seedPriceConfig(session?: ClientSession) {
    try {
        await ensureConnected();
        
        if (!session) {
            await PriceConfig.deleteMany({});
        }

        const data = [{
            _id: 'main',
            baseRates: {
                weekday: [
                    { minGuests: 2, maxGuests: 3, price: 300 },
                    { minGuests: 4, maxGuests: 5, price: 400 },
                    { minGuests: 6, maxGuests: 10, price: 500 }
                ],
                weekend: [
                    { minGuests: 2, maxGuests: 3, price: 400 },
                    { minGuests: 4, maxGuests: 5, price: 500 },
                    { minGuests: 6, maxGuests: 10, price: 600 }
                ],
                extraBedPrice: 50,
                childrenFreeAgeLimit: 13
            },
            seasons: [
                {
                    name: "Wakacje 2026",
                    startDate: new Date("2026-07-01"),
                    endDate: new Date("2026-08-31"),
                    weekday: [
                        { minGuests: 2, maxGuests: 3, price: 450 },
                        { minGuests: 4, maxGuests: 5, price: 600 },
                        { minGuests: 6, maxGuests: 10, price: 800 }
                    ],
                    weekend: [
                        { minGuests: 2, maxGuests: 3, price: 550 },
                        { minGuests: 4, maxGuests: 5, price: 700 },
                        { minGuests: 6, maxGuests: 10, price: 900 }
                    ],
                    extraBedPrice: 70,
                    isActive: true
                }
            ]
        }];

        if (session) {
            await PriceConfig.insertMany(data, { session });
        } else {
            await PriceConfig.insertMany(data);
        }

        return {
            success: true,
            message: "Konfiguracja cenowa została zapisana."
        };
    } catch (error: any) {
        console.error("Błąd seedowania cen:", error);
        return { success: false, error: error.message };
    }
}

export async function seedBookings(session?: ClientSession) {
    try {
        await ensureConnected();

        // Pobranie domków (zawsze potrzebne)
        const props = session 
            ? await Property.find({ isActive: true }).session(session)
            : await Property.find({ isActive: true });

        if (props.length < 2) {
            return { success: false, error: "Najpierw uruchom seedProperties()." };
        }

        const cabinA = props.find(p => p.slug === 'chatka-a');
        const cabinB = props.find(p => p.slug === 'chatka-b');

        if (!cabinA || !cabinB) {
            return { success: false, error: "Nie znaleziono domków." };
        }

        // Czyszczenie tylko przy wywołaniu indywidualnym
        if (!session) {
            await Booking.deleteMany({});
        }

        const data = [
            {
                propertyId: cabinA._id,
                guestName: "Rafał Testowy",
                guestEmail: "rafal@example.com",
                guestPhone: "123456789",
                startDate: new Date("2026-03-10"),
                endDate: new Date("2026-03-15"),
                totalPrice: 1500,
                numberOfGuests: 3,
                extraBedsCount: 0,
                status: 'confirmed',
                bookingType: 'real',
                paymentId: "PAY_SINGLE_001"
            },
            {
                propertyId: cabinA._id,
                guestName: "Marek Nowak",
                guestEmail: "marek@example.com",
                guestPhone: "987654321",
                startDate: new Date("2026-06-20"),
                endDate: new Date("2026-06-27"),
                totalPrice: 3500,
                numberOfGuests: 5,
                extraBedsCount: 1,
                status: 'confirmed',
                bookingType: 'real',
                paymentId: "PAY_DOUBLE_002"
            },
            {
                propertyId: cabinB._id,
                guestName: "Marek Nowak",
                guestEmail: "marek@example.com",
                guestPhone: "987654321",
                startDate: new Date("2026-06-20"),
                endDate: new Date("2026-06-27"),
                totalPrice: 3500,
                numberOfGuests: 5,
                extraBedsCount: 1,
                status: 'confirmed',
                bookingType: 'real',
                paymentId: "PAY_DOUBLE_002"
            },
            {
                propertyId: cabinB._id,
                guestName: "Anna Wiśniewska",
                guestEmail: "anna@example.com",
                guestPhone: "555666777",
                startDate: new Date("2026-07-01"),
                endDate: new Date("2026-07-05"),
                totalPrice: 2000,
                numberOfGuests: 4,
                extraBedsCount: 0,
                status: 'confirmed',
                bookingType: 'real',
                paymentId: "PAY_SHADOW_003"
            },
            {
                propertyId: cabinA._id,
                guestName: "SYSTEM BLOCK",
                guestEmail: "system@local",
                guestPhone: "",
                startDate: new Date("2026-07-01"),
                endDate: new Date("2026-07-05"),
                totalPrice: 0,
                numberOfGuests: 0,
                extraBedsCount: 0,
                status: 'blocked',
                bookingType: 'shadow',
                linkedBookingId: null,
                paymentId: null
            }
        ];

        const inserted = session 
            ? await Booking.insertMany(data, { session })
            : await Booking.insertMany(data);

        return {
            success: true,
            message: `Dodano ${inserted.length} rezerwacji.`
        };

    } catch (error: any) {
        console.error("Błąd seedowania rezerwacji:", error);
        return { success: false, error: error.message };
    }
}

// --- GŁÓWNA FUNKCJA KOORDYNUJĄCA ---

export async function seedAllData() {
    await ensureConnected();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Wyczyść WSZYSTKO na start (tylko raz)
        await Property.deleteMany({}, { session });
        await Booking.deleteMany({}, { session });
        await PriceConfig.deleteMany({}, { session });
        await SystemConfig.deleteMany({}, { session });

        // 2. Wywołaj funkcje składowe przekazując sesję
        // Kolejność jest ważna: najpierw domki, potem rezerwacje (które potrzebują ID domków)
        await seedProperties(session);
        await seedSystemConfig(session);
        await seedPriceConfig(session);
        
        // seedBookings pobierze domki z bazy (przez sesję) i utworzy rezerwacje
        await seedBookings(session);

        await session.commitTransaction();
        return { success: true, message: "Baza została zresetowana i zasiana wszystkimi danymi!" };

    } catch (error: any) {
        await session.abortTransaction();
        console.error("Błąd seedowania:", error);
        return { success: false, error: error.message };
    } finally {
        session.endSession();
    }
}

export async function clearAllData() {
    await ensureConnected();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await Property.deleteMany({}, { session });
        await Booking.deleteMany({}, { session });
        await PriceConfig.deleteMany({}, { session });
        await SystemConfig.deleteMany({}, { session });

        await session.commitTransaction();
        return { success: true, message: "Wszystkie kolekcje zostały pomyślnie wyczyszczone!" };

    } catch (error: any) {
        await session.abortTransaction();
        console.error("Błąd czyszczenia bazy:", error);
        return { success: false, error: error.message };
    } finally {
        session.endSession();
    }
}