import dbConnect from '@/db/connection';
import PriceConfig from '@/db/models/PriceConfig';

interface PriceBreakdown {
  nightlyPrices: { date: string; price: number; type: 'weekday' | 'weekend'; seasonName?: string }[];
  totalPrice: number;
  extraBedsTotal: number;
  summary: string;
}

export async function calculateDynamicPrice(
  startDate: string,
  endDate: string,
  totalGuests: number,
  extraBedsCount: number
): Promise<PriceBreakdown> {
  await dbConnect();

  const config = await PriceConfig.findById('main');
  
  if (!config) {
    throw new Error("Konfiguracja cen nie została znaleziona w bazie danych.");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const nightlyPrices: PriceBreakdown['nightlyPrices'] = [];
  let totalPrice = 0;

  // Pętla po każdej nocy pobytu
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const currentDay = d.getDay(); // 0 = Niedziela, 6 = Sobota
    const isWeekend = currentDay === 5 || currentDay === 6; // Piątek i Sobota to weekend (noc z Pt na Sb, Sb na Nd)
    
    // Sprawdź czy jesteśmy w sezonie wysokim
    const activeSeason = config.seasons.find(s => 
      s.isActive && 
      d >= s.startDate && 
      d <= s.endDate
    );

    const ratesSource = activeSeason ? activeSeason : config.baseRates;
    const extraBedPrice = activeSeason?.extraBedPrice ?? config.baseRates.extraBedPrice;

    // Znajdź odpowiedni próg cenowy dla liczby gości
    // Uwaga: totalGuests to wszyscy goście (dorośli + dzieci powyżej limitu? - upraszczamy: całkowita liczba płatnych miejsc)
    // W prostym modelu: cena zależy od całkowitej liczby osób śpiących (goście + dostawki) LUB samej grupy bazowej.
    // Przyjmijmy logikę: Cena bazowa zależy od liczby osób (totalGuests), a dostawki są dodawane na wierzch.
    
    const tier = ratesSource[isWeekend ? 'weekend' : 'weekday'].find(r => 
      totalGuests >= r.minGuests && totalGuests <= r.maxGuests
    ) || ratesSource[isWeekend ? 'weekend' : 'weekday'][ratesSource[isWeekend ? 'weekend' : 'weekday'].length - 1];

    const nightPrice = tier.price + (extraBedsCount * extraBedPrice);

    nightlyPrices.push({
      date: d.toISOString().split('T')[0],
      price: nightPrice,
      type: isWeekend ? 'weekend' : 'weekday',
      seasonName: activeSeason?.name
    });

    totalPrice += nightPrice;
  }

  return {
    nightlyPrices,
    totalPrice,
    extraBedsTotal: extraBedsCount * (activeSeason?.extraBedPrice ?? config.baseRates.extraBedPrice) * getNightsCount(start, end),
    summary: `${getNightsCount(start, end)} noclegów, ${totalGuests} gości, ${extraBedsCount} dostawek`
  };
}

function getNightsCount(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}