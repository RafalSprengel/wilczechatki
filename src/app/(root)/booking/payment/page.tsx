'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import { createBookingFromDraft } from '@/actions/bookingActions';

interface SelectedOption {
  type: 'single' | 'double';
  displayName: string;
  totalPrice: number;
  maxGuests: number;
  propertyIds?: string[];  // Dodajemy opcjonalne pole propertyIds
}

interface BookingData {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  extraBeds: number;
  selectedOption: SelectedOption | null;
  guestData: {
    firstName: string;
    lastName: string;
    address: string;
    email: string;
    phone: string;
    invoice: boolean;
    invoiceData?: {
      companyName: string;
      nip: string;
      street: string;
      city: string;
      postalCode: string;
    };
    termsAccepted: boolean;
  };
}

const STORAGE_KEY = 'wilczechatki_booking_draft';

const DEMO_CARD = {
  cardNumber: '4242 4242 4242 4242',
  cardName: 'JAN KOWALSKI',
  expiry: '12/30',
  cvc: '123',
};

export default function PaymentPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: DEMO_CARD.cardNumber,
    cardName: DEMO_CARD.cardName,
    expiry: DEMO_CARD.expiry,
    cvc: DEMO_CARD.cvc,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const fillDemoData = () => {
    setCardDetails({
      cardNumber: DEMO_CARD.cardNumber,
      cardName: DEMO_CARD.cardName,
      expiry: DEMO_CARD.expiry,
      cvc: DEMO_CARD.cvc,
    });
    setErrors({});
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiry') {
      formattedValue = formatExpiry(value);
    }

    setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const cardNumberClean = cardDetails.cardNumber.replace(/\s+/g, '');
    if (!cardNumberClean) {
      newErrors.cardNumber = 'Numer karty jest wymagany';
    } else if (!/^\d{16}$/.test(cardNumberClean)) {
      newErrors.cardNumber = 'Nieprawidłowy numer karty';
    }

    if (!cardDetails.cardName.trim()) {
      newErrors.cardName = 'Imię i nazwisko na karcie jest wymagane';
    }

    const expiryClean = cardDetails.expiry.replace('/', '');
    if (!expiryClean) {
      newErrors.expiry = 'Data ważności jest wymagana';
    } else if (!/^\d{4}$/.test(expiryClean)) {
      newErrors.expiry = 'Nieprawidłowa data (MM/RR)';
    } else {
      const month = parseInt(expiryClean.substring(0, 2), 10);
      const year = parseInt(expiryClean.substring(2, 4), 10) + 2000;
      const now = new Date();
      const expDate = new Date(year, month - 1);
      if (month < 1 || month > 12) {
        newErrors.expiry = 'Nieprawidłowy miesiąc';
      } else if (expDate < now) {
        newErrors.expiry = 'Karta wygasła';
      }
    }

    if (!cardDetails.cvc) {
      newErrors.cvc = 'Kod CVC jest wymagany';
    } else if (!/^\d{3,4}$/.test(cardDetails.cvc)) {
      newErrors.cvc = 'Nieprawidłowy kod CVC';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !bookingData) return;

    setIsProcessing(true);
    
    // Symulacja płatności (2 sekundy)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 70% szans na sukces (dla testów)
    const success = Math.random() > 0.3;
    
    if (success) {
      try {
        // Zapisz rezerwację w bazie danych
        const result = await createBookingFromDraft(bookingData);
        
        if (result.success) {
          // Wyczyść localStorage
          localStorage.removeItem(STORAGE_KEY);
          // Przekieruj na stronę sukcesu
          router.push('/booking/success');
        } else {
          console.error('Błąd zapisu rezerwacji:', result.error);
          router.push('/booking/fail');
        }
      } catch (error) {
        console.error('Błąd podczas zapisu rezerwacji:', error);
        router.push('/booking/fail');
      }
    } else {
      router.push('/booking/fail');
    }
  };

  if (!bookingData) {
    return (
      <div className={styles.container}>
        <FloatingBackButton />
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Ładowanie danych płatności...</p>
        </div>
      </div>
    );
  }

  const { startDate, endDate, selectedOption, guestData } = bookingData;
  const nights = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      
      <header className={styles.header}>
        <h1>Płatność</h1>
        <p>Wprowadź dane karty, aby potwierdzić rezerwację</p>
      </header>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Podsumowanie</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Obiekt:</span>
            <span className={styles.summaryValue}>{selectedOption?.displayName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Termin:</span>
            <span className={styles.summaryValue}>{startDate} — {endDate} ({nights} nocy)</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Gość:</span>
            <span className={styles.summaryValue}>{guestData.firstName} {guestData.lastName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Email:</span>
            <span className={styles.summaryValue}>{guestData.email}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Do zapłaty:</span>
            <span className={styles.priceValue}>{selectedOption?.totalPrice} zł</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.paymentCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>Dane karty płatniczej</h2>
          <button type="button" onClick={fillDemoData} className={styles.demoButton}>
            🧪 Wypełnij danymi testowymi
          </button>
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="cardNumber">Numer karty *</label>
          <input
            id="cardNumber"
            name="cardNumber"
            type="text"
            value={cardDetails.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className={errors.cardNumber ? styles.inputError : ''}
          />
          {errors.cardNumber && <span className={styles.errorText}>{errors.cardNumber}</span>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="cardName">Imię i nazwisko na karcie *</label>
          <input
            id="cardName"
            name="cardName"
            type="text"
            value={cardDetails.cardName}
            onChange={handleChange}
            placeholder="JAN KOWALSKI"
            className={errors.cardName ? styles.inputError : ''}
          />
          {errors.cardName && <span className={styles.errorText}>{errors.cardName}</span>}
        </div>

        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label htmlFor="expiry">Data ważności *</label>
            <input
              id="expiry"
              name="expiry"
              type="text"
              value={cardDetails.expiry}
              onChange={handleChange}
              placeholder="MM/RR"
              maxLength={5}
              className={errors.expiry ? styles.inputError : ''}
            />
            {errors.expiry && <span className={styles.errorText}>{errors.expiry}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="cvc">CVC *</label>
            <input
              id="cvc"
              name="cvc"
              type="text"
              value={cardDetails.cvc}
              onChange={handleChange}
              placeholder="123"
              maxLength={4}
              className={errors.cvc ? styles.inputError : ''}
            />
            {errors.cvc && <span className={styles.errorText}>{errors.cvc}</span>}
          </div>
        </div>

        <div className={styles.securityInfo}>
          <span className={styles.lockIcon}>🔒</span>
          <span>Twoje dane są szyfrowane i bezpieczne</span>
        </div>

        <div className={styles.actions}>
          <Link href="/booking/summary" className={styles.btnBack}>
            ← Wstecz
          </Link>
          <button 
            type="submit" 
            className={styles.btnPay} 
            disabled={isProcessing}
          >
            {isProcessing ? 'Przetwarzanie...' : `Zapłać ${selectedOption?.totalPrice} zł`}
          </button>
        </div>
      </form>
    </div>
  );
}