'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { updateBookingConfig, updateAllowCheckinOnDepartureDay } from '@/actions/bookingConfigActions';
import '../settings.css';

interface BookingConfig {
  minBookingDays: number;
  maxBookingDays: number;
  highSeasonStart: string | null;
  highSeasonEnd: string | null;
  childrenFreeAgeLimit: number;
  allowCheckinOnDepartureDay: boolean;
  checkInHour: number;
  checkOutHour: number;
}

interface Props {
  initialConfig: BookingConfig;
}

export default function BookingSettingsForm({ initialConfig }: Props) {
  const [state, formAction, isPending] = useActionState(updateBookingConfig, {
    message: '',
    success: false,
  });

  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState({ text: '', success: false });

  // Stany lokalne dla pól, które wymagają zatwierdzenia formularzem
  const [localMinDays, setLocalMinDays] = useState(initialConfig.minBookingDays);
  const [localMaxDays, setLocalMaxDays] = useState(initialConfig.maxBookingDays);
  const [localHighSeasonStart, setLocalHighSeasonStart] = useState(initialConfig.highSeasonStart);
  const [localHighSeasonEnd, setLocalHighSeasonEnd] = useState(initialConfig.highSeasonEnd);
  const [localChildrenFreeAge, setLocalChildrenFreeAge] = useState(initialConfig.childrenFreeAgeLimit);
  const [localCheckInHour, setLocalCheckInHour] = useState(initialConfig.checkInHour);
  const [localCheckOutHour, setLocalCheckOutHour] = useState(initialConfig.checkOutHour);

  // Stany dla przełącznika (działa natychmiast)
  const [allowCheckin, setAllowCheckin] = useState(initialConfig.allowCheckinOnDepartureDay);
  const [togglePending, startToggleTransition] = useTransition();

  // Efekt do aktualizacji stanu po zmianie initialConfig (np. po odświeżeniu)
  useEffect(() => {
    setAllowCheckin(initialConfig.allowCheckinOnDepartureDay);
  }, [initialConfig.allowCheckinOnDepartureDay]);

  useEffect(() => {
    if (state.message) {
      setMessage({ text: state.message, success: state.success });
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleToggle = () => {
    const newValue = !allowCheckin;
    startToggleTransition(async () => {
      const result = await updateAllowCheckinOnDepartureDay(newValue);
      if (result.success) {
        setAllowCheckin(newValue); // aktualizujemy stan lokalny
      } else {
        // opcjonalnie pokaż błąd
        alert(result.message || 'Błąd zapisu');
      }
    });
  };

  return (
    <form action={formAction} className="settings-card">
      {/* Ukryte pola formularza – ich wartości pochodzą ze stanów lokalnych */}
      <input type="hidden" name="minBookingDays" value={localMinDays} />
      <input type="hidden" name="maxBookingDays" value={localMaxDays} />
      <input type="hidden" name="highSeasonStart" value={localHighSeasonStart || ''} />
      <input type="hidden" name="highSeasonEnd" value={localHighSeasonEnd || ''} />
      <input type="hidden" name="childrenFreeAgeLimit" value={localChildrenFreeAge} />
      <input type="hidden" name="checkInHour" value={localCheckInHour} />
      <input type="hidden" name="checkOutHour" value={localCheckOutHour} />

      <div className="card-header">
        <h2 className="card-title">Długość pobytu</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="minBookingDays" className="setting-label">Minimalna liczba nocy</label>
          <p className="setting-description">Klient nie może wybrać okresu krótszego.</p>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="minBookingDays"
            min="1"
            max="30"
            value={localMinDays}
            onChange={(e) => setLocalMinDays(parseInt(e.target.value) || 1)}
            className="number-input"
          />
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="maxBookingDays" className="setting-label">Maksymalna liczba nocy</label>
          <p className="setting-description">Klient nie może wybrać okresu dłuższego.</p>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="maxBookingDays"
            min="1"
            max="90"
            value={localMaxDays}
            onChange={(e) => setLocalMaxDays(parseInt(e.target.value) || 1)}
            className="number-input"
          />
        </div>
      </div>

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Sezon wysoki</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="highSeasonStart" className="setting-label">Data rozpoczęcia</label>
        </div>
        <div className="setting-control">
          <input
            type="date"
            id="highSeasonStart"
            value={localHighSeasonStart ? new Date(localHighSeasonStart).toISOString().split('T')[0] : ''}
            onChange={(e) => setLocalHighSeasonStart(e.target.value || null)}
            className="date-input"
          />
        </div>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="highSeasonEnd" className="setting-label">Data zakończenia</label>
        </div>
        <div className="setting-control">
          <input
            type="date"
            id="highSeasonEnd"
            value={localHighSeasonEnd ? new Date(localHighSeasonEnd).toISOString().split('T')[0] : ''}
            onChange={(e) => setLocalHighSeasonEnd(e.target.value || null)}
            className="date-input"
          />
        </div>
      </div>

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Dzieci</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="childrenFreeAgeLimit" className="setting-label">Wiek dzieci bezpłatnych (do lat)</label>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="childrenFreeAgeLimit"
            min="0"
            max="18"
            value={localChildrenFreeAge}
            onChange={(e) => setLocalChildrenFreeAge(parseInt(e.target.value) || 0)}
            className="number-input"
          />
        </div>
      </div>

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Dostępność terminów</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="allowCheckinOnDepartureDay" className="setting-label">
            Zezwalaj na zameldowanie w dniu wymeldowania poprzednich gości
          </label>
          <p className="setting-description">
            Jeśli włączone, nowi goście mogą przyjechać tego samego dnia, w którym poprzedni wyjeżdżają (po {localCheckOutHour}:00).<br />
            Jeśli wyłączone, dzień wymeldowania jest niedostępny dla nowych rezerwacji.
          </p>
        </div>
        <div className="setting-control">
          <div className="toggle-wrapper">
            <button
              type="button"
              onClick={handleToggle}
              disabled={togglePending}
              className={`toggle-switch ${allowCheckin ? 'toggle-on' : 'toggle-off'} ${togglePending ? 'toggle-disabled' : ''}`}
              aria-pressed={allowCheckin}
            >
              <span className="toggle-knob" />
            </button>
            <span className={`toggle-status-label ${allowCheckin ? 'status-active' : 'status-inactive'}`}>
              {allowCheckin ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
            </span>
            {togglePending && <span className="loading-spinner">Zapisywanie...</span>}
          </div>
        </div>
      </div>

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Doba hotelowa</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="checkInHour" className="setting-label">Godzina rozpoczęcia doby (check-in)</label>
          <p className="setting-description">Od której godziny można się zameldować w dniu przyjazdu.</p>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="checkInHour"
            name="checkInHour"
            min="0"
            max="23"
            step="1"
            value={localCheckInHour}
            onChange={(e) => setLocalCheckInHour(parseInt(e.target.value) || 0)}
            className="number-input"
          />
        </div>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="checkOutHour" className="setting-label">Godzina zakończenia doby (check-out)</label>
          <p className="setting-description">Do której godziny trzeba opuścić domek w dniu wyjazdu.</p>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="checkOutHour"
            name="checkOutHour"
            min="0"
            max="23"
            step="1"
            value={localCheckOutHour}
            onChange={(e) => setLocalCheckOutHour(parseInt(e.target.value) || 0)}
            className="number-input"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </button>
      </div>

      {showMessage && (
        <div className={`form-message ${message.success ? 'success-message' : 'error-message'}`}>
          {message.text}
        </div>
      )}
    </form>
  );
}