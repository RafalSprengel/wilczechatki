'use server'
import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import { revalidatePath } from 'next/cache';
import { calculateTotalPrice as calculatePrice } from './searchActions';

// Ręczna funkcja walidacji
function validateBookingData(data: any) {
  const errors: string[] = [];

  if (!data.propertyId) errors.push('Należy wybrać obiekt');
  if (!data.startDate) errors.push('Należy podać datę rozpoczęcia');
  if (!data.endDate) errors.push('Należy podać datę zakończenia');
  if (new Date(data.endDate) <= new Date(data.startDate)) errors.push('Data zakończenia musi być późniejsza niż data rozpoczęcia');
  
  const numGuests = Number(data.numGuests);
  if (isNaN(numGuests) || numGuests <= 0) errors.push('Liczba gości musi być poprawną liczbą większą od 0');

  const extraBeds = Number(data.extraBeds);
  if (isNaN(extraBeds) || extraBeds < 0) errors.push('Liczba dostawek nie może być ujemna');

  const totalPrice = Number(data.totalPrice);
  if (isNaN(totalPrice) || totalPrice < 0) errors.push('Cena całkowita nie może być ujemna');

  const paidAmount = Number(data.paidAmount);
  if (isNaN(paidAmount) || paidAmount < 0) errors.push('Wpłacona kwota nie może być ujemna');

  if (!data.guestName) errors.push('Należy podać imię i nazwisko gościa');
  if (!data.guestEmail || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.guestEmail)) errors.push('Niepoprawny format adresu email');
  if (!data.guestPhone) errors.push('Należy podać numer telefonu gościa');

  return errors;
}

export async function getAdminBookingsList() {
    await dbConnect();
    const bookings = await Booking.find({}).sort({ startDate: -1 }).lean();
    return JSON.parse(JSON.stringify(bookings));
}

export async function createManualBooking(prevState: any, formData: FormData) {
  await dbConnect();

  const rawData = Object.fromEntries(formData.entries());
  const validationErrors = validateBookingData(rawData);

  if (validationErrors.length > 0) {
    return {
      message: validationErrors.join(', '),
      success: false
    };
  }

  try {
    const newBooking = new Booking({
      propertyId: rawData.propertyId === 'both' ? null : rawData.propertyId,
      properties: rawData.propertyId === 'both' ? [] : [rawData.propertyId],
      startDate: new Date(rawData.startDate as string),
      endDate: new Date(rawData.endDate as string),
      numGuests: Number(rawData.numGuests),
      extraBeds: Number(rawData.extraBeds),
      totalPrice: Number(rawData.totalPrice),
      paidAmount: Number(rawData.paidAmount),
      guestInfo: {
        name: rawData.guestName,
        email: rawData.guestEmail,
        phone: rawData.guestPhone,
      },
      status: 'confirmed',
      paymentStatus: Number(rawData.paidAmount) >= Number(rawData.totalPrice) ? 'paid' : (Number(rawData.paidAmount) > 0 ? 'deposit' : 'unpaid'),
      bookingSource: 'manual',
      internalNotes: rawData.internalNotes,
    });

    await newBooking.save();
    revalidatePath('/admin/bookings');

    return {
      message: 'Rezerwacja została pomyślnie utworzona!',
      success: true
    };

  } catch (error: any) {
    return {
      message: error.message || 'Wystąpił nieoczekiwany błąd serwera.',
      success: false
    };
  }
}

// Akcja do obliczania ceny
export async function calculatePriceAction(
  params: {
    startDate: string;
    endDate: string;
    guests: number;
    extraBeds: number;
    propertySelection: string;
  }
): Promise<{ price: number }> {
  try {
    const price = await calculatePrice(params);
    return { price };
  } catch (error) {
    console.error('Błąd podczas obliczania ceny:', error);
    return { price: 0 };
  }
}
