'use server'

import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import PropertyPrices from '@/db/models/PropertyPrices';
import Booking from '@/db/models/Booking';
import PriceConfig from '@/db/models/PriceConfig';
import Season, { ISeason } from '@/db/models/Season';
import CustomPrice from '@/db/models/CustomPrice';
import SystemConfig from '@/db/models/SystemConfig';
import BookingConfig from '@/db/models/BookingConfig';
import { buildBookingOverlapFilter } from '@/utils/bookingOverlap';
import { Types } from 'mongoose';
import { resolveOccupiedPropertyIdsFromBookings } from '@/utils/lazyAvailabilityCleanup';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(utc);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export interface SearchOption {
  propertyId: string;
  displayName: string;
  totalPrice: number;
  extraBedPrice: number;
  maxAdults: number;
  maxChildren: number;
  maxExtraBeds: number;
  description: string;
}

export interface SearchResults {
  propertiesAvailable: SearchOption[];
  areAllAvailable: boolean;
  forceCombined: boolean;
  overlappingSeasons: OverlappingSeasonInfo[];
}

interface PriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

interface SeasonPropertyPriceInfo {
  propertyId: string;
  displayName: string;
  weekdayPrices: PriceTier[];
  weekendPrices: PriceTier[];
  weekdayExtraBedPrice: number;
  weekendExtraBedPrice: number;
}

interface SeasonPriceDoc {
  seasonId: Types.ObjectId | null;
  propertyId: Types.ObjectId;
  weekdayPrices: PriceTier[];
  weekendPrices: PriceTier[];
  weekdayExtraBedPrice: number;
  weekendExtraBedPrice: number;
}

interface OverlappingSeasonInfo {
  seasonId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  prices: SeasonPropertyPriceInfo[];
}

interface SearchParams {
  startDate: string;
  endDate: string;
  baseGuests: number;
  adults: number;
  children: number;
  extraBeds: number;
}

interface CalculateTotalPriceParams {
  startDate: string;
  endDate: string;
  baseGuests: number;
  extraBeds: number;
  propertySelection: string;
}

interface GetDailyPriceParams {
  date: dayjs.Dayjs;
  baseGuests: number;
  extraBeds: number;
  propertyMaxAdults: number;
  customPrices: Map<string, any>;
  activeSeasons: ISeason[];
  basicPrices: any | null;
  seasonPricesMap: Map<string, any>;
}


function findPriceTier(
  tiers: { minGuests: number; maxGuests: number; price: number }[] | undefined,
  baseGuests: number
): { minGuests: number; maxGuests: number; price: number } | null {
  if (!tiers?.length) return null;
  const matchedTier = tiers.find((r) => baseGuests >= r.minGuests && baseGuests <= r.maxGuests);
  if (matchedTier) return matchedTier;

  // For guests below the first threshold (e.g. 0 in multi-cabin allocation),
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
  propertyMaxAdults,
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

export async function getMaxCapacity(): Promise<{ maxAdults: number; maxChildren: number }> {
  await dbConnect();
  const properties = await Property.find({ isActive: true });
  if (properties.length === 0) {
    throw new Error('Brak aktywnych domków. Skonfiguruj obiekty przed udostępnieniem formularza rezerwacji.');
  }
  const maxAdults = properties.reduce((sum, prop) => sum + prop.maxAdults, 0);
  const maxChildren = properties.reduce((sum, prop) => sum + prop.maxChildren, 0);
  if (maxAdults === 0) {
    throw new Error('Żaden aktywny domek nie ma skonfigurowanego limitu dorosłych.');
  }
  return { maxAdults, maxChildren };
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

  if (!property) throw new Error(`Domek o ID ${propertySelection} nie istnieje.`);

  const basicPrices = allPropertyPrices.find(
    (p) => p.seasonId === null || p.seasonId === undefined
  );

  if (!basicPrices) {
    throw new Error(`Brak cennika podstawowego dla domku: ${property.name ?? propertySelection}. Skonfiguruj cennik przed udostępnieniem domku.`);
  }

  const seasonPricesMap = new Map<string, any>(
    allPropertyPrices
      .filter((p) => p.seasonId != null)
      .map((p) => [p.seasonId!.toString(), p])
  );

  const customPricesMap = new Map<string, any>(
    customPricesDocs.map((cp: any) => [dayjs(cp.date).format('YYYY-MM-DD'), cp])
  );

  const resolvedBasicPrices = basicPrices;

  let total = 0;
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end, 'day')) {
    total += await getDailyPrice({
      date: currentDate,
      baseGuests,
      extraBeds,
      propertyMaxAdults: property.maxAdults,
      customPrices: customPricesMap,
      activeSeasons: activeSeasons as ISeason[],
      basicPrices: resolvedBasicPrices,
      seasonPricesMap,
    });
    currentDate = currentDate.add(1, 'day');
  }

  return total;
}

