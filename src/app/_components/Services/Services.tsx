import { getBookingConfig } from '@/actions/bookingConfigActions';
import { getAllProperties } from '@/actions/adminPropertyActions';
import { getBasicPrices } from '@/actions/seasonActions';
import styles from './Services.module.css';

interface PriceItem {
    description: string;
    amount: string;
}

interface PriceTier {
    minGuests: number;
    maxGuests: number;
    price: number;
}

interface BasicPricesData {
    weekdayPrices?: PriceTier[];
    weekendPrices?: PriceTier[];
    weekdayExtraBedPrice?: number;
    weekendExtraBedPrice?: number;
}

function formatGuestsLabel(minGuests: number, maxGuests: number): string {
    if (minGuests === maxGuests) {
        if (minGuests === 1) return '1 osoba';
        const lastDigit = minGuests % 10;
        const lastTwoDigits = minGuests % 100;
        if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits > 20)) {
            return `${minGuests} osoby`;
        }
        return `${minGuests} osób`;
    } else {
        const lastDigitMax = maxGuests % 10;
        const lastTwoDigitsMax = maxGuests % 100;
        if (lastDigitMax >= 2 && lastDigitMax <= 4 && (lastTwoDigitsMax < 10 || lastTwoDigitsMax > 20)) {
            return `${minGuests}-${maxGuests} osoby`;
        }
        return `${minGuests}-${maxGuests} osób`;
    }
}

function mapTiersToPriceItems(tiers: PriceTier[]): PriceItem[] {
    return [...tiers]
        .sort((a, b) => a.minGuests - b.minGuests)
        .map((tier) => ({
            description: formatGuestsLabel(tier.minGuests, tier.maxGuests),
            amount: `${tier.price} zł`,
        }));
}

