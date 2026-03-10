'use server'
import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import { revalidatePath } from 'next/cache';
import { calculateTotalPrice as calculatePrice } from './searchActions';

// --- RĘCZNA WALIDACJA --- 
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
  if (!data.guestName) errors.push('Należy podać imię i nazwisko gościa');
  if (!data.guestEmail || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.guestEmail)) errors.push('Niepoprawny format adresu email');
  if (!data.guestPhone) errors.push('Należy podać numer telefonu gościa');
  return errors;
}

// --- POBIERANIE DANYCH ---
export async function getAdminBookingsList() {
  await dbConnect();
  const bookings = await Booking.find({}).populate('propertyId').sort({ startDate: -1 }).lean();
  return JSON.parse(JSON.stringify(bookings));
}

export async function getBookingById(id: string) {
  await dbConnect();
  const booking = await Booking.findById(id).populate('propertyId').lean();
  if (!booking) return null;
  return JSON.parse(JSON.stringify(booking));
}

export async function getAllProperties() {
  await dbConnect();
  const properties = await Property.find({}).lean();
  return JSON.parse(JSON.stringify(properties));
}

// --- AKCJE CRUD ---
export async function createManualBooking(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validationErrors = validateBookingData(rawData);

    if (validationErrors.length > 0) {
        return { message: validationErrors.join(', '), success: false };
    }

    try {
        await dbConnect();
        const newBooking = new Booking({
            ...rawData,
            propertyId: rawData.propertyId === 'both' ? null : rawData.propertyId,
            startDate: new Date(rawData.startDate as string),
            endDate: new Date(rawData.endDate as string),
            numGuests: Number(rawData.numGuests),
            extraBeds: Number(rawData.extraBeds),
            totalPrice: Number(rawData.totalPrice),
            paidAmount: Number(rawData.paidAmount),
            guestInfo: { name: rawData.guestName, email: rawData.guestEmail, phone: rawData.guestPhone },
            status: 'confirmed',
            paymentStatus: Number(rawData.paidAmount) >= Number(rawData.totalPrice) ? 'paid' : (Number(rawData.paidAmount) > 0 ? 'deposit' : 'unpaid'),
            bookingSource: 'manual',
        });
        await newBooking.save();
        revalidatePath('/admin/bookings');
        return { message: 'Rezerwacja została pomyślnie utworzona!', success: true };
    } catch (error: any) {
        return { message: error.message || 'Wystąpił błąd serwera.', success: false };
    }
}

export async function updateBooking(id: string, data: any) {
    const validationErrors = validateBookingData(data);
    if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
    }

    try {
        await dbConnect();
        const updatedBooking = await Booking.findByIdAndUpdate(id, {
            ...data,
            startDate: new Date(data.startDate as string),
            endDate: new Date(data.endDate as string),
            numGuests: Number(data.numGuests),
            extraBeds: Number(data.extraBeds),
            totalPrice: Number(data.totalPrice),
            paidAmount: Number(data.paidAmount),
            guestInfo: { name: data.guestName, email: data.guestEmail, phone: data.guestPhone },
            paymentStatus: Number(data.paidAmount) >= Number(data.totalPrice) ? 'paid' : (Number(data.paidAmount) > 0 ? 'deposit' : 'unpaid'),
        }, { new: true });
        
        if (!updatedBooking) throw new Error('Nie znaleziono rezerwacji');

        revalidatePath('/admin/bookings');
        revalidatePath(`/admin/bookings/list/${id}`);
        return { success: true, message: 'Rezerwacja zaktualizowana.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteBooking(id: string) {
    try {
        await dbConnect();
        await Booking.findByIdAndDelete(id);
        revalidatePath('/admin/bookings');
        return { success: true, message: 'Rezerwacja usunięta.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// --- OBLICZANIE CENY ---
export async function calculatePriceAction(
  params: { startDate: string; endDate: string; guests: number; extraBeds: number; propertySelection: string; }
): Promise<{ price: number }> {
  try {
    const price = await calculatePrice(params);
    return { price };
  } catch (error) {
    console.error('Błąd podczas obliczania ceny:', error);
    return { price: 0 };
  }
}
