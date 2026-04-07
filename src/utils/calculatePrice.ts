import dbConnect from '@/db/connection';
import Season from '@/db/models/Season';
import CustomPrice from '@/db/models/CustomPrice';
import Property from '@/db/models/Property';

interface PriceBreakdown {
  nightlyPrices: { date: string; price: number; type: 'weekday' | 'weekend'; seasonName?: string; source: 'custom' | 'season' | 'basic' }[];
  totalPrice: number;
  extraBedsTotal: number;
  summary: string;
}

interface IPriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

export async function calculateDynamicPrice(
  startDate: string,
  endDate: string,
  totalGuests: number,
  extraBedsCount: number,
  propertyId: string
): Promise<PriceBreakdown> {
  await dbConnect();

  const start = new Date(startDate);
  const end = new Date(endDate);
  const nightlyPrices: PriceBreakdown['nightlyPrices'] = [];
  let totalPrice = 0;
  let totalExtraBedPrice = 0;

  // Fetch property with basicPrices
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new Error("Nieruchomość nie została znaleziona w bazie danych.");
  }

  // Fetch all seasons
  const seasons = await Season.find({ isActive: true });

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const currentDay = d.getDay();
    const isWeekend = currentDay === 5 || currentDay === 6;

    let nightPrice: number;
    let source: 'custom' | 'season' | 'basic' = 'basic';
    let seasonName: string | undefined;
    let extraBedPrice: number;

    // Step 1: Check for CustomPrice for this property and date
    const customPrice = await CustomPrice.findOne({
      propertyId,
      date: { $gte: d, $lt: new Date(d.getTime() + 86400000) }
    });

    if (customPrice) {
      const tier = findPriceTier(customPrice.prices ?? [], totalGuests);
      if (!tier) {
        throw new Error(`Nie znaleziono wariantu cenowego custom dla ${totalGuests} gości`);
      }
      nightPrice = tier.price;
      extraBedPrice = customPrice.extraBedPrice ?? 50;
      source = 'custom';
    } else {
      // Step 2: Check if date falls within any Season
      const activeSeason = seasons.find(s =>
        d >= new Date(s.startDate) && d <= new Date(s.endDate)
      );

      if (activeSeason) {
        // Use prices from the matching season
        const pricesTier = isWeekend ? activeSeason.weekendPrices : activeSeason.weekdayPrices;
        const tier = findPriceTier(pricesTier, totalGuests);
        
        if (!tier) {
          throw new Error(`Nie znaleziono wariantu cenowego dla ${totalGuests} gości w sezonie ${activeSeason.name}`);
        }
        
        nightPrice = tier.price;
        extraBedPrice = isWeekend ? activeSeason.weekendExtraBedPrice : activeSeason.weekdayExtraBedPrice;
        seasonName = activeSeason.name;
        source = 'season';
      } else {
        // Step 3: Fallback to basicPrices from Property
        if (!property.basicPrices) {
          throw new Error("Brak cen podstawowych dla nieruchomości. Proszę skonfigurować ceny podstawowe w panelu admina.");
        }

        const basicPricesTier = isWeekend ? property.basicPrices.weekendPrices : property.basicPrices.weekdayPrices;
        const tier = findPriceTier(basicPricesTier, totalGuests);
        
        if (!tier) {
          throw new Error(`Nie znaleziono wariantu cenowego dla ${totalGuests} gości w cenach podstawowych`);
        }
        
        nightPrice = tier.price;
        extraBedPrice = isWeekend ? property.basicPrices.weekendExtraBedPrice : property.basicPrices.weekdayExtraBedPrice;
        source = 'basic';
      }
    }

    const finalNightPrice = nightPrice + (extraBedsCount * extraBedPrice);

    nightlyPrices.push({
      date: dateStr,
      price: finalNightPrice,
      type: isWeekend ? 'weekend' : 'weekday',
      seasonName,
      source
    });

    totalPrice += finalNightPrice;
    totalExtraBedPrice += extraBedsCount * extraBedPrice;
  }

  return {
    nightlyPrices,
    totalPrice,
    extraBedsTotal: totalExtraBedPrice,
    summary: `${getNightsCount(start, end)} noclegów, ${totalGuests} gości, ${extraBedsCount} dostawek`
  };
}

function findPriceTier(tiers: IPriceTier[], guests: number): IPriceTier | null {
  const matchingTier = tiers.find(r => guests >= r.minGuests && guests <= r.maxGuests);
  if (matchingTier) {
    return matchingTier;
  }
  // Fallback to highest tier if exact match not found
  return tiers.length > 0 ? tiers[tiers.length - 1] : null;
}

function getNightsCount(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}