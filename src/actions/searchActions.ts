'use server'
import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import Booking from '@/db/models/Booking';
import PriceConfig, { ISeason } from '@/db/models/PriceConfig';
import SystemConfig from '@/db/models/SystemConfig';
import { Types } from 'mongoose';

export interface SearchOption {
  type: 'single' | 'whole';
  displayName: string;
  totalPrice: number;
  maxGuests: number;
  maxExtraBeds: number;
  description: string;
  available: boolean;
}

interface SearchParams {
  startDate: string;
  endDate: string;
  guests: number;
  extraBeds?: number;
}

export async function calculateTotalPrice({
  startDate,
  endDate,
  guests,
  extraBeds = 0,
  propertySelection
}: {
  startDate: string;
  endDate: string;
  guests: number;
  extraBeds?: number;
  propertySelection: string;
}): Promise<number> {
  if (!startDate || !endDate || !guests) return 0;
  await dbConnect();
  const config = await PriceConfig.findById('main');
  if (!config) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  let total = 0;
  const property = await Property.findById(propertySelection);
  
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    const isWeekend = (day === 5 || day === 6);
    const activeSeason = config.seasons.find((s: ISeason) =>
      s.isActive && d >= s.startDate && d <= s.endDate
    );
    const ratesSource = activeSeason || config.baseRates;
    const bedPrice = activeSeason?.extraBedPrice ?? config.baseRates.extraBedPrice;
    const tierKey = isWeekend ? 'weekend' : 'weekday';
    const guestsForPricing = Math.min(guests, property?.baseCapacity || guests);
    const tier = ratesSource[tierKey].find(r =>
      guestsForPricing >= r.minGuests && guestsForPricing <= r.maxGuests
    ) || ratesSource[tierKey][ratesSource[tierKey].length - 1];
    if (!tier) continue;
    const nightPrice = tier.price + (extraBeds * bedPrice);
    total += nightPrice;
  }
  return total;
}

export async function calculateTotalPriceForWhole({
  startDate,
  endDate,
  guests,
  extraBeds = 0
}: {
  startDate: string;
  endDate: string;
  guests: number;
  extraBeds?: number;
}): Promise<number> {
  if (!startDate || !endDate || !guests) return 0;
  await dbConnect();
  
  const properties = await Property.find({ isActive: true, type: 'single' }).sort({ name: 1 });
  if (properties.length === 0) return 0;
  
  const config = await PriceConfig.findById('main');
  if (!config) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  let total = 0;
  let remainingGuests = guests;
  let remainingExtraBeds = extraBeds;

  for (const property of properties) {
    const guestsForThisCabin = Math.min(remainingGuests, property.baseCapacity);
    const extraBedsForThisCabin = Math.min(remainingExtraBeds, property.maxExtraBeds);
    
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      const isWeekend = (day === 5 || day === 6);
      const activeSeason = config.seasons.find((s: ISeason) =>
        s.isActive && d >= s.startDate && d <= s.endDate
      );
      const ratesSource = activeSeason || config.baseRates;
      const bedPrice = activeSeason?.extraBedPrice ?? config.baseRates.extraBedPrice;
      const tierKey = isWeekend ? 'weekend' : 'weekday';
      const tier = ratesSource[tierKey].find(r =>
        guestsForThisCabin >= r.minGuests && guestsForThisCabin <= r.maxGuests
      ) || ratesSource[tierKey][ratesSource[tierKey].length - 1];
      if (!tier) continue;
      const nightPrice = tier.price + (extraBedsForThisCabin * bedPrice);
      total += nightPrice;
    }
    
    remainingGuests -= guestsForThisCabin;
    remainingExtraBeds -= extraBedsForThisCabin;
  }
  
  return total;
}

export async function searchAction({
  startDate,
  endDate,
  guests,
  extraBeds = 0
}: SearchParams): Promise<SearchOption[]> {
  try {
    await dbConnect();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const systemConfig = await SystemConfig.findById('main');
    const autoBlockOtherCabins = systemConfig?.autoBlockOtherCabins ?? true;
    const properties = await Property.find({ isActive: true, type: 'single' }).sort({ name: 1 });
    
    if (properties.length === 0) return [];
    
    const options: SearchOption[] = [];

    for (const prop of properties) {
      if (guests > prop.baseCapacity) {
        continue;
      }
      
      let conflictingBookings;
      if (autoBlockOtherCabins) {
        conflictingBookings = await Booking.find({
          propertyId: { $in: properties.map(p => p._id) },
          status: { $in: ['confirmed', 'blocked'] },
          startDate: { $lte: end },
          endDate: { $gte: start }
        });
      } else {
        conflictingBookings = await Booking.find({
          propertyId: prop._id,
          status: { $in: ['confirmed', 'blocked'] },
          startDate: { $lte: end },
          endDate: { $gte: start }
        });
      }
      const isAvailable = conflictingBookings.length === 0;
      const price = await calculateTotalPrice({
        startDate,
        endDate,
        guests,
        extraBeds,
        propertySelection: prop._id.toString()
      });
      options.push({
        type: 'single',
        displayName: prop.name,
        totalPrice: price,
        maxGuests: prop.baseCapacity,
        maxExtraBeds: prop.maxExtraBeds,
        description: prop.description || "Wynajem pojedynczego domku.",
        available: isAvailable
      });
    }

    const totalGuestsCapacity = properties.reduce((sum, p) => sum + p.baseCapacity, 0);
    
    if (guests <= totalGuestsCapacity) {
      const allCabinsAvailable = await Booking.find({
        propertyId: { $in: properties.map(p => p._id) },
        status: { $in: ['confirmed', 'blocked'] },
        startDate: { $lte: end },
        endDate: { $gte: start }
      });

      if (allCabinsAvailable.length === 0) {
        const totalExtraBedsCapacity = properties.reduce((sum, p) => sum + p.maxExtraBeds, 0);
        const price = await calculateTotalPriceForWhole({
          startDate,
          endDate,
          guests,
          extraBeds
        });
        
        options.push({
          type: 'whole',
          displayName: 'Cała posesja',
          totalPrice: price,
          maxGuests: totalGuestsCapacity,
          maxExtraBeds: totalExtraBedsCapacity,
          description: 'Wynajem całej posesji - wszystkie domki.',
          available: true
        });
      }
    }

    return options.sort((a, b) => {
      if (a.type === 'whole') return -1;
      if (b.type === 'whole') return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  } catch (error) {
    console.error("Błąd wyszukiwania dostępności:", error);
    throw new Error("Nie udało się pobrać dostępnych terminów.");
  }
}