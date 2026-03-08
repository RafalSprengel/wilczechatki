'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function BookingFailPage() {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      router.push('/booking/payment');
    }, 500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <span className={styles.failIcon}>✗</span>
        </div>
        
        <h1 className={styles.title}>Płatność nieudana</h1>
        
        <p className={styles.message}>
          Niestety nie udało się przetworzyć Twojej płatności.
        </p>
        
        <p className={styles.details}>
          Przyczyną może być: brak środków na karcie, błędny kod CVC lub tymczasowy problem z systemem płatności.
        </p>
        
        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            💳 Sprawdź czy dane karty są poprawne
          </p>
          <p className={styles.infoText}>
            📞 W razie problemów: <a href="tel:+48503420551" className={styles.phoneLink}>+48 503 420 551</a>
          </p>
        </div>
        
        <div className={styles.actions}>
          <button onClick={handleRetry} className={styles.btnPrimary} disabled={isRetrying}>
            {isRetrying ? 'Przekierowywanie...' : 'Spróbuj ponownie'}
          </button>
          <Link href="/booking/details" className={styles.btnSecondary}>
            Edytuj dane
          </Link>
          <Link href="/" className={styles.btnTertiary}>
            Wróć na stronę główną
          </Link>
        </div>
      </div>
    </div>
  );
}