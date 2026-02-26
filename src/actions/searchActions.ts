'use server'
import dbConnect from '@/db/connection';
import Property, { IProperty } from '@/db/models/Property';
import Booking from '@/db/models/Booking';
import PriceConfig, { IPriceConfig, ISeason } from '@/db/models/PriceConfig';
import SystemConfig from '@/db/models/SystemConfig';
import { Types } from 'mongoose';

export interface SearchOption {
  type: 'single' | 'double';
  propertyIds: string[];
  displayName: string;
  totalPrice: number;
  maxGuests: number;
  description: string;
  available: boolean;
}

interface SearchParams {
  startDate: string;
  endDate: string;
  guests: number;
  extraBeds?: number;
}

async function calculateTotalPrice(
  startDate: string,
  endDate: string,
  guests: number,
  extraBeds: number,
  isDouble: boolean = false
): Promise<number> {
  await dbConnect();
  const config = await PriceConfig.findById('main');
  if (!config) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  let total = 0;

  const guestsPerCabin = isDouble ? Math.ceil(guests / 2) : guests;
  const extraBedsPerCabin = isDouble ? Math.ceil(extraBeds / 2) : extraBeds;

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

    const nightPrice = tier.price + (extraBedsPerCabin * bedPrice);
    total += isDouble ? nightPrice * 2 : nightPrice;
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

    let sysConfig = await SystemConfig.findById('main');
    if (!sysConfig) {
      sysConfig = { autoBlockOtherCabins: true } as any;
    }

    const isAutoBlockEnabled = sysConfig.autoBlockOtherCabins;
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

    const options: SearchOption[] = [];

    if (isAutoBlockEnabled) {
      const anyBooked = bookedPropertyIds.size > 0;
      const allBooked = bookedPropertyIds.size === properties.length;

      if (!anyBooked) {
        for (const prop of properties) {
          const price = await calculateTotalPrice(startDate, endDate, guests, extraBeds, false);
          options.push({
            type: 'single',
            propertyIds: [prop._id.toString()],
            displayName: prop.name,
            totalPrice: price,
            maxGuests: prop.baseCapacity + (prop.maxCapacityWithExtra - prop.baseCapacity),
            description: "Wynajem pojedynczego domku. Drugi domek zostanie automatycznie zablokowany na ten termin.",
            available: true
          });
        }

        const doublePrice = await calculateTotalPrice(startDate, endDate, guests, extraBeds, true);
        options.push({
          type: 'double',
          propertyIds: properties.map(p => p._id.toString()),
          displayName: "Cała Posesja (Wszystkie domki)",
          totalPrice: doublePrice,
          maxGuests: properties.reduce((sum, p) => sum + p.baseCapacity, 0),
          description: "Maksymalna prywatność. Wynajem całej posesji.",
          available: true
        });
      } else if (allBooked) {
        return [];
      } else {
        return [];
      }
    } else {
      for (const prop of properties) {
        const isBooked = bookedPropertyIds.has(prop._id.toString());
        if (!isBooked) {
          const price = await calculateTotalPrice(startDate, endDate, guests, extraBeds, false);
          options.push({
            type: 'single',
            propertyIds: [prop._id.toString()],
            displayName: prop.name,
            totalPrice: price,
            maxGuests: prop.baseCapacity + (prop.maxCapacityWithExtra - prop.baseCapacity),
            description: "Wynajem pojedynczego domku. Drugi domek może być wynajmowany niezależnie.",
            available: true
          });
        }
      }

      const allFree = properties.every(p => !bookedPropertyIds.has(p._id.toString()));
      if (allFree && properties.length > 1) {
        const price = await calculateTotalPrice(startDate, endDate, guests, extraBeds, true);
        options.push({
          type: 'double',
          propertyIds: properties.map(p => p._id.toString()),
          displayName: "Cała Posesja (Wszystkie domki)",
          totalPrice: price,
          maxGuests: properties.reduce((sum, p) => sum + p.baseCapacity, 0),
          description: "Maksymalna prywatność. Wynajem wszystkich dostępnych domków.",
          available: true
        });
      }
    }

    return options.sort((a, b) => {
      if (a.type === 'double') return -1;
      if (b.type === 'double') return 1;
      return b.totalPrice - a.totalPrice;
    });
  } catch (error) {
    console.error("Błąd wyszukiwania dostępności:", error);
    throw new Error("Nie udało się pobrać dostępnych terminów.");
  }
}