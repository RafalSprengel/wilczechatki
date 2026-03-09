'use server'
import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';

export interface BookingDetails {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numberOfGuests: number;
  extraBeds: number;
  totalPrice: number;
  paidAmount: number;
  status: string;
  startDate: string;
  endDate: string;
  durationDays: number;
}

export interface CalendarCell {
  status: 'free' | 'booked' | 'blocked_sys';
  details?: BookingDetails;
}

export interface CalendarDay {
  date: string;
  datePL: string;
  cabins: Record<string, CalendarCell>;
}

export async function getCalendarData(daysInMonth: number, startDateStr: string): Promise<CalendarDay[]> {
  await dbConnect();
  const startDate = new Date(startDateStr);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysInMonth);
  endDate.setHours(23, 59, 59, 999);

  const properties = await Property.find({ isActive: true }).lean();
  const bookings = await Booking.find({
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
    status: { $in: ['confirmed', 'blocked'] }
  }).lean();

  const calendarData: CalendarDay[] = [];

  for (let i = 0; i < daysInMonth; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    currentDate.setHours(0, 0, 0, 0);
    const dateStr = currentDate.toISOString().split('T')[0];
    const datePL = currentDate.toLocaleDateString('pl-PL');

    const dayData: CalendarDay = {
      date: dateStr,
      datePL,
      cabins: {}
    };

    for (const property of properties) {
      const propertyId = property._id.toString();
      
      const booking = bookings.find(b => 
        b.propertyId.toString() === propertyId &&
        new Date(b.startDate) <= currentDate &&
        new Date(b.endDate) > currentDate
      );

      let cell: CalendarCell;

      if (booking) {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        cell = {
          status: booking.status === 'blocked' ? 'blocked_sys' : 'booked',
          details: {
            id: booking._id.toString(),
            guestName: booking.guestName || 'Gość',
            guestEmail: booking.guestEmail || '',
            guestPhone: booking.guestPhone || '',
            numberOfGuests: booking.numberOfGuests || 0,
            extraBeds: booking.extraBedsCount || 0,
            totalPrice: booking.totalPrice || 0,
            paidAmount: booking.paidAmount || 0,
            status: booking.status,
            startDate: booking.startDate.toISOString().split('T')[0],
            endDate: booking.endDate.toISOString().split('T')[0],
            durationDays
          }
        };
      } else {
        cell = {
          status: 'free'
        };
      }

      dayData.cabins[propertyId] = cell;
    }

    calendarData.push(dayData);
  }

  return calendarData;
}