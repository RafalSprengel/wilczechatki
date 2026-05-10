'use client';

import { useState } from 'react';
import { updateSystemConfigSetting } from '@/actions/adminConfigActions';
import { ISystemConfig } from '@/db/models/SystemConfig';
import styles from './settings.module.css';

interface ToggleSwitchProps {
  initialState: boolean;
  settingKey: keyof ISystemConfig;
}

export default function ToggleSwitch({ initialState, settingKey }: ToggleSwitchProps) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleToggle = async () => {
    const newState = !state;
    setState(newState);
    setIsPending(true);
    
    try {
      const result = await updateSystemConfigSetting(settingKey, newState);
      
      if (result.success) {
        setStatusMessage(result.message);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setState(!newState);
        setStatusMessage(result.message);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={styles.toggleWrapper}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`${styles.toggleSwitch} ${state ? styles.toggleOn : styles.toggleOff} ${isPending ? styles.toggleDisabled : ''}`}
        aria-pressed={state}
        aria-label="Przełącz ustawienie"
      >
        <span className={styles.toggleKnob} />
      </button>
      
      <span className={`${styles.toggleStatusLabel} ${state ? styles.statusActive : styles.statusInactive}`}>
        {state ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
      </span>

      {statusMessage && (
        <div className={`${styles.statusMessage} ${statusMessage.includes('Włączono') || statusMessage.includes('W') ? styles.msgSuccess : styles.msgError}`}>
          {statusMessage}
        </div>
      )}
      
      {isPending && (
        <span className={styles.loadingText}>Zapisywanie...</span>
      )}
    </div>
  );
}
