'use server'

import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import PropertyPrices from '@/db/models/PropertyPrices';
import Booking from '@/db/models/Booking';
import PriceConfig from '@/db/models/PriceConfig';
import Season, { ISeason } from '@/db/models/Season';
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
}

interface SearchParams {
  startDate: string;
  endDate: string;
  baseGuests: number;
  extraBeds: number;
}

interface CalculateTotalPriceParams {
  startDate: string;
  endDate: string;
  baseGuests: number;
  extraBeds: number;
  propertySelection: string;
}

export interface CabinAllocation {
  propertyId: string;
  baseGuests: number;
  extraBeds: number;
}

interface CalculateTotalPriceForWholeParams {
  startDate: string;
  endDate: string;
  baseGuests: number;
  extraBeds: number;
  cabinAllocations: CabinAllocation[];
}

interface GetDailyPriceParams {
  date: dayjs.Dayjs;
  baseGuests: number;
  extraBeds: number;
  propertyBaseCapacity: number;
  customPrices: Map<string, any>;
  activeSeasons: ISeason[];
  basicPrices: any | null;
  seasonPricesMap: Map<string, any>;
}

const DEFAULT_FALLBACK_NIGHT_PRICE = 1000;
const DEFAULT_FALLBACK_EXTRA_BED_PRICE = 50;

function createFallbackBasicPrices(propertyBaseCapacity: number) {
  return {
    seasonId: null,
    weekdayPrices: [
      {
        minGuests: 1,
        maxGuests: Math.max(1, propertyBaseCapacity),
        price: DEFAULT_FALLBACK_NIGHT_PRICE,
      },
    ],
    weekendPrices: [
      {
        minGuests: 1,
        maxGuests: Math.max(1, propertyBaseCapacity),
        price: DEFAULT_FALLBACK_NIGHT_PRICE,
      },
    ],
    weekdayExtraBedPrice: DEFAULT_FALLBACK_EXTRA_BED_PRICE,
    weekendExtraBedPrice: DEFAULT_FALLBACK_EXTRA_BED_PRICE,
  };
}

function findPriceTier(
  tiers: { minGuests: number; maxGuests: number; price: number }[] | undefined,
  baseGuests: number
): { minGuests: number; maxGuests: number; price: number } | null {
  if (!tiers?.length) return null;
  const matchedTier = tiers.find((r) => baseGuests >= r.minGuests && baseGuests <= r.maxGuests);
  if (matchedTier) return matchedTier;

  // For guests below the first threshold (e.g. 0 in whole-property allocation),
  // use the lowest tier instead of falling back to the highest one.
  if (baseGuests < tiers[0].minGuests) return tiers[0];

  return tiers[tiers.length - 1];
}

function isDateInRecurringSeason(date: dayjs.Dayjs, season: ISeason): boolean {

  const normalize = (dateInput: Date | string | number): number => {
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) {
      throw new Error('Nieprawidlowy format daty');
    }

    d.setHours(0, 0, 0, 0);
    d.setFullYear(2000);

    return d.getTime();
  };

  const check = normalize(date.toDate());
  const start = normalize(season.startDate);
  const end = normalize(season.endDate);

  if (start <= end) {
    return check >= start && check <= end;
  }
  return check >= start || check <= end;
}

// ─── Pomocnicza funkcja kalkulacji ceny za jedną noc ─────────────────────────

