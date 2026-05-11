'use server'
import dbConnect from '@/db/connection';
import BookingConfig from '@/db/models/BookingConfig';
import { revalidatePath } from 'next/cache';

export interface BookingConfig {
  minBookingDays: number;
  maxBookingDays: number;
  highSeasonStart: string | null;
  highSeasonEnd: string | null;
  childrenFreeAgeLimit: number;
  allowCheckinOnDepartureDay: boolean;
  checkInHour: number;
  checkOutHour: number;
}

async function ensureBookingConfigExists() {
  try {
    await dbConnect();
    const exists = await BookingConfig.findById('main');
    if (!exists) {
      await BookingConfig.create({
        _id: 'main',
        allowCheckinOnDepartureDay: true,
        checkInHour: 15,
        checkOutHour: 12
      });
    }
  } catch (error) {
    console.error('Błąd podczas sprawdzania konfiguracji rezerwacji:', error);
  }
}

export async function getBookingConfig(): Promise<BookingConfig> {
  try {
    await ensureBookingConfigExists();
    const config = await BookingConfig.findById('main').lean();
    return {
      minBookingDays: config?.minBookingDays ?? 1,
      maxBookingDays: config?.maxBookingDays ?? 30,
      highSeasonEnd: config?.highSeasonEnd ?? null,
      highSeasonStart: config?.highSeasonStart ?? null,
      childrenFreeAgeLimit: config?.childrenFreeAgeLimit ?? 13,
      allowCheckinOnDepartureDay: config?.allowCheckinOnDepartureDay ?? true,
      checkInHour: config?.checkInHour ?? 15,
      checkOutHour: config?.checkOutHour ?? 12
    };
  } catch (error) {
    console.error('Błąd podczas pobierania konfiguracji rezerwacji:', error);
    return {
      minBookingDays: 1,
      maxBookingDays: 30,
      highSeasonEnd: null,
      highSeasonStart: null,
      childrenFreeAgeLimit: 13,
      allowCheckinOnDepartureDay: true,
      checkInHour: 15,
      checkOutHour: 12
    };
  }
}

export async function updateAllowCheckinOnDepartureDay(allow: boolean) {
  try {
    await dbConnect();
    await BookingConfig.findByIdAndUpdate(
      'main',
      { allowCheckinOnDepartureDay: allow },
      { upsert: true }
    );
    revalidatePath('/admin/settings/booking');
    return { success: true, message: 'Zaktualizowano ustawienie' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Błąd zapisu' };
  }
}

export async function updateBookingConfig(_prevState: Record<string, unknown>, formData: FormData) {
  try {
    await dbConnect();
    const minBookingDays = parseInt(formData.get('minBookingDays') as string, 10) || 1;
    const maxBookingDays = parseInt(formData.get('maxBookingDays') as string, 10) || 30;
    const childrenFreeAgeLimit = parseInt(formData.get('childrenFreeAgeLimit') as string, 10) || 13;
    const allowCheckinOnDepartureDay = formData.get('allowCheckinOnDepartureDay') === 'on';
    const checkInHour = parseInt(formData.get('checkInHour') as string, 10) || 15;
    const checkOutHour = parseInt(formData.get('checkOutHour') as string, 10) || 12;

    if (checkInHour < 0 || checkInHour > 23 || checkOutHour < 0 || checkOutHour > 23) {
      return { success: false, message: 'Godziny muszą być w zakresie 0-23.' };
    }

    await BookingConfig.findByIdAndUpdate(
      'main',
      {
        minBookingDays,
        maxBookingDays,
        childrenFreeAgeLimit,
        allowCheckinOnDepartureDay,
        checkInHour,
        checkOutHour
      },
      { upsert: true, new: true }
    );
    revalidatePath('/admin/settings/booking');
    return { success: true, message: 'Zapisano ustawienia rezerwacji.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Wystąpił błąd podczas zapisu.' };
  }
}