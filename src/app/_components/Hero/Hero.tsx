import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <h1>Wilcze Chatki</h1>
                    <p>Odkryj spokój w sercu Kaszub – Szumleś Królewski</p>
                    <Link href="#services" className={styles.cta}>
                        Sprawdź ofertę
                    </Link>
                </div>
            </div>
        </section>
    );
}