async function getDailyPrice({
  date,
  baseGuests,
  extraBeds,
  propertyBaseCapacity,
  customPrices,
  activeSeasons,
  basicPrices,
  seasonPricesMap,
}: GetDailyPriceParams): Promise<number> {
  const dateKey = date.format('YYYY-MM-DD');
  const customPrice = customPrices.get(dateKey);
  const day = date.day();
  const isWeekend = day === 5 || day === 6; // piątek i sobota

  // 1. CustomPrice (schema: stałe tiery per konkretny dzień)
  if (customPrice) {
    const tiers = customPrice.prices;
    const tier = findPriceTier(tiers, baseGuests);
    if (tier) {
      const bedPrice = customPrice.extraBedPrice;
      return tier.price + extraBeds * (bedPrice ?? 0);
    }
  }

  // 2. Sezon — tylko gdy data wpada w zakres sezonu I jest wpis PropertyPrices dla tego seasonId
  // 3. W przeciwnym razie (brak sezonu dla daty albo brak cen sezonowych dla property) → cennik podstawowy

  const activeSeason = activeSeasons.find((s) => isDateInRecurringSeason(date, s));

  const seasonPrices =
    activeSeason &&
    seasonPricesMap.get(String((activeSeason as { _id?: unknown })._id));

  let ratesSource: any[];
  let bedPrice: number;

  if (seasonPrices) {
    ratesSource = isWeekend ? seasonPrices.weekendPrices : seasonPrices.weekdayPrices;
    bedPrice = isWeekend
      ? seasonPrices.weekendExtraBedPrice
      : seasonPrices.weekdayExtraBedPrice;
  } else {
    ratesSource = isWeekend ? basicPrices.weekendPrices : basicPrices.weekdayPrices;
    bedPrice = isWeekend
      ? basicPrices.weekendExtraBedPrice
      : basicPrices.weekdayExtraBedPrice;
  }

  const tier = findPriceTier(ratesSource, baseGuests);

  if (!tier) throw new Error(`Brak odpowiedniego przedziału cenowego dla ${baseGuests} gości w ${isWeekend ? 'weekendzie' : 'dniu powszednim'}.`);
  return tier.price + extraBeds * bedPrice;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Kalkulacja ceny dla pojedynczego domku ───────────────────────────────────

export async function calculateTotalPrice(
  params: CalculateTotalPriceParams
): Promise<number> {
  const { startDate, endDate, baseGuests, extraBeds, propertySelection } = params;
  if (!startDate || !endDate || !propertySelection || baseGuests <= 0 || extraBeds < 0) {
    throw new Error('Nieprawidłowe parametry kalkulacji ceny.');
  }

  const startValidation = dayjs(startDate);
  const endValidation = dayjs(endDate);
  if (
    !startValidation.isValid() ||
    !endValidation.isValid() ||
    !startValidation.isBefore(endValidation, 'day')
  ) {
    throw new Error('Nieprawidłowy zakres dat kalkulacji ceny.');
  }

  await dbConnect();

  const [property, customPricesDocs, activeSeasons, allPropertyPrices] =
    await Promise.all([
      Property.findById(propertySelection),
      CustomPrice.find({
        propertyId: propertySelection,
        date: {
          $gte: dayjs(startDate).toDate(),
          $lt: dayjs(endDate).toDate(),
        },
      }),
      Season.find({ isActive: true }).sort({ order: 1, startDate: 1 }),

      PropertyPrices.find({ propertyId: propertySelection }).lean(),
    ]);

  if (!property) return 0;

  // Rozdziel na basicPrices i mapę sezonową
  const basicPrices = allPropertyPrices.find(
    (p) => p.seasonId === null || p.seasonId === undefined
  );
  const resolvedBasicPrices = basicPrices ?? createFallbackBasicPrices(property.baseCapacity);
  if (!basicPrices) {
    console.warn(
      `Brak cennika podstawowego dla domku: ${propertySelection}. Użyto domyślnej stawki ${DEFAULT_FALLBACK_NIGHT_PRICE} zł/noc.`
    );
  }

  const seasonPricesMap = new Map<string, any>(
    allPropertyPrices
      .filter((p) => p.seasonId != null)
      .map((p) => [p.seasonId!.toString(), p])
  );

  const customPricesMap = new Map<string, any>(
    customPricesDocs.map((cp: any) => [dayjs(cp.date).format('YYYY-MM-DD'), cp])
  );

  let total = 0;
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end, 'day')) {
    total += await getDailyPrice({
      date: currentDate,
      baseGuests,
      extraBeds,
      propertyBaseCapacity: property.baseCapacity,
      customPrices: customPricesMap,
      activeSeasons: activeSeasons as ISeason[],
      basicPrices: resolvedBasicPrices,
      seasonPricesMap,
    });
    currentDate = currentDate.add(1, 'day');
  }

  return total;
}

// ─── Kalkulacja ceny dla całej posesji (wszystkie domki) ─────────────────────

