'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface BookingCancelClientProps {
  siteSettings: {
    phoneDisplay: string;
    phoneHref: string;
  };
}

export default function BookingCancelClient({ siteSettings }: BookingCancelClientProps) {
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
          <span className={styles.cancelIcon}>✗</span>
        </div>

        <h1 className={styles.title}>Płatność anulowana</h1>

        <p className={styles.message}>
          Nie dokonano płatności. Twoja rezerwacja nie została potwierdzona.
        </p>

        <p className={styles.details}>
          Możesz wrócić do płatności lub edytować dane rezerwacji.
        </p>

        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            📞 W razie pytań: <a href={`tel:${siteSettings.phoneHref}`} className={styles.phoneLink}>{siteSettings.phoneDisplay}</a>
          </p>
        </div>

        <div className={styles.actions}>
          <button onClick={handleRetry} className={styles.btnPrimary} disabled={isRetrying}>
            {isRetrying ? 'Przekierowywanie...' : 'Wróć do płatności'}
          </button>
          <Link href="/booking/summary" className={styles.btnSecondary}>
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
