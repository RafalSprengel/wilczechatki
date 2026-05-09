'use server'
import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import { resolveOccupiedPropertyIdsFromBookings } from '@/utils/lazyAvailabilityCleanup';
import type { PaymentStatus } from '@/types/bookingStatus';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

import { formatDisplayDate } from '@/utils/formatDate';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export interface BookingDetails {
  id: string;
  orderId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  adminNotes?: string;
  source?: string;
  adults: number;
  children: number;
  extraBeds: number;
  totalPrice: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  status: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  color: string;
}

export interface CalendarCell {
  status: 'free' | 'booked' | 'blocked_sys' | 'check-out' | 'check-in' | 'check-out-in';
  details?: BookingDetails;
  checkoutDetails?: BookingDetails;
  checkinDetails?: BookingDetails;
}

export interface CalendarDay {
  date: string;
  datePL: string;
  cabins: Record<string, CalendarCell>;
}

const generatePastelColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 85%)`;
};

export async function getCalendarData(daysInMonth: number, startDateStr: string): Promise<CalendarDay[]> {
  await dbConnect();

  const startDate = dayjs.utc(startDateStr).startOf('day');
  const endDate = startDate.add(daysInMonth, 'day').endOf('day');

  const properties = await Property.find({ isActive: true }).lean();
  const bookingsForCleanup = await Booking.find({
    $or: [
      { status: 'blocked' },
      { status: 'confirmed' },
      { status: 'pending' },
    ],
    startDate: { $lt: endDate.toDate() },
    endDate: { $gt: startDate.toDate() }
  }).lean();

  const { didMutateBookings } = await resolveOccupiedPropertyIdsFromBookings(bookingsForCleanup);

  const bookings = didMutateBookings
    ? await Booking.find({
        $or: [
          { status: 'blocked' },
          { status: 'confirmed' },
          { status: 'pending' },
        ],
        startDate: { $lt: endDate.toDate() },
        endDate: { $gt: startDate.toDate() }
      }).lean()
    : bookingsForCleanup;

  const mapBookingDetails = (b: any): BookingDetails => {
    const id = b._id.toString();
    const paidAmount = Number(b.paidAmount);
    const totalPrice = Number(b.totalPrice);
    const paymentStatus = b.paymentStatus || (paidAmount <= 0 ? 'unpaid' : paidAmount < totalPrice ? 'partial_paid' : 'paid');

    return {
      id,
      orderId: typeof b.orderId === 'string' && b.orderId.trim().length > 0 ? b.orderId : undefined,
      guestName: b.guestName || 'Gość',
      guestEmail: b.guestEmail || '',
      guestPhone: b.guestPhone || '',
      adminNotes: b.adminNotes || '',
      source: b.source || '',
      adults: b.adults || 0,
      children: b.children || 0,
      extraBeds: b.extraBedsCount || 0,
      totalPrice,
      paidAmount,
      paymentStatus,
      status: b.status,
      startDate: formatDisplayDate(b.startDate),
      endDate: formatDisplayDate(b.endDate),
      durationDays: dayjs.utc(b.endDate).diff(dayjs.utc(b.startDate), 'day'),
      color: b.status === 'blocked' ? '#e3f2fd' : generatePastelColor(id)
    };
  };

  const calendarData: CalendarDay[] = [];

  for (let i = 0; i < daysInMonth; i++) {
    const currentDate = startDate.add(i, 'day');
    const dayData: CalendarDay = {
      date: currentDate.format('YYYY-MM-DD'),
      datePL: formatDisplayDate(currentDate.format('YYYY-MM-DD')),
      cabins: {}
    };

    for (const property of properties) {
      const propertyId = property._id.toString();

      const departing = bookings.find(b => 
        b.propertyId.toString() === propertyId &&
        dayjs.utc(b.endDate).isSame(currentDate, 'day')
      );

      const arriving = bookings.find(b => 
        b.propertyId.toString() === propertyId &&
        dayjs.utc(b.startDate).isSame(currentDate, 'day')
      );

      const staying = bookings.find(b => 
        b.propertyId.toString() === propertyId &&
        dayjs.utc(b.startDate).isBefore(currentDate, 'day') &&
        dayjs.utc(b.endDate).isAfter(currentDate, 'day')
      );

      let cell: CalendarCell = { status: 'free' };

      if (departing && arriving) {
        cell = { 
          status: 'check-out-in', 
          checkoutDetails: mapBookingDetails(departing), 
          checkinDetails: mapBookingDetails(arriving) 
        };
      } else if (staying) {
        cell = { 
          status: staying.status === 'blocked' ? 'blocked_sys' : 'booked', 
          details: mapBookingDetails(staying) 
        };
      } else if (arriving) {
        cell = { status: 'check-in', checkinDetails: mapBookingDetails(arriving) };
      } else if (departing) {
        cell = { status: 'check-out', checkoutDetails: mapBookingDetails(departing) };
      }

      dayData.cabins[propertyId] = cell;
    }
    calendarData.push(dayData);
  }

  return calendarData;
}