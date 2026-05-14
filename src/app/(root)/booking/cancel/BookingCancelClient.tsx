"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

interface BookingCancelClientProps {
  siteSettings: {
    phoneDisplay: string;
    phoneHref: string;
  };
}

export default function BookingCancelClient({
  siteSettings,
}: BookingCancelClientProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      router.push("/booking/payment");
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
            📞 W razie pytań:{" "}
            <a
              href={`tel:${siteSettings.phoneHref}`}
              className={styles.phoneLink}
            >
              {siteSettings.phoneDisplay}
            </a>
          </p>
        </div>

        <div className={styles.actions}>
          <Button onClick={handleRetry} variant="danger" disabled={isRetrying}>
            {isRetrying ? "Przekierowywanie..." : "Wróć do płatności"}
          </Button>
          <Button href="/booking/summary" variant="secondary">
            Edytuj dane
          </Button>
          <Button href="/" variant="tertiary">
            Wróć na stronę główną
          </Button>
        </div>
      </div>
    </div>
  );
}
