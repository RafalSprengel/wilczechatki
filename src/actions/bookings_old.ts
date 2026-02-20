'use server'

import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking_old';

export async function checkAvailability(startDate: string, endDate: string, requestedCabins: number) {
    try {
        await dbConnect();

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Całkowita liczba domek w obiekcie (możesz to też pobierać z konfiguracji)
        const TOTAL_CABINS = 2;

        // 1. Proste zapytanie znajdujące TYLKO kolidujące rezerwacje
        // Warunek kolizji: (IstniejącyStart < NowyKoniec) AND (IstniejącyKoniec > NowyStart)
        const conflictingBookings = await Booking.find({
            status: 'confirmed',
            startDate: { $lt: end },
            endDate: { $gt: start }
        }).select('cabinsCount startDate endDate'); // Pobieramy tylko potrzebne pola

        // 2. Obliczanie maksymalnego obłożenia w zakresie żądanych dat
        // Musimy sprawdzić dzień po dniu w żądanym okresie, ile domek jest już zajętych przez KOFLIKTUJĄCE rezerwacje
        let maxOccupiedInPeriod = 0;

        // Iterujemy tylko po dniach, które klient chce zarezerwować
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const currentDayOccupied = conflictingBookings.reduce((sum, booking) => {
                // Sprawdź, czy dana konkretna rezerwacja obejmuje ten konkretny dzień (d)
                if (d >= booking.startDate && d < booking.endDate) {
                    return sum + (booking.cabinsCount || 1);
                }
                return sum;
            }, 0);

            if (currentDayOccupied > maxOccupiedInPeriod) {
                maxOccupiedInPeriod = currentDayOccupied;
            }
        }

        // 3. Decyzja
        if (maxOccupiedInPeriod + requestedCabins <= TOTAL_CABINS) {
            return { available: true };
        } else {
            return { 
                available: false, 
                remaining: Math.max(0, TOTAL_CABINS - maxOccupiedInPeriod),
                message: "Wybrane dni są częściowo lub całkowicie zajęte."
            };
        }

    } catch (error) {
        console.error("Błąd sprawdzania dostępności:", error);
        return { available: false, error: "Błąd serwera" };
    }
}