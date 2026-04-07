'use client'
import { useState } from 'react';
import {
  seedAllData,
  seedProperties,
  seedBookings,
  seedSystemConfig,
  seedPriceConfigDefaults,
  seedSeasons,
  seedBookingConfig,
  seedPropertyPrices,
  clearAllData,
} from '@/actions/seed';
import styles from './page.module.css';

export default function DevPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  };

  const runAction = async (name: string, actionFn: () => Promise<any>) => {
    addLog(`Uruchamiam: ${name}...`);
    try {
      const res = await actionFn();
      if (res.success) {
        addLog(`✅ SUCCESS: ${res.message}`);
      } else {
        addLog(`❌ ERROR: ${res.error || res.message}`);
      }
    } catch (error: any) {
      addLog(`❌ EXCEPTION: ${error.message}`);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.devContainer}>
        <header className={styles.header}>
          <h1>Developer Console</h1>
          <span className={styles.status}>Environment: Development</span>
        </header>
        <div className={styles.grid}>
          <section className={styles.actions}>
            <h3>Database Actions</h3>
            <div className={styles.buttonGroup}>

              {/* ── Full reset ──────────────────────────────────────────────── */}
              <button
                className={styles.btnPrimary}
                onClick={() => runAction('Seed All (Reset)', seedAllData)}
              >
                Seed All Data (Full Reset)
              </button>

              <hr className={styles.divider} />

              {/* ── Jednotkowe seedy ────────────────────────────────────────── */}
              <button
                className={styles.btnSecondary}
                onClick={() => runAction('Seed Properties (2 domki)', seedProperties)}
              >
                Seed Properties Only
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() =>
                  runAction('Seed PropertyPrices (ceny)', seedPropertyPrices)
                }
              >
                Seed PropertyPrices (ceny per domek)
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => runAction('Seed Seasons', seedSeasons)}
              >
                Seed Seasons (3 sezony)
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() =>
                  runAction('Seed Price Config (Default)', seedPriceConfigDefaults)
                }
              >
                Seed Price Config (Default)
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => runAction('Seed System Config', seedSystemConfig)}
              >
                Seed System Config
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => runAction('Seed Booking Config', seedBookingConfig)}
              >
                Seed Booking Config
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => runAction('Seed Bookings', seedBookings)}
              >
                Seed Bookings Only
              </button>

              <hr className={styles.divider} />

              <button
                className={styles.btnDanger}
                onClick={() => runAction('Clear Database', clearAllData)}
              >
                Clear All Collections
              </button>
            </div>
          </section>

          <section className={styles.console}>
            <h3>Output Logs</h3>
            <div className={styles.logWindow}>
              {logs.length === 0 && (
                <span className={styles.empty}>Waiting for actions...</span>
              )}
              {logs.map((log, i) => (
                <div key={i} className={styles.logEntry}>
                  {log}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
