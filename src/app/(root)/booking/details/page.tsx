'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';

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
  guestData: {
    firstName: string;
    lastName: string;
    address: string;
    email: string;
    phone: string;
    invoice: boolean;
    termsAccepted: boolean;
  };
}

const STORAGE_KEY = 'wilczechatki_booking_draft';

export default function BookingDetailsPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    email: '',
    phone: '',
    invoice: false,
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookingSummary, setBookingSummary] = useState<BookingData | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed: BookingData = JSON.parse(savedData);
        setBookingSummary(parsed);
        if (parsed.guestData) {
          setFormData(parsed.guestData);
        }
      } catch {
        router.push('/booking');
      }
    } else {
      router.push('/booking');
    }
  }, [router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Imię jest wymagane';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nazwisko jest wymagane';
    if (!formData.address.trim()) newErrors.address = 'Adres jest wymagany';
    if (!formData.email.trim()) {
      newErrors.email = 'Email jest wymagany';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon jest wymagany';
    } else if (!/^[\d\s+\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Nieprawidłowy format telefonu';
    }
    if (!formData.termsAccepted) newErrors.termsAccepted = 'Musisz zaakceptować regulamin';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    const updatedData: BookingData = {
      ...(bookingSummary as BookingData),
      guestData: formData,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push('/booking/summary');
  };

  if (!bookingSummary) {
    return (
      <div className={styles.container}>
        <FloatingBackButton />
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Ładowanie danych rezerwacji...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Dane Gościa</h1>
        <p>Wypełnij formularz, aby kontynuować rezerwację</p>
      </header>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Podsumowanie rezerwacji</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Termin:</span>
            <span className={styles.summaryValue}>
              {bookingSummary.startDate} — {bookingSummary.endDate}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Obiekt:</span>
            <span className={styles.summaryValue}>{bookingSummary.selectedOption?.displayName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Goście:</span>
            <span className={styles.summaryValue}>
              {bookingSummary.adults} dosp. + {bookingSummary.children} dz.
              {bookingSummary.extraBeds > 0 && ` + ${bookingSummary.extraBeds} dost.`}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Cena:</span>
            <span className={styles.summaryPrice}>{bookingSummary.selectedOption?.totalPrice} zł</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Dane osobowe</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">Imię *</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? styles.inputError : ''}
                autoComplete="given-name"
              />
              {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Nazwisko *</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? styles.inputError : ''}
                autoComplete="family-name"
              />
              {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="address">Adres *</label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ulica, numer, kod pocztowy, miejscowość"
              className={errors.address ? styles.inputError : ''}
              autoComplete="street-address"
            />
            {errors.address && <span className={styles.errorText}>{errors.address}</span>}
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Dane kontaktowe</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? styles.inputError : ''}
                autoComplete="email"
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">Telefon *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+48 123 456 789"
                className={errors.phone ? styles.inputError : ''}
                autoComplete="tel"
              />
              {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Dodatkowe opcje</h2>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="invoice"
              checked={formData.invoice}
              onChange={handleChange}
            />
            <span>Chcę otrzymać fakturę VAT (dane firmowe podam w kolejnym kroku)</span>
          </label>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Akceptacja regulaminu</h2>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
            />
            <span>
              Zapoznałem/am się i akceptuję{' '}
              <Link href="/regulamin.pdf" target="_blank" className={styles.link}>
                regulamin obiektu
              </Link>{' '}
              *
            </span>
          </label>
          {errors.termsAccepted && <span className={styles.errorText}>{errors.termsAccepted}</span>}
        </div>

        <div className={styles.formActions}>
          <Link href="/booking" className={styles.btnBack}>
            ← Wstecz
          </Link>
          <button type="submit" className={styles.btnNext} disabled={isSubmitting}>
            {isSubmitting ? 'Zapisywanie...' : 'Dalej →'}
          </button>
        </div>
      </form>
    </div>
  );
}