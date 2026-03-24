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
  price: number;
  weekdayExtraBedPrice: number;
  weekendExtraBedPrice: number;
}

export interface CustomPriceEntry {
  date: string;
  price: number;
  propertyId: string;
  weekdayExtraBedPrice?: number;
  weekendExtraBedPrice?: number;
}

export async function updatePriceConfig(prevState: any, formData: FormData) {
  try {
    await dbConnect();

    const seasonIndex = formData.get('seasonIndex') as string;
    const weekdayTiers = JSON.parse(formData.get('weekdayTiers') as string) as PriceTier[];
    const weekendTiers = JSON.parse(formData.get('weekendTiers') as string) as PriceTier[];
    const weekdayExtraBedPrice = parseInt(formData.get('weekdayExtraBedPrice') as string) || 50;
    const weekendExtraBedPrice = parseInt(formData.get('weekendExtraBedPrice') as string) || 70;
    const childrenFreeAgeLimit = parseInt(formData.get('childrenFreeAgeLimit') as string) || 13;

    const updateData: any = {};
    updateData[`${seasonIndex}.weekday`] = weekdayTiers;
    updateData[`${seasonIndex}.weekend`] = weekendTiers;
    updateData[`${seasonIndex}.weekdayExtraBedPrice`] = weekdayExtraBedPrice;
    updateData[`${seasonIndex}.weekendExtraBedPrice`] = weekendExtraBedPrice;
    updateData.childrenFreeAgeLimit = childrenFreeAgeLimit;

    await PriceConfig.findByIdAndUpdate(
      'main',
      { $set: updateData },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/prices');
    return { success: true, message: `Zapisano konfigurację dla ${seasonIndex}.` };
  } catch (error) {
    console.error('Błąd zapisu cen:', error);
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
            weekdayExtraBedPrice: data.weekdayExtraBedPrice,
            weekendExtraBedPrice: data.weekendExtraBedPrice,
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
      propertyId: p.propertyId.toString(),
      weekdayExtraBedPrice: p.weekdayExtraBedPrice,
      weekendExtraBedPrice: p.weekendExtraBedPrice
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