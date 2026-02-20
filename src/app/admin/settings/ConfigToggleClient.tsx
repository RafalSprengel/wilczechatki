'use client';

import { useState, useTransition } from 'react';
import { updateAutoBlockSetting } from '@/actions/adminConfigActions';

interface ConfigToggleProps {
  initialEnabled: boolean;
}

export default function ConfigToggle({ initialEnabled }: ConfigToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleToggle = async () => {
    const newState = !enabled;
    setEnabled(newState);
    
    startTransition(async () => {
      const result = await updateAutoBlockSetting(newState);
      
      if (result.success) {
        setStatusMessage(result.message);
        // Ukryj komunikat po 3 sekundach
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        // Przywróć poprzedni stan w razie błędu
        setEnabled(!newState);
        setStatusMessage(result.message);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    });
  };

  return (
    <div className="toggle-wrapper">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`toggle-switch ${enabled ? 'toggle-on' : 'toggle-off'} ${isPending ? 'toggle-disabled' : ''}`}
        aria-pressed={enabled}
        aria-label="Przełącz automatyczną blokadę"
      >
        <span className="toggle-knob" />
      </button>
      
      <span className={`toggle-status-label ${enabled ? 'status-active' : 'status-inactive'}`}>
        {enabled ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
      </span>

      {statusMessage && (
        <div className={`status-message ${statusMessage.includes('Włączono') ? 'msg-success' : 'msg-error'}`}>
          {statusMessage}
        </div>
      )}
      
      {isPending && (
        <span className="loading-spinner">Zapisywanie...</span>
      )}
    </div>
  );
}