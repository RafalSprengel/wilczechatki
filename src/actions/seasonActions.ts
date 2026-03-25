'use server'

import dbConnect from '@/db/connection';
import Season from '@/db/models/Season';
import { revalidatePath } from 'next/cache';

export interface SeasonData {
  _id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  order: number;
  weekdayPrices: { minGuests: number; maxGuests: number; price: number }[];
  weekendPrices: { minGuests: number; maxGuests: number; price: number }[];
  weekdayExtraBedPrice: number;
  weekendExtraBedPrice: number;
}

export async function getAllSeasons() {
  try {
    await dbConnect();
    const seasons = await Season.find({}).sort({ order: 1 }).lean();
    return JSON.parse(JSON.stringify(seasons)) as SeasonData[];
  } catch (error) {
    console.error('Błąd pobierania sezonów:', error);
    return [];
  }
}

export async function getSeasonById(id: string) {
  try {
    await dbConnect();
    const season = await Season.findById(id).lean();
    if (!season) return null;
    return JSON.parse(JSON.stringify(season)) as SeasonData;
  } catch (error) {
    console.error('Błąd pobierania sezonu:', error);
    return null;
  }
}

export async function updateSeasonDates(seasonId: string, startDate: string, endDate: string) {
  try {
    await dbConnect();
    await Season.findByIdAndUpdate(seasonId, {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });
    revalidatePath('/admin/settings/booking');
    return { success: true, message: 'Zaktualizowano daty sezonu' };
  } catch (error) {
    console.error('Błąd aktualizacji sezonu:', error);
    return { success: false, message: 'Nie udało się zaktualizować dat sezonu' };
  }
}

export async function updateSeasonOrder(seasonId: string, order: number) {
  try {
    await dbConnect();
    await Season.findByIdAndUpdate(seasonId, { order });
    revalidatePath('/admin/settings/booking');
    return { success: true, message: 'Zaktualizowano kolejność wyświetlania' };
  } catch (error) {
    console.error('Błąd aktualizacji kolejności sezonu:', error);
    return { success: false, message: 'Nie udało się zaktualizować kolejności' };
  }
}

export async function updateSeasonPrices(
  seasonId: string,
  data: {
    weekdayPrices: { minGuests: number; maxGuests: number; price: number }[];
    weekendPrices: { minGuests: number; maxGuests: number; price: number }[];
    weekdayExtraBedPrice: number;
    weekendExtraBedPrice: number;
  }
) {
  try {
    await dbConnect();
    await Season.findByIdAndUpdate(seasonId, {
      weekdayPrices: data.weekdayPrices,
      weekendPrices: data.weekendPrices,
      weekdayExtraBedPrice: data.weekdayExtraBedPrice,
      weekendExtraBedPrice: data.weekendExtraBedPrice
    });
    revalidatePath('/admin/prices');
    return { success: true, message: 'Zapisano ceny sezonu' };
  } catch (error) {
    console.error('Błąd zapisu cen sezonu:', error);
    return { success: false, message: 'Wystąpił błąd podczas zapisu' };
  }
}