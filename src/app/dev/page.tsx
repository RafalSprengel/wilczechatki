'use client'

import { useState } from 'react';
import { seedPrices, seedBookings, clearAllData } from '@/actions/seed';
import styles from './page.module.css';

export default function DevPage() {
    const [logs, setLogs] = useState<string[]>([]);

   const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-10));
};

    const runAction = async (name: string, actionFn: () => Promise<any>) => {
        addLog(`Uruchamiam: ${name}...`);
        const res = await actionFn();
        if (res.success) {
            addLog(`✅ SUCCESS: ${res.message}`);
        } else {
            addLog(`❌ ERROR: ${res.error}`);
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
                        <h3>Database Seeds</h3>
                        <div className={styles.buttonGroup}>
                            <button className={styles.btnPrimary} onClick={() => runAction('Zasiej Ceny', seedPrices)}>
                                Seed PriceConfig
                            </button>
                            <button className={styles.btnPrimary} onClick={() => runAction('Zasiej Rezerwacje', seedBookings)}>
                                Seed Bookings
                            </button>
                            <hr className={styles.divider} />
                            <button className={styles.btnDanger} onClick={() => runAction('Wyczyść Bazę', clearAllData)}>
                                Clean All Collections
                            </button>
                        </div>
                    </section>

                    <section className={styles.console}>
                        <h3>Output Logs</h3>
                        <div className={styles.logWindow}>
                            {logs.length === 0 && <span className={styles.empty}>Waiting for actions...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className={styles.logEntry}>{log}</div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}