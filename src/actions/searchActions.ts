'use server'
import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import Booking from '@/db/models/Booking';
import PriceConfig, { ISeason } from '@/db/models/PriceConfig';
import SystemConfig from '@/db/models/SystemConfig';
import { Types } from 'mongoose';

export interface SearchOption {
  type: 'single' | 'double';
  propertyIds: string[];
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

// Wyeksportowana i zrefaktoryzowana funkcja do obliczania ceny
export async function calculateTotalPrice(
  { startDate, endDate, guests, extraBeds = 0, propertySelection }: {
    startDate: string;
    endDate: string;
    guests: number;
    extraBeds?: number;
    propertySelection: 'both' | string;
  }
): Promise<number> {
  if (!startDate || !endDate || !guests) return 0;
  
  await dbConnect();
  const config = await PriceConfig.findById('main');
  if (!config) return 0;

  let propertiesCount = 1;
  if (propertySelection === 'both') {
    propertiesCount = await Property.countDocuments({ isActive: true });
    propertiesCount = propertiesCount > 0 ? propertiesCount : 1;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  let total = 0;

  const guestsPerCabin = Math.ceil(guests / propertiesCount);
  const extraBedsPerCabin = Math.ceil(extraBeds / propertiesCount);

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
      guestsPerCabin >= r.minGuests && guestsPerCabin <= r.maxGuests
    ) || ratesSource[tierKey][ratesSource[tierKey].length - 1];

    if (!tier) continue; 

    const nightPrice = tier.price + (extraBedsPerCabin * bedPrice);
    total += nightPrice * propertiesCount;
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

    const properties = await Property.find({ isActive: true });
    if (properties.length === 0) return [];

    const propertyIds = properties.map(p => p._id.toString());

    const conflictingBookings = await Booking.find({
      propertyId: { $in: propertyIds.map(id => new Types.ObjectId(id)) },
      status: { $in: ['confirmed', 'blocked'] },
      startDate: { $lte: end },
      endDate: { $gte: start }
    }).select('propertyId');

    const bookedPropertyIds = new Set(
      conflictingBookings.map(b => b.propertyId.toString())
    );

    const availableProperties = properties.filter(p => !bookedPropertyIds.has(p._id.toString()));
    const options: SearchOption[] = [];

    // Opcje pojedynczych domków
    for (const prop of availableProperties) {
      const price = await calculateTotalPrice({ startDate, endDate, guests, extraBeds, propertySelection: prop._id.toString() });
      
      const baseCapacity = Number(prop.baseCapacity) || 0;
      const maxExtraBedsValue = Number(prop.maxExtraBeds) || 0;
      const maxGuests = baseCapacity + maxExtraBedsValue;
      
      options.push({
        type: 'single',
        propertyIds: [prop._id.toString()],
        displayName: prop.name,
        totalPrice: price,
        maxGuests: maxGuests,
        maxExtraBeds: maxExtraBedsValue,
        description: "Wynajem pojedynczego domku.",
        available: true
      });
    }

    // Opcja całej posesji
    if (availableProperties.length === properties.length && properties.length > 1) {
      const totalMaxGuests = properties.reduce((sum, p) => sum + (Number(p.baseCapacity) || 0) + (Number(p.maxExtraBeds) || 0), 0);
      const totalMaxExtraBeds = properties.reduce((sum, p) => sum + (Number(p.maxExtraBeds) || 0), 0);
      const price = await calculateTotalPrice({ startDate, endDate, guests, extraBeds, propertySelection: 'both' });
      
      options.push({
        type: 'double',
        propertyIds: properties.map(p => p._id.toString()),
        displayName: "Cała Posesja (Wszystkie domki)",
        totalPrice: price,
        maxGuests: totalMaxGuests,
        maxExtraBeds: totalMaxExtraBeds,
        description: "Maksymalna prywatność. Wynajem wszystkich domków.",
        available: true
      });
    }

    return options.sort((a, b) => {
      if (a.type === 'double') return -1;
      if (b.type === 'double') return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  } catch (error) {
    console.error("Błąd wyszukiwania dostępności:", error);
    throw new Error("Nie udało się pobrać dostępnych terminów.");
  }
}
