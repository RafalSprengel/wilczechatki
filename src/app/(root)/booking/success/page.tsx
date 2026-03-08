'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function BookingSuccessPage() {
  useEffect(() => {
    sessionStorage.setItem('booking_confirmed', 'true');
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <span className={styles.successIcon}>✓</span>
        </div>
        
        <h1 className={styles.title}>Rezerwacja potwierdzona!</h1>
        
        <p className={styles.message}>
          Dziękujemy za dokonanie rezerwacji w Wilczych Chatkach.
        </p>
        
        <p className={styles.details}>
          Szczegóły Twojej rezerwacji zostały wysłane na adres e-mail podany w formularzu.
        </p>
        
        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            Sprawdź skrzynkę odbiorczą (oraz folder SPAM)
          </p>
          <p className={styles.infoText}>
            W razie pytań: <a href="tel:+48503420551" className={styles.phoneLink}>+48 503 420 551</a>
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