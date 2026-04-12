import styles from './page.module.css'
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'

export default function Loading() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <FloatingBackButton />
          <h1>Lista Rezerwacji</h1>
        </div>
        <p>Przeglądaj, edytuj lub usuwaj istniejące rezerwacje.</p>
      </header>

      <div className={styles.loadingState} role="status" aria-live="polite">
        <span className={styles.loadingSpinner} aria-hidden="true"></span>
        <span>Wczytywanie...</span>
      </div>
    </div>
  )
}
