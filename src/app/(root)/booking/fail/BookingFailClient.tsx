"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

interface BookingFailClientProps {
  siteSettings: {
    phoneDisplay: string;
    phoneHref: string;
  };
}

export default function BookingFailClient({
  siteSettings,
}: BookingFailClientProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      router.push("/booking/summary");
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
          Przyczyną może być: brak środków na karcie, błędny kod CVC lub
          tymczasowy problem z systemem płatności.
        </p>

        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            💳 Sprawdź czy dane karty są poprawne
          </p>
          <p className={styles.infoText}>
            📞 W razie problemów:{" "}
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
            {isRetrying ? "Przekierowywanie..." : "Spróbuj ponownie"}
          </Button>
          <Button href="/" variant="tertiary">
            Wróć na stronę główną
          </Button>
        </div>
      </div>
    </div>
  );
}
