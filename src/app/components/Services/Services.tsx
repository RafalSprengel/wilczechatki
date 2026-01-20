import styles from './Services.module.css';

interface PriceItem {
    description: string;
    amount: string;
}

export default function Services() {
    const weekdayRates: PriceItem[] = [
        { description: '2-3 osoby', amount: '300 zł' },
        { description: '4-6 osób', amount: '400 zł' }
    ];

    const weekendRates: PriceItem[] = [
        { description: '2-3 osoby', amount: '400 zł' },
        { description: '4-5 osób', amount: '500 zł' },
        { description: 'Dostawka', amount: '+100 zł' }
    ];

    return (
        <section id="services" className={styles.container}>
            <header className={styles.header}>
                <h2>Nasza Oferta</h2>
                <p>Dwa przytulne domki o powierzchni 35 m² każdy</p>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Cennik za dobę</h3>
                    <div className={styles.priceGroup}>
                        <h4>W tygodniu:</h4>
                        {weekdayRates.map((rate, index) => (
                            <div key={index} className={styles.priceRow}>
                                <span>{rate.description}</span>
                                <strong>{rate.amount}</strong>
                            </div>
                        ))}
                    </div>
                    <div className={styles.priceGroup}>
                        <h4>Weekendy:</h4>
                        {weekendRates.map((rate, index) => (
                            <div key={index} className={styles.priceRow}>
                                <span>{rate.description}</span>
                                <strong>{rate.amount}</strong>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.card}>
                    <h3>Udogodnienia</h3>
                    <ul className={styles.features}>
                        <li>Sauna 4-osobowa Infrared</li>
                        <li>Jakuzzi ogrzewane drewnem (w cenie)</li>
                        <li>Plac zabaw dla dzieci</li>
                        <li>Pełne wyposażenie i klimatyzacja</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}