'use server'

import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import SystemConfig from '@/db/models/SystemConfig';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

export async function createManualBooking(prevState: any, formData: FormData) {
  try {
    await dbConnect();

    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;
    const propertyId = formData.get('propertyId') as string;
    const numGuests = parseInt(formData.get('numGuests') as string) || 1;
    const extraBeds = parseInt(formData.get('extraBeds') as string) || 0;
    const guestName = formData.get('guestName') as string;
    const guestEmail = formData.get('guestEmail') as string;
    const guestPhone = formData.get('guestPhone') as string;
    const totalPrice = parseFloat(formData.get('totalPrice') as string) || 0;
    const paymentStatus = formData.get('paymentStatus') as string || 'unpaid';
    const internalNotes = formData.get('internalNotes') as string;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Walidacja dat
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { success: false, message: 'Nieprawidłowy format daty.' };
    }

    if (startDate >= endDate) {
      return { success: false, message: 'Data wyjazdu musi być późniejsza niż data przyjazdu.' };
    }

    // Walidacja podstawowych pól
    if (!propertyId || !guestName || !guestEmail || !guestPhone) {
      return { success: false, message: 'Wszystkie pola są wymagane' };
    }

    // Walidacja dostawek
    if (extraBeds < 0 || extraBeds > 4) {
      return { success: false, message: 'Liczba dostawek musi być między 0 a 4' };
    }

    // Walidacja statusu płatności
    if (!['paid', 'deposit', 'unpaid'].includes(paymentStatus)) {
      return { success: false, message: 'Nieprawidłowy status płatności' };
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sysConfig = await SystemConfig.findById('main').session(session);
      const shouldAutoBlock = sysConfig?.autoBlockOtherCabins ?? true;

      if (propertyId === 'both') {
        // Rezerwacja całej posesji
        const properties = await Property.find({ isActive: true }).session(session);

        if (properties.length === 0) {
          throw new Error('Brak aktywnych domków.');
        }

        const mainBooking = await Booking.create([{
          propertyId: properties[0]._id,
          guestName,
          guestEmail,
          guestPhone,
          startDate,
          endDate,
          numberOfGuests: numGuests,
          extraBedsCount: extraBeds,
          totalPrice,
          paymentStatus,
          status: 'confirmed',
          bookingType: 'real',
          notes: internalNotes || '',
          source: 'admin',
        }], { session });

        const mainBookingId = mainBooking[0]._id;

        // Blokady dla pozostałych domków
        const otherProperties = properties.slice(1);
        if (otherProperties.length > 0) {
          const shadowBookingsData = otherProperties.map(otherProp => ({
            propertyId: otherProp._id,
            guestName: "SYSTEM BLOCK (Auto)",
            guestEmail: "system@wilczechatki.pl",
            guestPhone: "-",
            startDate,
            endDate,
            numberOfGuests: 0,
            extraBedsCount: 0,
            totalPrice: 0,
            paymentStatus: 'unpaid', // Blokady zawsze unpaid
            status: 'blocked',
            bookingType: 'shadow',
            linkedBookingId: mainBookingId,
            notes: `Blokada automatyczna dla rezerwacji ${mainBookingId}`,
            source: 'system',
          }));

          await Booking.create(shadowBookingsData, { session });
        }
      } else {
        // Rezerwacja pojedynczego domku
        const selectedPropId = new mongoose.Types.ObjectId(propertyId);
        
        // Sprawdź czy property istnieje
        const property = await Property.findById(selectedPropId).session(session);
        if (!property) {
          throw new Error('Nie znaleziono domku o podanym ID');
        }

        const mainBooking = await Booking.create([{
          propertyId: selectedPropId,
          guestName,
          guestEmail,
          guestPhone,
          startDate,
          endDate,
          numberOfGuests: numGuests,
          extraBedsCount: extraBeds,
          totalPrice,
          paymentStatus,
          status: 'confirmed',
          bookingType: 'real',
          notes: internalNotes || '',
          source: 'admin',
        }], { session });

        const mainBookingId = mainBooking[0]._id;

        // Automatyczne blokady jeśli włączone
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
              guestPhone: "-",
              startDate,
              endDate,
              numberOfGuests: 0,
              extraBedsCount: 0,
              totalPrice: 0,
              paymentStatus: 'unpaid',
              status: 'blocked',
              bookingType: 'shadow',
              linkedBookingId: mainBookingId,
              notes: `Blokada automatyczna dla rezerwacji ${mainBookingId}`,
              source: 'system',
            }));

            await Booking.create(shadowBookingsData, { session });
          }
        }
      }

      await session.commitTransaction();
      session.endSession();

      revalidatePath('/admin/bookings/calendar');
      revalidatePath('/admin/bookings/list');
      revalidatePath('/admin/bookings/add');

      return { success: true, message: 'Rezerwacja dodana pomyślnie' };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Błąd podczas tworzenia rezerwacji:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Wystąpił błąd podczas zapisu' 
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
          extraBedsCount: booking.extraBedsCount || 0,
          guestName: booking.guestName || '',
          guestEmail: booking.guestEmail || '',
          guestPhone: booking.guestPhone || '',
          totalPrice: booking.totalPrice || 0,
          paymentStatus: booking.paymentStatus || 'unpaid',
          status: booking.status || 'pending',
          bookingType: booking.bookingType || 'real',
          notes: booking.notes || '',
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
      extraBedsCount: booking.extraBedsCount || 0,
      guestName: booking.guestName || '',
      guestEmail: booking.guestEmail || '',
      guestPhone: booking.guestPhone || '',
      totalPrice: booking.totalPrice || 0,
      paymentStatus: booking.paymentStatus || 'unpaid',
      status: booking.status || 'pending',
      bookingType: booking.bookingType || 'real',
      notes: booking.notes || '',
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
    
    const updateData = {
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      numberOfGuests: data.numberOfGuests,
      extraBedsCount: data.extraBedsCount || 0,
      totalPrice: data.totalPrice,
      paymentStatus: data.paymentStatus,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      notes: data.notes,
    };

    await Booking.findByIdAndUpdate(bookingId, updateData);
    
    revalidatePath('/admin/bookings/calendar');
    revalidatePath('/admin/bookings/list');
    revalidatePath(`/admin/bookings/list/${bookingId}`);
    
    return { success: true, message: 'Rezerwacja zaktualizowana' };
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
      // Usuń powiązane blokady
      await Booking.deleteMany({ linkedBookingId: bookingId });
    }

    await Booking.findByIdAndDelete(bookingId);
    
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/bookings/list');
    revalidatePath('/admin/bookings/calendar');
    
    return { success: true, message: 'Rezerwacja usunięta' };
  } catch (error) {
    console.error('Błąd usuwania rezerwacji:', error);
    return { success: false, error: 'Nie udało się usunąć rezerwacji' };
  }
}