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

interface BaseRatesUpdate {
  weekday: PriceTier[];
  weekend: PriceTier[];
  highSeason: {
    weekday: PriceTier[];
    weekend: PriceTier[];
    extraBedPrice: number;
  };
  extraBedPrice: number;
  childrenFreeAgeLimit: number;
}

interface CustomPriceUpdate {
  propertyId: string;
  dates: string[];
  price: number;
  extraBedPrice: number;
}

export interface CustomPriceEntry {
  date: string;
  price: number;
  propertyId: string;
}

export async function updatePriceConfig(prevState: any, formData: FormData) {
  try {
    await dbConnect();

    const weekdayTiers = JSON.parse(formData.get('weekdayTiers') as string) as PriceTier[];
    const weekendTiers = JSON.parse(formData.get('weekendTiers') as string) as PriceTier[];
    const highSeasonWeekdayTiers = JSON.parse(formData.get('highSeasonWeekdayTiers') as string) as PriceTier[];
    const highSeasonWeekendTiers = JSON.parse(formData.get('highSeasonWeekendTiers') as string) as PriceTier[];
    const highSeasonExtraBedPrice = parseInt(formData.get('highSeasonExtraBedPrice') as string) || 0;
    const extraBedPrice = parseInt(formData.get('extraBedPrice') as string) || 50;
    const childrenFreeAgeLimit = parseInt(formData.get('childrenFreeAgeLimit') as string) || 13;

    await PriceConfig.findByIdAndUpdate(
      'main',
      {
        baseRates: {
          weekday: weekdayTiers,
          weekend: weekendTiers,
          highSeason: {
            weekday: highSeasonWeekdayTiers,
            weekend: highSeasonWeekendTiers,
            extraBedPrice: highSeasonExtraBedPrice
          },
          extraBedPrice,
          childrenFreeAgeLimit
        }
      },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/prices');
    return { success: true, message: 'Zapisano ceny podstawowe.' };
  } catch (error) {
    console.error('Błąd zapisu cen:', error);
    return { success: false, message: 'Wystąpił błąd podczas zapisu.' };
  }
}

export async function updateBaseRates(data: BaseRatesUpdate) {
  try {
    await dbConnect();

    await PriceConfig.findByIdAndUpdate(
      'main',
      {
        baseRates: {
          weekday: data.weekday,
          weekend: data.weekend,
          highSeason: data.highSeason,
          extraBedPrice: data.extraBedPrice,
          childrenFreeAgeLimit: data.childrenFreeAgeLimit
        }
      },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/prices');
    return { success: true, message: 'Zapisano ceny podstawowe.' };
  } catch (error) {
    console.error('Błąd zapisu cen podstawowych:', error);
    return { success: false, message: 'Wystąpił błąd podczas zapisu.' };
  }
}

export async function updateCustompriceForDate(data: CustomPriceUpdate) {
  try {
    await dbConnect();

    const operations = data.dates.map(date => ({
      updateOne: {
        filter: {
          propertyId: new mongoose.Types.ObjectId(data.propertyId),
          date: dayjs(date).startOf('day').toDate() 
        },
        update: {
          $set: {
            price: data.price,
            extraBedPrice: data.extraBedPrice,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    await CustomPrice.bulkWrite(operations);
    revalidatePath('/admin/prices');
    
    return { success: true, message: `Zapisano ceny dla ${data.dates.length} dni.` };
  } catch (error) {
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
    
    return { success: true, message: `Przywrócono ceny sezonowe dla ${data.dates.length} dni.` };
  } catch (error) {
    console.error('Błąd usuwania cen:', error);
    return { success: false, message: 'Błąd bazy danych podczas usuwania.' };
  }
}

export async function getCustomPrices(propertyId: string): Promise<CustomPriceEntry[]> {
  try {
    await dbConnect();
    const prices = await CustomPrice.find({ propertyId }).sort({ date: 1 }).lean();

    return prices.map((p: any) => ({
      date: dayjs(p.date).format('YYYY-MM-DD'),
      price: p.price,
      propertyId: p.propertyId.toString()
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