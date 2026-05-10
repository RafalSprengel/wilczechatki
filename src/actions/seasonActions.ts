'use server'

import dbConnect from '@/db/connection';
import Season from '@/db/models/Season';
import PropertyPrices from '@/db/models/PropertyPrices';
import Property from '@/db/models/Property';
import CustomPrice from '@/db/models/CustomPrice';
import { revalidatePath } from 'next/cache';

export interface ISeasonData {
  _id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  order: number;
}

type MonthDaySegment = { start: number; end: number };

function toMonthDayValue(dateLike: Date | string): number {
  const date = new Date(dateLike);
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function formatMonthDay(dateLike: Date | string): string {
  const date = new Date(dateLike);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

function toSegments(start: number, end: number): MonthDaySegment[] {
  if (start <= end) {
    return [{ start, end }];
  }

  // Cross-year range (e.g. 12-20 to 01-05).
  return [
    { start, end: 1231 },
    { start: 101, end },
  ];
}

function rangesOverlap(
  rangeA: MonthDaySegment[],
  rangeB: MonthDaySegment[]
): boolean {
  return rangeA.some((a) =>
    rangeB.some((b) => a.start <= b.end && b.start <= a.end)
  );
}

// ── Seasons CRUD ─────────────────────────────────────────────────────────────

export async function getAllSeasons() {
  try {
    await dbConnect();
    const seasons = await Season.find({}).sort({ order: 1 }).lean();
    return JSON.parse(JSON.stringify(seasons)) as ISeasonData[];
  } catch (error) {
    console.error('Błąd pobierania sezonów:', error);
    return [];
  }
}

export async function getSeasonById(id: string) {
  try {
    await dbConnect();
    const season = await Season.findById(id).lean();
    if (!season) return null;
    return JSON.parse(JSON.stringify(season)) as ISeasonData;
  } catch (error) {
    console.error('Błąd pobierania sezonu:', error);
    return null;
  }
}

export async function updateSeasonDates(
  seasonName: string,
  seasonDesc: string,
  seasonId: string,
  startDate: string,
  endDate: string
) {
  try {
    await dbConnect();

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { success: false, message: 'Nieprawidłowe daty sezonu' };
    }

    const startMonth = start.getMonth();
    const startDay = start.getDate();
    const endMonth = end.getMonth();
    const endDay = end.getDate();

    // Canonical yearly range: year is ignored in pricing logic.
    const normalizedStartDate = new Date(2000, startMonth, startDay);
    const isCrossYear = (endMonth + 1) * 100 + endDay < (startMonth + 1) * 100 + startDay;
    const normalizedEndDate = new Date(isCrossYear ? 2001 : 2000, endMonth, endDay);

    const candidateStart = toMonthDayValue(normalizedStartDate);
    const candidateEnd = toMonthDayValue(normalizedEndDate);
    const candidateSegments = toSegments(candidateStart, candidateEnd);

    const otherSeasons = await Season.find({ _id: { $ne: seasonId } })
      .select('name startDate endDate')
      .lean();

    const overlappingSeason = otherSeasons.find((other) => {
      const otherStart = toMonthDayValue(other.startDate as Date);
      const otherEnd = toMonthDayValue(other.endDate as Date);
      const otherSegments = toSegments(otherStart, otherEnd);
      return rangesOverlap(candidateSegments, otherSegments);
    });

    if (overlappingSeason) {
      const overlapStart = formatMonthDay(overlappingSeason.startDate as Date);
      const overlapEnd = formatMonthDay(overlappingSeason.endDate as Date);
      return {
        success: false,
        message: `Zakres dat nakłada się na sezon "${overlappingSeason.name}", który jest ustawiony od ${overlapStart} do ${overlapEnd}.`,
      };
    }

    await Season.findByIdAndUpdate(seasonId, {
      name: seasonName,
      description: seasonDesc,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    });
    revalidatePath('/admin/settings/booking');
    return { success: true, message: 'Zaktualizowano daty sezonu' };
  } catch (error) {
    console.error('Błąd aktualizacji sezonu:', error);
    return { success: false, message: 'Nie udało się zaktualizować dat sezonu' };
  }
}

export async function updateSeasonOrder(seasonId: string, order: number) {
  try {
    await dbConnect();
    await Season.findByIdAndUpdate(seasonId, { order });
    revalidatePath('/admin/settings/booking');
    return { success: true, message: 'Zaktualizowano kolejność wyświetlania' };
  } catch (error) {
    console.error('Błąd aktualizacji kolejności sezonu:', error);
    return { success: false, message: 'Nie udało się zaktualizować kolejności' };
  }
}

export async function createSeason(name: string, description: string, order: number) {
  try {
    await dbConnect();

    const normalizedName = name.trim();
    if (!normalizedName) {
      return { success: false, message: 'Nazwa sezonu jest wymagana' };
    }

    const season = await Season.create({
      name: normalizedName,
      description: description.trim(),
      order,
      startDate: new Date(2000, 0, 1),
      endDate: new Date(2000, 0, 1),
      isActive: true,
    });

    revalidatePath('/admin/settings/booking');
    return {
      success: true,
      message: `Dodano sezon: ${normalizedName}`,
      seasonId: season._id.toString(),
    };
  } catch (error) {
    console.error('Błąd tworzenia sezonu:', error);
    return { success: false, message: 'Nie udało się dodać sezonu' };
  }
}

export async function deleteSeason(seasonId: string) {
  try {
    await dbConnect();

    const deleted = await Season.findByIdAndDelete(seasonId);
    if (!deleted) {
      return { success: false, message: 'Nie znaleziono sezonu do usunięcia' };
    }

    revalidatePath('/admin/settings/booking');
    return { success: true, message: `Usunięto sezon: ${deleted.name}` };
  } catch (error) {
    console.error('Błąd usuwania sezonu:', error);
    return { success: false, message: 'Nie udało się usunąć sezonu' };
  }
}

// ── Prices per property (kolekcja PropertyPrices) ────────────────────────────
//
// Konwencja: seasonId === null  →  ceny poza sezonem (dawne basicPrices)
//            seasonId === <id>  →  ceny dla konkretnego sezonu

/**
 * Pobiera wszystkie rekordy cenowe dla jednego domku.
 * Zwraca tablicę zawierającą zarówno basicPrices (seasonId: null)
 * jak i wszystkie wpisy sezonowe.
 */
export async function getPricesForProperty(propertyId: string) {
  try {
    await dbConnect();
    const prices = await PropertyPrices.find({ propertyId }).lean();
    return JSON.parse(JSON.stringify(prices));
  } catch (error) {
    console.error('Błąd pobierania cen domku:', error);
    return [];
  }
}

/**
 * Pobiera ceny poza sezonem dla domku.
 */
export async function getBasicPrices(propertyId: string) {
  try {
    await dbConnect();
    const prices = await PropertyPrices.findOne({
      propertyId,
      seasonId: null,
    }).lean();

    return {
      success: true,
      data: prices ?? null,
      message: prices
        ? 'Ceny podstawowe znalezione'
        : 'Brak skonfigurowanych cen podstawowych',
    };
  } catch (error) {
    console.error('Błąd pobierania cen podstawowych:', error);
    return { success: false, message: 'Nie udało się pobrać cen podstawowych' };
  }
}

/**
 * Zapisuje/aktualizuje ceny poza sezonem dla domku.
 * Używa upsert – bezpieczne przy pierwszym zapisie.
 */
export async function updateBasicPrices(
  previousState: { message: string; success: boolean } | null,
  formData: FormData
) {
  try {
    const propertyId = formData.get('propertyId') as string;
    const weekdayPrices = JSON.parse(formData.get('weekdayTiers') as string);
    const weekendPrices = JSON.parse(formData.get('weekendTiers') as string);
    const weekdayExtraBedPrice =
      parseInt(formData.get('weekdayExtraBedPrice') as string) || 50;
    const weekendExtraBedPrice =
      parseInt(formData.get('weekendExtraBedPrice') as string) || 70;

    if (
      !propertyId ||
      !Array.isArray(weekdayPrices) ||
      !Array.isArray(weekendPrices)
    ) {
      return { success: false, message: 'Nieprawidłowe dane' };
    }

    await dbConnect();

    await PropertyPrices.findOneAndUpdate(
      { propertyId, seasonId: null },
      { weekdayPrices, weekendPrices, weekdayExtraBedPrice, weekendExtraBedPrice },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/prices');
    return { success: true, message: 'Zapisano ceny podstawowe' };
  } catch (error) {
    console.error('Błąd zapisu cen podstawowych:', error);
    return { success: false, message: 'Nie udało się zapisać cen podstawowych' };
  }
}

/**
 * Usuwa ceny poza sezonem dla domku.
 */
export async function deleteBasicPrices(propertyId: string) {
  try {
    await dbConnect();
    await PropertyPrices.deleteOne({ propertyId, seasonId: null });
    revalidatePath('/admin/prices');
    return { success: true, message: 'Usunięto ceny podstawowe' };
  } catch (error) {
    console.error('Błąd usuwania cen podstawowych:', error);
    return { success: false, message: 'Nie udało się usunąć cen podstawowych' };
  }
}

/**
 * Zapisuje ceny sezonowe lub podstawowe dla domku.
 * mode === 'basic'  →  seasonId: null
 * mode === 'season' →  seasonId: <id>
 *
 * Używa upsert – jedno zapytanie, żadnej logiki merge.
 */
export async function updateSeasonPricesForProperty(
  previousState: { message: string; success: boolean } | null,
  formData: FormData
) {
  try {
    const propertyId = formData.get('propertyId') as string;
    const mode = formData.get('mode') as 'basic' | 'season';
    const weekdayPrices = JSON.parse(formData.get('weekdayTiers') as string);
    const weekendPrices = JSON.parse(formData.get('weekendTiers') as string);
    const weekdayExtraBedPrice =
      parseInt(formData.get('weekdayExtraBedPrice') as string) || 50;
    const weekendExtraBedPrice =
      parseInt(formData.get('weekendExtraBedPrice') as string) || 70;

    if (
      !propertyId ||
      !Array.isArray(weekdayPrices) ||
      !Array.isArray(weekendPrices)
    ) {
      return { success: false, message: 'Nieprawidłowe dane' };
    }

    await dbConnect();

    const seasonId = mode === 'season'
      ? (formData.get('seasonId') as string | null)
      : null;

    if (mode === 'season' && !seasonId) {
      return { success: false, message: 'Brak ID sezonu' };
    }

    await PropertyPrices.findOneAndUpdate(
      { propertyId, seasonId: seasonId ?? null },
      { weekdayPrices, weekendPrices, weekdayExtraBedPrice, weekendExtraBedPrice },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/prices');
    return {
      success: true,
      message: mode === 'basic'
        ? 'Zapisano ceny podstawowe'
        : 'Zapisano ceny sezonowe',
    };
  } catch (error) {
    console.error('Błąd zapisu cen:', error);
    return { success: false, message: 'Wystąpił błąd podczas zapisu' };
  }
}

// Zostawione dla kompatybilności wstecznej (BookingSettingsForm używa updateSeasonPrices)
export async function updateSeasonPrices(
  previousState: { message: string; success: boolean },
  formData: FormData
) {
  return updateSeasonPricesForProperty(previousState, formData);
}

/**
 * Kopiuje wszystkie ceny (podstawowe + sezonowe) z jednego domku do pozostałych aktywnych domków.
 */
export async function copyPricesToAllProperties(sourcePropertyId: string) {
  try {
    await dbConnect();

    const sourcePrices = await PropertyPrices.find({ propertyId: sourcePropertyId }).lean();
    const sourceCustomPrices = await CustomPrice.find({ propertyId: sourcePropertyId }).lean();
    const otherProperties = await Property.find({
      isActive: true,
      _id: { $ne: sourcePropertyId },
    }).lean();

    if (otherProperties.length === 0) {
      return { success: false, message: 'Brak innych domków do skopiowania cen.' };
    }

    for (const property of otherProperties) {
      const targetId = property._id.toString();

      // Kopiuj ceny sezonowe/podstawowe
      await PropertyPrices.deleteMany({ propertyId: targetId });
      for (const priceRecord of sourcePrices) {
        const { _id, propertyId: _src, ...rest } = priceRecord as any;
        await PropertyPrices.create({ ...rest, propertyId: targetId });
      }

      // Kopiuj ceny indywidualne
      await CustomPrice.deleteMany({ propertyId: targetId });
      for (const customRecord of sourceCustomPrices) {
        const { _id, propertyId: _src, ...rest } = customRecord as any;
        await CustomPrice.create({ ...rest, propertyId: targetId });
      }
    }

    revalidatePath('/admin/prices');
    return {
      success: true,
      message: `Ceny skopiowano do ${otherProperties.length} domku(ów).`,
    };
  } catch (error) {
    console.error('Błąd kopiowania cen:', error);
    return { success: false, message: 'Nie udało się skopiować cen.' };
  }
}