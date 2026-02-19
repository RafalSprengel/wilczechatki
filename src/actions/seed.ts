'use server'

import dbConnect from '@/db/connection';
import PriceConfig from '@/db/models/PriceConfig';
import Booking from '@/db/models/Booking';

export async function seedPrices() {
    try {
        await dbConnect();
        const initialPrices = [
            {
                seasonName: "Wiosna 2026",
                startDate: new Date("2026-03-01"),
                endDate: new Date("2026-05-31"),
                pricePerNightOneCabin: 350,
                pricePerNightTwoCabins: 600,
                minNights: 2
            },
            {
                seasonName: "Wakacje 2026",
                startDate: new Date("2026-06-01"),
                endDate: new Date("2026-08-31"),
                pricePerNightOneCabin: 550,
                pricePerNightTwoCabins: 1000,
                minNights: 5
            },
            {
                seasonName: "Jesień 2026",
                startDate: new Date("2026-09-01"),
                endDate: new Date("2026-11-30"),
                pricePerNightOneCabin: 300,
                pricePerNightTwoCabins: 550,
                minNights: 2
            },
            {
                seasonName: "Zima 2026",
                startDate: new Date("2026-12-01"),
                endDate: new Date("2026-12-31"),
                pricePerNightOneCabin: 450,
                pricePerNightTwoCabins: 800,
                minNights: 3
            }
        ];

        await PriceConfig.deleteMany({});
        const inserted = await PriceConfig.insertMany(initialPrices);
        const count = await PriceConfig.countDocuments();

        return { 
            success: true, 
            message: `Zapisano ${inserted.length} sezonów. Łącznie w bazie: ${count}.` 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function seedBookings() {
    try {
        await dbConnect();
        const initialBookings = [
            {
                startDate: new Date("2026-02-25"),
                endDate: new Date("2026-05-27"),
                adults: 2,
                children: 0,
                cabinsCount: 1,
                totalPrice: 1750,
                status: 'confirmed',
                customerName: "Rafał Testowy",
                customerEmail: "rafal@example.com"
            },
            {
                startDate: new Date("2026-06-15"),
                endDate: new Date("2026-06-22"),
                adults: 4,
                children: 4,
                cabinsCount: 2,
                totalPrice: 7000,
                status: 'confirmed',
                customerName: "Marek Nowak",
                customerEmail: "marek@example.com"
            },
            {
                startDate: new Date("2026-07-01"),
                endDate: new Date("2026-07-08"),
                adults: 2,
                children: 2,
                cabinsCount: 1,
                totalPrice: 3850,
                status: 'confirmed',
                customerName: "Anna Wiśniewska",
                customerEmail: "anna@example.com"
            },
            {
                startDate: new Date("2026-07-05"),
                endDate: new Date("2026-07-12"),
                adults: 3,
                children: 0,
                cabinsCount: 1,
                totalPrice: 3850,
                status: 'confirmed',
                customerName: "Piotr Zieliński",
                customerEmail: "piotr@example.com"
            }
        ];

        await Booking.deleteMany({});
        const inserted = await Booking.insertMany(initialBookings);
        const count = await Booking.countDocuments();

        return { 
            success: true, 
            message: `Dodano ${inserted.length} rezerwacji. Łącznie w bazie: ${count}.` 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function clearAllData() {
    try {
        await dbConnect();
        await PriceConfig.deleteMany({});
        await Booking.deleteMany({});
        return { success: true, message: "Baza została całkowicie wyczyszczona!" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}