export async function calculateTotalPriceForWhole(
  params: CalculateTotalPriceForWholeParams
): Promise<number> {
  const { startDate, endDate, baseGuests, extraBeds, cabinAllocations } = params;
  if (!startDate || !endDate || baseGuests <= 0 || extraBeds < 0) {
    throw new Error('Nieprawidłowe parametry kalkulacji ceny dla całej posesji.');
  }
  if (!Array.isArray(cabinAllocations) || cabinAllocations.length === 0) {
    throw new Error('Brak alokacji gości na domki dla kalkulacji całej posesji.');
  }

  const startValidation = dayjs(startDate);
  const endValidation = dayjs(endDate);
  if (
    !startValidation.isValid() ||
    !endValidation.isValid() ||
    !startValidation.isBefore(endValidation, 'day')
  ) {
    throw new Error('Nieprawidłowy zakres dat kalkulacji ceny dla całej posesji.');
  }

  await dbConnect();

  const requestedPropertyIds = cabinAllocations.map((allocation) => allocation.propertyId);

  const properties = await Property.find({
    isActive: true,
    type: 'single',
    _id: { $in: requestedPropertyIds },
  }).sort({
    name: 1,
  });
  if (properties.length === 0) return 0;

  const propertyIds = properties.map((p) => p._id);

  const [allCustomPrices, activeSeasons, allPropertyPrices] = await Promise.all([
    CustomPrice.find({
      propertyId: { $in: propertyIds },
      date: {
        $gte: dayjs(startDate).toDate(),
        $lt: dayjs(endDate).toDate(),
      },
    }),
    Season.find({ isActive: true }).sort({ order: 1, startDate: 1 }),
    // Wszystkie ceny dla wszystkich domków jednym zapytaniem
    PropertyPrices.find({ propertyId: { $in: propertyIds } }).lean(),
  ]);

  // Grupuj custom ceny: propertyId → (date → rekord)
  const propertyCustomPrices = new Map<string, Map<string, any>>();
  for (const cp of allCustomPrices as any[]) {
    const pId = cp.propertyId.toString();
    if (!propertyCustomPrices.has(pId)) propertyCustomPrices.set(pId, new Map());
    propertyCustomPrices.get(pId)!.set(dayjs(cp.date).format('YYYY-MM-DD'), cp);
  }

  // Grupuj PropertyPrices: propertyId → { basicPrices, seasonPricesMap }
  const propertyPricesIndex = new Map<
    string,
    { basicPrices: any | null; seasonPricesMap: Map<string, any> }
  >();
  for (const pp of allPropertyPrices) {
    const pId = pp.propertyId.toString();
    if (!propertyPricesIndex.has(pId)) {
      propertyPricesIndex.set(pId, { basicPrices: null, seasonPricesMap: new Map() });
    }
    const entry = propertyPricesIndex.get(pId)!;
    if (pp.seasonId === null || pp.seasonId === undefined) {
      entry.basicPrices = pp;
    } else {
      entry.seasonPricesMap.set(pp.seasonId.toString(), pp);
    }
  }

  const allocationsByPropertyId = new Map(
    cabinAllocations.map((allocation) => [allocation.propertyId, allocation])
  );

  let total = 0;

  for (const property of properties) {
    const pId = property._id.toString();
    const allocation = allocationsByPropertyId.get(pId);
    if (!allocation) {
      throw new Error(`Brak alokacji gości dla domku ${pId}.`);
    }
    const baseGuestsForThisCabin = allocation.baseGuests;
    const extraBedsForThisCabin = allocation.extraBeds;

    const priceEntry = propertyPricesIndex.get(pId) ?? {
      basicPrices: null,
      seasonPricesMap: new Map(),
    };
    const resolvedBasicPrices =
      priceEntry.basicPrices ?? createFallbackBasicPrices(property.baseCapacity);
    if (!priceEntry.basicPrices) {
      console.warn(
        `Brak cennika podstawowego dla domku: ${pId}. Użyto domyślnej stawki ${DEFAULT_FALLBACK_NIGHT_PRICE} zł/noc.`
      );
    }
    const customPricesMap =
      propertyCustomPrices.get(pId) ?? new Map<string, any>();

    let currentDate = dayjs(startDate);
    const end = dayjs(endDate);

    while (currentDate.isBefore(end, 'day')) {
      total += await getDailyPrice({
        date: currentDate,
        baseGuests: baseGuestsForThisCabin,
        extraBeds: extraBedsForThisCabin,
        propertyBaseCapacity: property.baseCapacity,
        customPrices: customPricesMap,
        activeSeasons: activeSeasons as ISeason[],
        basicPrices: resolvedBasicPrices,
        seasonPricesMap: priceEntry.seasonPricesMap,
      });
      currentDate = currentDate.add(1, 'day');
    }
  }

  return total;
}

