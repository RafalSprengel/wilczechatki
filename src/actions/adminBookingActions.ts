'use server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import SystemConfig from '@/db/models/SystemConfig';
import mongoose from 'mongoose';

export async function createManualBooking(formData: FormData) {
  try {
    await dbConnect();

    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;
    const propertyId = formData.get('propertyId') as string;
    const numGuests = parseInt(formData.get('numGuests') as string, 10);
    const guestName = formData.get('guestName') as string;
    const guestEmail = formData.get('guestEmail') as string;
    const guestPhone = formData.get('guestPhone') as string;
    const totalPriceStr = formData.get('totalPrice') as string;
    const internalNotes = formData.get('internalNotes') as string;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const totalPrice = parseFloat(totalPriceStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Nieprawidłowy format daty.');
    }

    if (startDate >= endDate) {
      throw new Error('Data wyjazdu musi być późniejsza niż data przyjazdu.');
    }

    if (!propertyId || !guestName || !guestEmail) {
      throw new Error('Brak wymaganych danych gościa lub property.');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const isWholeProperty = propertyId === 'both';

      if (isWholeProperty) {
        const properties = await Property.find({ isActive: true }).session(session);

        if (properties.length === 0) {
          throw new Error('Brak aktywnych domków.');
        }

        const mainProp = properties[0];
        const mainBooking = await Booking.create([{
          propertyId: mainProp._id,
          guestName,
          guestEmail,
          guestPhone,
          startDate,
          endDate,
          numberOfGuests: numGuests,
          totalPrice,
          status: 'confirmed',
          bookingType: 'real',
          paymentId: `MANUAL_${Date.now()}`,
          internalNotes: internalNotes || '',
          source: 'admin',
        }], { session });

        const mainBookingId = mainBooking[0]._id;

        const otherProperties = properties.slice(1);
        if (otherProperties.length > 0) {
          const shadowBookingsData = otherProperties.map(otherProp => ({
            propertyId: otherProp._id,
            guestName: "SYSTEM BLOCK (Auto)",
            guestEmail: "system@wilczechatki.pl",
            startDate,
            endDate,
            totalPrice: 0,
            numberOfGuests: 0,
            extraBedsCount: 0,
            status: 'blocked',
            bookingType: 'shadow',
            linkedBookingId: mainBookingId,
            paymentId: undefined,
            internalNotes: `Blokada automatyczna dla rezerwacji ${mainBookingId}`,
            source: 'system',
          }));

          await Booking.create(shadowBookingsData, { session });
        }
      } else {
        const sysConfig = await SystemConfig.findById('main').session(session);
        const shouldAutoBlock = sysConfig?.autoBlockOtherCabins ?? true;

        const selectedPropId = new mongoose.Types.ObjectId(propertyId);

        const mainBooking = await Booking.create([{
          propertyId: selectedPropId,
          guestName,
          guestEmail,
          guestPhone,
          startDate,
          endDate,
          numberOfGuests: numGuests,
          totalPrice,
          status: 'confirmed',
          bookingType: 'real',
          paymentId: `MANUAL_${Date.now()}`,
          internalNotes: internalNotes || '',
          source: 'admin',
        }], { session });

        const mainBookingId = mainBooking[0]._id;

        if (shouldAutoBlock) {
          const otherProperties = await Property.find({
            isActive: true,
            _id: { $ne: selectedPropId }
          }).session(session);

          if (otherProperties.length > 0) {
            const shadowBookingsData = otherProperties.map(otherProp => ({
              propertyId: otherProp._id,
              guestName: "SYSTEM BLOCK (Auto)",
              guestEmail: "system@wilczechatki.pl",
              startDate,
              endDate,
              totalPrice: 0,
              numberOfGuests: 0,
              extraBedsCount: 0,
              status: 'blocked',
              bookingType: 'shadow',
              linkedBookingId: mainBookingId,
              paymentId: undefined,
              internalNotes: `Blokada automatyczna dla rezerwacji ${mainBookingId}`,
              source: 'system',
            }));

            await Booking.create(shadowBookingsData, { session });
          }
        }
      }

      await session.commitTransaction();

      revalidatePath('/admin/bookings/calendar');
      revalidatePath('/admin/bookings/list');
      revalidatePath('/admin/bookings/add');

      return {
        success: true,
        message: 'Pomyślnie dodano rezerwację',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Błąd podczas tworzenia rezerwacji:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Wystąpił nieznany błąd.',
    };
  }
}

export async function getAdminBookingsList() {
  try {
    await dbConnect();
    
    const bookings = await Booking.find({
      bookingType: { $ne: 'shadow' }
    })
    .sort({ createdAt: -1 })
    .lean();

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking: any) => {
        let propertyName = 'Nieznany obiekt';
        if (booking.propertyId) {
          try {
            const property = await Property.findById(booking.propertyId).lean();
            if (property) {
              propertyName = property.name || propertyName;
            }
          } catch (err) {
            console.error(`Błąd pobierania nazwy property dla ${booking._id}`, err);
          }
        }

        return {
          _id: booking._id.toString(),
          startDate: booking.startDate,
          endDate: booking.endDate,
          propertyId: booking.propertyId?.toString() || null,
          propertyName: propertyName,
          numberOfGuests: booking.numberOfGuests || 0,
          guestName: booking.guestName || '',
          guestEmail: booking.guestEmail || '',
          guestPhone: booking.guestPhone || '',
          totalPrice: booking.totalPrice || 0,
          status: booking.status || 'PENDING',
          paymentStatus: booking.paymentStatus || 'UNPAID',
          bookingType: booking.bookingType || 'real',
          internalNotes: booking.internalNotes || '',
          source: booking.source || 'unknown',
          createdAt: booking.createdAt,
        };
      })
    );

    return bookingsWithDetails;
  } catch (error) {
    console.error('Błąd podczas pobierania listy rezerwacji:', error);
    return [];
  }
}

