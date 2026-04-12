import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'
import styles from './booking.module.css'

export default function Loading() {
  return (
    <div className={styles.adminSettingsContainer}>
      <FloatingBackButton />
      <header className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>Ustawienia rezerwacji</h1>
        <p className={styles.adminSubtitle}>Zarządzaj globalnymi zasadami rezerwacji</p>
      </header>

      <div className={styles.loadingState} role="status" aria-live="polite">
        <span className={styles.loadingSpinner} aria-hidden="true"></span>
        <span>Wczytywanie...</span>
      </div>
    </div>
  )
}
