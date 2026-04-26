'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { SITE_CONFIG } from '@/config/site';

const STORAGE_KEY = 'wilczechatki_booking_draft';
const RETRY_DELAY_MS = 3000;
const MAX_ATTEMPTS = 4;

type VerificationState = 'loading' | 'success' | 'error';

type CheckoutStatusResponse = {
  status?: string;
  paymentStatus?: string;
  customerEmail?: string | null;
  error?: string;
};

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const [verificationState, setVerificationState] = useState<VerificationState>('loading');
  const [attempts, setAttempts] = useState(0);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  const bookingsParam = searchParams.get('bookings');
  const bookingsCount = useMemo(() => {
    if (!bookingsParam) {
      return undefined;
    }

    const parsed = Number(bookingsParam);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return undefined;
    }

    return parsed;
  }, [bookingsParam]);

  const sessionId = searchParams.get('session_id');
  const isMultiBooking = typeof bookingsCount === 'number' && bookingsCount > 1;

  useEffect(() => {
    if (!sessionId) {
      setVerificationState('error');
      return;
    }

    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const waitForRetry = async () => {
      await new Promise<void>((resolve) => {
        timeoutId = setTimeout(() => resolve(), RETRY_DELAY_MS);
      });
    };

    const verifyCheckoutSession = async () => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        if (isCancelled) {
          return;
        }

        setAttempts(attempt);

        try {
          const response = await fetch(`/api/checkout-status?session_id=${encodeURIComponent(sessionId)}`, {
            method: 'GET',
            cache: 'no-store',
          });

          const data = (await response.json()) as CheckoutStatusResponse;

          if (!response.ok) {
            if (data.error) {
              throw new Error(data.error);
            }

            throw new Error('Błąd odpowiedzi API weryfikacji płatności.');
          }

          if (data.status === 'complete') {
            localStorage.removeItem(STORAGE_KEY);
            setCustomerEmail(data.customerEmail ?? null);
            setVerificationState('success');
            return;
          }

          if (data.status === 'expired' || data.paymentStatus === 'unpaid') {
            setVerificationState('error');
            return;
          }
        } catch (error) {
          if (attempt === MAX_ATTEMPTS) {
            setVerificationState('error');
            return;
          }

          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
        }

        if (attempt < MAX_ATTEMPTS) {
          await waitForRetry();
        }
      }

      setVerificationState('error');
    };

    setVerificationState('loading');
    void verifyCheckoutSession();

    return () => {
      isCancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sessionId]);

  const isLoading = verificationState === 'loading';
  const isSuccess = verificationState === 'success';
  const isError = verificationState === 'error';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {isLoading && (
          <>
            <div className={styles.loaderWrapper}>
              <span className={styles.spinner} />
            </div>
            <h1 className={styles.title}>Weryfikujemy płatność...</h1>
            <p className={styles.message}>Prosimy nie odświeżać strony.</p>
            <p className={styles.details}>Trwa potwierdzanie płatności w Stripe.</p>
            <p className={styles.details}>Próba {attempts}/{MAX_ATTEMPTS}</p>
          </>
        )}

        {isSuccess && (
          <>
            <div className={styles.iconWrapper}>
              <span className={styles.successIcon}>✓</span>
            </div>
            <h1 className={styles.title}>Płatność potwierdzona!</h1>
            <p className={styles.message}>Dziękujemy za rezerwację.</p>
            <p className={styles.details}>Płatność została pomyślnie przetworzona przez Stripe.</p>

            {isMultiBooking && (
              <p className={styles.details}>
                Utworzono <strong>{bookingsCount}</strong> rezerwacje (po jednej dla każdego wybranego domku).
              </p>
            )}

            <p className={styles.details}>
              Szczegóły Twojej rezerwacji zostały wysłane na adres e-mail:
              {customerEmail ? (
                <strong> {customerEmail}</strong>
              ) : (
                ' podany w formularzu.'
              )}
            </p>

            <div className={styles.infoBox}>
              <p className={styles.infoText}>Sprawdź skrzynkę odbiorczą (oraz folder SPAM)</p>
              <p className={styles.infoText}>
                W razie pytań:{' '}
                <a href={`tel:${SITE_CONFIG.phoneHref}`} className={styles.phoneLink}>
                  {SITE_CONFIG.phoneDisplay}
                </a>
              </p>
            </div>
          </>
        )}

        {isError && (
          <>
            <div className={styles.errorIconWrapper}>
              <span className={styles.errorIcon}>!</span>
            </div>
            <h1 className={styles.title}>Wystąpił problem z płatnością.</h1>
            <p className={styles.message}>
              Prosimy o kontakt z obsługą pod numerem{' '}
              <a href={`tel:${SITE_CONFIG.phoneHref}`} className={styles.phoneLink}>
                {SITE_CONFIG.phoneDisplay}
              </a>
              .
            </p>
          </>
        )}
        
        <div className={styles.actions}>
          <Link href="/" className={styles.btnPrimary}>
            Wróć do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}
