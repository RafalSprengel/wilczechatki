'use client'

import { useState } from 'react';
import { 
    seedAllData, 
    seedProperties, 
    seedBookings, 
    seedSystemConfig, 
    seedPriceConfig,
    clearAllData 
} from '@/actions/seed';
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
            addLog(`❌ ERROR: ${res.error || res.message}`);
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
                            <button className={styles.btnPrimary} onClick={() => runAction('Seed All (Reset)', seedAllData)}>
                                Seed All Data (Full Reset)
                            </button>
                            
                            <hr className={styles.divider} />
                            
                            <button className={styles.btnSecondary} onClick={() => runAction('Seed Properties', seedProperties)}>
                                Seed Properties Only
                            </button>
                            <button className={styles.btnSecondary} onClick={() => runAction('Seed Price Config', seedPriceConfig)}>
                                Seed Price Config
                            </button>
                            <button className={styles.btnSecondary} onClick={() => runAction('Seed System Config', seedSystemConfig)}>
                                Seed System Config
                            </button>
                            <button className={styles.btnSecondary} onClick={() => runAction('Seed Bookings', seedBookings)}>
                                Seed Bookings Only
                            </button>
                            
                            <hr className={styles.divider} />
                            
                            {/* 2. Podpięcie prawdziwej funkcji */}
                            <button className={styles.btnDanger} onClick={() => runAction('Clear Database', clearAllData)}>
                                Clear All Collections
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