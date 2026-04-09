'use server'

import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import SystemConfig from '@/db/models/SystemConfig';
import BookingConfig from '@/db/models/BookingConfig';
import {
  calculateTotalPrice,
} from '@/actions/searchActions';
import { Types } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface GuestData {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
  invoice: boolean;
  invoiceData?: {
    companyName: string;
    nip: string;
    street: string;
    city: string;
    postalCode: string;
  };
  termsAccepted: boolean;
}

interface SelectedOption {
  type: 'cabin';
  displayName: string;
  totalPrice: number;
}

interface BookingDraftData {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  extraBeds: number;
  selectedOption: SelectedOption | null;
  guestData: GuestData;
}

export async function createBookingFromDraft(draftData: BookingDraftData) {
  try {
    await dbConnect();

    const { startDate, endDate, adults, children, extraBeds, selectedOption, guestData } = draftData;

    if (!selectedOption) {
      console.error('Brak selectedOption');
      return { success: false, error: 'Brak wybranego obiektu' };
    }

    if (!guestData.firstName || !guestData.lastName || !guestData.email || !guestData.phone) {
      console.error('Niekompletne dane gościa');
      return { success: false, error: 'Niekompletne dane gościa' };
    }

    const numberOfGuests = adults + children;
    const bookings = [];

    const property = await Property.findOne({ name: selectedOption.displayName, isActive: true }).select('_id');

    if (!property) {
      console.error('Nie znaleziono domku w bazie');
      return { success: false, error: 'Nie można znaleźć domku w bazie' };
    }

    const recalculatedPrice = await calculateTotalPrice({
      startDate,
      endDate,
      baseGuests: numberOfGuests,
      extraBeds,
      propertySelection: property._id.toString(),
    });
    if (recalculatedPrice <= 0) {
      return { success: false, error: 'Nie udało się poprawnie wyliczyć ceny rezerwacji.' };
    }

    bookings.push({
      propertyId: new Types.ObjectId(property._id.toString()),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      guestName: `${guestData.firstName} ${guestData.lastName}`,
      guestEmail: guestData.email,
      guestPhone: guestData.phone,
      guestAddress: guestData.address,
      numberOfGuests,
      extraBedsCount: extraBeds,
      totalPrice: recalculatedPrice,
      paidAmount: recalculatedPrice,
      status: 'confirmed',
      invoice: guestData.invoice,
      invoiceData: guestData.invoiceData,
      customerNotes: '',
      source: 'customer',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedBookings = await Booking.insertMany(bookings);

    return {
      success: true,
      message: 'Rezerwacja utworzona pomyślnie',
      bookingIds: savedBookings.map(b => b._id.toString())
    };
  } catch (error: any) {
    console.error('Błąd podczas tworzenia rezerwacji:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return { success: false, error: `Błąd walidacji: ${errors.join(', ')}` };
    }

    if (error.message && error.message.includes('Path') && error.message.includes('is not in schema')) {
      return { success: false, error: `Próba zapisu nieznanego pola: ${error.message}` };
    }

    return { success: false, error: 'Nie udało się utworzyć rezerwacji' };
  }
}

export async function getBlockedDates(): Promise<{ date: string }[]> {
  try {
    await dbConnect();

    const [systemConfig, bookingConfig] = await Promise.all([
      SystemConfig.findById('main'),
      BookingConfig.findById('main')
    ]);

    const autoBlock = systemConfig?.autoBlockOtherCabins ?? true;

    if (!autoBlock) {
      return [];
    }

    const allowCheckinOnDepartureDay = bookingConfig?.allowCheckinOnDepartureDay ?? true;

    const bookings = await Booking.find({
      status: { $in: ['confirmed', 'blocked'] }
    }).select('startDate endDate').lean();

    const blockedSet = new Set<string>();

    for (const booking of bookings) {
      const start = dayjs(booking.startDate).utc();
      const end = dayjs(booking.endDate).utc();

      // Dni w pełni zajęte: od start+1 do end-1 (włącznie)
      let current = start.add(1, 'day');
      while (current.isBefore(end, 'day')) {
        blockedSet.add(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
      }

      // Jeśli nie pozwalamy na zameldowanie w dniu zameldowania i wymeldowania
      if (!allowCheckinOnDepartureDay) {
        blockedSet.add(end.format('YYYY-MM-DD'));
        blockedSet.add(start.format('YYYY-MM-DD')); 
      }
    }

    return Array.from(blockedSet).map(date => ({ date }));
  } catch (error) {
    console.error('Błąd podczas pobierania zablokowanych dat:', error);
    return [];
  }
}