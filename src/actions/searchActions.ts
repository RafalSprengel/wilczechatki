'use server'
import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import Booking from '@/db/models/Booking';
import PriceConfig, { ISeason } from '@/db/models/PriceConfig';
import SystemConfig from '@/db/models/SystemConfig';
import { Types } from 'mongoose';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

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

async function getDailyPrice({
  date,
  config,
  guests,
  extraBeds,
  propertyBaseCapacity
}: {
  date: dayjs.Dayjs;
  config: any;
  guests: number;
  extraBeds: number;
  propertyBaseCapacity: number;
}): Promise<number> {
  const day = date.day();
  const isWeekend = day === 5 || day === 6;

  const activeSeason = config.seasons.find((s: ISeason) =>
    s.isActive &&
    date.isSameOrAfter(dayjs(s.startDate), 'day') &&
    date.isSameOrBefore(dayjs(s.endDate), 'day')
  );

  const ratesSource = activeSeason || config.baseRates;
  const bedPrice = activeSeason?.extraBedPrice ?? config.baseRates.extraBedPrice;
  const tierKey = isWeekend ? 'weekend' : 'weekday';

  const guestsForPricing = Math.min(guests, propertyBaseCapacity);

  const tier = ratesSource[tierKey].find((r: any) =>
    guestsForPricing >= r.minGuests && guestsForPricing <= r.maxGuests
  ) || ratesSource[tierKey][ratesSource[tierKey].length - 1];

  if (!tier) return 0;

  return tier.price + (extraBeds * bedPrice);
}

export async function getMaxTotalGuests() {
  try {
    await dbConnect();
    const properties = await Property.find({ isActive: true, type: 'single' });
    return properties.reduce((sum, prop) => sum + prop.baseCapacity, 0);
  } catch (error) {
    console.error('Błąd podczas pobierania maksymalnej pojemności:', error);
    return 12;
  }
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
  const [config, property] = await Promise.all([
    PriceConfig.findById('main'),
    Property.findById(propertySelection)
  ]);

  if (!config || !property) return 0;

  let total = 0;
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end, 'day')) {
    total += await getDailyPrice({
      date: currentDate,
      config,
      guests,
      extraBeds,
      propertyBaseCapacity: property.baseCapacity
    });
    currentDate = currentDate.add(1, 'day');
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
  const [properties, config] = await Promise.all([
    Property.find({ isActive: true, type: 'single' }).sort({ name: 1 }),
    PriceConfig.findById('main')
  ]);

  if (properties.length === 0 || !config) return 0;

  let total = 0;
  let remainingGuests = guests;
  let remainingExtraBeds = extraBeds;

  for (const property of properties) {
    const guestsForThisCabin = Math.min(remainingGuests, property.baseCapacity);
    const extraBedsForThisCabin = Math.min(remainingExtraBeds, property.maxExtraBeds);

    let currentDate = dayjs(startDate);
    const end = dayjs(endDate);

    while (currentDate.isBefore(end, 'day')) {
      total += await getDailyPrice({
        date: currentDate,
        config,
        guests: guestsForThisCabin,
        extraBeds: extraBedsForThisCabin,
        propertyBaseCapacity: property.baseCapacity
      });
      currentDate = currentDate.add(1, 'day');
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

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    const systemConfig = await SystemConfig.findById('main');
    const autoBlockOtherCabins = systemConfig?.autoBlockOtherCabins ?? true;

    const properties = await Property.find({ isActive: true, type: 'single' }).sort({ name: 1 });
    if (properties.length === 0) return [];

    const options: SearchOption[] = [];

    const allConflictingBookings = await Booking.find({
      propertyId: { $in: properties.map(p => p._id) },
      status: { $in: ['confirmed', 'blocked'] },
      startDate: { $lt: end.toDate() },
      endDate: { $gt: start.toDate() }
    });

    for (const prop of properties) {
      if (guests > prop.baseCapacity + prop.maxExtraBeds) continue;

      const isAvailable = autoBlockOtherCabins 
        ? allConflictingBookings.length === 0 
        : !allConflictingBookings.some(b => b.propertyId.toString() === prop._id.toString());

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
    const totalExtraCapacity = properties.reduce((sum, p) => sum + p.maxExtraBeds, 0);

    if (guests <= totalGuestsCapacity + totalExtraCapacity) {
      const isWholeAvailable = allConflictingBookings.length === 0;

      if (isWholeAvailable) {
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
          maxExtraBeds: totalExtraCapacity,
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