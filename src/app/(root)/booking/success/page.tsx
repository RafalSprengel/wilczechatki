'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { SITE_CONFIG } from '@/config/site';

const STORAGE_KEY = 'wilczechatki_booking_draft';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const bookingsCount = Number(searchParams.get('bookings') || '1');
  const sessionId = searchParams.get('session_id');
  const isMultiBooking = bookingsCount > 1;
  const isStripePayment = !!sessionId;

  useEffect(() => {
    // Usuń dane rezerwacji po udanej płatności
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <span className={styles.successIcon}>✓</span>
        </div>
        
        <h1 className={styles.title}>
          {isStripePayment ? 'Płatność potwierdzona!' : 'Rezerwacja potwierdzona!'}
        </h1>
        
        <p className={styles.message}>
          Dziękujemy za dokonanie rezerwacji w Wilczych Chatkach.
        </p>

        {isStripePayment && (
          <p className={styles.details}>
            Płatność została pomyślnie przetworzona przez Stripe.
          </p>
        )}

        {isMultiBooking && (
          <p className={styles.details}>
            Utworzono <strong>{bookingsCount}</strong> rezerwacje (po jednej dla każdego wybranego domku).
          </p>
        )}
        
        <p className={styles.details}>
          Szczegóły Twojej rezerwacji zostały wysłane na adres e-mail podany w formularzu.
        </p>
        
        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            Sprawdź skrzynkę odbiorczą (oraz folder SPAM)
          </p>
          <p className={styles.infoText}>
            W razie pytań: <a href={`tel:${SITE_CONFIG.phoneHref}`} className={styles.phoneLink}>{SITE_CONFIG.phoneDisplay}</a>
          </p>
        </div>
        
        <div className={styles.actions}>
          <Link href="/" className={styles.btnPrimary}>
            Wróć do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}