// ─── Wyszukiwanie dostępności ─────────────────────────────────────────────────

export async function searchAction(params: SearchParams): Promise<SearchResults> {
  const { startDate, endDate, adults, children, extraBeds } = params;
  const effectiveGuests = adults;
  if (adults < 1) {
    throw new Error('Liczba platnych gosci musi byc wieksza od zera.');
  }
  try {
    await dbConnect();
    const start = dayjs.utc(startDate, 'YYYY-MM-DD', true);
    const end = dayjs.utc(endDate, 'YYYY-MM-DD', true);

    const activeSeasons = await Season.find({ isActive: true })
      .select('_id name description startDate endDate')
      .lean();

    const overlappingSeasons: OverlappingSeasonInfo[] = [];
    for (const season of activeSeasons as Array<ISeason & { _id: Types.ObjectId }>) {
      let currentDate = start;
      while (currentDate.isBefore(end, 'day')) {
        if (isDateInRecurringSeason(currentDate, season)) {
          overlappingSeasons.push({
            seasonId: String(season._id),
            name: season.name,
            description: season.description,
            startDate: dayjs.utc(season.startDate).format('YYYY-MM-DD'),
            endDate: dayjs.utc(season.endDate).format('YYYY-MM-DD'),
            prices: [],
          });
          break;
        }
        currentDate = currentDate.add(1, 'day');
      }
    }

    const totalActiveProperties = await Property.countDocuments({ isActive: true });

    const systemConfig = await SystemConfig.findById('main');
    const autoBlockOtherCabins = systemConfig?.autoBlockOtherCabins ?? true;
    const bookingConfig = await BookingConfig.findById('main').lean();
    const allowCheckinOnDepartureDay = bookingConfig?.allowCheckinOnDepartureDay ?? true;
    const overlapCondition = buildBookingOverlapFilter(start.toDate(), end.toDate(), allowCheckinOnDepartureDay);

    // Blokady admina: używamy ścisłego filtru ($lte) — wymeldowanie w dniu blokady jest niedozwolone
    const blockedOverlapCondition = {
      startDate: { $lte: end.toDate() },
      endDate: { $gt: start.toDate() },
    };

    const [blockedConflicts, regularConflicts] = await Promise.all([
      Booking.find({ status: 'blocked', ...blockedOverlapCondition })
        .select('_id propertyId status createdAt stripeSessionId source adminNotes')
        .lean(),
      Booking.find({ $or: [{ status: 'confirmed' }, { status: 'pending' }], ...overlapCondition })
        .select('_id propertyId status createdAt stripeSessionId source adminNotes')
        .lean(),
    ]);

    const overlappingBookings = [...blockedConflicts, ...regularConflicts];
    //console.log(overlappingBookings);
    const { occupiedPropertyIds } = await resolveOccupiedPropertyIdsFromBookings(overlappingBookings);

    const occupiedIds = Array.from(occupiedPropertyIds)
      .map((id) => {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error('Nieprawidłowe propertyId podczas przygotowania listy zajętych domków.');
        }

        return new Types.ObjectId(id);
      });

    if (autoBlockOtherCabins && occupiedIds.length > 0) {
      return { propertiesAvailable: [], areAllAvailable: false, forceCombined: false, overlappingSeasons };
    }

    const availableProperties = await Property.find({
      isActive: true,
      _id: { $nin: occupiedIds },
    }).select('-createdAt -updatedAt').sort({ name: 1 });

    if (availableProperties.length === 0) {
      return { propertiesAvailable: [], areAllAvailable: false, forceCombined: false, overlappingSeasons };
    }

    const options: SearchOption[] = [];

    const combinedMaxAdults = availableProperties.reduce((sum, p) => sum + p.maxAdults, 0);
    const combinedMaxChildren = availableProperties.reduce((sum, p) => sum + p.maxChildren, 0);
    const canCombinedAccommodate =
      adults <= combinedMaxAdults && children <= combinedMaxChildren;
    const anyFitsIndividually = availableProperties.some(
      (p) => adults <= p.maxAdults && children <= p.maxChildren
    );
    const forceCombined = canCombinedAccommodate && !anyFitsIndividually;

    for (const property of availableProperties) {
      const fitsIndividually =
        adults <= property.maxAdults && children <= property.maxChildren;

      if (!fitsIndividually && !canCombinedAccommodate) continue;

      const allocAdults = fitsIndividually
        ? adults
        : Math.min(property.maxAdults, adults);

      const price = await calculateTotalPrice({
        startDate,
        endDate,
        baseGuests: Math.max(1, allocAdults),
        extraBeds,
        propertySelection: property._id.toString(),
      });

      const extraBedPrice = property.maxExtraBeds > extraBeds
        ? Math.max(
            0,
            (await calculateTotalPrice({
              startDate,
              endDate,
              baseGuests: Math.max(1, allocAdults),
              extraBeds: extraBeds + 1,
              propertySelection: property._id.toString(),
            })) - price
          )
        : 0;

      options.push({
        propertyId: property._id.toString(),
        displayName: property.name ?? '',
        totalPrice: price,
        extraBedPrice,
        maxAdults: property.maxAdults,
        maxChildren: property.maxChildren,
        maxExtraBeds: property.maxExtraBeds,
        description: property.description ?? '',
      });
    }
    const result = options.sort((a, b) => a.totalPrice - b.totalPrice);

    // Jeśli wybrano tylko jednego dorosłego, nie pokazuj opcji kilku domków
    let areAllAvailable = result.length === totalActiveProperties;
    if (adults === 1 && result.length > 1) {
      areAllAvailable = false;
    }

    if (overlappingSeasons.length > 0 && result.length > 0) {
      const seasonIds = overlappingSeasons.map((season) => new Types.ObjectId(season.seasonId));
      const propertyIds = result.map((option) => new Types.ObjectId(option.propertyId));

      const seasonPriceDocs = await PropertyPrices.find({
        seasonId: { $in: seasonIds },
        propertyId: { $in: propertyIds },
      })
        .select('seasonId propertyId weekdayPrices weekendPrices weekdayExtraBedPrice weekendExtraBedPrice')
        .lean() as SeasonPriceDoc[];

      const propertyNameById = new Map(result.map((option) => [option.propertyId, option.displayName]));

      for (const season of overlappingSeasons) {
        const seasonPrices = seasonPriceDocs.filter((doc) => {
          if (!doc.seasonId) return false;
          return String(doc.seasonId) === season.seasonId;
        });

        season.prices = seasonPrices.map((doc) => {
          const propertyId = String(doc.propertyId);
          const displayName = propertyNameById.get(propertyId);
          if (!displayName) {
            throw new Error(`Brak nazwy domku dla identyfikatora: ${propertyId}`);
          }

          return {
            propertyId,
            displayName,
            weekdayPrices: doc.weekdayPrices,
            weekendPrices: doc.weekendPrices,
            weekdayExtraBedPrice: doc.weekdayExtraBedPrice,
            weekendExtraBedPrice: doc.weekendExtraBedPrice,
          };
        });
      }
    }

    return {
      propertiesAvailable: result,
      areAllAvailable,
      forceCombined,
      overlappingSeasons,
    };
  } catch (error) {
    console.error('Błąd wyszukiwania dostępności:', error);
    throw new Error('Nie udało się pobrać dostępnych terminów.');
  }
}