'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';

interface InvoiceData {
  companyName: string;
  nip: string;
  street: string;
  city: string;
  postalCode: string;
}

interface GuestData {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
  invoice: boolean;
  invoiceData?: InvoiceData;
  termsAccepted: boolean;
}

interface BookingData {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  extraBeds: number;
  selectedOption: {
    type: 'single' | 'double';
    displayName: string;
    totalPrice: number;
    maxGuests: number;
  } | null;
  guestData: GuestData;
}

const STORAGE_KEY = 'wilczechatki_booking_draft';

export default function BookingSummaryPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      router.push('/booking');
      return;
    }

    try {
      const parsed: BookingData = JSON.parse(saved);
      if (!parsed.guestData?.firstName) {
        router.push('/booking/details');
        return;
      }
      setBookingData(parsed);
    } catch {
      router.push('/booking');
    }
  }, [router]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    router.push('/booking/success');
  };

  if (!bookingData) {
    return (
      <div className={styles.container}>
        <FloatingBackButton />
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Ładowanie podsumowania...</p>
        </div>
      </div>
    );
  }

  const { startDate, endDate, adults, children, extraBeds, selectedOption, guestData } = bookingData;
  const nights = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={styles.container}>
      <FloatingBackButton />

      <header className={styles.header}>
        <h1>Podsumowanie rezerwacji</h1>
        <p>Sprawdź dane przed potwierdzeniem</p>
      </header>

      {/* Blok podsumowania pobytu */}
      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Dane pobytu</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Termin:</span>
            <span className={styles.summaryValue}>
              {startDate} — {endDate} ({nights} nocy)
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Obiekt:</span>
            <span className={styles.summaryValue}>{selectedOption?.displayName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Goście:</span>
            <span className={styles.summaryValue}>
              {adults} dorosłych, {children} dzieci
              {extraBeds > 0 && ` + ${extraBeds} dostawki`}
            </span>
          </div>
        </div>
      </div>

      {/* Blok danych kontaktowych */}
      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Dane kontaktowe</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Imię i nazwisko:</span>
            <span className={styles.summaryValue}>{guestData.firstName} {guestData.lastName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Adres:</span>
            <span className={styles.summaryValue}>{guestData.address}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Email:</span>
            <span className={styles.summaryValue}>{guestData.email}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Telefon:</span>
            <span className={styles.summaryValue}>{guestData.phone}</span>
          </div>
        </div>
      </div>

      {/* Blok danych faktury (jeśli zaznaczona) */}
      {guestData.invoice && guestData.invoiceData && (
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Dane faktury VAT</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Nazwa firmy:</span>
              <span className={styles.summaryValue}>{guestData.invoiceData.companyName}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>NIP:</span>
              <span className={styles.summaryValue}>{guestData.invoiceData.nip}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Adres:</span>
              <span className={styles.summaryValue}>
                {guestData.invoiceData.street}, {guestData.invoiceData.postalCode} {guestData.invoiceData.city}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Blok ceny */}
      <div className={styles.priceCard}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Cena całkowita:</span>
          <span className={styles.priceValue}>{selectedOption?.totalPrice} zł</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Link href="/booking/details" className={styles.btnBack}>
          ← Edytuj dane
        </Link>
        <Link href="/booking/payment" className={styles.btnConfirm}>
          Przejdź do płatności →
        </Link>
      </div>
    </div>
  );
}