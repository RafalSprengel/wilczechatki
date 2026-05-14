"use client";

import { useState } from "react";
import {
  clearAllData,
  seedAdmin,
  seedAllData,
  seedBookingConfig,
  seedBookings,
  seedPriceConfigDefaults,
  seedProperties,
  seedPropertyPrices,
  seedSeasons,
  seedSystemConfig,
} from "@/actions/seed";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

export default function DevPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30),
    );
  };

  const runAction = async (name: string, actionFn: () => Promise<{ success: boolean; message?: string; error?: string }>) => {
    addLog(`Uruchamiam: ${name}...`);
    try {
      const res = await actionFn();
      if (res.success) {
        addLog(`✅ SUCCESS: ${res.message}`);
      } else {
        addLog(`❌ ERROR: ${res.error || res.message}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      addLog(`❌ EXCEPTION: ${message}`);
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
              <Button
                className={styles.btnPrimary}
                onClick={() => runAction("Seed All (Reset)", seedAllData)}
              >
                Seed All Data (Full Reset)
              </Button>

              <hr className={styles.divider} />

              {/* ── Jednotkowe seedy ────────────────────────────────────────── */}
              <Button
                className={styles.btnSecondary}
                onClick={() =>
                  runAction("Seed Properties (2 domki)", seedProperties)
                }
              >
                Seed Properties Only
              </Button>
              <Button
                className={styles.btnSecondary}
                onClick={() =>
                  runAction("Seed PropertyPrices (ceny)", seedPropertyPrices)
                }
              >
                Seed PropertyPrices (ceny per obiekt)
              </Button>
              <Button
                className={styles.btnSecondary}
                onClick={() => runAction("Seed Seasons", seedSeasons)}
              >
                Seed Seasons (3 sezony)
              </Button>
              <Button
                className={styles.btnSecondary}
                onClick={() =>
                  runAction(
                    "Seed Price Config (Default)",
                    seedPriceConfigDefaults,
                  )
                }
              >
                Seed Price Config (Default)
              </Button>
              <Button
                className={styles.btnSecondary}
                onClick={() =>
                  runAction("Seed System Config", seedSystemConfig)
                }
              >
                Seed System Config
              </Button>
              <Button
                className={styles.btnSecondary}
                onClick={() =>
                  runAction("Seed Booking Config", seedBookingConfig)
                }
              >
                Seed Booking Config
              </Button>
              <Button
                className={styles.btnSecondary}
                onClick={() => runAction("Seed Bookings", seedBookings)}
              >
                Seed Bookings Only
              </Button>

              <hr className={styles.divider} />

              <Button
                className={styles.btnDanger}
                onClick={() => runAction("Clear Database", clearAllData)}
              >
                Clear All Collections
              </Button>

              <hr className={styles.divider} />

              {/* ── Auth / Admin ─────────────────────────────────────────────── */}
              <Button
                className={styles.btnSecondary}
                onClick={() =>
                  runAction("Seed Admin (kontakt@wilczechatki.pl)", seedAdmin)
                }
              >
                Seed Admin User
              </Button>
            </div>
          </section>

          <section className={styles.console}>
            <h3>Output Logs</h3>
            <div className={styles.logWindow}>
              {logs.length === 0 && (
                <span className={styles.empty}>Waiting for actions...</span>
              )}
              {logs.map((log) => (
                <div key={log} className={styles.logEntry}>
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
