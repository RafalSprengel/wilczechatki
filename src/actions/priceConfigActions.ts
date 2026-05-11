'use server'

import dbConnect from '@/db/connection';
import PriceConfig from '@/db/models/PriceConfig';
import CustomPrice from '@/db/models/CustomPrice';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import dayjs from 'dayjs';

interface PriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

interface SeasonUpdate {
  seasonIndex: string; // "season0", "season1", etc.
  weekday: PriceTier[];
  weekend: PriceTier[];
  weekdayExtraBedPrice: number;
  weekendExtraBedPrice: number;
  childrenFreeAgeLimit: number;
}

interface CustomPriceUpdate {
  propertyId: string;
  dates: string[];
  prices: PriceTier[];
  extraBedPrice: number;
}

export interface CustomPriceEntry {
  date: string;
  prices: PriceTier[];
  previewPrice: number;
  propertyId: string;
  extraBedPrice?: number;
}

// Tymczasowo wyłączona funkcja updatePriceConfig
// export async function updatePriceConfig(prevState: any, formData: FormData) {
//   try {
//     await dbConnect();
//
//     const seasonIndex = formData.get('seasonIndex') as string;
//     const weekdayTiers = JSON.parse(formData.get('weekdayTiers') as string) as PriceTier[];
//     const weekendTiers = JSON.parse(formData.get('weekendTiers') as string) as PriceTier[];
//     const weekdayExtraBedPrice = parseInt(formData.get('weekdayExtraBedPrice') as string) || 50;
//     const weekendExtraBedPrice = parseInt(formData.get('weekendExtraBedPrice') as string) || 70;
//     const childrenFreeAgeLimit = parseInt(formData.get('childrenFreeAgeLimit') as string) || 13;
//
//     // Wymuś godzinę 12:00 dla startDate i endDate jeśli są obecne w formData
//     const startDateRaw = formData.get('startDate') as string | undefined;
//     const endDateRaw = formData.get('endDate') as string | undefined;
//     let startDate: Date | undefined;
//     let endDate: Date | undefined;
//     if (startDateRaw) {
//       const d = new Date(startDateRaw);
//       d.setHours(12, 0, 0, 0);
//       startDate = d;
//     }
//     if (endDateRaw) {
//       const d = new Date(endDateRaw);
//       d.setHours(12, 0, 0, 0);
//       endDate = d;
//     }
//
//     const updateData: any = {};
//     if (startDate) updateData[`${seasonIndex}.startDate`] = startDate;
//     if (endDate) updateData[`${seasonIndex}.endDate`] = endDate;
//     updateData[`${seasonIndex}.weekday`] = weekdayTiers;
//     updateData[`${seasonIndex}.weekend`] = weekendTiers;
//     updateData[`${seasonIndex}.weekdayExtraBedPrice`] = weekdayExtraBedPrice;
//     updateData[`${seasonIndex}.weekendExtraBedPrice`] = weekendExtraBedPrice;
//     updateData.childrenFreeAgeLimit = childrenFreeAgeLimit;
//
//     await PriceConfig.findByIdAndUpdate(
//       'main',
//       { $set: updateData },
//       { upsert: true, new: true }
//     );
//
//     revalidatePath('/admin/prices');
//     return { success: true, message: `Zapisano konfigurację dla ${seasonIndex}.` };
//   } catch (error) {
//     console.error('Błąd zapisu cen:', error);
//     return { success: false, message: 'Wystąpił błąd podczas zapisu.' };
//   }
// }


export async function updateCustompriceForDate(data: CustomPriceUpdate) {
  try {
    await dbConnect();

    if (!data.propertyId || !Array.isArray(data.dates) || data.dates.length === 0) {
      return { success: false, message: 'Brak wymaganych danych zapisu.' };
    }

    if (!Array.isArray(data.prices) || data.prices.length === 0) {
      return { success: false, message: 'Brak przedziałów cenowych do zapisania.' };
    }

    const normalizedExtraBedPrice =
      typeof data.extraBedPrice === 'number' ? data.extraBedPrice : 50;

    const operations = data.dates.map(date => ({
      updateOne: {
        filter: {
          propertyId: new mongoose.Types.ObjectId(data.propertyId),
          date: dayjs(date).startOf('day').toDate() 
        },
        update: {
          $set: {
            prices: data.prices,
            extraBedPrice: normalizedExtraBedPrice,
            updatedAt: new Date()
          },
        },
        upsert: true
      }
    }));

    await CustomPrice.collection.bulkWrite(operations as any[]);
    revalidatePath('/admin/prices');
    
    return { success: true, message: `Zapisano ceny dla zaznaczonych dni.` };
  } catch (error) {
    console.error('Błąd zapisu custom prices:', error);
    return { success: false, message: 'Błąd bazy danych.' };
  }
}

export async function deleteCustomPricesForDate(data: { propertyId: string; dates: string[] }) {
  try {
    await dbConnect();

    const datesAsDates = data.dates.map(date => dayjs(date).startOf('day').toDate());

    await CustomPrice.deleteMany({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      date: { $in: datesAsDates }
    });

    revalidatePath('/admin/prices');
    
    return { success: true, message: `Przywrócono ceny sezonowe dla usuniętego elementu.` };
  } catch (error) {
    console.error('Błąd usuwania cen:', error);
    return { success: false, message: 'Błąd bazy danych podczas usuwania.' };
  }
}

export async function getCustomPrices(propertyId: string): Promise<CustomPriceEntry[]> {
  try {
    await dbConnect();
    const prices = await CustomPrice.collection
      .find({ propertyId: new mongoose.Types.ObjectId(propertyId) })
      .sort({ date: 1 })
      .toArray();

    return prices.map((p: any) => ({
      date: dayjs(p.date).format('YYYY-MM-DD'),
      prices: p.prices ?? [],
      previewPrice: p.prices?.[0]?.price ?? 0,
      propertyId: p.propertyId.toString(),
      extraBedPrice: p.extraBedPrice,
    }));
  } catch (error) {
    return [];
  }
}

export async function getPriceConfig() {
  try {
    await dbConnect();
    const config = await PriceConfig.findById('main').lean();
    if (!config) return null;
    return JSON.parse(JSON.stringify(config));
  } catch (error) {
    console.error('Błąd pobierania konfiguracji cen:', error);
    return null;
  }
}