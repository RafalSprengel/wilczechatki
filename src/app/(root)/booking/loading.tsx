import React from 'react'
import styles from './page.module.css'

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <h2>Znajdź swój termin</h2>
      </div>

      <div className={styles.searchBox} style={{ opacity: 0.6, pointerEvents: 'none' }}>
        <div className={styles.gestsBox}>
          <div className={styles.gests}>
            <div style={{ width: '120px', height: '20px', background: '#e2e8f0', borderRadius: '4px' }}></div>
          </div>
        </div>

        <div className={styles.dateBox}>
          <div className={styles.date}>
            <div style={{ width: '180px', height: '20px', background: '#e2e8f0', borderRadius: '4px' }}></div>
          </div>
        </div>

        <button className={styles.button} disabled>
          Ładowanie...
        </button>
      </div>

      <div className={styles.resultsContainer}>
        <div className={styles.loadingState}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #f3f3f3', borderTop: '4px solid var(--accent-color)', animation: 'spin 1s linear infinite' }}></div>
          <p>Przygotowywanie konfiguracji rezerwacji...</p>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}