'use server'

import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';

export async function checkAvailability(startDate: string, endDate: string, requestedCabins: number) {
    //console.clear()
    console.log(startDate, endDate, requestedCabins);
    try {
        await dbConnect();

        const start = new Date(startDate);
        const end = new Date(endDate);

        const overlappingBookings = await Booking.find({
            status: 'confirmed',
            $or: [
                { startDate: { $lt: end }, endDate: { $gt: start } }
            ]
        });
        console.log(overlappingBookings);
        const totalCabins = 2;

        const maxOccupiedOnAnyDay = (checkStart: Date, checkEnd: Date) => {
            let max = 0;
            for (let d = new Date(checkStart); d < checkEnd; d.setDate(d.getDate() + 1)) {
                const currentDayOccupied = overlappingBookings
                    .filter(b => d >= b.startDate && d < b.endDate)
                    .reduce((sum, b) => sum + b.cabinsCount, 0);
                if (currentDayOccupied > max) max = currentDayOccupied;
            }
            return max;
        };

        const alreadyOccupied = maxOccupiedOnAnyDay(start, end);

        if (alreadyOccupied + requestedCabins <= totalCabins) {
            return { available: true };
        } else {
            return { available: false, remaining: totalCabins - alreadyOccupied };
        }
    } catch (error) {
        return { available: false, error: "Błąd serwera" };
    }
}