export async function getBookingById(bookingId: string) {
  try {
    await dbConnect();
    const booking = await Booking.findById(bookingId).lean();
    if (!booking) return null;

    let propertyName = 'Nieznany obiekt';
    if (booking.propertyId) {
      const property = await Property.findById(booking.propertyId).lean();
      if (property) {
        propertyName = property.name || propertyName;
      }
    }

    return {
      _id: booking._id.toString(),
      startDate: booking.startDate,
      endDate: booking.endDate,
      propertyId: booking.propertyId?.toString() || null,
      propertyName,
      numberOfGuests: booking.numberOfGuests || 0,
      guestName: booking.guestName || '',
      guestEmail: booking.guestEmail || '',
      guestPhone: booking.guestPhone || '',
      totalPrice: booking.totalPrice || 0,
      status: booking.status || 'PENDING',
      bookingType: booking.bookingType || 'real',
      internalNotes: booking.internalNotes || '',
      createdAt: booking.createdAt,
    };
  } catch (error) {
    console.error('Błąd podczas pobierania rezerwacji:', error);
    return null;
  }
}

export async function updateBooking(bookingId: string, data: any) {
  try {
    await dbConnect();
    await Booking.findByIdAndUpdate(bookingId, data);
    revalidatePath('/admin/bookings/calendar');
    revalidatePath('/admin/bookings/list');
    return { success: true };
  } catch (error) {
    console.error('Błąd aktualizacji rezerwacji:', error);
    return { success: false, message: 'Nie udało się zaktualizować rezerwacji' };
  }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  try {
    await dbConnect();
    await Booking.findByIdAndUpdate(bookingId, { status });
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/bookings/list');
    revalidatePath('/admin/bookings/calendar');
    return { success: true };
  } catch (error) {
    console.error('Błąd aktualizacji statusu:', error);
    return { success: false, error: 'Nie udało się zaktualizować statusu' };
  }
}

export async function deleteBooking(bookingId: string) {
  try {
    await dbConnect();
    const booking = await Booking.findById(bookingId);

    if (booking && booking.bookingType === 'real') {
      await Booking.deleteMany({ linkedBookingId: bookingId });
    }

    await Booking.findByIdAndDelete(bookingId);
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/bookings/list');
    revalidatePath('/admin/bookings/calendar');
    return { success: true };
  } catch (error) {
    console.error('Błąd usuwania rezerwacji:', error);
    return { success: false, error: 'Nie udało się usunąć rezerwacji' };
  }
}