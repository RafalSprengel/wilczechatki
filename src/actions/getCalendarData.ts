'use server'
import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import SystemConfig from '@/db/models/SystemConfig';
import { Types } from 'mongoose';

export interface BookingDetails {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numberOfGuests: number;
  totalPrice: number;
  status: string;
  durationDays: number;
  startDate: string;
  endDate: string;
}

export interface CalendarDay {
  date: string;
  datePL: string;
  cabins: Record<string, {
    status: 'free' | 'booked' | 'cleaning' | 'blocked_sys';
    details?: BookingDetails
  }>;
  isFullyBlocked?: boolean;
}

export async function getCalendarData(daysToShow: number = 60, startDateString?: string): Promise<CalendarDay[]> {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = startDateString ? new Date(startDateString + 'T00:00:00') : today;
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysToShow - 1);

  const sysConfig = await SystemConfig.findById('main');
  const isAutoBlockEnabled = sysConfig?.autoBlockOtherCabins ?? true;

  const properties = await Property.find({ isActive: true });
  if (properties.length === 0) return [];

  const propertyIds = properties.map(p => p._id);

  const bookings = await Booking.find({
    propertyId: { $in: propertyIds },
    status: { $in: ['confirmed', 'blocked'] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  })
    .select('propertyId guestName guestEmail guestPhone numberOfGuests totalPrice status startDate endDate bookingType linkedBookingId')
    .sort({ startDate: 1 });

  const result: CalendarDay[] = [];
  const seenDates = new Set<string>();
  const currentDay = new Date(startDate);

  while (currentDay <= endDate) {
    const dateStr = currentDay.toISOString().split('T')[0];

    if (seenDates.has(dateStr)) {
      currentDay.setDate(currentDay.getDate() + 1);
      continue;
    }

    seenDates.add(dateStr);
    const [year, month, day] = dateStr.split('-');
    const datePL = `${day}-${month}-${year}`;
    const dayTime = currentDay.getTime();

    const cabinsStatus: Record<string, any> = {};
    let bookedCount = 0;
    let realBookingCount = 0;

    for (const prop of properties) {
      const propId = prop._id.toString();

      const activeBooking = bookings.find(b =>
        b.propertyId.toString() === propId &&
        new Date(b.startDate).getTime() <= dayTime &&
        new Date(b.endDate).getTime() > dayTime
      );

      const checkOutBooking = bookings.find(b =>
        b.propertyId.toString() === propId &&
        new Date(b.endDate).getTime() === dayTime
      );

      const bookingToUse = activeBooking || checkOutBooking;
      const isCheckOutDay = !!checkOutBooking && !activeBooking;

      if (bookingToUse) {
        const start = new Date(bookingToUse.startDate);
        const end = new Date(bookingToUse.endDate);
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        const isShadow = bookingToUse.bookingType === 'shadow';

        if (isShadow) {
          cabinsStatus[propId] = {
            status: 'blocked_sys',
            details: undefined
          };
          bookedCount++;
        } else {
          cabinsStatus[propId] = {
            status: isCheckOutDay ? 'cleaning' : 'booked',
            details: {
              guestName: bookingToUse.guestName || 'Gość',
              guestEmail: bookingToUse.guestEmail || '-',
              guestPhone: bookingToUse.guestPhone || '-',
              numberOfGuests: bookingToUse.numberOfGuests || 0,
              totalPrice: bookingToUse.totalPrice || 0,
              status: bookingToUse.status,
              durationDays: duration,
              startDate: bookingToUse.startDate.toISOString().split('T')[0],
              endDate: bookingToUse.endDate.toISOString().split('T')[0],
            }
          };
          bookedCount++;
          realBookingCount++;
        }
      } else {
        cabinsStatus[propId] = { status: 'free' };
      }
    }

    if (isAutoBlockEnabled && realBookingCount > 0 && realBookingCount < properties.length) {
      for (const prop of properties) {
        const propId = prop._id.toString();
        if (cabinsStatus[propId].status === 'free') {
          cabinsStatus[propId] = {
            status: 'blocked_sys',
            details: undefined
          };
        }
      }
    }

    result.push({
      date: dateStr,
      datePL,
      cabins: cabinsStatus,
      isFullyBlocked: realBookingCount === properties.length
    });

    currentDay.setDate(currentDay.getDate() + 1);
  }

  return result;
}