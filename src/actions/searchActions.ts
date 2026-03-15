'use server'
import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import Booking from '@/db/models/Booking';
import PriceConfig, { ISeason } from '@/db/models/PriceConfig';
import SystemConfig from '@/db/models/SystemConfig';
import { Types } from 'mongoose';
export interface SearchOption {
  type: 'single' | 'whole';
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
  if (property?.isComposite && property.componentPropertyIds?.length) {
    const componentProps = await Property.find({
      _id: { $in: property.componentPropertyIds }
    });
    const guestsPerCabin = Math.ceil(guests / componentProps.length);
    const extraBedsPerCabin = Math.ceil(extraBeds / componentProps.length);
    for (const compProp of componentProps) {
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
        total += nightPrice;
      }
    }
  } else {
    const guestsForPricing = property?.isComposite ? guests : Math.min(guests, property?.baseCapacity || guests);
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
        guestsForPricing >= r.minGuests && guestsForPricing <= r.maxGuests
      ) || ratesSource[tierKey][ratesSource[tierKey].length - 1];
      if (!tier) continue;
      const nightPrice = tier.price + (extraBeds * bedPrice);
      total += nightPrice;
    }
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
    const properties = await Property.find({ isActive: true });
    if (properties.length === 0) return [];
    const compositeProperty = properties.find(p => p.isComposite);
    const singleProperties = properties.filter(p => !p.isComposite);
    const options: SearchOption[] = [];
    for (const prop of singleProperties) {
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
        propertyIds: [prop._id.toString()],
        displayName: prop.name,
        totalPrice: price,
        maxGuests: prop.baseCapacity + prop.maxExtraBeds,
        maxExtraBeds: prop.maxExtraBeds,
        description: prop.description || "Wynajem pojedynczego domku.",
        available: isAvailable
      });
    }
    if (compositeProperty && compositeProperty.componentPropertyIds?.length) {
      const componentProps = await Property.find({
        _id: { $in: compositeProperty.componentPropertyIds }
      });
      let hasConflicts = false;
      if (autoBlockOtherCabins) {
        hasConflicts = await Booking.exists({
          propertyId: { $in: properties.map(p => p._id) },
          status: { $in: ['confirmed', 'blocked'] },
          startDate: { $lte: end },
          endDate: { $gte: start }
        });
      } else {
        for (const compProp of componentProps) {
          const conflict = await Booking.exists({
            propertyId: compProp._id,
            status: { $in: ['confirmed', 'blocked'] },
            startDate: { $lte: end },
            endDate: { $gte: start }
          });
          if (conflict) {
            hasConflicts = true;
            break;
          }
        }
      }
      const isAvailable = !hasConflicts;
      const price = await calculateTotalPrice({
        startDate,
        endDate,
        guests,
        extraBeds,
        propertySelection: compositeProperty._id.toString()
      });
      options.push({
        type: 'composite',
        propertyIds: compositeProperty.componentPropertyIds.map(id => id.toString()),
        displayName: compositeProperty.name,
        totalPrice: price,
        maxGuests: compositeProperty.baseCapacity + compositeProperty.maxExtraBeds,
        maxExtraBeds: compositeProperty.maxExtraBeds,
        description: compositeProperty.description || "Wynajem całej posesji - oba domki.",
        available: isAvailable
      });
    }
    return options.sort((a, b) => {
      if (a.type === 'composite') return -1;
      if (b.type === 'composite') return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  } catch (error) {
    console.error("Błąd wyszukiwania dostępności:", error);
    throw new Error("Nie udało się pobrać dostępnych terminów.");
  }
}