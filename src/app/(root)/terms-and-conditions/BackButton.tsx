'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function BackButton() {
  const router = useRouter();
  return (
    <button onClick={() => router.back()} className={styles.backButton}>
      ← Powrót
    </button>
  );
}