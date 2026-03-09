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

async function calculateTotalPrice(
  startDate: string,
  endDate: string,
  guests: number,
  extraBeds: number,
  propertiesCount: number = 1
): Promise<number> {
  await dbConnect();
  const config = await PriceConfig.findById('main');
  if (!config) return 0;

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
    
    console.log('=== SEARCH ACTION START ===');
    console.log('Parametry:', { startDate, endDate, guests, extraBeds });
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    let sysConfig = await SystemConfig.findById('main');
    if (!sysConfig) {
      sysConfig = { autoBlockOtherCabins: true } as any;
    }

    const properties = await Property.find({ isActive: true });
    console.log('Properties z bazy (surowy JSON):', JSON.parse(JSON.stringify(properties)));
    
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
      const price = await calculateTotalPrice(startDate, endDate, guests, extraBeds, 1);
      
      // Konwersja na liczby - zabezpieczenie przed stringami
      const baseCapacity = Number(prop.baseCapacity) || 0;
      const maxExtraBedsValue = Number(prop.maxExtraBeds) || 0;
      
      const maxGuests = baseCapacity + maxExtraBedsValue;
      
      console.log(`Prop ${prop.name}:`, {
        baseCapacity: baseCapacity,
        maxExtraBedsRaw: prop.maxExtraBeds,
        maxExtraBedsConverted: maxExtraBedsValue,
        maxGuests: maxGuests,
        type: typeof prop.maxExtraBeds
      });
      
      options.push({
        type: 'single',
        propertyIds: [prop._id.toString()],
        displayName: prop.name,
        totalPrice: price,
        maxGuests: maxGuests,
        maxExtraBeds: maxExtraBedsValue,
        description: "Wynajem pojedynczego domku. Drugi domek zostanie automatycznie zablokowany na ten termin.",
        available: true
      });
    }

    // Opcja całej posesji (jeśli wszystkie domki są wolne)
    if (availableProperties.length === properties.length && properties.length > 1) {
      // Suma pojemności ze wszystkich domków
      const totalMaxGuests = properties.reduce((sum, p) => {
        const base = Number(p.baseCapacity) || 0;
        const extra = Number(p.maxExtraBeds) || 0;
        return sum + base + extra;
      }, 0);
      
      const totalMaxExtraBeds = properties.reduce((sum, p) => {
        return sum + (Number(p.maxExtraBeds) || 0);
      }, 0);
      
      const price = await calculateTotalPrice(startDate, endDate, guests, extraBeds, properties.length);
      
      console.log(`Double option:`, {
        totalMaxGuests,
        totalMaxExtraBeds,
        propertiesCount: properties.length
      });
      
      options.push({
        type: 'double',
        propertyIds: properties.map(p => p._id.toString()),
        displayName: "Cała Posesja (Wszystkie domki)",
        totalPrice: price,
        maxGuests: totalMaxGuests,
        maxExtraBeds: totalMaxExtraBeds,
        description: "Maksymalna prywatność. Wynajem wszystkich domków z dostępem do całego terenu.",
        available: true
      });
    }

    console.log('Wygenerowane opcje:', JSON.parse(JSON.stringify(options)));
    console.log('=== SEARCH ACTION END ===');

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