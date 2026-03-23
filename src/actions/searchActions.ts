'use server'
import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import Booking from '@/db/models/Booking';
import PriceConfig, { ISeason } from '@/db/models/PriceConfig';
import CustomPrice from '@/db/models/CustomPrice';
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

// Helper to check if date is in season ignoring the year (MM-DD comparison)
function isDateInSeason(date: dayjs.Dayjs, startStr?: string | null, endStr?: string | null) {
  if (!startStr || !endStr) return false;
  // Format as MM-DD to ignore year
  const d = date.format('MM-DD');
  const s = dayjs(startStr).format('MM-DD');
  const e = dayjs(endStr).format('MM-DD');

  if (s <= e) {
    // Standard range (e.g. 06-01 to 08-31)
    return d >= s && d <= e;
  } else {
    // Cross-year range (e.g. 12-20 to 01-05)
    return d >= s || d <= e;
  }
}

async function getDailyPrice({
  date,
  config,
  systemConfig,
  guests,
  extraBeds,
  propertyBaseCapacity,
  customPrices
}: {
  date: dayjs.Dayjs;
  config: any;
  systemConfig: any;
  guests: number;
  extraBeds: number;
  propertyBaseCapacity: number;
  customPrices: Map<string, any>;
}): Promise<number> {
  // 1. Check for Individual Price (CustomPrice) - Highest Priority
  const dateKey = date.format('YYYY-MM-DD');
  const customPrice = customPrices.get(dateKey);

  if (customPrice) {
    return customPrice.price + (extraBeds * customPrice.extraBedPrice);
  }

  const day = date.day();
  const isWeekend = day === 5 || day === 6;

  // 2. Check for High Season (Recurring)
  const isHighSeason = isDateInSeason(date, systemConfig?.highSeasonStart, systemConfig?.highSeasonEnd);
  
  let ratesSource = config.baseRates;
  let bedPrice = config.baseRates.extraBedPrice;
  const tierKey = isWeekend ? 'weekend' : 'weekday';

  if (isHighSeason && config.baseRates.highSeason) {
    // Use High Season rates
    ratesSource = config.baseRates.highSeason;
    bedPrice = config.baseRates.highSeason.extraBedPrice ?? config.baseRates.extraBedPrice;
  }

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
  const [config, property, systemConfig, customPricesDocs] = await Promise.all([
    PriceConfig.findById('main'),
    Property.findById(propertySelection),
    SystemConfig.findById('main'),
    CustomPrice.find({
      propertyId: propertySelection,
      date: { $gte: dayjs(startDate).toDate(), $lt: dayjs(endDate).toDate() }
    })
  ]);

  if (!config || !property) return 0;

  // Create map for O(1) lookup
  const customPricesMap = new Map();
  customPricesDocs.forEach((cp: any) => {
    customPricesMap.set(dayjs(cp.date).format('YYYY-MM-DD'), cp);
  });

  let total = 0;
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end, 'day')) {
    total += await getDailyPrice({
      date: currentDate,
      config,
      systemConfig,
      guests,
      extraBeds,
      propertyBaseCapacity: property.baseCapacity,
      customPrices: customPricesMap
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
  const [properties, config, systemConfig, allCustomPrices] = await Promise.all([
    Property.find({ isActive: true, type: 'single' }).sort({ name: 1 }),
    PriceConfig.findById('main'),
    SystemConfig.findById('main'),
    CustomPrice.find({
      date: { $gte: dayjs(startDate).toDate(), $lt: dayjs(endDate).toDate() }
    })
  ]);

  if (properties.length === 0 || !config) return 0;

  // Group custom prices by propertyId -> date -> price
  const propertyCustomPrices = new Map<string, Map<string, any>>();
  allCustomPrices.forEach((cp: any) => {
    const pId = cp.propertyId.toString();
    if (!propertyCustomPrices.has(pId)) propertyCustomPrices.set(pId, new Map());
    propertyCustomPrices.get(pId)?.set(dayjs(cp.date).format('YYYY-MM-DD'), cp);
  });

  let total = 0;
  let remainingGuests = guests;
  let remainingExtraBeds = extraBeds;

  for (const property of properties) {
    const guestsForThisCabin = Math.min(remainingGuests, property.baseCapacity);
    const extraBedsForThisCabin = Math.min(remainingExtraBeds, property.maxExtraBeds);
    const customPricesMap = propertyCustomPrices.get(property._id.toString()) || new Map();

    let currentDate = dayjs(startDate);
    const end = dayjs(endDate);

    while (currentDate.isBefore(end, 'day')) {
      total += await getDailyPrice({
        date: currentDate,
        config,
        systemConfig,
        guests: guestsForThisCabin,
        extraBeds: extraBedsForThisCabin,
        propertyBaseCapacity: property.baseCapacity,
        customPrices: customPricesMap
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