export default async function Services() {
    let childrenFreeAge: number | null = 13;
    const defaultWeekdayRates: PriceItem[] = [
        { description: '2-3 osoby', amount: 'Kontakt' },
        { description: '4-5 osób', amount: 'Kontakt' },
        { description: '6 osób', amount: 'Kontakt' },
        { description: 'Dostawka', amount: 'Kontakt' }
    ];

    const defaultWeekendRates: PriceItem[] = [
        { description: '2-3 osoby', amount: 'Kontakt' },
        { description: '4-5 osób', amount: 'Kontakt' },
        { description: '6 osób', amount: 'Kontakt' },
        { description: 'Dostawka', amount: 'Kontakt' }
    ];

    let basicPricesData: BasicPricesData | null = null;

    try {
        const bookingConfig = await getBookingConfig();
        childrenFreeAge = bookingConfig?.childrenFreeAgeLimit ?? 13;

        const properties = await getAllProperties();
        const firstProperty = properties[0];

        if (firstProperty?._id) {
            const basicPricesResult = await getBasicPrices(firstProperty._id);
            if (basicPricesResult.success && basicPricesResult.data) {
                basicPricesData = basicPricesResult.data as BasicPricesData;
            }
        }
    } catch {

    }

    const weekdayRates = basicPricesData
        ? [
            ...mapTiersToPriceItems(basicPricesData.weekdayPrices ?? []),
            {
                description: 'Dostawka',
                amount: basicPricesData.weekdayExtraBedPrice != null ? `+${basicPricesData.weekdayExtraBedPrice} zł` : '—',
            },
        ]
        : defaultWeekdayRates;

    const weekendRates = basicPricesData
        ? [
            ...mapTiersToPriceItems(basicPricesData.weekendPrices ?? []),
            {
                description: 'Dostawka',
                amount: basicPricesData.weekendExtraBedPrice != null ? `+${basicPricesData.weekendExtraBedPrice} zł` : '—',
            },
        ]
        : defaultWeekendRates;

    return (
        <section id="services" className={styles.section}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h2 className={styles.title}>Nasza oferta</h2>
                    <div className={styles.introText}>
                        <p>
                            Oferujemy dwa przytulne domki o powierzchni 35 m² każdy. Każdy domek komfortowo mieści 6 osób
                            (z możliwością 2 dodatkowych dostawek). Częścią wspólną dla obu obiektów jest zamknięta altana,
                            wyposażona w 4-5 osobową saunę infrared oraz jacuzzi ogrzewane drewnem (drewno wliczone w cenę), wraz z dwoma dużymi biesiadnymi stołami.
                        </p>
                        <p>
                            Na tarasie każdego domku znajduje się grill oraz stół. Do dyspozycji gości oddajemy również
                            plac zabaw dla dzieci wyposażony w huśtawkę, trampolinę, zjeżdżalnię oraz hamaki.
                            Wnętrze każdego domku obejmuje aneks kuchenny, łazienkę oraz dwa pokoje na poddaszu:
                            jeden z łóżkiem małżeńskim, drugi z dwoma łóżkami pojedynczymi.
                        </p>
                    </div>

                    <div className={styles.equipment}>
                        <h3>Wyposażenie każdego domku:</h3>
                        <ul className={styles.equipmentList}>
                            <li>Kuchenka indukcyjna z piekarnikiem</li>
                            <li>Lodówka</li>
                            <li>Zmywarka</li>
                            <li>Zastawa kuchenna, garnki, patelnie, toster</li>
                            <li>Pralka</li>
                            <li>TV i WiFi</li>
                            <li>Stół dla 6 osób i rozkładana 2-osobowa kanapa w salonie</li>
                            <li>Klimatyzacja</li>
                            <li>Suszarka do włosów i ubrań</li>
                            <li>Ręczniki</li>
                            <li>Kosmetyki i środki higieniczne</li>
                            <li>Odkurzacz</li>
                            <li>Kawa i herbata</li>
                        </ul>
                    </div>
                </header>

                <div id="pricing" className={styles.grid}>
                   <div className={`${styles.card} ${styles.pricingCard}`}>
                        <h3>Cennik za dobę:</h3>
                        <div className={styles.priceGroup}>
                            <h4>W tygodniu</h4>
                            {weekdayRates.map((rate, index) => (
                                <div key={index} className={styles.priceRow}>
                                    <span>{rate.description}</span>
                                    <strong>{rate.amount}</strong>
                                </div>
                            ))}
                        </div>
                        <div className={styles.priceGroup}>
                            <h4>Weekendy</h4>
                            {weekendRates.map((rate, index) => (
                                <div key={index} className={styles.priceRow}>
                                    <span>{rate.description}</span>
                                    <strong>{rate.amount}</strong>
                                </div>
                            ))}
                        </div>
                        {childrenFreeAge !== null &&
                            <div className={styles.note}>* Dzieci do {childrenFreeAge} roku życia bezpłatnie.</div>
                        }
                        <div className={styles.note}>** Cennik obowiązuje poza sezonem wysokim.</div>
                        <div className={styles.note}>
                            <a href="/terms-and-conditions" className={styles.link}>
                                Regulamin obiektu &raquo;
                            </a>
                        </div>
                    </div>

                    <div className={`${styles.card} ${styles.featuresCard}`}>
                        <h3>Główne atrakcje:</h3>
                        <ul className={styles.features}>
                            <li>Chata biesiadna z sauną i jacuzzi oraz dwoma dużymi stołami</li>
                            <li>Sauna 4-5 osobowa Infrared</li>
                            <li>Jacuzzi ogrzewane drewnem (w cenie)</li>
                            <li>Pełne wyposażenie i klimatyzacja</li>
                            <li>Hamaki i strefa relaksu</li>
                            <li>Grill do dyspozycji</li>
                            <li>Plac zabaw dla dzieci</li>
                            <li>Trampolina</li>
                            <li>Miejsce na ognisko</li>
                            <li>Teren ogrodzony</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}