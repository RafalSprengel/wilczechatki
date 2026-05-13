'use server'

import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import SystemConfig from '@/db/models/SystemConfig';
import BookingConfig from '@/db/models/BookingConfig';
import { resolveOccupiedPropertyIdsFromBookings } from '@/utils/lazyAvailabilityCleanup';
import { calculatePaymentStatus } from '@/utils/getPaymentStatus';
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
  propertyId?: string;
  displayName: string;
  totalPrice: number;
  propertyAllocations?: Array<{
    propertyId: string;
    displayName: string;
    guests: number;
    adults: number;
    children: number;
    extraBeds: number;
    totalPrice: number;
  }>;
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

    const bookings: any[] = [];

    const baseBookingData = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      guestName: `${guestData.firstName} ${guestData.lastName}`,
      guestEmail: guestData.email,
      guestPhone: guestData.phone,
      guestAddress: guestData.address,
      status: 'pending' as const,
      paymentMethod: 'online' as const,
      invoice: guestData.invoice,
      invoiceData: guestData.invoiceData,
      customerNotes: '',
      source: 'online' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (selectedOption.propertyId === 'ALL_PROPERTIES') {
      const allocations = selectedOption.propertyAllocations || [];
      if (allocations.length === 0) {
        return { success: false, error: 'Brak podziału rezerwacji na domki.' };
      }

      for (const allocation of allocations) {
        if (!Types.ObjectId.isValid(allocation.propertyId)) {
          return { success: false, error: `Nieprawidłowe ID domku: ${allocation.displayName}` };
        }

        const property = await Property.findOne({
          _id: allocation.propertyId,
          isActive: true,
        }).select('_id');

        if (!property) {
          return { success: false, error: `Nie można znaleźć domku w bazie: ${allocation.displayName}` };
        }

        const recalculatedPrice = await calculateTotalPrice({
          startDate,
          endDate,
          baseGuests: allocation.guests,
          extraBeds: allocation.extraBeds,
          propertySelection: allocation.propertyId,
        });

        if (recalculatedPrice <= 0) {
          return {
            success: false,
            error: `Nie udało się wyliczyć ceny dla domku: ${allocation.displayName}`,
          };
        }

        bookings.push({
          ...baseBookingData,
          propertyId: new Types.ObjectId(allocation.propertyId),
          adults: allocation.adults,
          children: allocation.children,
          extraBedsCount: allocation.extraBeds,
          totalPrice: recalculatedPrice,
          depositAmount: recalculatedPrice,
          paidAmount: 0,
          paymentStatus: calculatePaymentStatus(recalculatedPrice, 0),
        });
      }
    } else {
      let property = null;
      if (selectedOption.propertyId && Types.ObjectId.isValid(selectedOption.propertyId)) {
        property = await Property.findOne({
          _id: selectedOption.propertyId,
          isActive: true,
        }).select('_id');
      }

      if (!property) {
        property = await Property.findOne({ name: selectedOption.displayName, isActive: true }).select('_id');
      }

      if (!property) {
        console.error('Nie znaleziono domku w bazie');
        return { success: false, error: 'Nie można znaleźć domku w bazie' };
      }

      const recalculatedPrice = await calculateTotalPrice({
        startDate,
        endDate,
        baseGuests: adults,
        extraBeds,
        propertySelection: property._id.toString(),
      });
      if (recalculatedPrice <= 0) {
        return { success: false, error: 'Nie udało się poprawnie wyliczyć ceny rezerwacji.' };
      }

      bookings.push({
        ...baseBookingData,
        propertyId: new Types.ObjectId(property._id.toString()),
        adults,
        children,
        extraBedsCount: extraBeds,
        totalPrice: recalculatedPrice,
        depositAmount: recalculatedPrice,
        paidAmount: 0,
        paymentStatus: calculatePaymentStatus(recalculatedPrice, 0),
      });
    }

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

    const bookingsForCleanup = await Booking.find({
      $or: [
        { status: 'blocked' },
        { status: 'confirmed' },
        { status: 'pending' },
      ],
    })
      .select('_id propertyId status createdAt stripeSessionId source adminNotes startDate endDate')
      .lean();

    const { didMutateBookings } = await resolveOccupiedPropertyIdsFromBookings(bookingsForCleanup);

    const bookings = didMutateBookings
      ? await Booking.find({
        $or: [
          { status: 'blocked' },
          { status: 'confirmed' },
          { status: 'pending' },
        ],
      })
        .select('startDate endDate')
        .lean()
      : bookingsForCleanup;

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