export async function distributeGuestsAcrossProperties(
  properties: { _id: unknown; baseCapacity: number; maxExtraBeds: number }[],
  baseGuests: number,
  extraBeds: number
): Promise<CabinAllocation[]> {
  let remainingBaseGuests = baseGuests;
  let remainingExtraBeds = extraBeds;

  return properties.map((property) => {
    const allocatedBaseGuests = Math.min(remainingBaseGuests, property.baseCapacity);
    const allocatedExtraBeds = Math.min(remainingExtraBeds, property.maxExtraBeds);

    remainingBaseGuests -= allocatedBaseGuests;
    remainingExtraBeds -= allocatedExtraBeds;

    return {
      propertyId: String(property._id),
      baseGuests: allocatedBaseGuests,
      extraBeds: allocatedExtraBeds,
    };
  });
}

// ─── Wyszukiwanie dostępności ─────────────────────────────────────────────────

export async function searchAction(params: SearchParams) {
  const { startDate, endDate, baseGuests, extraBeds } = params;
  try {
    await dbConnect();
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    const systemConfig = await SystemConfig.findById('main'); // autoBlockOtherCabins - onlyOnePropertyInSearchResult
    const autoBlockOtherCabins = systemConfig?.autoBlockOtherCabins ?? false;

    const occupiedIds = await Booking.distinct('propertyId', {
      status: { $in: ['confirmed', 'blocked'] },
      startDate: { $lt: end },
      endDate: { $gt: start },
    });

    const isWholeAvailable = occupiedIds.length === 0;

    const availableProperties = await Property.find({
      isActive: true,
      type: 'single',
      _id: { $nin: occupiedIds },
      baseCapacity: { $gte: baseGuests - extraBeds }
    }).select('-createdAt -updatedAt').sort({ name: 1 });

    if (availableProperties.length === 0) return [];

    const options: SearchOption[] = [];

    for (const property of availableProperties) { //loop for each available property
      if (baseGuests > property.baseCapacity + property.maxExtraBeds) continue;

      // console.log('Zmienne wyszukiwania:', {
      //   startDate,
      //   endDate,
      //   guests,
      //   extraBeds,
      //   propertyName: property.name,
      //   propertyId: property._id.toString(),
      // });

      const price = await calculateTotalPrice({ //calculate price for single property
        startDate,
        endDate,
        baseGuests,
        extraBeds,
        propertySelection: property._id.toString(),
      });

      options.push({
        type: 'single',
        displayName: property.name ?? '',
        totalPrice: price,
        maxGuests: property.baseCapacity,
        maxExtraBeds: property.maxExtraBeds,
        description: property.description ?? '',
      });
    }

    // Opcja całej posesji
    const totalGuestsCapacity = availableProperties.reduce((sum, p) => sum + p.baseCapacity, 0);
    const totalExtraCapacity = availableProperties.reduce((sum, p) => sum + p.maxExtraBeds, 0);

    if (baseGuests <= totalGuestsCapacity + totalExtraCapacity) {

      if (isWholeAvailable) {
        const wholeProperty = await Property.findOne({ type: 'whole' }); //find type of property 'whole' should be only one
        if (wholeProperty) {
          const cabinAllocations = await distributeGuestsAcrossProperties(
            availableProperties,
            baseGuests,
            extraBeds
          );

          const wholePrice = await calculateTotalPriceForWhole({
            startDate,
            endDate,
            baseGuests,
            extraBeds,
            cabinAllocations,
          });
          options.push({
            type: 'whole',
            displayName: wholeProperty.name ?? '',
            totalPrice: wholePrice,
            maxGuests: totalGuestsCapacity,
            maxExtraBeds: totalExtraCapacity,
            description: wholeProperty.description ?? '',
          });
        }
      }
    }

    return options.sort((a, b) => {
      if (a.type === 'whole') return 1;
      if (b.type === 'whole') return -1;
      return a.displayName.localeCompare(b.displayName);
    });
  } catch (error) {
    console.error('Błąd wyszukiwania dostępności:', error);
    throw new Error('Nie udało się pobrać dostępnych terminów.');
  }
}